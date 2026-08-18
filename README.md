# Snap2Find

AI-powered Lost & Found platform. Upload a photo of a lost or found item — Snap2Find automatically categorizes it and lets you search visually instead of typing.

## Features

- **Visual Search**: Search for lost items using image embeddings instead of text.
- **AI Verification**: AI image verification and automated categorization.
- **Tracking & Stats**: Item stats, visit tracking, and category browsing.
- **Secure Claims**: Claim verification system.
- **Premium UI**: Modern frontend with a premium theme and splash screen.

## Progress

- [x] AI microservice (Python, FastAPI, CLIP) — image classification + embedding
- [x] Backend (Node.js, Express, SQLite) — item storage, search, image processing
- [x] Frontend (React, Vite) — upload UI, search UI, statistics

## Tech Stack

- **AI/ML**: Python, FastAPI, OpenAI CLIP (zero-shot classification + visual similarity search)
- **Backend**: Node.js, Express, SQLite
- **Frontend**: React, Vite