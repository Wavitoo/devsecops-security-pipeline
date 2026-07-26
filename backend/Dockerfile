# --- Stage 1: Build ---
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# --- Stage 2: Runtime ---
FROM node:24-alpine

# Bonne pratique sécurité : ne jamais tourner en root dans le conteneur
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app ./

USER appuser

EXPOSE 3000

CMD ["node", "index.js"]
