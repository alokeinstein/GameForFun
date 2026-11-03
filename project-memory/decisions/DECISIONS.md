# Historical Architectural & Product Decisions

> [!WARNING]
> **READING RESTRICTION**: Do NOT read this file automatically on new chat startup. Consult only when debugging, modifying existing mechanics, or assessing architectural changes. See `decisions/README.md`.

---

### DEC-001: Monorepo Architecture with Turborepo & npm Workspaces
- **Date:** 2026-11-03
- **Area:** Architecture
- **Decision:** Organize the repository as a Turborepo monorepo using standard `npm workspaces` with decoupled packages (`@mafia/game-rules`, `@mafia/shared`, `@mafia/database`) and applications (`apps/game-server`, `@mafia/web`).
- **Reason:** Keeps the pure rules engine testable with zero web/DOM or WebSocket dependencies, shares types and Colyseus schemas seamlessly across server and client, and avoids duplication while maintaining fast cached build pipelines.
- **Impact:** All shared code and rules reside in `packages/`; apps import them directly without duplicate models.

---

### DEC-002: PostgreSQL & Prisma ORM for Match & User Persistence
- **Date:** 2026-11-03
- **Area:** Database
- **Decision:** Use PostgreSQL with Prisma ORM from Day One instead of temporary JSON files, SQLite, or NoSQL.
- **Reason:** Social deduction games require strict relational integrity between historical sessions, player actions, role assignments, vote records, and cumulative user stats.
- **Impact:** Active room sessions remain purely in-memory on Colyseus for ultra-low latency; completed matches archive relational records to PostgreSQL asynchronously post-victory.

---

### DEC-003: Colyseus 0.15 for Authoritative Multiplayer Room State
- **Date:** 2026-11-03
- **Area:** Networking / Architecture
- **Decision:** Use Colyseus 0.15 (`colyseus@0.15.57` and `colyseus.js@0.15.28`) rather than raw Socket.io or custom WebSocket handlers.
- **Reason:** Colyseus provides built-in binary delta schema compression (`@colyseus/schema`), server-side clock timers, seat reservations, room matchmaking, and automatic reconnection handling out of the box.
- **Impact:** Client views update reactively via schema listeners (`room.onStateChange`). Avoided Colyseus 0.18 / 0.16 version mismatch issues by pinning to stable 0.15.

---

### DEC-004: Zero Role Leakage via Directed Private WebSocket Messages
- **Date:** 2026-11-03
- **Area:** Security / Gameplay
- **Decision:** Never include player roles in the publicly synchronized `PlayerState` Colyseus schema. Transmit roles exclusively via directed private messages (`client.send(ROLE_ASSIGNMENT)`).
- **Reason:** Any property in a synchronized room schema is broadcast to all connected WebSocket clients, enabling trivial cheat engines and packet sniffing.
- **Impact:** Citizens receive zero information about Mafia teammates or other players. Full role identities are broadcast only upon match conclusion (`VICTORY` phase).

---

### DEC-005: Elimination Requires ≥ 50% Majority of All Eligible Living Voters
- **Date:** 2026-11-03
- **Area:** Gameplay
- **Decision:** Public Day elimination requires a strict majority ($\ge 50\%$) of **all eligible living voters**, not merely a plurality of cast votes.
- **Reason:** Social deduction balance dictates that an elimination is a high-stakes decision. Plurality voting enables Mafia voting blocs to easily hijack daytime trials when town votes are fragmented.
- **Impact:** In a 5-player living town, 3 votes are required. If the top candidate receives 2 votes (40%), no elimination occurs.

---

### DEC-006: Strict Plurality for Mafia Night Assassinations (Ties Produce Zero Kills)
- **Date:** 2026-11-03
- **Area:** Gameplay
- **Decision:** Mafia night targets are chosen by strict plurality among living Mafia members. If there is a tie between top candidates, no victim is eliminated.
- **Reason:** Enforces syndicate coordination and prevents arbitrary random server tie-breaking that could feel unfair or uncoordinated.
- **Impact:** Mafia teammates must communicate and agree on a single target before the night timer elapses.

---

### DEC-007: Failed Day Vote (< 50%) Transitions Directly to Night
- **Date:** 2026-11-03
- **Area:** Gameplay / State Machine
- **Decision:** When daytime voting or a runoff revote concludes without any candidate achieving $\ge 50\%$, the state machine transitions directly to `NIGHT`, incrementing the round counter without triggering an `ELIMINATION_ANNOUNCEMENT` phase.
- **Reason:** Displaying an elimination announcement screen when nobody was eliminated causes confusion and disjointed UX.
- **Impact:** Clean UX banner informs players that no consensus was reached, and the game proceeds immediately to the next Night phase.

---

### DEC-008: Host-Configurable Role Reveal on Elimination
- **Date:** 2026-11-03
- **Area:** Gameplay / UI
- **Decision:** Allow the room host to toggle whether an eliminated player's role is publicly revealed upon death (`revealRoleOnDeath: true | false`).
- **Reason:** Hardcore Mafia communities prefer concealed roles upon death (leaving town to deduce role counts), while casual groups prefer immediate revelation.
- **Impact:** System announcements and elimination banners dynamically respect the host's configuration.

---

### DEC-009: 60-Second Reconnection Grace Period with Cryptographic Tokens
- **Date:** 2026-11-03
- **Area:** Networking / Reliability
- **Decision:** When a player joins a room, the server issues a private cryptographic token. If a client drops connection, their seat, role, and alive status are reserved for 60 seconds.
- **Reason:** Prevents accidental page refreshes, mobile browser tab backgrounding, or brief Wi-Fi hiccups from abruptly terminating active matches.
- **Impact:** Reconnecting clients invoke `joinById(roomId, { reconnectionToken })` and instantly resume play without missing their turn.

---

### DEC-010: Developer Testing Mode (3 Players Minimum) Alongside Production Mode (5 Players Minimum)
- **Date:** 2026-11-03
- **Area:** Testing / Architecture
- **Decision:** Support a host-configurable `isDevMode: boolean` flag in room settings that lowers the minimum required player count from 5 to 3 and permits fast 1-second phase timers.
- **Reason:** Running automated end-to-end integration tests and manual multi-tab browser testing with 5 players requires excessive overhead. 3 players (1 Mafia, 2 Citizens) is the mathematical minimum for a complete social deduction game loop.
- **Impact:** Enables lightning-fast automated CI tests and effortless manual testing with just 3 browser windows.

---

### DEC-011: Stylized Low-Poly 3D Graphics with React Three Fiber and Rapier WASM Physics
- **Date:** 2026-11-03
- **Area:** 3D / Graphics
- **Decision:** Build the 3D game layer using React Three Fiber (`@react-three/fiber`), Drei helpers, and Rapier WASM physics (`@react-three/rapier`), adopting a flat-shaded stylized low-poly aesthetic (Deadshot.io style).
- **Reason:** R3F integrates seamlessly with Next.js 14 and React state; Rapier WebAssembly physics avoids garbage-collection frame drops; low-poly geometries require zero texture downloads, load in < 1 second, and achieve 60+ FPS on all devices.
- **Impact:** Eliminates heavy 3D asset overhead and guarantees instant web accessibility.

---

### DEC-012: Procedural Web Audio API Sound Synthesis
- **Date:** 2026-11-03
- **Area:** Audio / Frontend
- **Decision:** Synthesize all ambient sounds and phase transition audio cues mathematically using the browser's native `AudioContext` (oscillators, envelopes, biquad filters) rather than loading static `.mp3` or `.wav` files.
- **Reason:** Static audio files introduce network latency, 404/CORS failure risks, asset bundle bloat, and cache busting hurdles. Procedural synthesis guarantees instant playback with zero bandwidth consumption and 100% offline reliability.
- **Impact:** `apps/web/src/services/audio.ts` provides instant auditory cues (dawn bell, night drone, tribunal gavel, urgent countdown ticks) with master volume and mute controls persisted in localStorage.

---

### DEC-013: WebRTC Proximity Voice Mesh with Authoritative Dead Channel Isolation
- **Date:** 2026-11-03
- **Area:** Networking / Audio / Gameplay Integrity
- **Decision:** Implement peer-to-peer proximity voice chat using browser WebRTC peer connections signaled directly through the authoritative Colyseus room (`VOICE_SIGNAL`), with distance attenuation calculated dynamically in 3D and dead player voice isolation enforced at both the server signaling layer and client audio gain layer.
- **Reason:** Eliminates the need for a separate third-party voice signaling server; spatial quadratic distance falloff replicates realistic in-person social deduction; strict server-side dropping of voice signals from eliminated players prevents dead players from spoiling secret roles or communicating outside their spectator channel.
- **Impact:** Delivers immersive, tamper-proof proximity audio with visual speaking indicators on 3D character avatars and player cards.
