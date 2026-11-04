FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY turbo.json ./
COPY packages/game-rules/package*.json ./packages/game-rules/
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source trees
COPY packages/game-rules ./packages/game-rules
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build dependencies and Next.js app
RUN npm --workspace=@mafia/game-rules run build
RUN npm --workspace=@mafia/shared run build
RUN npm --workspace=@mafia/web run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app /app

EXPOSE 3000

CMD ["npm", "--workspace=@mafia/web", "run", "start"]

