# Project Context

## 1. Identity & Vision
- **Project Name:** MAFIA 3D Multiplayer
- **Purpose:** A browser-based real-time 3D multiplayer social deduction game based on the classic party game Mafia / Werewolf.
- **Vision:** Deliver an instant, zero-install, browser-accessible 3D multiplayer experience with the visual clarity of Deadshot.io, smooth 60 FPS performance across modern desktop and mobile browsers, and airtight server-authoritative competitive integrity.

---

## 2. Core Gameplay Loop
1. **Lobby:** 5 to 20 players (3 to 20 in Dev Mode) gather via 5-character room codes (e.g. `M8K92`). Host configures timers, Mafia ratio (10-30%), and death reveal settings.
2. **Role Assignment:** Authoritative server cryptographically shuffles and delivers secret roles privately. Mafia members see their syndicate teammates; Citizens see only their own innocence.
3. **Night Phase:** The town sleeps. Living Mafia select a citizen target. Strict plurality decides the hit; tied votes produce zero casualties.
4. **Dawn Announcement:** The server announces the victim (or a peaceful night) and immediately checks victory conditions.
5. **Day Discussion:** Synchronized timer during which players strategize, question suspects, and form alliances.
6. **Day Voting:** Secret ballot voting to eliminate a suspected Mafia member. Eliminating a player strictly requires $\ge 50\%$ majority of all eligible living voters. Ties trigger a single runoff revote; sub-50% results transition directly back to Night.
7. **Victory Condition:**
   - **Citizens Win:** When 0 Mafia remain alive.
   - **Mafia Win:** When living Mafia $\ge$ living Citizens (parity reached).
   - Post-game reveal displays the true roles of all players.

---

## 3. Technology Stack
- **Monorepo:** npm workspaces + Turborepo (`turbo.json`).
- **Frontend (`apps/web`):** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide icons, Colyseus.js (`0.15.28`).
- **3D Graphics & Physics (`apps/web`):** Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`, Rapier 3D WebAssembly physics (`@react-three/rapier`).
- **Game Server (`apps/game-server`):** Node.js 20+, Colyseus 0.15 (`colyseus@0.15.57`, `@colyseus/ws-transport@0.15.3`), Express 4.
- **Core Rules Engine (`packages/game-rules`):** Pure TypeScript, framework-agnostic rules engine covered by Vitest unit tests.
- **Shared Schemas (`packages/shared`):** Colyseus `@colyseus/schema` data structures (`MafiaRoomState`, `PlayerState`, `GameConfigState`) and message definitions.
- **Database & Persistence (`packages/database`):** PostgreSQL + Prisma ORM (schemas for `User`, `GameSession`, `GamePlayer`, `GameEvent`, `PlayerStats`).

---

## 4. Key Architectural Principles
1. **Strict Server Authority:** Clients transmit intent only (`CAST_VOTE`, `MAFIA_TARGET_VOTE`, `PLAYER_INPUT`). The server authoritatively validates rules, advances timers, eliminates players, and awards victory.
2. **Zero Role Leakage:** Secret roles are never attached to public Colyseus schemas or room broadcast payloads. Roles are delivered via private directed WebSocket messages. Packet sniffing reveals zero role information.
3. **Plurality Night, Majority Day:**
   - Night assassination requires strict plurality among living Mafia (ties produce no kill).
   - Day elimination requires at least 50% of **all eligible living voters** (e.g. 3 of 5, 2 of 4, 2 of 3).
4. **Resilient Reconnection:** Disconnected players receive a 60-second grace window to reconnect using cryptographically signed session tokens without forfeiting their seat or status.
5. **Stylized Low-Poly Aesthetic:** Flat-shaded, low-polygon environment and character avatars avoiding heavy texture downloads to guarantee instantaneous loading and smooth framerates on integrated graphics.
