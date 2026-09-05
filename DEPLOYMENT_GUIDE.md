# Snap2Find Production Deployment Guide

This guide details step-by-step instructions for deploying Snap2Find to cloud production environments.

Snap2Find features a **unified single-container architecture**: the FastAPI Python server runs the AI model (OpenAI CLIP), handles all SQLite database operations, processes uploads into compressed WebP images, and serves the static production React frontend assets.

---

## What You Need Before Deploying

- A GitHub repository containing your Snap2Find code.
- A free account on **Render** (recommended), **Railway**, **Fly.io**, or any Linux VPS provider (DigitalOcean, Hetzner, AWS EC2).
- **No paid API keys required!** OpenAI CLIP runs locally embedded inside PyTorch.

---

## Option 1: Deploying to Render.com (Recommended Free / Low-Cost Host)

Render provides free Web Service hosting for Docker containers and automatically deploys whenever you push changes to GitHub.

### Step-by-Step Instructions:

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Deployment & performance optimizations"
   git push origin main
   ```

2. **Log into Render**:
   - Go to [render.com](https://render.com/) and sign up or sign in.
   - Click **New +** $\rightarrow$ Select **Web Service**.

3. **Connect GitHub Repository**:
   - Connect your GitHub account and select your `Snap2Find` repository.

4. **Configure Web Service Settings**:
   - **Name**: `snap2find` (or your preferred application name).
   - **Region**: Choose the region closest to you (e.g. Oregon, Frankfurt, Singapore).
   - **Language / Environment**: Select **Docker** (Render will automatically detect the root `Dockerfile`).
   - **Branch**: `main`
   - **Instance Type**: Select Free or Starter instance (at least 512MB RAM; 1GB+ recommended for faster CLIP model loading).

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will automatically execute the multi-stage `Dockerfile`, build the React frontend, pre-download CLIP model weights, and launch the server.
   - Once deployment finishes, Render will provide your live URL (e.g., `https://snap2find.onrender.com`).

---

## Option 2: Single-Command Docker Deployment (Local, VPS, or DigitalOcean)

If you have a Linux Server, VPS, AWS EC2, or DigitalOcean Droplet with Docker installed:

1. **Clone the repository on your server**:
   ```bash
   git clone https://github.com/your-username/Snap2Find.git
   cd Snap2Find
   ```

2. **Build and start the container**:
   ```bash
   docker compose up --build -d
   ```

3. **Access your live app**:
   - Open `http://your-server-ip:5050` in your web browser.

---

## Option 3: Deploying on Railway.app

1. Log into [railway.app](https://railway.app/).
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Select your `Snap2Find` repository.
4. Railway detects the `Dockerfile` automatically and builds the image.
5. In **Settings** $\rightarrow$ **Networking**, click **Generate Domain** to get your public URL.

---

## Summary of Speed & Performance Features Enabled

- **Dual WebP Image Processing**: Uploaded images are automatically converted to optimized 1200px WebP display images (~100KB) and 400px WebP thumbnails (~25KB).
- **SQLite WAL Mode & Indexing**: Database enabled Write-Ahead Logging (`WAL`) with composite index on `(status, type, category)`.
- **FastAPI GZip Compression**: Reduces API and asset JSON transfer sizes by up to 70%.
- **Lazy Loading & Async Decoding**: Gallery images load progressively with skeleton shimmer feedback.
- **Zero-Overhead AI Inference**: PyTorch `torch.inference_mode()` enables sub-second CLIP similarity matches.
