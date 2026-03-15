FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

# Build
FROM base AS builder
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

RUN mkdir -p uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
