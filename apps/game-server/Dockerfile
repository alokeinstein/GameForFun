FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.base.json ./
COPY packages/game-rules/package*.json ./packages/game-rules/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/database/package*.json ./packages/database/
COPY apps/game-server/package*.json ./apps/game-server/

# Install dependencies
RUN npm ci

# Copy source trees
COPY packages/game-rules ./packages/game-rules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/game-server ./apps/game-server

# Generate prisma client & build dependencies
RUN npm --workspace=@mafia/database run db:generate
RUN npm --workspace=@mafia/game-rules run build
RUN npm --workspace=@mafia/shared run build
RUN npm --workspace=@mafia/database run build
RUN npm --workspace=@mafia/game-server run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=2567

COPY --from=builder /app /app

EXPOSE 2567

CMD ["npm", "--workspace=@mafia/game-server", "run", "start"]

