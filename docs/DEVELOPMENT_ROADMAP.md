# MAFIA 3D — Engineering Development Roadmap

```
Milestone 0: Monorepo Setup, Pure Game Rules Engine & Unit Tests (ACTIVE)
     │
     ▼
Milestone 1: Colyseus Multiplayer Room Foundation & Next.js Lobby System
     │
     ▼
Milestone 2: Complete Server-Authoritative Game Loop (2D / UI Functional Validation)
     │
     ▼
Milestone 3: 3D Environment, Map, Low-Poly Avatars & Synced Character Controller
     │
     ▼
Milestone 4: LiveKit Voice Integration & Role-Gated Audio Channels
     │
     ▼
Milestone 5: 3D World + HUD Integration, Visual Polish & Audio Experience
     │
     ▼
Milestone 6: Security Hardening, Low-End Laptop Optimization & Edge Case Auditing
     │
     ▼
Milestone 7: Production Containerization, Cloud Deployment & Observability
```

---

## Detailed Milestone Breakdown

### Milestone 0: Foundation, Rules Engine & Database Schema (Current)
* [x] Audit workspace, environment, and requirements.
* [x] Establish architecture documents and ADRs.
* [ ] Initialize npm workspaces monorepo (`apps/*`, `packages/*`).
* [ ] Configure Turborepo, TypeScript, ESLint, and Vitest.
* [ ] Build `@mafia/game-rules`: pure, framework-agnostic mathematical and FSM logic.
* [ ] Implement comprehensive automated unit tests covering all edge cases.
* [ ] Configure Prisma schema for PostgreSQL in `@mafia/database`.
* [ ] Execute quality checks (type check, tests, build).

### Milestone 1: Multiplayer Room Foundation
* Set up `@mafia/game-server` using Node.js, Express, and Colyseus.
* Set up `@mafia/web` using Next.js 14/15 App Router and Tailwind CSS.
* Implement room creation with unique 5-character room codes (e.g. `M8K92`).
* Host controls: game configuration settings (Mafia %, timers, role reveal).
* Room joining, live player list, ready status, and host start trigger.
* Disconnection detection and 60-second session reconnection handling.

### Milestone 2: Complete Server-Authoritative Game Loop
* Implement the complete game state machine in Colyseus rooms:
  * `ROLE_ASSIGNMENT`: Cryptographic shuffle and private `ROLE_INFO` dispatch.
  * `NIGHT`: Living Mafia target selection, plurality tally, tie detection.
  * `MORNING_ANNOUNCEMENT`: Public victim reveal, alive counter updates.
  * `DAY_DISCUSSION`: Countdown timer, text chat, speech indicators.
  * `DAY_VOTING`: Secret ballots, 50% threshold formula evaluation.
  * `REVOTING`: Tied candidate runoffs.
  * `ELIMINATION_ANNOUNCEMENT`: Elimination animation/banner, role reveal setting check.
  * `VICTORY`: Authoritative win-condition evaluation and match finalization.
* Build 2D functional HUD to test and validate full match progression across multiple browser tabs.
* Security verification: verify that browser network inspection yields zero secret role leakage for Citizens.

### Milestone 3: 3D Environment, Low-Poly Map & Synced Characters
* React Three Fiber (R3F) and Three.js canvas setup in Next.js.
* Low-poly town map (central meeting plaza, houses, streets, ambient lighting).
* Third-person character controller (WASD, Sprint, Jump, Mouse Orbit camera).
* Rapier physics integration for terrain and building collisions.
* 20Hz movement synchronization over Colyseus with server speed-limit validation and client-side Lerp interpolation.

### Milestone 4: LiveKit Voice Integration
* LiveKit server setup and backend token generator service.
* Phase-gated channel switching:
  * Night: Mafia private channel.
  * Day Discussion: Public channel for living players.
  * Dead Chat: Segregated spectator channel.
* UI microphone controls: mute/unmute, input device selector, speaking indicators over 3D avatars.

### Milestone 5: 3D World + HUD Integration & Polish
* Combine the 3D viewport and 2D UI into a unified browser game experience.
* Cinematic camera cuts during morning announcements and player eliminations.
* Visual death states: tombstone / ghost avatars for eliminated players.
* Atmospheric visual cues: day/night skybox transitions and directional lighting shifts.

### Milestone 6: Hardening, Performance Optimization & Auditing
* Performance profiling on low-end laptops with integrated graphics.
* Optimize geometry, draw calls, and texture atlases.
* Anti-cheat testing: simulate malicious packet injection and clock tampering.
* High latency / network drop simulation and reconnection recovery testing.

### Milestone 7: Production Deployment & Observability
* Dockerize `@mafia/game-server` and configure horizontal WebSocket scaling.
* Deploy `@mafia/web` on Vercel / Node server.
* Provision production PostgreSQL instance and run Prisma migrations.
* LiveKit Cloud configuration and production environment secret management.

