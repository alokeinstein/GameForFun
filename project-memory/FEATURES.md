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

## 4. 3D World & Character Controller (Milestone 3)

### Feature: Stylized Low-Poly Town Square Map
- **Status:** Implemented
- **Purpose:** Atmospheric, high-performance 3D environment for social deduction gameplay.
- **Behaviour:** Central town square tribunal with stone circle for voting, surrounding low-poly buildings, cobblestone paths, and atmospheric street lighting.
- **Important notes:** Built with React Three Fiber (`@react-three/fiber`, `@react-three/drei`).

### Feature: Kinematic Character Controller & Camera
- **Status:** Implemented
- **Purpose:** Responsive third-person player navigation during 3D phases.
- **Behaviour:** WASD / Arrow key movement, sprint (`Shift`), ground clamping via Rapier physics (`@react-three/rapier`), and smooth third-person follow camera.

### Feature: Networked Transform Synchronization (20 Hz + Lerp)
- **Status:** Implemented
- **Purpose:** Fluid multiplayer character movement without lag or excessive bandwidth.
- **Behaviour:** Local client sends throttled position/rotation to server; server synchronizes at 20 Hz; remote avatars smoothly interpolate (`lerp`) at 60 FPS.

### Feature: Dynamic Day/Night Lighting Cycle
- **Status:** Implemented
- **Purpose:** Visual reinforcement of game state transitions in the 3D scene.
- **Behaviour:** Environment lighting transitions between bright daylight sun, sunrise dawn, and moody midnight moonlight/fog driven by the server's authoritative `phase`.

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

## 6. Database & Persistent Accounts (`packages/database`)

### Feature: PostgreSQL Relational Schema via Prisma
- **Status:** Implemented
- **Purpose:** Robust relational data store for match history, player statistics, and future accounts.
- **Behaviour:** Models defined for `User`, `GameSession`, `GamePlayer`, `GameEvent`, and `PlayerStats`. Validated via `prisma generate`.
- **Important notes:** Active match loop runs in-memory on Colyseus; database stores historical match summaries post-victory.
