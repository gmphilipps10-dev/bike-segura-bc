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

# Copy nginx config for SPA routing - uses $PORT from environment
RUN echo 'server { \
    listen $PORT; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Use envsubst to replace $PORT with actual value
CMD sed -i "s/\$PORT/$PORT/g" /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"
