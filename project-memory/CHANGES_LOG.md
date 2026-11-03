# Changes Log

## 2026-11-03

- Added: In-Game 2D HUD (`GameHUD.tsx`) supporting role dossiers, synchronized countdowns, Mafia night assassination panels, town discussion rosters, secret ballot voting, and full post-match role reveal.
- Added: Server-authoritative game loop in `MafiaRoom.ts` with complete state transitions, $\ge 50\%$ voter threshold validation, strict night plurality kills, and parity victory assessment.
- Added: Automated integration test suite (`GameLoop.test.ts`) covering zero role leakage, night kill parity victory, and 50% day voting citizen victory.
- Added: Host `RESET_TO_LOBBY` message allowing seamless rematches without reconnecting.
- Added: Root `npm run dev` script with Turborepo task definition to launch both Colyseus server and Next.js web concurrently.
- Fixed: Colyseus schema deserialization and 0-byte binary diff issue by setting `"useDefineForClassFields": false` in `tsconfig.base.json`.
- Fixed: Test runner timeout on slow timers by introducing Developer Testing Mode with 1-second phase timers.
- Added: Multiplayer room foundation in `MafiaRoom.ts` with 5-character room code matchmaking, host transfer on disconnect, and 60-second crypto reconnection tokens.
- Added: Pre-game lobby UI in `apps/web` with host configuration controls, ready toggles, and live chat.
- Added: `@mafia/game-rules` package with 38 Vitest unit tests covering role distribution, 50% voting threshold, night tie-handling, and victory conditions.
- Added: `@mafia/database` package with PostgreSQL schema for `User`, `GameSession`, `GamePlayer`, `GameEvent`, and `PlayerStats` via Prisma.
- Added: Authoritative project architecture documentation in `docs/`.
- Added: Monorepo foundation with npm workspaces and Turborepo.
