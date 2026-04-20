FROM python:3.11-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Remove .env to use environment variables from DigitalOcean
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Build frontend
COPY frontend/package.json frontend/yarn.lock ./frontend/
WORKDIR /app/frontend
RUN yarn install --frozen-lockfile --production=false

COPY frontend/ ./
RUN yarn build

# Copy built frontend to backend
WORKDIR /app
RUN cp -r frontend/dist backend/static_frontend && \
    cp frontend/public/logo.jpg backend/static_frontend/ 2>/dev/null || true && \
    cp frontend/public/icon-192.png backend/static_frontend/ 2>/dev/null || true && \
    cp frontend/public/icon-512.png backend/static_frontend/ 2>/dev/null || true && \
    cp frontend/public/apple-touch-icon.png backend/static_frontend/ 2>/dev/null || true && \
    cp frontend/public/manifest.json backend/static_frontend/ 2>/dev/null || true && \
    cp frontend/public/sw.js backend/static_frontend/ 2>/dev/null || true

# Copy backend
RUN rm -f backend/.env
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
