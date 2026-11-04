# Changes Log

## 2026-11-04

- Fixed: Resolved character vertical elevation bug in `CharacterController.tsx` where Rapier `RigidBody` received dynamic `position` updates on every network tick, causing character to float upward during W/S and fall from the air on key release. Fixed by caching initial spawn position once on mount using `useRef`.
- Fixed: Decoupled horizontal and vertical character physics cleanly. Projected camera forward direction onto the horizontal ground plane ($y=0$) so camera pitch never introduces vertical velocity. Applied horizontal movement strictly to $x$ and $z$ velocities.
- Added: Spacebar vertical jump physics ($v_y = 7.2\text{ m/s}$) with downward raycast ground detection, natural Rapier gravity ($g = -19.2\text{ m/s}^2$), and zero wall friction on capsule colliders.
- Upgraded: Redesigned 3D environment in `TownMap.tsx` from pitch-black void into a vibrant, stylized Urban City Park: 84x84m vibrant green grass lawn, stone crosswalks with curbs, central circular plaza with stepped dais, central civic obelisk monument with glowing phase-reactive beacon, 22 multi-tiered trees (oak, pine, birch) with solid trunk colliders, 8 wooden park benches, 12 ornamental streetlamps with warm pointlights, and 16 perimeter city buildings with illuminated window grids and rooftop water towers/HVAC units.
- Fixed: Removed redundant global navbar from `apps/web/src/app/layout.tsx` during active gameplay. Docked sleek, compact in-game HUD bar directly at `top-0` (67px) containing brand badge, round counter, phase title/countdown, survivors tally, alive status pill, dossier button, mic toggle, and sound controls.
- Added: Automated multi-tab browser test script (`scripts/browser-test.mjs`) using Microsoft Edge and Puppeteer. Verified 61 FPS rendering performance, top=0 docking, W/S/A/D movement, Shift sprint, Space jump, obstacle collision, and dossier switching across 10 captured screenshots.

## 2026-11-03

- Added: Prisma-backed match archival service (`apps/game-server/src/services/matchArchival.ts`) persisting `GameSession`, `GamePlayer`, and `GameEvent` upon `Phase.VICTORY` with offline graceful fallback.
- Added: Career player statistics upserting (`PlayerStats`) tracking games played, wins, mafia/citizen win breakdown, and survival totals.
- Added: REST API endpoints on Game Server (`/api/history`, `/api/stats/:username`, `/api/leaderboard`).
- Added: Career Dossier modal and record badge on web landing page (`apps/web/src/app/page.tsx`).
- Added: Multi-stage Dockerfiles (`apps/game-server/Dockerfile`, `apps/web/Dockerfile`) and root `docker-compose.yml` orchestrating PostgreSQL, Colyseus server, and Next.js web application.
- Added: Automated integration test suite `apps/game-server/tests/MatchArchival.test.ts` (all 4 tests passing).
- Added: Procedural Web Audio API sound synthesizer (`apps/web/src/services/audio.ts`) generating phase transition cues (dawn bell, night drone, tribunal gavel, doom toll, victory fanfare), urgent 10s countdown ticks, vote confirm taps, and UI click feedback with zero asset downloads.
- Added: WebRTC proximity voice chat client (`apps/web/src/services/webrtc.ts`) with peer mesh connection over STUN, Colyseus room signaling (`VOICE_SIGNAL`), Voice Activity Detection (VAD), and mic mute toggle (`M` hotkey).
- Added: 3D spatial audio distance attenuation calculating dynamic gain via Euclidean distance in town square ($d = \sqrt{\Delta x^2 + \Delta z^2}$) with quadratic falloff.
- Added: Authoritative dead player voice isolation in `MafiaRoom.ts` preventing eliminated players from transmitting voice signals to living players during active rounds.
- Added: Animated visual speaking indicators including pulsating green ground rings on `CharacterAvatar.tsx` and glowing mic icons on player roster cards in `GameHUD.tsx`.
- Added: Automated integration test suite `apps/game-server/tests/VoiceSignaling.test.ts` verifying signaling relay, voice state broadcasting, and dead player channel isolation (all passing).
- Added: Stylized low-poly Town Square 3D map (`TownMap.tsx`) with central tribunal circle, stone benches, perimeter buildings, streetlamps, and dynamic Day/Night lighting and fog.
- Added: Stylized Deadshot.io-style humanoid character avatars (`CharacterAvatar.tsx`) with floating HTML name tags, ghost mode for dead players, and procedural walking/running limb animations.
- Added: Rapier WASM physics kinematic character controller (`CharacterController.tsx`) with WASD movement, Shift sprint, and smooth third-person follow camera.
- Added: Networked player transform synchronization at 20 Hz (`PLAYER_INPUT`) with smooth client-side linear interpolation (`RemotePlayers.tsx`).
- Added: 3D scene overlay integration in `GameHUD.tsx` with one-click view toggling (`[3D Town View / Dossier View]`) and floating in-game widgets for night hits, day voting, and chat.
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
