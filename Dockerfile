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
