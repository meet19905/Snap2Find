# Snap2Find

AI-powered Lost & Found platform. Upload a photo of a lost or found item — Snap2Find automatically categorizes it and lets you search visually instead of typing.

## Features

- **Visual Search**: Search for lost items using image embeddings instead of text.
- **AI Verification**: AI image verification and automated categorization.
- **Tracking & Stats**: Item stats, visit tracking, and category browsing.
- **Secure Claims**: Claim verification system.
- **Premium UI**: Modern frontend with a premium theme and splash screen.

## Progress

- [x] Unified Python backend (FastAPI, SQLite, CLIP) — all API endpoints + AI in one service
- [x] Frontend (React, Vite) — upload UI, search UI, statistics

## Tech Stack

- **Backend**: Python, FastAPI, aiosqlite, Pydantic v2
- **AI/ML**: OpenAI CLIP (zero-shot classification + visual similarity search)
- **Frontend**: React, Vite

## Quick Start

### Backend (unified)

```bash
cd ai-service
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 5050 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Run Tests

```bash
cd ai-service
source venv/bin/activate
pytest tests/ -v
```