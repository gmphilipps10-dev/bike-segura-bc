# Build do site
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Build do painel administrativo
FROM node:20-alpine AS admin-builder

WORKDIR /admin

COPY admin/package*.json ./
RUN npm ci

COPY admin/ .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=frontend-builder /frontend/dist ./dist
RUN rm -rf ./dist/paineladmin
COPY --from=admin-builder /admin/dist ./dist/paineladmin

RUN npm install -g serve

CMD serve -s dist -l ${PORT:-8080}
