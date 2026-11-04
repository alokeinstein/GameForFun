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


---

## 7. Multi-Game Platform Expansion (Milestone M0)

### Feature: Forward Step-Climbing Assistance
- **Status:** Implemented
- **Purpose:** Enable characters to naturally walk up curbs, steps, and elevated platforms up to $0.35$m high without getting stuck on vertical collision faces or requiring manual jumps.
- **Behaviour:** Dual-ray forward probe in `CharacterController.tsx` (`y + 0.08` foot probe and `y + 0.42` knee/waist clearance probe). When a low obstacle with clear upper space is encountered while moving forward, a smooth vertical step impulse ($v_y = 2.8\text{ m/s}$) lifts the capsule over the ledge.
- **Important notes:** Verified in browser automation across sidewalks, curbs, and dais.

### Feature: Downward Ground Snapping & Clearance Evaluation
- **Status:** Implemented
- **Purpose:** Eliminate mid-air floating when characters step down ledges, curbs, or descend slopes.
- **Behaviour:** High-fidelity downward raycast (`y + 0.40` downwards) measures exact clearance relative to capsule bottom. If clearance is between $0.14$m and $0.45$m during non-jump descent, downward snap velocity ($-3.2\text{ m/s}$) firmly attaches the character to the descending terrain.
- **Important notes:** Clamps vertical velocity to $-0.6\text{ m/s}$ when grounded, maintaining smooth sprinting without hops.

### Feature: Expanded 152m x 152m Urban Map
- **Status:** Implemented
- **Purpose:** Provide a significantly larger, coherent urban game environment with distinct districts, natural terrain elevations, and solid Rapier colliders.
- **Behaviour:** Contains Zone A Central Park (dais with solid cylinder collider, 4 approach ramps, obelisk, 28 trees, 20 lamps), Dedicated Multi-Tier Elevation Pavilion ($+0.60$m terrace, $8.5^\circ$ ramp, 3-step stairs), Zone B City Streets & Sidewalks (asphalt roads, markings, $+0.14$m raised sidewalks with cuboid colliders), Zone C Commercial Boulevard (12 buildings with awnings/props), Zone D Residential District (12 brownstones/apartments), and boundary walls at $\pm 76$m. Server boundary clamping in `MafiaRoom.ts` expanded to $[-85, 85]$.
- **Important notes:** Verified at 121 FPS across 3 connected clients in `scripts/terrain-grounding-browser-test.mjs`.

---

## 8. Multi-Game Platform Expansion (Milestone M1)

### Feature: Post-Room-Creation Dual-Game Selection Screen
- **Status:** Implemented
- **Purpose:** Present room creators with an intuitive, modern UI to pick between MAFIA 3D and SHOOTING GAME upon room generation.
- **Behaviour:** Renders two high-impact cards (`GameSelectionScreen.tsx`) with game badges, player capacities (3–20 vs 2–24), game descriptions, and feature tags. Host clicking a card dispatches game mode selection and routes clients to the appropriate lobby.
- **Important notes:** Preserves identical 5-character room code format and single-room URL scheme (`/lobby/[roomCode]`). Non-host players joining an unselected room see an informative waiting banner.

### Feature: Colyseus Multi-Game Room Engine & Metadata Router
- **Status:** Implemented
- **Purpose:** Provide complete state and logic isolation between game modes while sharing server infrastructure.
- **Behaviour:** Colyseus server registers `shooting_room` alongside `mafia_room` filtered by `roomCode`. HTTP inquiry endpoint `/api/rooms/:roomCode` inspects active instances across both room types and returns authoritative `gameMode`, allowing connecting clients to instantly route to the correct room without guesswork.
- **Important notes:** Complete isolation prevents cross-game state pollution. Mafia room rules never run in Shooting rooms, and vice versa.

### Feature: Multi-Team Shooting Lobby & Match Settings Isolation
- **Status:** Implemented
- **Purpose:** Dedicated pre-game lobby for the Shooting Game with multi-team assignment and match customization.
- **Behaviour:** Displays 3 distinct team rosters: Team Red (`#ef4444`), Team Blue (`#3b82f6`), and Team Green (`#10b981`). Players can click to join available teams; room host has administrative controls to reassign players to balance rosters. Host can configure match duration (3–15 min), score limit (15–75 kills), combat map, and respawn delay.
- **Important notes:** Completely isolates game settings. Mafia settings (mafia ratio, voting duration, dev mode) are never shown in shooting lobbies.

### Feature: Authoritative Shooting State Machine & Match Lifecycle
- **Status:** Implemented
- **Purpose:** Authoritative lifecycle management for multiplayer combat sessions.
- **Behaviour:** `ShootingRoomState` manages transition through `LOBBY` $\rightarrow$ `COUNTDOWN` $\rightarrow$ `ACTIVE` $\rightarrow$ `MATCH_OVER`. Scores, timer countdowns, and winning team evaluation are computed server-side. Host can issue `RESET_TO_LOBBY` to return all connected players to the lobby for rematches.
- **Important notes:** Verified with 3 integration tests in `ShootingRoom.test.ts` and 7 browser automation tests in `scripts/multi-game-browser-test.mjs`.

---

## 9. Multi-Game Platform Expansion (Milestone M2)

### Feature: Extensible Weapons Catalog & Hit Region Configuration
- **Status:** Implemented
- **Purpose:** Centralized, declarative weapon database and body-part hit region multipliers for server-authoritative combat.
- **Behaviour:** `WEAPONS_CATALOG` defines 5 balanced weapon archetypes:
  1. `assault_rifle`: M4-A1 (32 dmg, 10 Hz, 30 mag, 120 reserve, 65m range, 0.035 recoil)
  2. `shotgun`: Tactical Pump Shotgun (18 dmg x 8 pellets = 144 burst, 1.2 Hz, 8 mag, 32 reserve, 25m range)
  3. `sniper_rifle`: AWM Heavy Sniper (85 dmg, 2.2x headshot multiplier, 0.8 Hz, 5 mag, 25 reserve, 140m range)
  4. `smg`: Vector Rapid SMG (22 dmg, 14 Hz, 35 mag, 140 reserve, 40m range, tight hipfire)
  5. `pistol`: Desert Eagle .50 (28 dmg, 4 Hz, 12 mag, 60 reserve, 35m range)
  - Hit region multipliers: Head (2.0x), Upper Torso (1.0x), Abdomen (0.85x), Arms (0.65x), Legs (0.60x).
- **Important notes:** Fully decoupled from character controller; easily extensible for future weapons without rewriting mechanics.

### Feature: Pre-Match Weapon Loadout Selection & Sync
- **Status:** Implemented
- **Purpose:** Allow players to customize their primary combat weapon in the shooting lobby before entering battle.
- **Behaviour:** Renders 5 interactive weapon cards in `ShootingLobby.tsx` displaying weapon icon, category, description, and key stat bars. Clicking an unequipped weapon dispatches `SHOOTING_SELECT_LOADOUT`; server updates `player.weaponId`, `ammo`, and `maxAmmo`, and synchronizes state to all clients.
- **Important notes:** Player weapon preferences are displayed next to their name in the team roster so teammates can coordinate roles (e.g. Snipers vs CQC Shotguns).

### Feature: Host Auto-Balance Teams & Team Renaming
- **Status:** Implemented
- **Purpose:** Ensure balanced team sizes with one click and allow custom team branding.
- **Behaviour:** Host can click "Auto-Balance Teams" (`SHOOTING_AUTO_BALANCE`) to round-robin distribute all connected players evenly across active teams (`team-red`, `team-blue`, `team-green`). Host can also click the edit button on any team card (`SHOOTING_RENAME_TEAM`) to rename teams (e.g. "Crimson Wolves").
- **Important notes:** Verified with 4 integration tests in `ShootingRoom.test.ts` and 6 browser automation tests in `scripts/shooting-lobby-browser-test.mjs`.

---

## 10. Multi-Game Platform Expansion (Milestone M3)

### Feature: Dedicated 3D Urban Combat Shooting Arena (`ShootingMap.tsx`)
- **Status:** Implemented
- **Purpose:** Provide a dedicated, competitive $160\text{m} \times 160\text{m}$ battlefield engineered specifically for fast-paced multiplayer shooting with multiple elevation tiers.
- **Behaviour:**
  - Team Red, Team Blue, and Team Green spawn bases with elevated pads ($+0.25$m), team colored floodlights, sandbag walls, and flags.
  - Central Abandoned Warehouse ($32\text{m} \times 24\text{m}$, height $7.5$m) with 4 open doorways, ground floor cover crates, and an elevated interior catwalk ($+3.5$m elevation) accessible via two inclined industrial staircases.
  - Shipping Container Flanking Maze with 11 stacked containers and sloped metal ramps leading to walkable container roofs ($+2.6$m).
  - Two elevated sniper watchtowers ($+5.2$m elevation) with access ramps and chest-high sandbag parapets.
  - Street network with 18 concrete Jersey barriers, 3 armored tactical trucks, and 6 floodlight poles.
- **Important notes:** Every walking surface (floors, ramps, stair treads, catwalks, container roofs) and barrier has a matching 1:1 Rapier WASM physical collider.

### Feature: 3D Shooting Player Controller & Team Avatars
- **Status:** Implemented
- **Purpose:** Full third-person character navigation and visual representation for the shooting game.
- **Behaviour:** `ShootingCharacterController.tsx` provides mouse aiming, pointer lock, camera-relative WASD steering, Spacebar jump ($v_y = 7.4\text{ m/s}$), and forward step-climbing assist. `ShootingCharacterAvatar.tsx` renders tactical combat uniforms with team colors, helmets, visors, overhead nameplates with health bars, and 3D weapon models held in hand (Rifle, Shotgun, Sniper, SMG, Pistol).
- **Important notes:** Spawns players authoritatively in their team's designated base (Red, Blue, Green).

### Feature: 2D Tactical Combat HUD Overlay (`ShootingCombatHUD.tsx`)
- **Status:** Implemented
- **Purpose:** Provide a high-visibility, clean competitive combat interface during active shooting matches.
- **Behaviour:** Docked top banner displays Team Deathmatch status, live team score tracks, match countdown timer, and kill limit. Center viewport features an aiming crosshair. Bottom-left HUD displays team identity, real-time health bar (100 HP), and shield bar (50 Shield). Bottom-right widget displays equipped weapon name, category, emoji, and magazine ammo counter. Includes host "Return to Lobby" action.
- **Important notes:** Verified across 6 real-browser tests in `scripts/shooting-map-browser-test.mjs`.

---

## 12. Multi-Game Platform Expansion (Milestone M6: Match Progression & Post-Match Podium)

### Feature: Authoritative Match Progression & Win Conditions
- **Status:** Implemented
- **Purpose:** Reliable match progression and termination across score limits, duration expiration, and draws.
- **Behaviour:** 
  - Server transitions room status from `ACTIVE` to `MATCH_OVER` when a team reaches `config.scoreLimit` or when `matchDurationSec` timer expires.
  - Automatically clears all combat timers (reload, respawn, match countdown) and locks all combat actions.
  - Determines winner or detects draw if scores are equal.
- **Important notes:** Unit tested in `ShootingMatchLoop.test.ts`.

### Feature: Post-Match Victory Podium & Accolades Breakdown (`ShootingPostMatchScreen.tsx`)
- **Status:** Implemented
- **Purpose:** Cinematic celebration of the winning squad, performance recognition, and comprehensive leaderboard.
- **Behaviour:**
  - Header displays victory banner for winning team with team color glow, or draw announcement.
  - Procedural victory fanfare (triumphant C-major) for winners; somber defeat stinger for losers.
  - Accolades highlight cards: MVP (highest total score), Top Fragger (most eliminations), Sharpshooter (highest headshot count).
  - Team breakdown cards displaying total squad score and surviving player count.
  - Full match leaderboard table ranking combatants by Score, Kills, Deaths, K/D ratio, Damage dealt, and Headshots.
  - Host "Rematch / Return to Lobby" control (`RESET_TO_LOBBY`) that cleanly resets all player vitals, scores, and team counts, returning room to `LOBBY`.
- **Important notes:** Verified with 6 browser automation test suites in `shooting-postmatch-browser-test.mjs`.

---

## 13. Multi-Game Platform Expansion (Milestone M7: Scaling & Security Validation)

### Feature: Anti-Cheat & Input Sanitization Validation
- **Status:** Implemented
- **Purpose:** Protect against coordinate tampering, speedhacks, rapid fire flood injection, and state exploits.
- **Behaviour:**
  - Position clamping restricts client coordinates strictly to $[-85, 85]$ horizontally and $[-5, 30]$ vertically; non-finite payloads (`NaN`, `Infinity`) are rejected.
  - Rate-of-fire validation rejects fire spam flood attacks; cooldown injection cannot bypass weapon fire intervals.
  - Mid-combat loadout switching is prohibited while alive, preventing instant ammo reload or gun switching exploits.
  - Friendly fire validation strictly prevents teammates from damaging each other when disabled.
  - Dead players cannot shoot; dead players cannot be repeatedly damaged during respawn delay.
  - Private cryptographic reconnection tokens preserve full combat state upon rejoin.
- **Important notes:** Verified by 6 test suites in `ShootingSecurityAndScaling.test.ts`.

### Feature: High-Concurrency Multiplayer Scaling (16 Players)
- **Status:** Implemented
- **Purpose:** Validate that the room system supports dynamic, large multiplayer matches beyond 4 players without performance degradation.
- **Behaviour:**
  - Scaled concurrency test harness in `scripts/shooting-stress-test.mjs` runs 16 concurrent headless players in a single `ShootingRoom`.
  - Simulates simultaneous 20Hz movement streaming, circular patrol navigation, and high-frequency crossfire combat.
  - Measured metrics: Average patch latency **65.45 ms**, median latency **62.00 ms**, 95th percentile latency **65.00 ms**, with 2,103 state patches and 4,352 muzzle flashes synchronized with 0 errors.

---

## 14. Multi-Game Platform Expansion (Milestone M8: Visual Polish & Sound Design)

### Feature: Tactical 3D Sky Dome & Atmospheric Environment
- **Status:** Implemented
- **Purpose:** Provide a visually compelling, atmospheric competitive combat environment without expensive heavy textures.
- **Behaviour:**
  - Dynamic celestial twilight dome (`#0c1322` to `#1e293b`) with horizon fog.
  - 24 procedural distant building silhouettes generating an urban skyline at $r = 110$m.
  - High-altitude sun/moon sphere (`#fef08a`) casting tactical directional shadows.

### Feature: 3D Combat Visual Effects (`ShootingCombatVFX.tsx`)
- **Status:** Implemented
- **Purpose:** Immersive 3D feedback for all combat interactions across local and remote players.
- **Behaviour:**
  - Dynamic muzzle flash point light pulse and flare on every shot.
  - High-velocity luminous bullet tracers connecting gun muzzle to target trajectory.
  - 3D surface impact sparks and character hit flares.
  - 3D floating damage indicators above victim heads with `-32` or `💥 -64 HEAD` headshot alerts and upward float/fade.

### Feature: Extended Procedural Zero-Asset Audio Engine (`combatAudio.ts`)
- **Status:** Implemented
- **Purpose:** Full sensory acoustic feedback without external asset dependencies.
- **Behaviour:**
  - Weapon-specific gunshots for all 5 archetypes.
  - Empty clip dry-fire click sound.
  - Kinetic jump thrust / whoosh audio.
  - Surface impact / bullet spark audio.
  - Hitmarker chirps (crisp 1750Hz headshot vs 1100Hz body hit).
  - Mechanical reload sequence and kill-confirmed chime.
  - Triumphant C-major victory fanfare and somber defeat stinger.
- **Important notes:** Verified across 7 multi-client staging browser tests in `scripts/shooting-staging-browser-test.mjs`.




