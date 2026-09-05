# =========================================================
# Stage 1: Build React Frontend
# =========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# =========================================================
# Stage 2: Unified FastAPI Backend + AI Model + Static Serving
# =========================================================
FROM python:3.12-slim AS runner

# Install system build dependencies and git (required for clip git repo)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    libheif-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/ai-service

# Install lightweight CPU-only PyTorch (reduces RAM usage by 70%)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install Python requirements
COPY ai-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY ai-service/ ./

# Copy built frontend production dist from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 5050

# Environment variables
ENV PORT=5050
ENV PYTHONUNBUFFERED=1

# Start production uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5050"]
