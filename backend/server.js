const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

async function getClassificationAndEmbedding(imagePath) {
  const form1 = new FormData();
  form1.append('file', fs.createReadStream(imagePath));
  const classifyRes = await axios.post(`${AI_SERVICE_URL}/classify`, form1, {
    headers: form1.getHeaders(),
  });

  const form2 = new FormData();
  form2.append('file', fs.createReadStream(imagePath));
  const embedRes = await axios.post(`${AI_SERVICE_URL}/embed`, form2, {
    headers: form2.getHeaders(),
  });

  return {
    category: classifyRes.data.top_category,
    embedding: embedRes.data.embedding,
  };
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

app.get('/', (req, res) => {
  res.json({ status: 'Snap2Find backend is running' });
});

app.post('/api/found', upload.single('image'), async (req, res) => {
  try {
    const { phone_number, description, location } = req.body;
    const imagePath = req.file.path;

    const { category, embedding } = await getClassificationAndEmbedding(imagePath);

    const stmt = db.prepare(`
      INSERT INTO items (type, category, location, image_path, embedding, phone_number, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      'found',
      category,
      location || '',
      imagePath,
      JSON.stringify(embedding),
      phone_number,
      description || ''
    );

    res.json({
      success: true,
      id: result.lastInsertRowid,
      category,
      message: 'Found item reported successfully!',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/lost', upload.single('image'), async (req, res) => {
  try {
    const { phone_number, description, location } = req.body;
    const imagePath = req.file.path;
    const { embedding, category } = await getClassificationAndEmbedding(imagePath);

    const stmt = db.prepare(`
      INSERT INTO items (type, category, location, image_path, embedding, phone_number, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      'lost',
      category,
      location || '',
      imagePath,
      JSON.stringify(embedding),
      phone_number || '',
      description || ''
    );

    let foundItems;
    if (location && location.trim() !== '') {
      foundItems = db.prepare(`SELECT * FROM items WHERE type = 'found' AND status = 'unclaimed' AND LOWER(location) LIKE LOWER(?)`).all(`%${location.trim()}%`);
    } else {
      foundItems = db.prepare(`SELECT * FROM items WHERE type = 'found' AND status = 'unclaimed'`).all();
    }

    const results = foundItems.map((item) => {
      const itemEmbedding = JSON.parse(item.embedding);
      const similarity = cosineSimilarity(embedding, itemEmbedding);
      return {
        id: item.id,
        type: item.type,
        category: item.category,
        location: item.location,
        image_path: item.image_path,
        phone_number: item.phone_number ? `***-***-${item.phone_number.slice(-4)}` : '',
        description: item.description,
        similarity: similarity,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    const topMatches = results.slice(0, 5);

    res.json({ success: true, searched_category: category, matches: topMatches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  const totalFound = db.prepare(`SELECT COUNT(*) as c FROM items WHERE type = 'found'`).get().c;
  const totalRecovered = db.prepare(`SELECT COUNT(*) as c FROM items WHERE status = 'recovered'`).get().c;
  const stillMissing = db.prepare(`SELECT COUNT(*) as c FROM items WHERE status = 'unclaimed'`).get().c;
  const totalVisitors = db.prepare(`SELECT COUNT(*) as c FROM visits`).get().c;
  res.json({ totalFound, totalRecovered, stillMissing, totalVisitors });
});

app.post('/api/visit', (req, res) => {
  db.prepare(`INSERT INTO visits DEFAULT VALUES`).run();
  res.json({ success: true });
});

app.get('/api/items', (req, res) => {
  const { category, type = 'found', status = 'unclaimed' } = req.query;
  let items;

  if (status === 'recovered') {
    items = db.prepare(`SELECT * FROM items WHERE status = 'recovered' ORDER BY created_at DESC`).all();
  } else if (category && category !== 'all') {
    items = db.prepare(`
      SELECT * FROM items WHERE type = ? AND status = ? AND category = ?
      ORDER BY created_at DESC
    `).all(type, status, category);
  } else {
    items = db.prepare(`
      SELECT * FROM items WHERE type = ? AND status = ?
      ORDER BY created_at DESC
    `).all(type, status);
  }

  const maskedItems = items.map(item => ({
    ...item,
    phone_number: item.phone_number ? `***-***-${item.phone_number.slice(-4)}` : ''
  }));

  res.json({ success: true, items: maskedItems });
});

app.post('/api/items/:id/recover', (req, res) => {
  const { claimant_phone } = req.body;
  if (!claimant_phone || claimant_phone.trim().length < 10) {
    return res.status(400).json({ success: false, error: 'A valid phone number is required to confirm this claim.' });
  }
  db.prepare(`UPDATE items SET status = 'recovered', claimed_by_phone = ? WHERE id = ?`).run(claimant_phone, req.params.id);
  res.json({ success: true });
});

app.post('/api/items/:id/verify-claim', upload.single('image'), async (req, res) => {
  try {
    const itemId = req.params.id;
    const { claimant_phone } = req.body;
    
    if (!claimant_phone || claimant_phone.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'A valid phone number is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'A verification photo is required.' });
    }

    const item = db.prepare(`SELECT * FROM items WHERE id = ?`).get(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found.' });
    }
    if (item.status === 'recovered') {
      return res.status(400).json({ success: false, error: 'Item is already recovered.' });
    }

    const imagePath = req.file.path;
    const { embedding } = await getClassificationAndEmbedding(imagePath);
    
    const originalEmbedding = JSON.parse(item.embedding);
    const similarity = cosineSimilarity(embedding, originalEmbedding);
    
    if (similarity > 0.80) {
      db.prepare(`UPDATE items SET status = 'recovered', claimed_by_phone = ? WHERE id = ?`).run(claimant_phone, itemId);
      res.json({ success: true, similarity: similarity, verified: true });
    } else {
      res.json({ 
        success: false, 
        similarity: similarity, 
        verified: false, 
        error: `AI Verification Failed (Similarity: ${(similarity*100).toFixed(0)}%). The photo does not match closely enough.`
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Snap2Find backend running on http://localhost:${PORT}`);
});