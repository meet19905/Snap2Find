import torch
import clip
from PIL import Image
import pillow_heif
import io
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Register HEIC/HEIF support so Pillow can open iPhone photos
pillow_heif.register_heif_opener()

# ---- App setup ----
app = FastAPI(title="Snap2Find AI Service")

# Allow requests from our backend/frontend (running on different ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # for development only, we'll restrict this later
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Load CLIP model (this happens once, when the server starts) ----
if torch.cuda.is_available():
    device = "cuda"
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = "mps"
else:
    device = "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# ---- Our fixed list of categories ----
CATEGORIES = ["calculator", "ID card", "wallet", "earbuds", "keys", "water bottle", "phone", "bag"]

# Pre-encode the category text prompts once (faster than doing it every request)
text_prompts = clip.tokenize([f"a photo of a {c}" for c in CATEGORIES]).to(device)
with torch.no_grad():
    text_features = model.encode_text(text_prompts)
    text_features /= text_features.norm(dim=-1, keepdim=True)


@app.get("/")
def health_check():
    return {"status": "Snap2Find AI service is running"}


@app.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    """Takes an image, returns the best-matching category + confidence."""
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_input = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        image_features = model.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)

        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
        values, indices = similarity[0].topk(3)

    results = [
        {"category": CATEGORIES[idx], "confidence": round(float(val), 4)}
        for val, idx in zip(values, indices)
    ]

    return {"top_category": results[0]["category"], "predictions": results}


@app.post("/embed")
async def embed_image(file: UploadFile = File(...)):
    """Takes an image, returns its embedding vector (for visual similarity search)."""
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_input = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        image_features = model.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)

    embedding = image_features[0].cpu().tolist()

    return {"embedding": embedding, "dimensions": len(embedding)}


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Takes an image, returns both embedding and classification in one pass."""
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_input = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        image_features = model.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)
        
        # Classification
        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
        values, indices = similarity[0].topk(1)
        top_category = CATEGORIES[indices[0]]

    embedding = image_features[0].cpu().tolist()

    return {
        "top_category": top_category,
        "embedding": embedding,
        "dimensions": len(embedding)
    }