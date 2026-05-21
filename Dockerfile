# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy from frontend folder
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist

# Install serve
RUN npm install -g serve

# Use serve with PORT env variable
CMD serve -s dist -l ${PORT:-8080}
