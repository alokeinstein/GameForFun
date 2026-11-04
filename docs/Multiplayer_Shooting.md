# PROJECT EXPANSION: MULTI-GAME MULTIPLAYER PLATFORM
## MAFIA 3D + TEAM-BASED MULTIPLAYER SHOOTING GAME

You are working on an existing multiplayer 3D game project.

The project currently contains an initial playable MAFIA 3D game with:
- Multiplayer rooms.
- Player movement.
- Third-person camera.
- WASD controls.
- Sprint and jump.
- Mouse-controlled camera.
- A 3D environment.
- Game HUD.
- Chat and voice-related functionality.

I now want to expand this project into a multiplayer game platform that supports multiple games using a shared room and player infrastructure.

This is a significant product expansion.

Act as the technical co-founder, principal game architect, multiplayer engineer, and 3D gameplay developer.

Your responsibility is to inspect the existing implementation, understand its architecture, design the expansion properly, and implement it incrementally.

**Do not rebuild the existing MAFIA game from scratch. Preserve working functionality.**

The two main objectives are:

1. Fix terrain elevation and character-ground collision.
2. Transform the existing single-game room system into a multi-game room system supporting MAFIA and a new multiplayer shooting game.

---

# PART 1 — FIX TERRAIN ELEVATION AND CHARACTER COLLISION

## 1.1 Current problem

There is a terrain collision issue in the existing 3D environment.

Consider this situation:

- The player is standing on a lower-level ground surface.
- There is a higher-level ground surface immediately to the player's left.
- The player walks from the lower surface onto the higher surface.
- The player's feet become submerged inside the higher ground.

The character appears to be partially buried in the elevated terrain.

This must be corrected.

The character should always stand naturally on the actual walkable surface, regardless of whether that surface is higher or lower than the previous surface.

## 1.2 Investigate the actual root cause

Inspect the existing:

- Terrain geometry.
- Ground meshes.
- Terrain collision geometry.
- Rapier colliders.
- Character controller.
- Character capsule dimensions.
- Player physics body.
- Ground detection.
- Collision groups.
- Ground snapping logic.
- Slope handling.
- Step climbing logic.
- Character model origin and foot position.

Determine whether the problem is caused by:

- Visual terrain and collision geometry not matching.
- Incorrect collider height.
- Incorrect character capsule dimensions.
- Incorrect physics-body positioning.
- Incorrect grounding calculations.
- Insufficient step-climbing support.
- Terrain normals or collision resolution.
- Character model origin being offset from the actual feet.

Do not apply arbitrary vertical offsets without understanding the cause.

## 1.3 Correct grounding behaviour

Implement a robust character-grounding system.

Expected behaviour:

1. Player stands correctly on flat terrain.
2. Player moves from lower terrain to higher terrain.
3. Player's feet align with the higher terrain.
4. Player moves from higher terrain to lower terrain.
5. Player follows the lower terrain naturally.
6. Player can walk on slopes within the permitted slope angle.
7. Player cannot walk through terrain.
8. Player cannot become embedded inside terrain.
9. Player cannot float unnecessarily above terrain.
10. Player does not jitter when moving across terrain boundaries.

Use the existing Rapier physics architecture.

If appropriate, use:
- Character controller ground detection.
- Capsule-based collision.
- Shape casts or raycasts.
- Controlled step climbing.
- Ground snapping within a configurable distance.
- Slope-limit validation.
- Correct collision layers.

Ensure the visible ground and physical collision surfaces are consistent.

## 1.4 Terrain transitions

The player should experience natural movement when transitioning between:

- Roads and sidewalks.
- Sidewalks and park paths.
- Flat ground and small ramps.
- Lower and elevated terrain.
- Steps and walkable platforms.
- Building entrances.

Avoid sudden vertical snapping.

If a height difference is too large to climb, the player should be blocked by the appropriate collision geometry rather than being teleported upward.

## 1.5 Browser validation

Test actual movement across different elevations.

Create or use a test area containing:
- Flat ground.
- A slightly elevated platform.
- A lower platform.
- A ramp.
- A step.
- A transition between two different terrain heights.

Walk over every transition in the browser.

Verify that the character's feet remain correctly positioned.

---

# PART 2 — EXPAND THE EXISTING MAP

## 2.1 Current requirement

The current game map is too small.

I want a significantly larger environment.

Expand the existing map rather than simply scaling every object and making the entire world look stretched.

The map should feel like a proper multiplayer game environment.

## 2.2 Map concept

Develop a larger urban environment with a central park and surrounding city areas.

Include areas such as:

### Zone A: Central park
- Grass.
- Trees.
- Walking paths.
- Benches.
- Streetlights.
- Decorative gardens.
- Open gathering areas.
- Small elevated landscape sections.

### Zone B: City streets
- Roads.
- Sidewalks.
- Street intersections.
- Streetlights.
- Road markings.
- Traffic signs.
- Parking areas.
- Decorative city objects.

### Zone C: Commercial buildings
- Shops.
- Restaurants.
- Office buildings.
- Building entrances.
- Windows.
- Balconies.
- Rooftop structures where accessible.

### Zone D: Residential area
- Apartment buildings.
- Smaller houses.
- Parking spaces.
- Sidewalks.
- Courtyards.

### Zone E: Additional exploration areas
- Small plazas.
- Connecting pathways.
- Open spaces.
- Decorative structures.

These are design suggestions. Build a coherent environment instead of randomly placing objects everywhere.

## 2.3 Map scale

Make the map substantially larger than the existing one.

Do not choose an arbitrary world size without considering:
- Player movement speed.
- Travel time between locations.
- Multiplayer visibility.
- Rendering performance.
- Gameplay density.

The environment must remain compact enough that players can find and interact with one another.

## 2.4 Environment optimization

Use:
- Shared geometry.
- Instanced meshes.
- Reusable building components.
- Optimized materials.
- Texture atlases where appropriate.
- Frustum culling.
- Level of detail where useful.
- Efficient collision meshes.
- Simplified physics colliders.

Avoid unnecessary high-poly geometry.

The map must work on ordinary laptops with integrated graphics.

---

# PART 3 — TRANSFORM THE PROJECT INTO A MULTI-GAME PLATFORM

This is the most important architectural expansion.

Currently, the project behaves like a game specifically designed for MAFIA.

I want to change this.

The platform should support multiple games through a shared room system.

The first two games will be:

1. MAFIA 3D.
2. Multiplayer Shooting Game.

Additional games may be added in the future.

Do not build the architecture in a way that assumes only these two games will ever exist.

## 3.1 Shared room creation

The room creation flow should work like this:

STEP 1:

Player visits the platform.

STEP 2:

Player clicks Create Room.

STEP 3:

The room is created.

STEP 4:

The creator is shown a game-selection screen.

The available options should include:

- MAFIA 3D.
- SHOOTING GAME.

STEP 5:

The creator selects a game.

STEP 6:

The room is configured for that particular game.

STEP 7:

The room displays a shareable room code or invitation link.

STEP 8:

Friends join the room.

STEP 9:

The host starts the selected game when the required conditions are satisfied.

The room creator must also participate as a player.

## 3.2 Game-selection UI

Create an attractive game-selection interface.

Use two distinct game cards.

### Card 1: MAFIA 3D

Display:
- Game name.
- Attractive preview image or scene.
- Short description.
- Multiplayer/social-deduction label.
- Select Game action.

Suggested description:

"Find the Mafia, investigate suspicious behaviour, discuss, vote and survive."

### Card 2: SHOOTING GAME

Display:
- Game name.
- Attractive shooting-game preview image or scene.
- Multiplayer/team-based label.
- Select Game action.

Suggested description:

"Create teams, choose your weapons, enter the battlefield and compete with your friends."

Use a consistent design language across the platform.

Do not make the interface look like two unrelated websites.

## 3.3 Game-specific room configuration

After the host chooses a game, show settings relevant to that game.

For MAFIA:
- Existing Mafia settings.
- Mafia percentage.
- Role revelation.
- Game timers.
- Existing game rules.

For SHOOTING:
- Map selection.
- Team configuration.
- Weapon availability.
- Match duration.
- Respawn rules.
- Score limit.
- Other game-specific options as they are implemented.

Do not display Mafia settings inside shooting-game rooms.

Do not display shooting-game settings inside Mafia rooms.

## 3.4 Shared room architecture

Introduce a proper game-mode abstraction.

Conceptually:

```text
MULTIPLAYER PLATFORM
│
├── SHARED ROOM SYSTEM
│   ├── Room creation
│   ├── Room codes
│   ├── Invitations
│   ├── Player joining
│   ├── Player identity
│   ├── Host management
│   └── Connection management
│
├── GAME MODE: MAFIA
│   ├── Mafia rules
│   ├── Secret roles
│   ├── Night/day phases
│   ├── Discussion
│   └── Voting
│
└── GAME MODE: SHOOTING
    ├── Team selection
    ├── Weapon selection
    ├── Combat
    ├── Health
    ├── Damage
    ├── Respawning
    └── Match scoring
```

The shared room system should not contain Mafia-specific or shooting-specific game logic.

Each game should implement its own independent game engine and state machine.

Use the existing Colyseus infrastructure wherever practical.

Do not unnecessarily create completely separate authentication, room creation, or invitation systems for every game.

However, game-specific real-time state and validation must remain isolated.

## 3.5 Host privileges

The host:
- Creates the room.
- Selects the game.
- Configures game settings.
- Invites friends.
- Starts the game.
- Manages appropriate lobby settings.

The host is also a normal player.

The host must not receive unfair gameplay advantages.

In Mafia, the host must not see secret roles.

In Shooting, the host must not receive special damage, health, weapon, or combat advantages.

---

# PART 4 — NEW GAME: MULTIPLAYER SHOOTING GAME

## 4.1 Overall vision

I want a browser-based multiplayer shooting game inspired by Deadshot.io.

However, I want our own game rather than a copy.

Use Deadshot.io as inspiration for:
- Lightweight browser graphics.
- Responsive multiplayer shooting.
- Fast gameplay.
- Simple weapon handling.
- Multiplayer combat.
- Smooth character movement.
- Easy access through a browser.

Do not copy:
- Its branding.
- Maps.
- Assets.
- Character models.
- Weapon models.
- Interface designs.
- Protected content.

Our game should have its own identity.

The shooting game should feel polished, responsive, competitive and visually attractive.

## 4.2 Player capacity and invitations

A major requirement is that I do not want an arbitrary four-player friend-group limitation.

I want to invite as many friends as the room and infrastructure can support.

There must not be a hardcoded four-player maximum.

The room capacity should be configurable and determined through performance testing.

Do not promise unlimited simultaneous players.

Instead:
- Design scalable room infrastructure.
- Make capacity configurable.
- Test the maximum supported capacity.
- Document practical limits.
- Ensure the system handles joining and disconnecting safely.

## 4.3 Team creation and assignment

I want players to be divided into multiple teams.

For example:

A room has 11 players, including the host.

The host wants:

- Team Red: 4 players.
- Team Blue: 3 players.
- Team Green: 4 players.

The host should be able to assign players to teams.

The host must also be assigned to a team.

### Team assignment interface

After entering a shooting-game room, show a lobby with:

- Team Red.
- Team Blue.
- Team Green.
- Player list.
- Team member counts.
- Player assignment controls.
- Host indicator.
- Ready status.

Allow the host to create and configure teams.

Initially, support:
- Creating teams.
- Renaming teams.
- Adding players.
- Removing players.
- Moving players between teams.
- Assigning the host to a team.
- Configuring team sizes.
- Balancing teams where desired.

The host should be able to manually arrange teams.

The host may also use an automatic team-balancing option.

### Important requirements

- A player can belong to only one team.
- A player cannot be assigned to two teams simultaneously.
- Every active player must belong to a team before the match starts.
- The server validates all team assignments.
- Clients cannot modify their own team through unauthorized messages.
- Host actions must be validated by the server.

### Team assignment during a match

For the initial version, freeze team membership once a match starts.

Do not allow arbitrary team switching during active combat.

---

# PART 5 — SHOOTING GAME MAP DESIGN

## 5.1 Map concept

Create a dedicated shooting-game map.

Do not simply reuse the Mafia park as a shooting map without adapting its layout.

The shooting game needs a proper battlefield.

My preferred direction is a larger urban combat environment.

Create an attractive, detailed but performance-friendly city map.

Possible areas:

### Area A: Urban streets
- Wide roads.
- Sidewalks.
- Street intersections.
- Vehicles as decorative or cover objects.
- Streetlights.
- Road barriers.

### Area B: Commercial buildings
- Multiple buildings.
- Accessible ground floors where appropriate.
- Building entrances.
- Windows.
- Balconies.
- Interior spaces where practical.
- Staircases.
- Corridors.

### Area C: Rooftops
- Accessible rooftops.
- Cover objects.
- Elevated firing positions.
- Connections between selected buildings where appropriate.

### Area D: Industrial zone
- Warehouses.
- Containers.
- Barriers.
- Loading areas.
- Large structures.

### Area E: Open combat areas
- Spaces for long-range combat.
- Cover.
- Obstacles.
- Clear sightlines.

### Area F: Spawn zones
- Separate spawn areas for different teams.
- Appropriate protection from immediate spawn attacks.
- Clear routes from spawn zones into the battlefield.

The map must be designed around actual gameplay.

Do not create beautiful buildings that players cannot enter or use if the design implies they should be accessible.

Clearly distinguish:
- Accessible buildings.
- Decorative buildings.
- Walkable rooftops.
- Non-walkable environmental geometry.

## 5.2 Map size and layout

Make the shooting map significantly larger than the current Mafia map.

The map must support multiple teams fighting simultaneously.

Avoid:
- Extremely small spawn distances.
- Players spawning directly in front of enemies.
- Unnecessary empty space.
- Impossible navigation.
- Excessive vertical complexity.

Create multiple routes, cover positions, flanking opportunities and different engagement distances.

## 5.3 Map optimization

Use:
- Optimized geometry.
- Instancing.
- Shared materials.
- Efficient lighting.
- Collision proxies.
- Frustum culling.
- LOD where useful.

Maintain playable performance on ordinary laptops.

---

# PART 6 — CHARACTER MODELS AND ANIMATIONS

The existing character models are acceptable as an initial prototype, but the shooting game requires a higher level of presentation.

Improve character appearance and animation quality.

## 6.1 Character appearance

Use a consistent stylized 3D character design.

Characters should have:
- Recognizable body proportions.
- Properly modeled arms and legs.
- Distinct team appearance.
- Appropriate clothing.
- Good silhouette.
- Clear animation rigs.

Different teams must be visually distinguishable.

Use team colours, subtle outlines, icons or other appropriate indicators.

Do not rely only on colour where additional visual distinction would improve accessibility.

## 6.2 Required animations

Implement or integrate appropriate animations:

- Idle.
- Walking.
- Running.
- Sprinting.
- Jumping.
- Falling.
- Landing.
- Crouching, if supported.
- Aiming.
- Shooting.
- Reloading.
- Weapon switching.
- Hit reaction.
- Death.
- Respawning.

Animations must blend smoothly.

Avoid:
- Sudden animation snapping.
- Repeated jumping while sprinting.
- Sliding feet.
- Arms passing through the weapon.
- Character model jitter.
- Root-motion conflicts with physics.

Use animation blending and a clear animation state machine.

Use properly licensed or original assets.

---

# PART 7 — WEAPON SYSTEM

The shooting game should support multiple weapons.

Design the weapon system to be extensible.

Do not hardcode weapon behaviour directly into the player controller.

## 7.1 Initial weapon categories

Start with a small, balanced collection.

Possible initial weapons:

1. Pistol.
2. Assault rifle.
3. SMG.
4. Shotgun.
5. Sniper rifle.

These are proposed categories for the initial implementation.

Each weapon should have configurable:

- Damage.
- Fire rate.
- Reload duration.
- Magazine capacity.
- Maximum ammunition.
- Range.
- Recoil.
- Spread.
- Weapon switching time.
- Headshot multiplier.
- Body damage.
- Leg damage.

Create a central weapon configuration system.

Future weapons should be addable without rewriting the combat engine.

## 7.2 Weapon interactions

Support:
- Primary fire.
- Aiming.
- Reloading.
- Switching weapons.
- Ammunition tracking.
- Firing cooldowns.
- Weapon feedback.
- Appropriate sound effects.
- Muzzle flashes.
- Impact effects.

Use keyboard and mouse controls suitable for desktop browser gameplay.

Suggested controls:

| Input | Action |
|---|---|
| WASD | Movement |
| Mouse | Camera and aim |
| Left mouse button | Fire |
| Right mouse button | Aim |
| R | Reload |
| 1–5 | Weapon selection |
| Shift | Sprint |
| Space | Jump |
| C or Ctrl | Crouch, if implemented |
| Escape | Release pointer lock / open pause interface |

Avoid conflicting with existing UI controls.

---

# PART 8 — BODY-PART DAMAGE SYSTEM

This is a particularly important gameplay feature.

I want damage to depend on where a player is hit.

A headshot should deal the most damage.

A shot to the central torso should deal less than a headshot but more than a leg shot.

A shot to the legs should deal less damage.

## 8.1 Hit regions

Implement distinct hit regions:

1. Head.
2. Upper torso.
3. Lower torso / abdomen.
4. Arms.
5. Legs.

The desired damage relationship is:

```text
HEAD > UPPER TORSO > ABDOMEN > ARMS / LEGS
```

Use a configurable damage table.

Example values for initial balancing:

| Hit region | Example base damage multiplier |
|---|---:|
| Head | 2.0x |
| Upper torso | 1.0x |
| Abdomen | 0.85x |
| Arms | 0.65x |
| Legs | 0.60x |

These values are starting suggestions, not immutable rules.

Tune them through gameplay testing.

## 8.2 Hit detection

Use properly designed hitboxes attached to the character's skeletal or body structure.

Requirements:
- Head hitbox must be distinct.
- Torso hitboxes must be distinct.
- Arm hitboxes must be distinct.
- Leg hitboxes must be distinct.
- Hitboxes should follow character animations.
- Hit detection should remain consistent with visible character geometry.

Do not use one large capsule for every body part and pretend that headshots are implemented.

## 8.3 Server-authoritative combat

This is mandatory.

The client must never decide:
- Whether a shot hit.
- Which player was hit.
- Which body part was hit.
- How much damage was dealt.
- Whether a player died.

The client sends an authenticated shooting action.

The authoritative server validates:
- Shooter identity.
- Shooter alive status.
- Weapon ownership.
- Ammunition.
- Fire-rate limits.
- Shooting cooldown.
- Weapon range.
- Aim direction.
- Line of sight.
- Target validity.
- Hit region.
- Damage calculation.

The server determines the actual result.

Do not trust client-reported damage values.

Use an appropriate server-authoritative hit-detection architecture.

For hitscan weapons, the server validates ray origin and direction against authoritative player positions and hitboxes, accounting for reasonable network latency.

For projectile weapons, simulate and validate projectiles on the authoritative server.

Do not introduce client-side damage authority merely to make shooting feel responsive.

---

# PART 9 — HEALTH, DEATH AND RESPAWNING

Implement an extensible combat lifecycle.

## 9.1 Health

Each player has:
- Maximum health.
- Current health.
- Damage received.
- Alive/dead state.

Health must be controlled by the server.

## 9.2 Death

When health reaches zero:
- Mark the player dead.
- Prevent additional combat actions.
- Play the death animation.
- Update the team score where appropriate.
- Display suitable elimination feedback.

## 9.3 Respawning

Implement a configurable respawn system for the initial team-based game mode.

Requirements:
- Respawn delay configurable.
- Respawn at a valid team spawn location.
- Prevent spawning inside geometry.
- Prevent spawning inside another player.
- Avoid immediate spawn killing.
- Restore appropriate health and weapon state.

Do not confuse death and disconnection.

A disconnected player should be handled by the multiplayer session system, not counted as a combat kill.

---

# PART 10 — SHOOTING GAME MODES AND MATCH RULES

For the first playable version, prioritize a team-based deathmatch.

### Initial mode: Team Deathmatch

- Multiple teams compete.
- Players eliminate opposing-team members.
- Players respawn.
- Teams earn points for valid eliminations.
- The match ends when the time limit or score limit is reached.
- The winning team is announced.

Make these configurable:
- Match duration.
- Score limit.
- Respawn delay.
- Number of teams.
- Team sizes.
- Available weapons.
- Map selection.

The initial version should not become overloaded with too many game modes.

Design the architecture so future modes such as Free For All, Capture the Flag or other team modes can be added independently.

Do not implement these additional modes until the initial Team Deathmatch works properly.

---

# PART 11 — SHOOTING GAME HUD

Create a dedicated shooting-game interface.

It should display:

### Top area
- Team scores.
- Match timer.
- Match status.
- Remaining players or team status.

### Bottom area
- Current weapon.
- Ammunition.
- Reload status.
- Health.
- Optional armour, if introduced later.

### Gameplay feedback
- Hit markers.
- Headshot indicator.
- Elimination notification.
- Kill feed.
- Respawn countdown.
- Team identification.

### Lobby interface
- Room code.
- Team lists.
- Player assignment.
- Ready status.
- Map selection.
- Match settings.
- Start button.

The shooting HUD must be separate from the Mafia HUD.

Do not mix Mafia discussion, secret-role controls or Mafia phase timers into the shooting interface.

Preserve the existing Mafia HUD.

---

# PART 12 — MULTIPLAYER NETWORKING ARCHITECTURE

The project already uses Colyseus.

Extend the existing multiplayer infrastructure where appropriate.

## 12.1 Shared multiplayer responsibilities

Shared infrastructure should manage:
- Player identity.
- Room lifecycle.
- Room codes.
- Joining and leaving.
- Invitations.
- Host privileges.
- Reconnection.
- Connection state.
- Game-mode selection.

## 12.2 Game-specific responsibilities

MAFIA should have its own:
- Game state.
- Game rules.
- Phase management.
- Voting.
- Role privacy.
- Voice permissions.

SHOOTING should have its own:
- Player combat state.
- Team assignments.
- Health.
- Weapon state.
- Ammunition.
- Shooting validation.
- Hit detection.
- Score management.
- Respawning.
- Match lifecycle.

Do not place all game logic inside one enormous Colyseus room class.

Use clear boundaries and reusable services.

## 12.3 Network performance

For the shooting game, prioritize:
- Responsive local movement.
- Smooth remote player interpolation.
- Server-authoritative combat.
- Efficient state synchronization.
- Limited network payloads.
- Reasonable update frequencies.
- Reliable match-state transitions.

Profile before deciding the final networking tick rate.

Do not assume that sending every player's entire state every frame is acceptable.

Use suitable techniques such as:
- Snapshot interpolation.
- Client-side prediction for movement.
- Server reconciliation.
- Interpolation buffers.
- Delta or selective state updates.

Do not compromise server authority for damage and hit results.

---

# PART 13 — ROOM SECURITY AND PLAYER AUTHORIZATION

Ensure:
- Only authorized players join a room.
- Room codes are sufficiently unpredictable.
- Only the host can modify host-controlled settings.
- The host cannot impersonate other players.
- Team assignments are server validated.
- Game selection cannot be arbitrarily modified by ordinary players.
- Players cannot join a running match as active combatants unless explicitly supported.
- Secret Mafia roles remain protected.
- Shooting combat actions are validated by the authoritative server.
- Room state cannot be manipulated by trusting client payloads.

Keep the security model consistent across both games.

---

# PART 14 — GAME ASSET AND DESIGN QUALITY

The shooting game must look like a real game, not a collection of primitive cubes.

Improve:
- Character appearance.
- Weapon models.
- Building architecture.
- Environmental props.
- Animations.
- Materials.
- Lighting.
- Visual feedback.
- Sound effects.

Use original, properly licensed or open-licensed assets.

Maintain a consistent art direction.

I prefer an optimized stylized 3D aesthetic over expensive photorealistic graphics.

The game should feel visually polished while remaining lightweight.

Do not use placeholder cubes for final characters or weapons unless they are explicitly temporary development assets.

---

# PART 15 — PERFORMANCE TARGETS

Design for ordinary laptops and integrated GPUs.

Performance should be measured rather than assumed.

Investigate:
- Draw calls.
- Geometry complexity.
- Texture memory.
- Shader complexity.
- Shadow-map cost.
- Physics-body count.
- Network payload size.
- Number of simultaneously visible players.
- Server tick performance.

Use performance testing to determine realistic room capacity.

Do not promise unlimited players.

The product requirement is that there should be no arbitrary four-player limitation, and the infrastructure should support larger rooms as far as measured resources permit.

---

# PART 16 — BROWSER TESTING IS MANDATORY

You have browser-testing capabilities.

Use them to validate the actual running application.

Do not finish this task by only editing source code or running TypeScript checks.

## 16.1 Terrain tests

Open the actual game.

Test:
- Flat ground.
- Higher ground.
- Lower ground.
- Slopes.
- Steps.
- Ramps.
- Terrain transitions.
- Building entrances.

Verify that the character's feet do not sink into elevated terrain.

## 16.2 Shared room tests

Test:
1. Create a room.
2. Select MAFIA.
3. Confirm the existing Mafia lobby opens.
4. Verify Mafia settings are available.
5. Invite another player.
6. Start or test the Mafia game.
7. Create another room.
8. Select SHOOTING.
9. Confirm the shooting lobby opens.
10. Verify shooting-specific settings are displayed.

Ensure selecting one game does not accidentally activate the other game's state machine.

## 16.3 Team assignment tests

Using multiple browser sessions where possible:

- Join a shooting room with multiple players.
- Create multiple teams.
- Assign players to teams.
- Move a player from one team to another.
- Assign the host to a team.
- Verify that no player appears in two teams.
- Verify team counts.
- Verify unauthorized players cannot modify team assignments.

## 16.4 Shooting tests

Once the combat prototype exists:

- Move around the shooting map.
- Test aiming.
- Fire each implemented weapon.
- Reload.
- Switch weapons.
- Test ammunition restrictions.
- Test headshots.
- Test torso hits.
- Test abdomen hits.
- Test leg hits.
- Verify different damage values.
- Test death.
- Test respawn.
- Test team scoring.
- Test match completion.

Use multiple browser sessions to test real multiplayer interactions.

## 16.5 Multiplayer tests

Verify:
- Multiple players can join.
- Remote player movement is synchronized.
- Team assignments remain consistent.
- Shooting results are server-authoritative.
- Players cannot submit unauthorized damage.
- Disconnections do not corrupt match state.
- Reconnection works where supported.

## 16.6 UI and console tests

Check:
- Room creation.
- Game selection.
- Lobby navigation.
- Game-specific HUDs.
- Buttons.
- Chat.
- Timers.
- Network errors.
- Browser console errors.
- WebGL errors.

Record actual test results.

Do not claim success for any browser test that was not performed.

---

# PART 17 — PROJECT MEMORY

Update the existing `project-memory/` system.

Keep records concise.

Update:
- PROJECT_CONTEXT.md
- FEATURES.md
- CURRENT_STATUS.md
- CHANGES_LOG.md
- NEXT_STEPS.md
- DECISIONS.md, only when new decisions are actually established.

Record:
- Terrain grounding correction.
- Larger Mafia map.
- Multi-game room architecture.
- Game-selection flow.
- Shooting-game implementation status.
- Team assignment.
- Weapon and damage systems.
- Browser testing results.

Do not document every implementation function or modified source file.

Clearly distinguish implemented features from planned features.

---

# PART 18 — IMPLEMENTATION ROADMAP

This is a substantial expansion. Do not try to implement everything in one enormous change.

Follow these milestones.

## M0 — Existing game stabilization
- Fix elevated-ground collision.
- Validate character grounding.
- Expand the existing Mafia map.
- Run browser tests.
- Preserve existing Mafia gameplay.

## M1 — Multi-game room architecture
- Introduce game-mode identification.
- Separate shared room responsibilities from game-specific logic.
- Implement post-room-creation game selection.
- Add Mafia game selection and preserve its existing flow.
- Add shooting-game selection.
- Add game-specific lobby routing.
- Test both room types.

## M2 — Shooting lobby and team system
- Shooting lobby.
- Player list.
- Team creation.
- Team assignment.
- Host team assignment.
- Team balancing.
- Ready state.
- Map selection.
- Match configuration.

## M3 — Shooting environment
- Create a dedicated larger city combat map.
- Add buildings and accessible areas.
- Add cover.
- Add spawn locations.
- Add collision geometry.
- Optimize rendering.

## M4 — Shooting character and movement
- Improved character models.
- Running and aiming animations.
- Character orientation.
- Weapon-holding animations.
- Smooth movement.
- Multiplayer synchronization.

## M5 — Weapons and combat
- Weapon configuration.
- Shooting input.
- Aiming.
- Reloading.
- Weapon switching.
- Server-authoritative hit detection.
- Body-part damage.
- Health.
- Death.

## M6 — Team Deathmatch
- Respawning.
- Team scoring.
- Match timer.
- Score limit.
- Victory conditions.
- Kill feed.
- Match completion.

## M7 — Multiplayer and security validation
- Multiple simultaneous players.
- Server-authoritative combat.
- Team authorization.
- Reconnection.
- Performance profiling.
- Security tests.

## M8 — Polish and deployment
- Visual polish.
- Animation improvements.
- Sound effects.
- Performance optimization.
- Browser compatibility.
- Deployment preparation.

---

# PART 19 — IMPORTANT DEVELOPMENT RULES

1. Inspect the existing repository before implementation.
2. Preserve existing working Mafia functionality.
3. Do not rewrite the entire application unnecessarily.
4. Do not introduce duplicate room systems.
5. Keep game modes modular.
6. Keep game-specific rules independent.
7. Keep combat authoritative on the server.
8. Do not trust client-reported damage or hit regions.
9. Do not hardcode arbitrary player limits.
10. Do not promise unlimited room capacity.
11. Use actual browser testing.
12. Maintain the project memory.
13. Keep code modular and maintainable.
14. Use proper tests for important gameplay rules.
15. Avoid unnecessary dependencies.
16. Do not copy copyrighted assets or game content.
17. Do not mark features implemented until they work.
18. Explain important architectural changes.

If a technical limitation is encountered, explain the limitation and provide a recommended solution rather than silently reducing the scope.

Do not ask me to reconfirm already-approved MAFIA architecture or gameplay decisions.

Do not invent new gameplay rules without documenting them as proposals.

---

# PART 20 — FIRST RESPONSE AND EXECUTION EXPECTATIONS

Before making major changes:

1. Inspect the current codebase.
2. Inspect the existing project-memory folder.
3. Identify the current architecture.
4. Identify the terrain collision issue.
5. Identify how the current room creation and game-start flows work.
6. Identify what must be shared and what must be separated between games.

Then provide a short implementation assessment:

- Existing components that can be reused.
- Components requiring modification.
- New modules required.
- Architectural risks.
- Recommended implementation order.

After that, begin M0 and proceed through the roadmap incrementally.

Do not spend the entire session only producing another architecture document.

Implement, test, report, and update project memory as you progress.

For any milestone that is too large to complete in one session, finish a coherent working increment, update NEXT_STEPS.md and leave the repository in a stable state.

## FINAL PRODUCT VISION

The final product should be a browser-based multiplayer gaming platform.

A player creates a room, chooses a game, invites friends, and plays.

The platform initially supports:

**MAFIA 3D**
- Social deduction.
- Secret roles.
- Discussion.
- Voting.
- Multiplayer interaction.

**TEAM SHOOTING GAME**
- Large multiplayer rooms within measured infrastructure limits.
- Flexible team creation.
- Manual player assignment.
- Multiple weapons.
- Body-part-based damage.
- Smooth third-person shooting.
- Larger urban maps.
- Respawning and team competition.

Both games share the platform infrastructure but retain independent game engines.

The result should feel like a proper multiplayer gaming platform, not a single Mafia game with an unrelated shooting prototype bolted onto it.

**Start by inspecting the current implementation and fixing M0. Then build the multi-game architecture and shooting game in controlled, testable milestones.**