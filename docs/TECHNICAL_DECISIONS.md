# MAFIA 3D — Architectural Decision Records (ADRs)

## Record of Approved Technical Decisions

### ADR-01: Monorepo Tooling & Workspaces
* **Decision:** Use `npm workspaces` combined with `Turborepo`.
* **Context:** The environment has Node v24 and npm 11. `pnpm` is not globally installed.
* **Outcome:** Zero environment friction. Turborepo provides pipeline caching and fast parallel execution across `apps/*` and `packages/*`.

---

### ADR-02: PostgreSQL Persistence from Day 1
* **Decision:** Use PostgreSQL as the exclusive database engine with Prisma ORM across all environments.
* **Context:** Corrects initial co-founder suggestion of SQLite for local dev. Avoids SQL dialect drift, schema divergence, and migration friction between SQLite and PostgreSQL.
* **Outcome:** Clean, unified database schema from day one.

---

### ADR-03: Real-Time Multiplayer Architecture (Colyseus)
* **Decision:** Deploy a standalone Node.js Colyseus server communicating via WebSockets.
* **Context:** Next.js Server Actions and API Routes are request-response paradigms unsuitable for 20Hz authoritative game loops and state delta broadcasts.
* **Outcome:** Dedicated multiplayer room lifecycle, built-in reconnection management, binary schema delta compression, and sub-50ms tick processing.

---

### ADR-04: Framework-Agnostic Core Rules Engine (`packages/game-rules`)
* **Decision:** Build all mathematical and logical rules (role formulas, voting math, win conditions, FSM validators) in an isolated, pure TypeScript package with zero runtime dependencies.
* **Context:** Keeps game rules 100% testable in Vitest, completely decoupled from React, Next.js, Colyseus, and the database.
* **Outcome:** Enables lightning-fast unit tests and guarantees that neither UI nor networking changes can break core Mafia mechanics.

---

### ADR-05: Zero Secret Role Leakage Protocol
* **Decision:** Never expose secret roles in public Colyseus synchronized schemas or public match-history endpoints.
* **Context:** Transport Layer Security (WSS) does not prevent clients from inspecting WebSocket frames delivered to them.
* **Outcome:** Private roles and Mafia teammate lists are transmitted strictly via directed private messages (`client.send`). In-progress matches never return roles to public queries.

---

### ADR-06: 3D Graphics & Rendering Pipeline
* **Decision:** Use Three.js, React Three Fiber (R3F), and Rapier WebAssembly physics, targeting the lightweight performance philosophy of *Deadshot.io*.
* **Context:** The game must run smoothly on ordinary laptops with integrated graphics.
* **Outcome:** Low-poly geometry, texture atlasing, static baked lighting, and direct Three.js object manipulation in `useFrame` (bypassing React component re-renders for 60fps performance).

---

### ADR-07: Voice Communication Architecture (LiveKit SFU)
* **Decision:** Use LiveKit WebRTC SFU with server-minted, short-lived JWT tokens.
* **Context:** Peer-to-peer WebRTC cannot scale to 10+ players.
* **Outcome:** Minimal client upload bandwidth (1 stream), role-gated private channels, and instant revocation of living channel access upon player elimination.

---

### ADR-08: Revote State Machine Transition Correction
* **Decision:** If a revote fails to achieve the 50% elimination threshold, the state machine transitions **directly to `NIGHT`**.
* **Context:** Corrects earlier proposal that routed all revotes through an `ELIMINATION_ANNOUNCEMENT` phase even when nobody was eliminated.
* **Outcome:** Clear, bug-free state transitions and eliminates confusing false elimination announcements.

---

### ADR-09: Disconnection Grace Window
* **Decision:** A disconnected player is granted a 60-second grace window to reconnect with their token.
* **Context:** Transient network glitches must not immediately eliminate players.
* **Outcome:** Reconnection restores socket bindings and identity without player duplication.

---

### ADR-10: Configurable Room Capacity
* **Decision:** Treat room maximum capacity as a configurable infrastructure setting rather than hardcoding an arbitrary game rule.
* **Context:** Facilitates scaling tests and room flexibility.
* **Outcome:** Clean separation between network capacity limits and gameplay balance.
