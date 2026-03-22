# ═══════════════════════════════════════════════════════════
# Gruda Armada — Dockerfile for Coolify / VPS deployment
# Multi-stage: Node build → nginx static serving
# ═══════════════════════════════════════════════════════════

# ── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .

# Build-time env (API base URL injected at build)
ARG VITE_GRUDGE_API=https://api.grudge-studio.com
ENV VITE_GRUDGE_API=$VITE_GRUDGE_API

RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────
FROM nginx:alpine
LABEL maintainer="Racalvin The Pirate King <grudgestudio>"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
