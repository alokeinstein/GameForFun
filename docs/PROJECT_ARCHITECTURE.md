# MAFIA 3D — System Architecture

## 1. Overview & Architectural Goals
MAFIA 3D is a browser-based, server-authoritative, real-time multiplayer social-deduction game. The system is designed for high performance, low bandwidth consumption, zero secret role leakage, and smooth 60fps rendering even on low-end laptops with integrated graphics.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  +------------------------------------+  +-----------------------------------------+  |
|  |     Next.js (App Router, React)    |  |       3D Canvas (R3F, Three.js)         |  |
|  |  • Auth, Landing, Room Lobby       |  |  • Low-poly town map & player avatars   |  |
|  |  • 2D Game HUD, Chat, Voting UI    |  |  • Rapier physics & camera controller   |  |
|  |  • Audio controls & state modals   |  |  • 60fps render loop & network Lerp    |  |
|  +-----------------+------------------+  +--------------------+--------------------+  |
|                    |                                          |                       |
|                    +---------------------+--------------------+                       |
|                                          |                                            |
|                        Zustand Store / Colyseus Client SDK                            |
+------------------------------------------+--------------------------------------------+
                                           | WebSockets (Binary Schemas & Direct Msgs)
                                           v
+---------------------------------------------------------------------------------------+
|                         SERVER LAYER (Authoritative Node.js)                          |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  |                   Colyseus Room Engine (20Hz Tick Loop)                         |  |
|  |  • Client authentication & session management                                   |  |
|  |  • Server-authoritative Game State Machine (Lobby -> Night -> Day -> Vote -> Win)  |  |
|  |  • Movement validation & anti-teleport bounds checking                          |  |
|  |  • Secret role distribution (cryptographic RNG)                                 |  |
|  |  • Filtered network transmission (Zero role leakage to unauthorized clients)    |  |
|  +---------------------------------------------------------------------------------+  |
+--------------------+---------------------------------------------+--------------------+
                     |                                             |
     WebRTC Signaling|Tokens                       Async Flush     | Match Summaries
                     v                                             v
+-----------------------------------------+  +------------------------------------------+
|            VOICE LAYER (LiveKit)        |  |          PERSISTENCE LAYER (Prisma)      |
|  • WebRTC SFU (Selective Forwarding)    |  |  • PostgreSQL (from Day 1)               |
|  • Phase-gated tokens (Night = Mafia)   |  |  • Match history, Player statistics      |
|  • Public Discussion vs Dead-Chat       |  |  • User accounts & persistent profiles   |
+-----------------------------------------+  +------------------------------------------+
```

## 2. Core Architectural Pillars

### 2.1 Monorepo Architecture
The repository uses an **npm workspaces** monorepo orchestrated with **Turborepo**:
- `apps/web`: Next.js 14/15 App Router frontend application.
- `apps/game-server`: Colyseus room-based multiplayer server.
- `packages/game-rules`: Pure, framework-agnostic TypeScript package containing mathematical formulas and state transition logic. Zero runtime dependencies.
- `packages/shared`: Shared TypeScript definitions, network message schemas, and timing configurations.
- `packages/database`: PostgreSQL persistence layer powered by Prisma ORM.

### 2.2 Client-Side Separation: 2D HUD vs 3D Viewport
- Next.js and React manage DOM-based user interfaces: authentication, room lobbies, configuration forms, voting dialogs, and HUD overlays.
- React Three Fiber (R3F) and Three.js run the 3D viewport canvas.
- High-frequency 3D data (position, rotation, camera updates) is decoupled from standard React component state to prevent high-frequency re-renders. Character updates are applied directly to Three.js `Object3D` instances in the animation loop.

### 2.3 Server Authority & State Synchronization
- The Colyseus server runs the authoritative simulation loop at **20Hz**.
- Public room state (phase, remaining timer, public player transforms, alive status) is synchronized via `@colyseus/schema` binary deltas.
- **Role Privacy Guarantee:** Secret roles are never attached to public schemas. Private state is transmitted exclusively via directed messages (`client.send`).

### 2.4 Voice Layer (LiveKit SFU)
- WebRTC voice communication uses LiveKit's Selective Forwarding Unit (SFU) architecture.
- Voice channels are strictly segregated and authorized by server-minted JWTs:
  - Day Discussion: Living players only.
  - Night Mafia: Living Mafia members only. Eliminated Mafia members lose access immediately upon death.
  - Dead Chat: Eliminated players have their own isolated channel and cannot communicate with living players.

### 2.5 Persistence Layer (PostgreSQL & Prisma)
- Transient gameplay state (player coordinates, voting tallies, tick timers) lives in memory on the game server.
- PostgreSQL stores user accounts, match summaries, aggregated statistics, and post-game event logs.
- Match history records do not expose secret roles to public client queries while a match is in progress.

