# UAV Patrol Frontend - Production Deployment Guide

This guide covers the best practices for deploying the **UAV Patrol Dashboard** (Vite + React) to a production web server. While this project utilizes Tauri for desktop packaging, the frontend web application can be deployed independently to a standard web server for remote access.

Given that this is a **Single Page Application (SPA)** utilizing `react-router-dom`, we highly recommend deploying via **Docker + Nginx**.

---

## 1. Recommended Architecture

For maximum performance, security, and ease of updates, use a **Multi-stage Docker Build**:
1. **Build Stage**: Uses Node.js to compile the Vite React app into static HTML/CSS/JS.
2. **Production Stage**: Uses a lightweight Nginx Alpine image to serve the compiled static files.

---

## 2. Setting Up Docker

Create a `Dockerfile` in the root directory of your project:

```dockerfile
# Stage 1: Build the Vite application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (leverage Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files
COPY . .

# Pass build-time environment variables
# Note: VITE_ variables MUST be present during the build step
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_STREAM_API_URL
ARG VITE_WHEP_URL
ARG VITE_DETECTIONS_WS_URL
ARG VITE_DUMMY_STREAM
ARG VITE_API_BASE_URL_DOCKING

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL
ENV VITE_STREAM_API_URL=$VITE_STREAM_API_URL
ENV VITE_WHEP_URL=$VITE_WHEP_URL
ENV VITE_DETECTIONS_WS_URL=$VITE_DETECTIONS_WS_URL
ENV VITE_DUMMY_STREAM=$VITE_DUMMY_STREAM
ENV VITE_API_BASE_URL_DOCKING=$VITE_API_BASE_URL_DOCKING

# Build the production static files
RUN npm run build


# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Nginx Configuration (SPA Best Practices)

Because this is a React Router SPA, direct navigation to URLs (like `/missions/active`) will return a 404 on a standard web server unless configured properly. 

Create a file named `nginx.conf` in the project root:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Enable Gzip Compression for faster loading
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
    gzip_disable "MSIE [1-6]\.";

    # Fallback routing for React Router SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets (Images, JS, CSS)
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public, max-age=15552000, immutable";
    }
}
```

---

## 4. Docker Compose Setup (Optional but Recommended)

Create a `docker-compose.yml` file to easily manage your deployment and pass environment variables:

```yaml
version: '3.8'
services:
  uav-patrol-dashboard:
    build:
      context: .
      args:
        # Define your production backend API URLs here
        - VITE_API_BASE_URL=https://api.yourdomain.com
        - VITE_WS_BASE_URL=wss://ws.yourdomain.com
        - VITE_STREAM_API_URL=https://stream.yourdomain.com
        - VITE_WHEP_URL=https://whep.yourdomain.com
        - VITE_DETECTIONS_WS_URL=wss://detections.yourdomain.com
        - VITE_DUMMY_STREAM=false
        - VITE_API_BASE_URL_DOCKING=https://api-docking.yourdomain.com
    ports:
      - "80:80"
    restart: unless-stopped
```

---

## 5. Deployment Execution

Once the `Dockerfile`, `nginx.conf`, and `docker-compose.yml` are on your server, simply run:

```bash
docker-compose up -d --build
```

---

## 6. Security & HTTPS (SSL/TLS)

For a production environment involving UAV controls, **HTTPS is absolutely mandatory**. 
The easiest way to secure the Nginx server is by placing it behind a Reverse Proxy like **Traefik**, **Caddy**, or **Nginx Proxy Manager**, which will automatically provision Let's Encrypt SSL certificates.

Alternatively, you can install **Certbot** directly on the host machine:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dashboard.yourdomain.com
```
