# Changes Log

## 2026-11-04 (Shooting Game Major Overhaul — Milestones M0 through M8)

- **Milestone M0 (Character Grounding, Physics & Movement Stabilization):**
  - **Root Cause & Solution for Sinking:** Identified that character avatar mesh had an internal geometry offset of $-0.9$m below the capsule center, causing legs and lower body to submerge into the road. Fixed by realigning the avatar mesh origin precisely at foot soles ($y = 0.0$), matching Rapier's capsule collider base ($R = 0.35$m, $H = 1.1$m).
  - **Root Cause & Solution for Stuck Forward Movement:** Resolved input event listener coupling with React render lifecycles. Bound event listeners only once using mutable refs (`playerRef`, `roomRef`). Added `resetAllInputs` on `blur`, `focus`, `visibilitychange`, and `pointerlockchange` to prevent held keys from remaining active on window blur.
  - **Instant Deceleration & Diagonal Normalization:** Eliminated residual velocity on key release (`targetVelX = 0, targetVelZ = 0`), normalized diagonal movement vectors ($\sqrt{2}/2 \approx 0.707$), and prevented camera pitch from leaking into horizontal velocity.
  - **Browser Verification:** Verified via `scripts/shooting-movement-browser-test.mjs` (7 screenshots in `test-screenshots/shooting-overhaul/m0-grounding-movement/`).

- **Milestone M1 (Visual Environment Overhaul — Bright Urban District):**
  - Rebuilt `ShootingMap.tsx` with vibrant daylight aesthetics:
    - Azure sky dome (`#38bdf8`), horizon haze (`#bae6fd`), and radiant directional sunlight (`intensity: 2.2`, `#fffbeb`) with soft fill lighting.
    - Asphalt roadways with double-yellow center lines and pedestrian crosswalks.
    - Raised granite sidewalks ($+0.12$m) with beveled curbs.
    - Public parks with green lawns (`#22c55e`), 3D low-poly trees with 3-tier foliage, wood-and-steel benches, and concrete planters.
    - Zone A Commercial: Modern cafe with red/white striped awning, tech store with cyan glass curtain wall.
    - Zone B Residential: Solaris apartments (amber) and Metro residences (sky blue) with balconies.
    - Zone C Logistics Warehouse: Cream warehouse with catwalk at $+3.5$m and yellow structural steel columns.
    - Zone D Container Yard: Vibrant stacked shipping containers (orange, blue, yellow, green).
    - Modern city vehicles (taxi, red sedan, blue hatchback, delivery van) providing tactical cover.
    - Modern architectural boundary walls ($+4.0$m) eliminating the dark void.
  - Browser verified: `01-bright-urban-district.png`.

- **Milestone M2 (Character & Animation Improvements):**
  - Rebuilt `ShootingCharacterAvatar.tsx`:
    - Distinct crouching tactical stance (`"crouch"`), lowering torso to $0.55$m and bending knees.
    - Modeled 5 distinct 3D weapon meshes: M4-A1 Assault Rifle (curved banana mag, tactical stock), Tactical Pump Shotgun (wide bore, pump grip), AWM Heavy Sniper (long fluted barrel, muzzle brake, scope mount), Vector Rapid SMG (vertical stick mag), Pistol.
    - Upper body procedural aiming pose bringing weapon to eye line.
  - Browser verified: `02-crouch-tactical-stance.png`.

- **Milestone M3 (Aiming, ADS, Scopes & Weapon Switching):**
  - Created `ShootingSniperScope.tsx`: full-screen 8x optical sniper scope with circular black vignette, mil-dot crosshairs, bullet-drop range marks (120, 240m), center illuminated red dot, and calibration text.
  - Integrated ADS camera zoom: smooth over-the-shoulder perspective for standard weapons, seamless transition into optical line of sight for sniper rifle.
  - Quick weapon switching: Number keys `1` to `5` map to all 5 weapon archetypes with metallic switch audio.
  - Browser verified: `03-ads-shoulder-zoom.png`, `05-sniper-optic-scope-clean.png`.

- **Milestone M4 (Recoil & Server-Authoritative Combat):**
  - Realistic camera recoil kick (`recoilIntensity`) with per-frame lerp decay recovery (`recoilPitchOffset.current`).
  - Server-authoritative multi-region hitboxes: Head (2.0x), Upper Torso (1.0x), Abdomen (0.85x), Arms (0.65x), Legs (0.60x).
  - Server range validation enforcing distance $\le \text{effectiveRange} \times 1.35$.
  - Rate-of-fire cooldown validation rejecting weapon fire flood exploits.

- **Milestone M5 (Death & Respawn Weapon Selection):**
  - Created `ShootingDeathLoadoutModal.tsx`:
    - Elimination banner and live countdown timer (`Respawning in X.Xs`).
    - 5 clickable weapon cards (M4-A1, Shotgun, AWM Heavy Sniper, SMG, Pistol) with stats (DMG, FIRE, MAG, RANGE).
    - Clicking a weapon sends `SHOOTING_SELECT_LOADOUT`, re-arming the player on respawn.
    - Dead player movement/shooting lockout: zeroed linear velocity when dead, disabled firing/ADS.
    - Realistic death pose: avatar collapses flat on the pavement ($-90^\circ$ rotation) with floating nametag hidden.
  - Browser verified: `06-death-respawn-loadout-modal.png`, `07-respawned-with-shotgun.png`.

- **Milestone M6 (Settings & Customization Modal):**
  - Created `shootingSettings.ts` and `ShootingSettingsModal.tsx`:
    - Mouse look sensitivity slider ($0.0008 - 0.0060$).
    - ADS aim sensitivity multiplier slider ($20\% - 150\%$).
    - Scoped sensitivity multiplier slider ($10\% - 120\%$).
    - Invert vertical look (Y-axis) toggle.
    - Left-handed controls preset toggle (swapping aim/fire mouse buttons).
    - Key remapping tab with click-to-bind listener.
    - Persistent storage via `localStorage` (`mafia_shooting_settings_v1`).
  - Browser verified: `04-settings-modal-active.png`.

- **Milestone M7 & M8 (Multiplayer Validation & Final Polish):**
  - Multi-client synchronization test with 3 concurrent Edge browser sessions (`scripts/shooting-multiplayer-browser-test.mjs`):
    - 3-Team Lobby (Red, Blue, Green): PASS (`01-multiplayer-lobby-3teams.png`).
    - Remote Player Interpolation: PASS (`02-remote-player-interpolation.png`).
    - Remote Crouch & Aim Sync: PASS (`03-remote-crouch-and-aim-sync.png`).
    - Authoritative Damage & Feedback: PASS (`04-authoritative-damage-hitmarker.png`).
    - Remote Elimination & Death Pose: PASS (`05-remote-elimination-ragdoll.png`).
    - Remote Respawn Restoration: PASS (`06-remote-respawn-synchronization.png`).
    - Victory Podium & Match Over: PASS (`07-match-over-victory-podium.png`).
  - Procedural Audio: Added `playWeaponSwitch()`, `playRespawn()`, gunshot acoustics, hitmarker chirps, victory fanfare, and defeat stinger.
  - Monorepo Tests: 68/68 unit & integration tests passing (38 game-rules, 30 game-server). TypeScript check: 0 errors.

- **Milestone M8 (Visual Polish, Sound Design & Staging Deployment):**
  - Added: Tactical 3D Sky Dome & Atmosphere in `apps/web/src/components/canvas/ShootingMap.tsx`:
    - Deep twilight celestial dome (`#0c1322` to `#1e293b`), horizon fog band, and 24 procedural urban building silhouettes creating a distant perimeter skyline at $r = 110$m.
    - High-altitude sun/moon sphere (`#fef08a`) casting realistic tactical shadows.
  - Added: 3D Combat Visual Effects in `apps/web/src/components/canvas/ShootingCombatVFX.tsx`:
    - Dynamic muzzle flash light pulses and flares triggered on `SHOOTING_MUZZLE_FLASH`.
    - High-velocity luminous bullet tracers connecting gun muzzle to target trajectory.
    - 3D surface and character bullet impact sparks.
    - 3D floating damage indicators above victim heads with `-32` or `💥 -64 HEAD` headshot indicators and smooth upward float/fade.
  - Added: Extended Procedural Audio in `apps/web/src/utils/combatAudio.ts`:
    - Weapon-specific gunshots for all 5 archetypes (Rifle, Shotgun, Sniper, SMG, Pistol).
    - Empty magazine dry-fire click sound.
    - Kinetic jump thrust / whoosh audio.
    - Surface impact / bullet spark audio.
    - Hitmarker chirps (crisp 1750Hz headshot vs 1100Hz body hit).
    - Mechanical reload sequence and kill-confirmed fanfare.
    - Triumphant C-major victory fanfare and somber defeat stinger.
  - Added & Verified: Multi-client staging browser automation test in `scripts/shooting-staging-browser-test.mjs` (7 suites): verified room creation, game selection, loadout picking, multi-client peer join, 3D combat arena & HUD, real-time combat exchange, post-match victory podium, and rematch flow. Captured 7 screenshots in `test-screenshots/shooting-staging/`.

- **Milestone M7 (Multiplayer Scaling, Security Validation & Stress Profiling):**
  - Added: Security hardening and anti-exploit protections in `apps/game-server/src/rooms/ShootingRoom.ts`:
    - Out-of-bounds coordinate clamping strictly to $[-85, 85]$ horizontally and $[-5, 30]$ vertically; non-finite (`NaN`, `Infinity`) payloads sanitized.
    - Rate-of-fire cooldown injection prevention: rapid fire flood attacks safely rejected by server authority.
    - Mid-combat loadout switch exploit prevention: weapon switching prohibited while alive during active match to prevent reload/ammo reset exploits.
    - Friendly fire validation strictly blocking teammate damage when disabled.
    - Dead/respawn player combat lockout: dead players cannot fire or receive duplicate damage.
    - Token-based reconnection: cryptographic session tokens preserve player state across reconnects.
  - Added: Unit & Security test suite in `apps/game-server/tests/ShootingSecurityAndScaling.test.ts` (6 suites passing).
  - Added: High-concurrency stress test harness in `scripts/shooting-stress-test.mjs`:
    - Simulated 16 concurrent combatants in a single `ShootingRoom`.
    - 2,103 state patches synchronized, 4,352 muzzle flashes, 752 eliminations logged.
    - Average tick latency **65.45 ms**, median **62.00 ms**, 95th percentile **65.00 ms** (0 crashes, 0 memory leaks).

- **Milestone M6 (Match Progression, Win Conditions & Post-Match Podium):**
  - Added: Post-match podium and awards overlay in `apps/web/src/components/game/ShootingPostMatchScreen.tsx`:
    - Dynamic victory banner for winning team with team color glow, or draw announcement.
    - Procedural victory fanfare (C-major) and defeat stinger.
    - Accolades highlight cards: MVP, Top Fragger, Sharpshooter.
    - Comprehensive combat leaderboard table (Rank, Player, Team, Kills, Deaths, K/D, Damage, Score).
    - Host "Rematch / Return to Lobby" control with clean state reset.
  - Added: Unit tests in `apps/game-server/tests/ShootingMatchLoop.test.ts` (2 suites passing).
  - Added: Browser test `scripts/shooting-postmatch-browser-test.mjs` (6 suites passing with 4 screenshots in `test-screenshots/shooting-postmatch/`).

## 2026-11-04 (Multi-Game Platform Expansion - Milestone M4/M5)

- Added: Authoritative combat messages and schemas:
  - In `packages/shared/src/schema/ShootingPlayerState.ts`: Added `shield` (50), `maxShield` (50), `reserveAmmo` (120), and `isReloading` (false).
  - In `packages/shared/src/messages.ts`: Added `SHOOTING_FIRE`, `SHOOTING_RELOAD`, `SHOOTING_MUZZLE_FLASH`, `SHOOTING_HIT_EVENT`, `SHOOTING_KILL_FEED`, `SHOOTING_PLAYER_RESPAWNED` and corresponding typed payload interfaces.
- Added: Server-authoritative combat handlers in `apps/game-server/src/rooms/ShootingRoom.ts`:
  - `SHOOTING_FIRE`: Rate-of-fire enforcement with 15% network tolerance, ammo deduction, auto-reload trigger when empty, muzzle flash broadcasting.
  - Multi-tier damage calculation: Hit region multipliers (Head 2.0x, Torso 1.0x, Abdomen 0.85x, Arms 0.65x, Legs 0.60x).
  - Shield-first absorption: Armor shield absorbs damage first before affecting health.
  - Friendly fire validation: Blocks friendly damage unless `friendlyFire` flag is enabled.
  - Range validation: Checks distance against `weapon.effectiveRangeM * 1.35`.
  - Elimination & Scoring: Target health $\le 0$ increments killer kills, killer score (+150 headshot, +100 standard), team score, broadcasts killfeed notification, and schedules automated respawn.
  - Automated Respawn: Repositions players at their team spawn base (`[50, 0.4, -50]`, `[-50, 0.4, 50]`, `[-50, 0.4, -50]`), resets health to 100, shield to 50, refills ammunition.
  - `SHOOTING_RELOAD`: Authoritative reload delay timer with reserve ammo deduction and magazine replenishment.
- Added: Client combat controls & raycasting in `apps/web/src/components/canvas/ShootingCharacterController.tsx`:
  - Left-click (Mouse 0) firing: Camera forward raycasting, line-of-sight occlusion testing against Rapier world obstacles, 3D player hitbox detection (Head, Torso, Abdomen, Legs), procedural recoil pitch kick and spread.
  - Right-click (Mouse 2) ADS (Aim Down Sights): Smooth camera zoom (6.2m -> 3.6m / 2.2m for Sniper) and dynamic mouse sensitivity scaling.
  - `KeyR` reload action with procedural mechanical audio.
  - `SHOOTING_PLAYER_RESPAWNED` listener: Smooth rigidBody repositioning on respawn without physics jitter.
- Added: Zero-asset procedural Web Audio synthesizer (`apps/web/src/utils/combatAudio.ts`):
  - Acoustic weapon gunshot profiles for Rifle, Shotgun, Sniper, SMG, and Pistol.
  - Audio hitmarker chirps (1750Hz headshot, 1100Hz body) and kill-confirmed fanfare.
- Enhanced: Tactical Combat HUD (`apps/web/src/components/game/ShootingCombatHUD.tsx`):
  - Center crosshair with animated hitmarker 'X' (red for headshot, white for body hit).
  - Top-right live killfeed stack with team colors, weapon icons, and headshot badges.
  - Dual health & armor shield bars.
  - Live ammo status with "RELOADING..." badge, low-ammo warnings, and reserve ammo tally.
  - Desktop controls hint banner and red vignette "ELIMINATED" death screen overlay.
- Added: Comprehensive test suites:
  - Unit tests in `apps/game-server/tests/ShootingCombat.test.ts` (3 suites): verified firing rate limits, body-part damage, shield absorption, friendly fire prevention, elimination scoring, automated respawn, and score limit match victory.
  - Edge Puppeteer browser test `scripts/shooting-combat-browser-test.mjs` (6 suites): verified game mode selection, 3D combat HUD overlay, firing and ammo consumption, [R] key reload cycle, multiplayer synchronization, and rematch reset. All 6 suites passed with screenshots in `test-screenshots/shooting-combat/`.
- Verified:
  - 60/60 unit/integration tests passing.
  - 8/8 Turborepo typechecks passing with 0 errors.

- Added: Dedicated 3D Urban Combat Map (`apps/web/src/components/canvas/ShootingMap.tsx`):
  - $160\text{m} \times 160\text{m}$ urban battlefield enclosed by solid perimeter walls at $\pm 78$m.
  - Team Red Base (`[50, 0, -50]`), Team Blue Base (`[-50, 0, 50]`), and Team Green Base (`[-50, 0, -50]`) with fortified spawn pads, team floodlights, flags, sandbags, and 3 exit lanes.
  - Central Abandoned Warehouse ($32\text{m} \times 24\text{m} \times 7.5\text{m}$) with 4 wide hangar doorways, ground floor cover crates, and an elevated interior catwalk ($+3.5$m) accessible via dual industrial staircases.
  - Shipping Container Flanking Maze with 11 containers and sloped metal ramps leading to upper container roof terraces ($+2.6$m).
  - Two elevated sniper watchtowers ($+5.2$m) with sandbag parapets and switchback ramps.
  - 18 concrete Jersey barriers, 3 armored tactical vehicles/trucks, and 6 industrial floodlight poles.
  - Matching 1:1 Rapier WASM physics colliders for all floors, walls, ramps, stairs, catwalks, and cover obstacles.
- Added: 3D character controller and avatars for shooting mode:
  - `ShootingCharacterController.tsx`: Mouse look with pointer lock, camera-relative WASD steering, Spacebar jump ($v_y = 7.4\text{ m/s}$), and forward step-climbing assist.
  - `ShootingCharacterAvatar.tsx`: Team color uniforms, helmets, visors, overhead team/health nameplates, and 3D weapon models held in hand (Rifle, Shotgun, Sniper, SMG, Pistol).
  - `ShootingRemotePlayers.tsx`: Smooth 60 FPS interpolation for remote teammates and enemies across the arena.
  - `ShootingGameScene.tsx`: React Three Fiber canvas with Rapier physics engine, shadows, and horizon fog.
- Added: Tactical Combat HUD Overlay (`apps/web/src/components/game/ShootingCombatHUD.tsx`):
  - Mode badge, live scores for Team Red, Team Blue, Team Green, countdown timer, and score limit.
  - Center viewport aiming crosshair.
  - Health bar (100 HP) and Shield bar (50 Shield).
  - Active weapon card with category, emoji, and magazine ammo counter.
  - Host "Return to Lobby" button for seamless rematches.
- Integrated: Dynamic rendering in `apps/web/src/app/lobby/[roomCode]/page.tsx` rendering `ShootingGameScene` and `ShootingCombatHUD` when `shootingStatus === "ACTIVE"`.
- Added: Automated browser test suite `scripts/shooting-map-browser-test.mjs` verifying 3D battlefield loading, HUD overlay, team spawn base placement, warehouse catwalk climb ($+3.5$m), jump over cover, and match reset across Microsoft Edge sessions. All 6 tests passed with 6 visual screenshots in `test-screenshots/shooting-map/`.
- Verified: Complete monorepo regression coverage:
  - 57/57 unit and integration tests passing (`@mafia/game-rules` 38, `@mafia/game-server` 19).
  - 8/8 Turborepo typechecks passing with 0 errors.

## 2026-11-04 (Multi-Game Platform Expansion - Milestone M2)

- Added: Weapons catalog and hit detection configuration (`packages/shared/src/weapons.ts`):
  - `WeaponId` enum (`ASSAULT_RIFLE`, `SHOTGUN`, `SNIPER_RIFLE`, `SMG`, `PISTOL`).
  - `HitRegion` enum (`HEAD`, `UPPER_TORSO`, `ABDOMEN`, `ARMS`, `LEGS`) and multipliers table (`HEAD`: 2.0x, `UPPER_TORSO`: 1.0x, `ABDOMEN`: 0.85x, `ARMS`: 0.65x, `LEGS`: 0.60x).
  - Declarative `WEAPONS_CATALOG` with full combat specifications for all 5 archetypes (damage, fire rate, reload duration, magazine capacity, max reserve ammo, effective range, recoil intensity, and spread).
- Added: Server handlers and team mechanics in `apps/game-server/src/rooms/ShootingRoom.ts`:
  - `SHOOTING_AUTO_BALANCE`: Host command to round-robin distribute all connected players evenly across Team Red, Team Blue, and Team Green.
  - `SHOOTING_SELECT_LOADOUT`: Player primary weapon selection with authoritative ammunition initialization (`ammo`, `maxAmmo`).
  - `SHOOTING_RENAME_TEAM`: Host command to rename teams with broadcast notifications.
  - Initialized default `weaponId = WeaponId.ASSAULT_RIFLE` and magazine ammo on player join.
- Added: Integration tests in `apps/game-server/tests/ShootingRoom.test.ts` verifying host auto-balancing, weapon loadout selection, and team renaming (all 4 tests passing).
- Added: Shooting Lobby UI upgrades in `apps/web/src/components/game/ShootingLobby.tsx`:
  - Host "Auto-Balance Teams" button in the top action bar.
  - In-place team renaming input and Save action for room hosts on team card headers.
  - Primary Weapon Loadout selector section with 5 weapon cards, category badges, emoji icons, stat bars, and "EQUIPPED" indicator.
  - Player weapon preference badges displayed alongside player avatars in the team roster columns.
- Added: Automated browser test suite `scripts/shooting-lobby-browser-test.mjs` verifying shooting lobby loading, weapon loadout visibility, sniper loadout selection, multiplayer loadout sync, auto-balance execution, and team renaming across 3 real connected browser sessions in Microsoft Edge. All 6 tests passed cleanly with 6 screenshots captured in `test-screenshots/shooting-lobby/`.
- Verified: Full monorepo health:
  - 57/57 automated unit and integration tests passing (`@mafia/game-rules` 38, `@mafia/game-server` 19).
  - 8/8 Turborepo typechecks passing with 0 errors.

## 2026-11-04 (Multi-Game Platform Expansion - Milestone M1)

- Added: Multi-Game architecture schemas in `@mafia/shared`:
  - `GameMode` enum (`UNSELECTED`, `MAFIA`, `SHOOTING`).
  - Added authoritative schemas: `ShootingPlayerState.ts` (health 100, shield 50, teamId, score/kills/deaths, weapon/ammo, isReady, isHost), `ShootingTeamState.ts` (id, name, color, score, playerCount), `ShootingConfigState.ts` (duration, scoreLimit, selectedMap, respawnDelay, friendlyFire), and `ShootingRoomState.ts` (status `LOBBY`/`ACTIVE`/`MATCH_OVER`, teams, players, config).
  - Added message types: `SELECT_GAME_MODE`, `SHOOTING_JOIN_TEAM`, `SHOOTING_ASSIGN_TEAM`, `SHOOTING_UPDATE_CONFIG`, `SHOOTING_START_MATCH`, `SHOOTING_PLAYER_ACTION`, `SHOOTING_HIT_EVENT`.
- Added: Colyseus Shooting Room engine (`apps/game-server/src/rooms/ShootingRoom.ts`):
  - Pre-populates 3 standard teams: Team Red (`#ef4444`), Team Blue (`#3b82f6`), Team Green (`#10b981`).
  - Authoritative player joining, auto-balancing to smallest team, player-requested team joins, host manual player reassignment.
  - Host-managed match configuration updates with input clamping and validation.
  - Match lifecycle state machine (`LOBBY` $\rightarrow$ `ACTIVE` $\rightarrow$ `MATCH_OVER` $\rightarrow$ `LOBBY`).
  - 60s reconnection token support with session recovery.
- Added: Server room metadata dispatcher in `apps/game-server/src/index.ts`:
  - Registered `shooting_room` with `filterBy(["roomCode"])`.
  - Updated `/api/rooms/:roomCode` to query both `mafia_room` and `shooting_room` and return authoritative `gameMode` for immediate client routing.
- Added: Server integration test suite `apps/game-server/tests/ShootingRoom.test.ts` verifying room creation, multi-team joining, auto-balancing, host player reassignment, config updates, ready toggling, match start, and match reset. All 3 tests pass.
- Added: Post-Room-Creation Game Selection UI (`apps/web/src/components/game/GameSelectionScreen.tsx`):
  - Dual-card selection for room creators featuring MAFIA 3D (3–20 players) and SHOOTING GAME (2–24 players).
  - High-impact visual previews, feature tags, and non-host waiting screen.
- Added: Shooting Game Lobby UI (`apps/web/src/components/game/ShootingLobby.tsx`):
  - 3-column team roster display (Team Red, Team Blue, Team Green) with member avatars and scores.
  - Direct team switching buttons and host player reassignment dropdowns.
  - Match configuration controls: duration (3–15 min), score limit (15–75 kills), map selector, and respawn delay (2–5s).
  - Ready toggle button, host START MATCH button, and live tactical chat.
- Added: Dynamic game mode routing in `apps/web/src/app/lobby/[roomCode]/page.tsx`:
  - Dynamically routes room states: `UNSELECTED` renders `GameSelectionScreen`, `MAFIA` renders Mafia Lobby or `GameHUD`, and `SHOOTING` renders `ShootingLobby` or Active Combat HUD.
- Added: Automated browser test suite `scripts/multi-game-browser-test.mjs` running in Microsoft Edge Puppeteer across multiple connected clients. All 7 test suites passed cleanly:
  1. Game Selection UI (Cards): PASS
  2. Mafia Room Creation & Lobby: PASS
  3. Mafia Game Start Integrity: PASS
  4. Shooting Room Creation & Lobby: PASS
  5. Team Assignment & Switching: PASS
  6. Settings Isolation (Zero Leak): PASS
  7. Match Lifecycle & Reset Lobby: PASS
  - 7 screenshot artifacts captured in `test-screenshots/multi-game/`.
- Verified: Complete regression verification across monorepo:
  - 56/56 unit and integration tests passing (`@mafia/game-rules` 38, `@mafia/game-server` 18).
  - 8/8 Turborepo typechecks passing with 0 errors.

## 2026-11-04 (Multi-Game Platform Expansion - Milestone M0)

- Fixed: Resolved elevated terrain and character collision issue (`CharacterController.tsx`). Diagnosed root cause as visual elevations (voting dais at $y = 0.35$m, sidewalk curbs at $y = 0.14$m) lacking physical Rapier colliders and character controller lacking step climbing. Added solid matching cylinder collider for the dais and solid cuboid colliders for all platforms and curbs in `TownMap.tsx`.
- Added: Implemented forward step-climbing assistance in `CharacterController.tsx` using dual forward probe rays (`y + 0.08` foot probe and `y + 0.42` waist probe) to smoothly traverse curbs, steps, and podiums up to $0.35$m without getting caught on vertical faces or requiring manual jumping.
- Added: Implemented high-fidelity downward ground raycasting (`y + 0.40` downwards) with ground clearance calculation. Firmly clamps grounded vertical velocity to $-0.6\text{ m/s}$ during walking/sprinting, and applies downward snap velocity ($-3.2\text{ m/s}$) when stepping down ledges or descending slopes to prevent mid-air floating.
- Upgraded: Expanded `TownMap.tsx` from an $84\text{m} \times 84\text{m}$ park into a full $152\text{m} \times 152\text{m}$ urban environment ($>3\times$ area).
  - Zone A Central Park: Paved tribunal circle, dais cylinder collider ($y = 0.35$m), 4 approach ramps, civic obelisk monument, 12 benches, 28 trees with solid cylinder trunk colliders, and 20 streetlamps.
  - Multi-Tier Elevation Test Pavilion: $+0.60$m elevated stone terrace platform ($12\text{m} \times 8\text{m}$), smooth $8.5^\circ$ approach ramp with rotated cuboid collider, 3-step staircase ($0.20$m risers) with solid colliders, and lowered basin.
  - Zone B City Streets & Raised Sidewalks: $10\text{m}$ wide asphalt avenues, road markings, dashed yellow dividers, and raised sidewalks ($+0.14\text{m}$) with solid cuboid colliders.
  - Zone C Commercial District: 12 multi-story commercial buildings with awnings and rooftop props.
  - Zone D Residential District: 12 residential brownstones and brick apartment complexes with courtyards and alleyways.
  - Zone E Perimeter: Solid boundary walls at $\pm 76\text{m}$.
- Fixed: Expanded server-side coordinate clamping in `MafiaRoom.ts` from $[-60, 60]$ to $[-85, 85]$ to support full exploration across the expanded $152\text{m} \times 152\text{m}$ map without desync.
- Added: Created automated browser test suite `scripts/terrain-grounding-browser-test.mjs` verifying flat ground standing, dais climb, ramp ascent, terrace elevation, staircase descent snap, and curb climb across 3 real connected browser sessions in Microsoft Edge at 121 FPS, capturing 8 screenshot artifacts.
- Verified: Re-ran `scripts/gta-camera-browser-test.mjs` confirming zero camera bobbing, stable sprint, explicit Spacebar jump, mouse look orbit, and multiplayer camera isolation all pass cleanly at 121 FPS.

## 2026-11-04 (GTA Camera & Movement)

- Added: Implemented GTA Vice City-style spherical orbit camera (`CharacterController.tsx`) with mouse-driven yaw and pitch control (clamped between $[-0.2, 1.2]$ radians) and mouse wheel distance zoom ($3.2$m to $13.0$m).
- Added: Integrated HTML5 Pointer Lock API with automatic canvas capture on click and instant cursor release on `Escape`. Intelligently ignores clicks originating on HUD controls, buttons, input bars, and chat elements to preserve full UI interactivity.
- Added: Dynamic camera-relative WASD movement. Camera forward ($\mathbf{F}_{\text{cam}}$) and right ($\mathbf{R}_{\text{cam}}$) vectors are projected on the ground plane, orienting character movement directly to the player's viewing angle. Moving the mouse while stationary orbits freely without spinning the character avatar.
- Fixed: Eliminated camera bobbing and scene vertical jitter during walking and running. Decoupled torso oscillation from camera tracking in `CharacterAvatar.tsx` (stabilizing torso height at $0.95$m) and added smoothed exponential lerp with vertical low-pass filtering (`lerp(..., 0.08)`) on camera focus target.
- Fixed: Resolved automatic jumping during `Shift + W` sprinting. Eliminated Rapier numerical contact-solver bounce impulses by clamping grounded vertical velocity to $-0.6\text{ m/s}$ during non-jump frames, ensuring continuous horizontal sprint at $8.5\text{ m/s}$. Isolated jumping strictly to explicit Spacebar inputs.
- Added: Updated Game HUD controls banner to display `WASD: Move • Shift: Sprint • Space: Jump • Mouse: Look • ESC: Release` and added center viewport hint pill `"Click viewport to look around • ESC to release mouse"`.
- Added: Created automated multi-player browser test suite (`scripts/gta-camera-browser-test.mjs`) in Microsoft Edge / Puppeteer across 3 connected clients. Verified all 4 test suites (Tests A, B, C, D) passing at 61 FPS with 11 screenshot artifacts.
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
