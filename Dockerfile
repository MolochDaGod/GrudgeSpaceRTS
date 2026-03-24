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

# Build-time env (backend URLs injected at build)
ARG VITE_GRUDGE_API=https://api.grudge-studio.com
ARG VITE_GRUDGE_ID_URL=https://id.grudge-studio.com
ARG VITE_ACCOUNT_API=https://account.grudge-studio.com
ARG VITE_ASSET_CDN=https://assets.grudgestudio.com
ARG VITE_WS_URL=https://ws.grudge-studio.com
ENV VITE_GRUDGE_API=$VITE_GRUDGE_API
ENV VITE_GRUDGE_ID_URL=$VITE_GRUDGE_ID_URL
ENV VITE_ACCOUNT_API=$VITE_ACCOUNT_API
ENV VITE_ASSET_CDN=$VITE_ASSET_CDN
ENV VITE_WS_URL=$VITE_WS_URL

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
