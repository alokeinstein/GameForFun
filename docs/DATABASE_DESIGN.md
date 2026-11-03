# MAFIA 3D — Database Architecture & Schema Design

## 1. Architectural Principles
1. **PostgreSQL from Day 1:** The database is PostgreSQL across development, staging, and production. No intermediate SQLite translation or migration steps are planned.
2. **Strict Separation of State:**
   - **Transient Game State:** High-frequency character transforms, round timers, active voting ballots, and secret night selections live in Colyseus server memory and are synchronized over WebSockets. They **never** hit PostgreSQL.
   - **Persistent Records:** User credentials, player profiles, completed match summaries, and historical player statistics are written asynchronously to PostgreSQL via Prisma.
3. **Role Secrecy in Public Endpoints:** Secret roles are written to `GamePlayer` records, but application-level API endpoints must never expose `role` in active/in-progress game queries.

---

## 2. Prisma Schema Specification

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  MAFIA
  CITIZEN
}

enum MatchResult {
  MAFIA_VICTORY
  CITIZEN_VICTORY
  ABANDONED
}

enum EliminationCause {
  NIGHT_KILL
  VOTED_OUT
  DISCONNECTED
}

model User {
  id            String          @id @default(uuid())
  username      String          @unique
  email         String?         @unique
  passwordHash  String?
  avatarConfig  String?         // Serialized cosmetic choices (color, hat, skin)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  hostedGames   GameSession[]   @relation("HostedGames")
  gameHistory   GamePlayer[]
  statistics    PlayerStats?
}

model GameSession {
  id              String         @id @default(uuid())
  roomCode        String         @unique
  hostUserId      String
  host            User           @relation("HostedGames", fields: [hostUserId], references: [id])
  status          String         // LOBBY, IN_PROGRESS, COMPLETED, CANCELLED
  winner          MatchResult?
  configJson      String         // Stored settings: timers, mafia %, revote rules
  playerCount     Int
  startedAt       DateTime?
  endedAt         DateTime?
  createdAt       DateTime       @default(now())

  players         GamePlayer[]
  events          GameEvent[]

  @@index([roomCode])
}

model GamePlayer {
  id               String            @id @default(uuid())
  gameSessionId    String
  gameSession      GameSession       @relation(fields: [gameSessionId], references: [id], onDelete: Cascade)
  userId           String?
  user             User?             @relation(fields: [userId], references: [id])
  displayName      String
  role             Role              // Stored authoritatively; exposed publicly only after match completion
  survived         Boolean           @default(false)
  eliminationCause EliminationCause?
  eliminatedRound  Int?
  joinedAt         DateTime          @default(now())

  @@index([gameSessionId])
  @@index([userId])
}

model GameEvent {
  id              String       @id @default(uuid())
  gameSessionId   String
  gameSession     GameSession  @relation(fields: [gameSessionId], references: [id], onDelete: Cascade)
  roundNumber     Int
  eventType       String       // "NIGHT_KILL", "VOTING_ELIMINATION", "REVOTE_TRIGGERED"
  publicDetails   String       // JSON payload safe for historical replay
  createdAt       DateTime     @default(now())

  @@index([gameSessionId, roundNumber])
}

model PlayerStats {
  id              String       @id @default(uuid())
  userId          String       @unique
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  gamesPlayed     Int          @default(0)
  gamesWon        Int          @default(0)
  mafiaWins       Int          @default(0)
  citizenWins     Int          @default(0)
  timesEliminated Int          @default(0)
  timesSurvived   Int          @default(0)
}
```

---

## 3. Migration & Local Development Instructions
- When setting up local development or staging, configure `DATABASE_URL` in `.env`:
  ```bash
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mafia_db?schema=public"
  ```
- Or point to a cloud-hosted PostgreSQL instance (e.g. Supabase, Neon, AWS RDS).
- Generate Prisma Client:
  ```bash
  npm run db:generate
  ```
- Run Prisma Migrations:
  ```bash
  npm run db:migrate
  ```

