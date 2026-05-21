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

RUN echo '#!/bin/sh\n\
PORT=${PORT:-8080}\n\
echo "Configuring nginx on port $PORT"\n\
cat > /etc/nginx/conf.d/default.conf <<EOF\n\
server {\n\
    listen $PORT;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\
}\n\
EOF\n\
cat /etc/nginx/conf.d/default.conf\n\
nginx -g "daemon off;"\n\
' > /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
