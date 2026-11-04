# Project Context

## 1. Identity & Vision
- **Project Name:** Multi-Game Multiplayer Platform (MAFIA 3D + TEAM SHOOTING GAME)
- **Purpose:** A browser-based real-time 3D multiplayer gaming platform powered by shared room infrastructure, supporting social deduction (MAFIA 3D) and fast-paced team combat (TEAM SHOOTING GAME).
- **Vision:** Deliver an instant, zero-install, browser-accessible 3D multiplayer platform with the visual clarity of Deadshot.io, smooth 60+ FPS performance across laptops and integrated graphics, flexible room capacities without arbitrary 4-player limitations, and airtight server-authoritative competitive integrity. Both games share the platform infrastructure (room creation, room codes, invitations, player identity, host privileges, reconnection) while maintaining independent game engines, state machines, and HUDs.

---

## 2. Core Gameplay Loops

### 2.1 MAFIA 3D Core Loop
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

### 2.2 TEAM SHOOTING GAME Core Loop
1. **Shooting Lobby:** Configurable room capacity (tested up to 16+ simultaneous combatants). Players choose their weapon loadout (M4-A1, Shotgun, Heavy Sniper, SMG, Desert Eagle) and join Team Red, Blue, or Green. Host can auto-balance teams, rename squads, or customize match settings.
2. **Match Deployment:** Players spawn authoritatively at designated team bases within the $160\text{m} \times 160\text{m}$ urban combat arena with 100 Health and 50 Armor Shield.
3. **Fast-Paced Combat:** Third-person combat controls with pointer lock, camera ADS zoom, server-authoritative rate-of-fire enforcement, and hitscan raycasting with Rapier WASM obstacle occlusion.
4. **Damage & Scoring:** Server-authoritative hit region multipliers (Head 2.0x, Torso 1.0x, Abdomen 0.85x, Arms 0.65x, Legs 0.60x). Shield absorbs damage first. Eliminating an opponent awards squad points (+150 for headshot, +100 standard) and broadcasts to the real-time kill feed.
5. **Automated Respawn:** Eliminated players automatically respawn at their team base after a brief cooldown with replenished vitals and ammunition.
6. **Victory & Podium:** Match terminates when a team achieves the score limit or duration expires. Displays victorious fanfare, MVP, Top Fragger, and Sharpshooter accolades, team standings, and a full combat leaderboard with host rematch return.

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
