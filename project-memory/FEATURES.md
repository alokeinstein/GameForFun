# Feature Registry

## 1. Core Rules Engine (`@mafia/game-rules`)

### Feature: Role Distribution Formula
- **Status:** Implemented
- **Purpose:** Ensure balanced Mafia-to-Citizen ratios across varying room sizes.
- **Behaviour:** Calculates Mafia count using a configurable 10% to 30% clamp (e.g. 5–6 players = 1 Mafia, 7–9 players = 2 Mafia). Dev mode allows 1 Mafia in 3-player matches.
- **Important notes:** Verified by 10 Vitest unit tests in `roles.test.ts`.

### Feature: Authoritative 50% Day Voting Threshold
- **Status:** Implemented
- **Purpose:** Prevent unfair minority or plurality lynchings during the day phase.
- **Behaviour:** Requires a strict $\ge 50\%$ majority of all eligible living voters (e.g. 3 of 5, 2 of 3). Tied leading candidates trigger a runoff; sub-50% results transition directly to Night without elimination.
- **Important notes:** Verified by 6 unit tests in `voting.test.ts`.

### Feature: Night Assassination Plurality
- **Status:** Implemented
- **Purpose:** Allow Mafia teammates to coordinate hits while penalizing indecision.
- **Behaviour:** Highest vote tally among living Mafia determines the target. Any tie between top candidates results in zero deaths.
- **Important notes:** Verified by 5 unit tests in `night.test.ts`.

### Feature: Victory Condition Assessment
- **Status:** Implemented
- **Purpose:** Authoritatively decide match termination after each casualty.
- **Behaviour:** Citizens win immediately when 0 Mafia remain. Mafia wins immediately when living Mafia count $\ge$ living Citizen count (parity).
- **Important notes:** Verified by 6 unit tests in `victory.test.ts`.

---

## 2. Multiplayer Networking & Room Management (`@mafia/shared`, `@mafia/game-server`)

### Feature: 5-Character Room Code Matchmaking
- **Status:** Implemented
- **Purpose:** Simple, human-friendly room sharing without complex URLs or account setup.
- **Behaviour:** Generates unique, unambiguous 5-character alphanumeric codes (e.g. `M8K92`). Colyseus `filterBy(["roomCode"])` groups clients into the exact room session.
- **Important notes:** Tested in `MafiaRoom.test.ts`.

### Feature: Zero Role Leakage Architecture
- **Status:** Implemented
- **Purpose:** Eliminate any possibility of packet-sniffing cheats revealing roles.
- **Behaviour:** Roles exist solely in private server memory (`Map<sessionId, Role>`). Clients receive their role via directed private messages (`client.send`); public schema omits any role field.
- **Important notes:** End-to-end verified in `GameLoop.test.ts`.

### Feature: 60-Second Reconnection Grace Period
- **Status:** Implemented
- **Purpose:** Preserve game continuity when players suffer brief network drops or page reloads.
- **Behaviour:** On joining, clients receive a cryptographically signed token. If disconnected, their seat is reserved for 60 seconds; reconnecting restores full state and identity.
- **Important notes:** Unclaimed seats after 60s trigger auto-elimination to prevent stalled games.

### Feature: Dynamic Host Configuration & Dev Mode
- **Status:** Implemented
- **Purpose:** Allow custom match pacing and rapid automated testing.
- **Behaviour:** Room host can configure timers (Night, Discussion, Voting), role reveal on death, and toggle Developer Testing Mode (lowers minimum player count from 5 to 3).
- **Important notes:** Server validates bounds strictly on all config update messages.

### Feature: Match Reset to Lobby
- **Status:** Implemented
- **Purpose:** Enable consecutive matches with the same group without re-joining.
- **Behaviour:** After victory, the host sends `RESET_TO_LOBBY`. Server revives all players, clears ballots/roles, and resets state to `WAITING_FOR_PLAYERS`.
- **Important notes:** Non-hosts are prevented from triggering resets.

---

## 3. Web UI & Game HUD (`apps/web`)

### Feature: Noir Landing Page & Room Creation
- **Status:** Implemented
- **Purpose:** Clean, atmospheric entry point for hosting or joining matches.
- **Behaviour:** Allows players to set a custom nickname, generate a new room code, or join an existing room with instant input validation.

### Feature: Interactive Pre-Game Lobby
- **Status:** Implemented
- **Purpose:** Room organization, player readiness, and game rule inspection before match start.
- **Behaviour:** Real-time player roster with host crown badges, ready toggles, host settings panel, live role breakdown counter, and lobby chat.

### Feature: Classified Role Reveal Modal & HUD Dossier
- **Status:** Implemented
- **Purpose:** Deliver a dramatic and private role assignment experience.
- **Behaviour:** Full-screen confidential dossier modal showing role assignment, teammate list (for Mafia), and a persistent top-bar role badge for ongoing reference.

### Feature: Synchronized In-Game Clock & Phase Header
- **Status:** Implemented
- **Purpose:** Keep all clients aligned on game progress and time limits.
- **Behaviour:** Renders real-time countdown bar and badge synchronized with server timestamps (`phaseEndsAt`), living survivor counter, and round indicator.

### Feature: Syndicate Night Hit Interface
- **Status:** Implemented
- **Purpose:** Empower Mafia to coordinate night assassinations in real time.
- **Behaviour:** Living Mafia members see selectable living Citizen cards with live teammate ballot tallies. Citizens see an atmospheric sleeping-town graphic.

### Feature: Secret Ballot Voting & 50% Threshold Meter
- **Status:** Implemented
- **Purpose:** Intuitive day voting with transparent elimination criteria.
- **Behaviour:** Living player candidate cards with elimination buttons, self-voting prevention, green vote confirmation badges, and a live $\ge 50\%$ threshold requirement display.

### Feature: Post-Game Victory Screen & Full Roster Reveal
- **Status:** Implemented
- **Purpose:** Celebrate the winning team and provide complete post-match clarity.
- **Behaviour:** Dynamic banner for Citizens or Mafia victory, complete table displaying every player's secret role and survival outcome, and a host Return to Lobby control.

---

## 4. 3D World & Character Controller (Milestone 3 & Physics/Environment Polish)

### Feature: Stylized Urban City Park & Surrounding Skyline Map
- **Status:** Implemented (Upgraded)
- **Purpose:** Highly atmospheric, beautifully lit urban city park for social deduction gameplay, eliminating the pitch-black void.
- **Behaviour:** 84x84m vibrant green grass lawn, stone crosswalks with curbs, central circular plaza with stepped voting dais, civic obelisk monument with phase-reactive beacon, 22 multi-tiered trees (oak, pine, birch) with solid trunk colliders, 8 wooden park benches with backrests, 12 ornamental streetlamps casting warm pointlights, and 16 multi-story perimeter city buildings with illuminated window grids and rooftop water towers/HVAC units.
- **Important notes:** Solid Rapier colliders on all obstacles (buildings, benches, trees, monument) and perimeter boundary walls.

### Feature: Clean Decoupled Kinematic Character Controller & Jump Physics
- **Status:** Implemented (Upgraded)
- **Purpose:** Responsive third-person navigation with strict mathematical decoupling of horizontal movement and vertical physics.
- **Behaviour:** WASD movement calculated relative to dynamic camera heading projected onto the horizontal XZ plane ($y=0$). W/A/S/D keys never affect vertical velocity. Spacebar triggers a crisp upward vertical jump ($v_y = 7.2\text{ m/s}$) with downward raycast ground detection. Zero vertical teleportation on network updates; natural Rapier gravity ($g = -19.2\text{ m/s}^2$) and zero-friction capsule collider.

### Feature: Continuous Sprinting & Ground Clamping (No Sprint Jumping)
- **Status:** Implemented
- **Purpose:** Reliable high-speed horizontal sprinting without Rapier contact-solver bouncing or unwanted jumping.
- **Behaviour:** Holding `Shift` increases speed from $4.2\text{ m/s}$ to $8.5\text{ m/s}$ purely on horizontal axes ($x, z$). When grounded and not jumping, vertical velocity is clamped to $-0.6\text{ m/s}$, suppressing numerical contact-bounce micro-impulses and keeping the player glued to the ground during sprint. Jumping is strictly isolated to the Spacebar.

### Feature: GTA-Style Mouse Orbit Camera & Camera-Relative Movement
- **Status:** Implemented
- **Purpose:** Intuitive, modern third-person camera control inspired by GTA Vice City and competitive multiplayer games.
- **Behaviour:** Mouse movement orbits camera smoothly around player with spherical coordinates (`cameraYaw`, `cameraPitch` clamped to $[-0.2, 1.2]$ rad). Mouse wheel adjusts distance ($3.2\text{m} - 13.0\text{m}$). WASD movement vectors are dynamically calculated relative to current camera heading ($\mathbf{F}_{\text{cam}}, \mathbf{R}_{\text{cam}}$). Moving the mouse while stationary orbits freely without spinning the character.
- **Important notes:** Integrated with Pointer Lock API. Clicking canvas locks cursor; pressing `ESC` releases cursor instantly; clicking HUD buttons, chat, and modals automatically ignores pointer lock.

### Feature: Vertical Camera Stabilization & Zero-Bobbing Tracking
- **Status:** Implemented
- **Purpose:** Stable, jitter-free third-person tracking during walking, continuous sprinting, and camera rotation.
- **Behaviour:** Camera target point uses smoothed exponential lerp with dedicated vertical low-pass filtering (`focusTarget.current.y = lerp(..., 0.08)`). Character torso oscillation is decoupled from camera tracking, preserving natural limb swing animations while eliminating all scene-shaking head-bob artifacts.
- **Important notes:** Fully isolated per client in multiplayer sessions.

### Feature: Docked Top-0 HUD & In-Game UI Cleanliness
- **Status:** Implemented (Upgraded)
- **Purpose:** Eliminate double navbars and provide an unobstructed 3D viewport.
- **Behaviour:** Redundant global navbar removed from active gameplay. Sleek, compact top bar docked directly at `top-0` (67px) containing brand emblem, round badge, phase title & countdown, survivor tally, living status pill, Dossier view toggle, WebRTC mic button, and SFX volume. Center HUD hint indicates `"Click viewport to look around • ESC to release mouse"`.
- **Important notes:** Controls hint banner (`WASD: Move • Shift: Sprint • Space: Jump • Mouse: Look • ESC: Release`) and collapsible Town Chat widget floating cleanly.

### Feature: Networked Transform Synchronization (20 Hz + Lerp)
- **Status:** Implemented
- **Purpose:** Fluid multiplayer character movement without lag or excessive bandwidth.
- **Behaviour:** Local client sends throttled position/rotation to server; server synchronizes at 20 Hz; remote avatars smoothly interpolate (`lerp`) at 60 FPS.

### Feature: Dynamic Day/Night Lighting Cycle
- **Status:** Implemented
- **Purpose:** Visual reinforcement of game state transitions in the 3D scene.
- **Behaviour:** Environment lighting transitions between bright daylight sun (sky blue, warm sunlight, gentle fog), golden sunrise dawn, and dramatic midnight moonlight/fog with glowing streetlamps driven by the server's authoritative `phase`.

---

## 5. Audio & Social Communication (Milestone 4)

### Feature: Procedural Web Audio API Sound Synthesizer
- **Status:** Implemented
- **Purpose:** Zero-asset audio cues for heightened tension, phase changes, and instant tactile feedback.
- **Behaviour:** Pure mathematical audio generation via AudioContext oscillators and filters. Features dawn church bell, nightfall drone, tribunal gavel strike, doom toll, urgent clock ticks (last 10s), vote confirmations, and victory fanfare.
- **Important notes:** Zero MP3/WAV downloads; master volume and mute state persisted in localStorage.

### Feature: WebRTC Proximity Voice Chat & Spatial Attenuation
- **Status:** Implemented
- **Purpose:** Immersive social-deduction debate using real-time browser microphone audio.
- **Behaviour:** Peer connection mesh signaled through Colyseus (`VOICE_SIGNAL`). Distance attenuation calculated dynamically in 3D town square ($d = \sqrt{\Delta x^2 + \Delta z^2}$, max 30m). Includes mic mute toggle (`M` shortcut), Voice Activity Detection (VAD), and visual speaking rings on avatars.
- **Important notes:** Strict server-enforced dead channel: dead players cannot transmit audio signals to living players during active rounds.

---

## 6. Database & Persistent Accounts (`packages/database`, `apps/game-server`)

### Feature: PostgreSQL Relational Schema via Prisma
- **Status:** Implemented
- **Purpose:** Robust relational data store for match history, player statistics, and future accounts.
- **Behaviour:** Models defined for `User`, `GameSession`, `GamePlayer`, `GameEvent`, and `PlayerStats`. Validated via `prisma generate`.
- **Important notes:** Active match loop runs in-memory on Colyseus; database stores historical match summaries post-victory.

### Feature: Asynchronous Post-Match Session Archival
- **Status:** Implemented
- **Purpose:** Automatically record game sessions, round lengths, winning factions, and individual participant survival/roles.
- **Behaviour:** Invoked asynchronously in `MafiaRoom.ts` upon `Phase.VICTORY` via `recordCompletedMatch`. Includes graceful offline fallback when database is unconfigured.
- **Important notes:** Verified by unit and integration tests in `MatchArchival.test.ts`.

### Feature: Player Career Statistics & Career Dossier
- **Status:** Implemented
- **Purpose:** Track career victories, mafia/citizen win ratios, and survival tallies per player alias.
- **Behaviour:** Upserted in `PlayerStats` on game victory and inspectable on the web landing page via Career Dossier modal and REST endpoints (`/api/stats/:username`, `/api/leaderboard`, `/api/history`).

### Feature: Multi-Container Production Docker Compose
- **Status:** Implemented
- **Purpose:** Seamless containerized deployment of PostgreSQL 16, Colyseus Game Server, and Next.js Web App.
- **Behaviour:** Multi-stage Dockerfiles (`apps/game-server/Dockerfile`, `apps/web/Dockerfile`) orchestrated via root `docker-compose.yml`.
