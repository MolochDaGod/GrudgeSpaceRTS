# ── Build stage ────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# ── Runtime stage ───────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy only production node_modules + compiled output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run migration then start server
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
