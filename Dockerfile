# ── Build stage ────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# ── Production stage (Cloudflare Workers / Node preview) ──────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
RUN npm install -g wrangler

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/wrangler.jsonc ./

EXPOSE 4173

CMD ["wrangler", "pages", "dev", "./dist", "--port", "4173", "--ip", "0.0.0.0"]
