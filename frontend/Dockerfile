# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo '#!/bin/sh' > /app-entrypoint.sh && \
    echo 'PORT=${PORT:-8080}' >> /app-entrypoint.sh && \
    echo 'echo "Configuring nginx on port $PORT"' >> /app-entrypoint.sh && \
    echo 'cat > /etc/nginx/conf.d/default.conf <<EOF' >> /app-entrypoint.sh && \
    echo 'server {' >> /app-entrypoint.sh && \
    echo '    listen '$PORT';' >> /app-entrypoint.sh && \
    echo '    listen 8001;' >> /app-entrypoint.sh && \
    echo '    location / {' >> /app-entrypoint.sh && \
    echo '        root /usr