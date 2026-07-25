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

// Serve uploaded images publicly (so frontend can display them)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make sure the uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer setup — handles the actual file upload, saves to /uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// ---- Helper: call the Python AI service ----
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

// ---- Helper: cosine similarity between two embeddings ----
function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ---- Route: health check ----
app.get('/', (req, res) => {
  res.json({ status: 'Snap2Find backend is running' });
});

// ---- Route: report a FOUND item ----
app.post('/api/found', upload.single('image'), async (req, res) => {
  try {
    const { phone_number, description } = req.body;
    const imagePath = req.file.path;

    const { category, embedding } = await getClassificationAndEmbedding(imagePath);

    const stmt = db.prepare(`
      INSERT INTO items (type, category, image_path, embedding, phone_number, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      'found',
      category,
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

// ---- Route: search for a LOST item using a photo ----
app.post('/api/search', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const { embedding, category } = await getClassificationAndEmbedding(imagePath);

    // Get all "found" items from the database
    const foundItems = db.prepare(`SELECT * FROM items WHERE type = 'found'`).all();

    // Compare the searched image's embedding against every found item's embedding
    const results = foundItems.map((item) => {
      const itemEmbedding = JSON.parse(item.embedding);
      const similarity = cosineSimilarity(embedding, itemEmbedding);
      return {
        id: item.id,
        category: item.category,
        image_path: item.image_path,
        phone_number: item.phone_number,
        description: item.description,
        similarity: similarity,
      };
    });

    // Sort by highest similarity first, return top 5
    results.sort((a, b) => b.similarity - a.similarity);
    const topMatches = results.slice(0, 5);

    res.json({ success: true, searched_category: category, matches: topMatches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Snap2Find backend running on http://localhost:${PORT}`);
});