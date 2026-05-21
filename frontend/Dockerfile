# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
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

# Deploy: Fri May 22 06:31:36 CST 2026
