# MAJOR SHOOTING GAME OVERHAUL
## Character Physics, Movement, Visual Environment, Combat, Weapon Handling, Aiming and Respawn System

You are working on an existing browser-based multiplayer shooting game built as part of the MAFIA multiplayer gaming platform.

I have provided a screenshot of the current shooting game.

Inspect the screenshot and the actual implementation before making changes.

The game currently has:
- A team deathmatch mode.
- Three teams: Red, Blue and Green.
- A 3D urban environment.
- Player characters.
- Third-person movement.
- Aiming and shooting controls.
- A weapon HUD.
- Health and armor indicators.
- Team scoring.
- A match timer.
- A return-to-lobby option.

However, the current implementation has substantial visual, physics and gameplay problems.

I want you to transform this prototype into a polished, smooth, attractive multiplayer shooting game.

The desired experience should have the accessibility, responsiveness and lightweight browser performance of modern browser-based arena shooters, combined with a more sophisticated third-person multiplayer environment.

Deadshot.io and other modern multiplayer shooters may be studied for gameplay and technical inspiration.

**Do not display Deadshot.io, RedShot.io or any other existing game's name anywhere in our UI, branding, menus or loading screens.**

We are creating our own game with our own identity, assets, maps and visual design.

Do not copy copyrighted maps, models, textures, sounds, branding or interface designs.

---

# PART 1 — FIX THE PLAYER MODEL AND GROUNDING

## 1.1 Current problem

The screenshot shows the player character partially submerged in the ground.

Only the upper part of the character is visible.

The character appears to be standing halfway inside the floor.

This is unacceptable.

The complete character must be visible and positioned correctly on the walkable surface.

## 1.2 Investigate the actual root cause

Inspect:
- Player model origin.
- Character root transform.
- Foot position.
- Character capsule.
- Physics body dimensions.
- Rapier collider dimensions.
- Ground collider.
- Spawn location.
- Character controller.
- Ground detection.
- Terrain collision.
- Model scaling.
- Animation rig and root motion.
- Camera positioning.

Determine whether the issue comes from:
- Incorrect character spawn height.
- Incorrect capsule offset.
- Model origin being at the centre rather than the feet.
- Incorrect collider height.
- Visual mesh and collider mismatch.
- Ground collision not being resolved.
- Character model being scaled incorrectly.
- Physics body and visible model having different positions.

Do not fix this by simply increasing the player's Y coordinate by an arbitrary amount.

Correct the actual source of the mismatch.

## 1.3 Correct character grounding

The following conditions must always hold:

- Character feet rest on the actual ground surface.
- Full character body is visible.
- Character does not sink into roads.
- Character does not sink into sidewalks.
- Character does not sink into ramps.
- Character does not float above the ground.
- Character does not fall through the map.
- Character does not become embedded in walls or buildings.
- Character remains correctly positioned during walking, sprinting, aiming and shooting.

The physics collider must match the character's intended physical dimensions.

The visible character model and physics body must remain synchronized.

## 1.4 Spawn validation

Every spawn location must be validated.

Before spawning a player:
- Check that the ground exists.
- Check that the character capsule fits.
- Check that the spawn location is not inside geometry.
- Check that there is sufficient vertical clearance.
- Check that the player is not spawned inside another player.
- Check that the location is appropriate for the player's team.

If a spawn point is invalid, select another valid location.

---

# PART 2 — FIX THE MOVEMENT BUG COMPLETELY

## 2.1 Current problem

There is a serious movement-control issue.

For example:

1. I press W.
2. The player starts moving forward.
3. I release W.
4. The player continues moving forward.
5. I press S, A or D.
6. The player does not properly change direction.
7. The character appears to have a persistent forward movement state.

Sometimes I can initially move in multiple directions, but after a while the player becomes stuck moving forward.

This must be investigated as a physics and input-management problem.

Do not assume it is just an animation issue.

## 2.2 Investigate input handling

Inspect:
- Keyboard event listeners.
- Keydown handling.
- Keyup handling.
- Browser focus.
- Pointer lock state.
- Input state management.
- Movement vector calculations.
- Velocity integration.
- Acceleration.
- Friction.
- Deceleration.
- Physics update frequency.
- Client/server synchronization.
- Input packet handling.
- Character controller state.
- Sprint state.
- Camera-relative movement.
- Movement animation state.

Pay particular attention to the possibility that the W key remains registered as pressed even after the player releases it.

Also inspect whether velocity continues accumulating without being correctly reduced or replaced.

## 2.3 Correct input-state management

Maintain an explicit input state.

Conceptually:

```text
InputState:
    forward
    backward
    left
    right
    sprint
    jump
    crouch
    aim
    fire
```

When a key is pressed, update its corresponding state.

When a key is released, immediately clear that state.

The movement direction must be recalculated from the currently active inputs.

Do not permanently accumulate movement direction from previous frames.

For example:

```text
W pressed:
    forward = true

W released:
    forward = false
```

If W is released and S is pressed, the player must move backward.

If W and A are pressed simultaneously, the player must move diagonally without gaining extra speed.

## 2.4 Handle lost keyboard focus

This is particularly important in browser games.

Sometimes a browser loses keyboard focus while a movement key is held.

This can leave a key stuck in the input state.

Implement safe input cleanup.

When:
- Window loses focus.
- Document becomes hidden.
- Pointer lock is released.
- Game is paused.
- Player enters a menu.
- Match ends.
- Player disconnects.

Clear appropriate movement and action inputs.

The player must never continue moving because the browser failed to deliver a keyup event.

## 2.5 Correct velocity behaviour

Use a proper movement model.

The character must have:
- Forward movement.
- Backward movement.
- Left movement.
- Right movement.
- Diagonal movement.
- Acceleration.
- Deceleration.
- Sprint speed.
- Ground friction.
- Air control, if supported.
- Jumping.
- Landing.

Movement must respond correctly to changes in input.

When switching from W to S, the character should decelerate and reverse smoothly.

Do not allow forward velocity to permanently dominate the movement vector.

Do not preserve stale movement input across frames.

## 2.6 Camera-relative movement

Continue using the third-person mouse-controlled camera.

Movement must be calculated relative to the camera's horizontal forward and right vectors.

Expected behaviour:

- Camera faces forward + W moves in that direction.
- Camera turns left + W follows the new direction.
- Camera turns right + W follows the new direction.
- Camera faces backward + W moves in the direction the camera faces.
- A and D move sideways relative to the camera.
- Looking upward or downward must not create unwanted vertical movement.

Normalize diagonal movement.

Ensure that the camera's vertical pitch does not introduce vertical velocity into horizontal movement.

## 2.7 Sprint

Shift should increase horizontal movement speed only.

Sprint must not:
- Trigger jumping.
- Increase vertical velocity.
- Cause floating.
- Cause camera bobbing.
- Cause physics instability.

Use proper running animations.

---

# PART 3 — CREATE A BEAUTIFUL, BRIGHT URBAN COMBAT ENVIRONMENT

## 3.1 Current visual problem

The current environment is excessively dark.

Large portions of the map are almost completely black.

The player can barely see the surrounding environment.

The map looks like an unfinished prototype made of dark geometric shapes.

I do not want this visual direction.

I want a beautiful, colourful, visually rich urban environment that is suitable for a multiplayer shooting game.

**The map should feel like a modern city arena, not a destroyed war zone, horror map or abandoned underground facility.**

## 3.2 Desired visual direction

Create a bright, stylized modern urban environment.

Think of a beautiful modern city district with:
- Colourful buildings.
- Clean streets.
- Modern architecture.
- Trees and greenery.
- Urban plazas.
- Commercial buildings.
- Rooftops.
- Warehouses.
- Parking areas.
- Pedestrian pathways.
- Decorative environmental elements.

The map can contain tactical combat areas without making the entire environment look destroyed.

## 3.3 Lighting

Lighting is a top priority.

The current darkness must be corrected.

Use an attractive daytime or bright late-afternoon lighting setup.

Requirements:
- Clearly visible buildings.
- Clearly visible characters.
- Clearly visible weapons.
- Clearly visible roads.
- Clearly visible ground.
- Clearly visible cover objects.
- Balanced shadows.
- Proper ambient lighting.
- Directional sunlight.
- Attractive sky.
- Appropriate environmental reflections.
- Good material contrast.

Do not use completely black shadows.

Do not use excessive darkness to create atmosphere.

The player should always be able to identify enemies and environmental objects.

Nighttime can be introduced as a future map variation, but the initial shooting map should have bright visibility.

## 3.4 Map concept: Urban District

Build a larger urban combat map with multiple distinct areas.

### Zone A — Commercial street

Include:
- Shops.
- Restaurants.
- Offices.
- Building entrances.
- Glass windows.
- Balconies.
- Streetlights.
- Sidewalks.
- Road markings.
- Signboards.

### Zone B — Residential blocks

Include:
- Apartment buildings.
- Courtyards.
- Parking areas.
- Small gardens.
- Walkable pathways.
- Building entrances.
- Outdoor seating.

### Zone C — Industrial area

Include:
- Warehouses.
- Loading bays.
- Shipping containers.
- Industrial buildings.
- Barriers.
- Storage areas.
- Different types of cover.

### Zone D — Central plaza

Include:
- Open space.
- Trees.
- Benches.
- Decorative plants.
- Fountains or other decorative structures.
- Pathways.
- Multiple routes.

### Zone E — Rooftops

Include:
- Accessible rooftops.
- Rooftop cover.
- Elevated shooting positions.
- Staircases.
- Building connections where appropriate.

### Zone F — Underground or indoor areas

Optional areas can include:
- Building interiors.
- Corridors.
- Parking structures.
- Accessible ground floors.
- Indoor tactical routes.

Only include these where they contribute to gameplay.

## 3.5 Tactical cover

Players should have places to hide and take cover.

Examples:
- Concrete barriers.
- Vehicles.
- Shipping containers.
- Walls.
- Pillars.
- Buildings.
- Street objects.
- Low walls.
- Rooftop structures.

Cover must have correct collision geometry.

Players should be able to hide behind objects and use them strategically.

Bullets must not pass through solid walls or other intended blocking geometry.

Avoid making all cover objects identical.

Create different types of cover for different combat situations.

## 3.6 Map readability

A beautiful map is not enough.

It must also support gameplay.

Ensure:
- Clear navigation.
- Multiple routes between areas.
- Different engagement distances.
- Flanking opportunities.
- Reasonable sightlines.
- Suitable spawn distances.
- No accidental dead ends.
- No impossible jumps.
- No invisible walls in expected walkable areas.
- No unintended holes in the terrain.

The environment should be larger than the current prototype but not unnecessarily huge.

Prioritize meaningful playable space over empty square kilometres.

---

# PART 4 — IMPROVE CHARACTER MODELS AND ANIMATIONS

The current characters look too basic.

I want a more polished stylized 3D character design.

Characters should have:
- Proper body proportions.
- Better clothing.
- Visible arms and legs.
- Better head models.
- Recognizable silhouettes.
- Proper weapon-holding poses.
- Smooth animations.

## 4.1 Required animation states

Implement appropriate animations:

- Idle.
- Walking.
- Running.
- Sprinting.
- Jumping.
- Falling.
- Landing.
- Aiming.
- Shooting.
- Reloading.
- Weapon switching.
- Crouching.
- Hit reaction.
- Death.
- Respawning.

Use smooth animation blending.

The animation state should match the actual movement and combat state.

For example:
- Sprinting should not use a jumping animation.
- Aiming should not make the character's weapon disappear.
- Reloading should not allow firing.
- Death should not allow continued movement.
- Respawning should restore the normal character state.

## 4.2 Weapon attachment

Weapons must be properly attached to the character's hands.

Ensure:
- Correct hand positioning.
- Correct weapon orientation.
- Proper aiming pose.
- Proper recoil animation.
- Proper reload animation.

Avoid weapons floating away from hands or passing through the character's body.

---

# PART 5 — COMPLETE AIMING SYSTEM

I want proper third-person shooting mechanics.

Right-click should aim.

Left-click should fire.

These controls must be configurable.

## 5.1 Aim behaviour

When the player holds the aim button:

- Enter aim mode.
- Adjust the camera to a suitable aiming position.
- Move the camera closer to the character's shoulder where appropriate.
- Display an appropriate aiming reticle.
- Align the weapon with the camera's aiming direction.
- Keep the player's character visible.
- Support precise aiming.

When the player releases the aim button:
- Return smoothly to the normal third-person camera.
- Remove the zoom or scope overlay.
- Restore the normal camera distance.

Do not abruptly teleport the camera.

## 5.2 Crosshair

Use a clean crosshair in normal shooting mode.

The crosshair should:
- Remain centred appropriately.
- Respond to weapon spread.
- Expand slightly during movement if appropriate.
- React to recoil.
- Provide hit feedback.
- Use a different visual indication for confirmed headshots.

Avoid a huge crosshair that obstructs the screen.

## 5.3 Camera-to-weapon alignment

The camera and weapon must be aligned correctly.

Do not simply fire in the direction the character is facing.

The shot direction must follow the actual aiming direction.

Account for the third-person camera offset.

The weapon's muzzle, camera ray and hit-detection logic must be consistent.

Prevent shots from passing through nearby cover simply because the camera is offset behind the player.

Use an appropriate camera-ray-to-muzzle validation method.

---

# PART 6 — WEAPON AND SCOPE SYSTEM

I want a variety of weapons with distinct handling.

Do not make every weapon behave identically.

## 6.1 Initial weapon collection

Start with:

1. Pistol.
2. Assault rifle.
3. SMG.
4. Shotgun.
5. Sniper rifle.

Additional weapons can be added later.

## 6.2 Weapon-specific behaviour

Each weapon should have its own configurable:

- Damage.
- Fire rate.
- Magazine capacity.
- Reserve ammunition.
- Reload time.
- Effective range.
- Maximum range.
- Recoil.
- Horizontal recoil.
- Vertical recoil.
- Spread.
- Accuracy.
- Aim speed.
- Weapon switching time.
- Scope configuration.
- Headshot multiplier.
- Body damage.
- Leg damage.

Use a central weapon configuration system.

Do not hardcode weapon behaviour into individual UI components.

## 6.3 Sniper and scoped weapons

Scoped weapons should have a proper scope/optic experience.

When the player aims with a sniper rifle:
- Transition into a scoped aiming view.
- Show an appropriate scope overlay.
- Zoom the camera.
- Display a clear reticle.
- Reduce the field of view appropriately.
- Keep the scope visually aligned with the weapon's actual aim.

When the player releases aim:
- Return to normal third-person view.

Do not show a sniper scope when holding an ordinary pistol.

Other weapons may use iron sights or red-dot-style aiming instead of a full-screen scope.

## 6.4 Weapon switching

Support:
- Number keys for weapon selection.
- Weapon wheel or inventory interface if useful.
- Appropriate weapon-switch animations.
- Weapon-specific ammunition display.

A weapon must not be usable if it is unavailable in the current loadout.

---

# PART 7 — REALISTIC BUT CONTROLLED RECOIL

I want shooting to feel satisfying.

There should be recoil physics when a weapon fires.

However, I do not want excessive recoil that makes aiming impossible.

## 7.1 Recoil behaviour

When firing:
- The weapon experiences a vertical recoil impulse.
- Some weapons have horizontal recoil.
- The camera may move slightly upward.
- The weapon model may move backward.
- The crosshair may expand temporarily.
- Recoil gradually recovers.

Different weapons must have different recoil profiles.

Examples:

### Pistol
- Moderate vertical kick.
- Small horizontal variation.
- Relatively easy recovery.

### Assault rifle
- Repeated vertical recoil.
- Controlled horizontal recoil.
- Burst firing is more accurate than uncontrolled continuous firing.

### SMG
- Faster firing.
- Moderate recoil.
- Greater spread at longer ranges.

### Shotgun
- Strong firing feedback.
- Large spread.
- Limited effective range.

### Sniper rifle
- Distinct firing kick.
- Slower recovery.
- High precision when properly aimed.

## 7.2 Recoil control

Implement:
- Weapon-specific recoil accumulation.
- Recoil recovery.
- Camera recoil.
- Weapon animation recoil.
- Spread changes.
- Optional movement penalties.

Do not randomly move the entire player character when a weapon fires.

Recoil should affect aiming and weapon presentation, not cause uncontrolled movement or physics instability.

## 7.3 Avoid exaggerated ballistic behaviour

Do not introduce arbitrary sideways bullet movement.

Bullets must not mysteriously curve horizontally.

For the initial implementation:

- Pistol, assault rifle, SMG and shotgun can use validated hitscan or suitable projectile simulation.
- Sniper rifles can use precise hitscan or a properly simulated projectile.
- Weapon spread should be controlled and configurable.
- Range limitations should be defined per weapon.
- Projectile gravity or drop can be added where appropriate, but should not create unrealistic behaviour.

A player should not be able to hit an enemy at an impossible distance with full damage.

Use weapon range and damage falloff where appropriate.

---

# PART 8 — BODY-PART HIT DETECTION AND DAMAGE

This system must be genuine and server-authoritative.

A headshot should deal the highest damage.

An abdomen hit should deal more damage than a leg hit but less than a headshot.

Different body regions must have distinct hitboxes.

## 8.1 Hit regions

Implement:

1. Head.
2. Upper torso.
3. Abdomen.
4. Left arm.
5. Right arm.
6. Left leg.
7. Right leg.

## 8.2 Initial damage configuration

Use a configurable damage system.

Suggested starting multipliers:

| Body part | Damage multiplier |
|---|---:|
| Head | 2.0x |
| Upper torso | 1.0x |
| Abdomen | 0.85x |
| Arms | 0.65x |
| Legs | 0.60x |

These are initial balancing values, not permanent rules.

Each weapon can have its own base damage.

Final damage is calculated from the weapon's base damage and the actual validated hit region.

## 8.3 Visual hit feedback

When a shot hits:

- Show a hit marker.
- Use a distinct headshot indicator.
- Update health.
- Display appropriate elimination feedback.
- Update the kill feed when applicable.

Do not display a successful hit marker before the server confirms the hit.

## 8.4 Server authority

The server decides:
- Whether the shot is valid.
- Whether the shot hit a player.
- Which body part was hit.
- How much damage was dealt.
- Whether the player died.

The client may immediately show cosmetic firing effects, but the server is authoritative for damage and kills.

---

# PART 9 — WEAPON SELECTION DURING DEATH AND RESPAWN

This is an important gameplay requirement.

I do not want players to be permanently stuck with their initial weapon.

When a player dies, they should have the opportunity to choose a weapon during the respawn period.

## 9.1 Death flow

When the player is eliminated:

1. Show the death feedback.
2. Display a respawn countdown.
3. Allow the player to observe the match while waiting.
4. Open the weapon/loadout selection interface.
5. Allow the player to select an available weapon.
6. Confirm the selected loadout.
7. Respawn when the timer finishes.

The player should be able to select weapons while waiting.

## 9.2 Loadout selection

Create a polished weapon-selection interface.

Display:
- Weapon name.
- Weapon category.
- Weapon preview.
- Damage.
- Fire rate.
- Range.
- Recoil.
- Magazine capacity.
- Ammunition.
- Weapon availability.

Provide a clear selection and confirmation action.

The player should know which weapon will be available after respawning.

## 9.3 Respawn rules

- Respawn after a configurable delay.
- Spawn in the correct team's spawn area.
- Validate spawn safety.
- Restore the appropriate health.
- Restore the selected weapon and ammunition according to the loadout rules.
- Prevent immediate spawn killing with configurable short spawn protection.
- Remove spawn protection when the player attacks or after its duration expires, according to the chosen rule.

The server controls the respawn process.

A dead player must not be able to fire, move or influence combat before respawning.

## 9.4 Loadout persistence

Define whether the selected loadout persists across subsequent deaths.

For the initial version:
- Preserve the last confirmed loadout.
- Allow players to change it during each respawn period.
- Do not allow unauthorized weapon selection.

---

# PART 10 — SETTINGS AND CONTROL CUSTOMIZATION

The game must support customizable controls.

I do not want controls hardcoded permanently.

Create a Settings interface with the following sections.

## 10.1 Mouse settings

- Mouse sensitivity.
- Aim sensitivity.
- Scoped sensitivity.
- Invert vertical mouse.
- Optional invert horizontal mouse.
- Mouse smoothing setting, if useful.
- Pointer-lock behaviour.

## 10.2 Key bindings

Allow players to customize:
- Forward.
- Backward.
- Left.
- Right.
- Sprint.
- Jump.
- Crouch.
- Aim.
- Fire.
- Reload.
- Weapon selection.
- Weapon switching.
- Pause.
- Scoreboard.

## 10.3 Left-handed controls

Provide a left-handed control preset.

The default should be suitable for right-handed players, but users should be able to remap aim and fire controls.

For example:
- Default aim: Right mouse.
- Default fire: Left mouse.
- Left-handed preset: configurable alternative mapping.

Do not assume every left-handed player wants exactly the same controls.

## 10.4 Settings persistence

Persist user preferences across sessions.

Use the project's existing settings persistence mechanism where available.

Do not store secrets or authentication data in browser preferences.

Ensure settings cannot break essential UI functionality.

---

# PART 11 — MULTIPLAYER MOVEMENT AND NETWORK PHYSICS

The shooting game must feel responsive.

A major part of multiplayer shooter quality is network synchronization.

Inspect the existing Colyseus implementation and its installed version before deciding which networking APIs to use.

Do not blindly upgrade dependencies.

## 11.1 Server-authoritative simulation

The server remains authoritative for:
- Player positions.
- Health.
- Damage.
- Weapons.
- Ammunition.
- Shooting cooldowns.
- Hit detection.
- Team membership.
- Death.
- Respawn.
- Match score.

Clients send input and actions, not arbitrary final game-state values.

## 11.2 Client-side prediction

For the local player:
- Apply movement immediately.
- Avoid waiting for a network round trip before displaying movement.
- Track input sequence numbers or equivalent acknowledgements.
- Reconcile against authoritative server state.
- Replay unacknowledged inputs where supported.
- Smooth small corrections.
- Handle large corrections safely.

The local character should feel responsive.

## 11.3 Remote-player interpolation

Other players should move smoothly.

Use:
- Timestamped server snapshots.
- Interpolation.
- Appropriate interpolation delay.
- Smooth orientation transitions.
- Reasonable handling of packet loss.

Avoid sudden teleporting when normal snapshots arrive.

## 11.4 Lag compensation

For shooting:

- Record a bounded history of authoritative player positions and hitbox poses.
- Associate firing actions with a validated server time or tick.
- Reconstruct the target state that the shooter reasonably saw.
- Perform hit detection against that historical state.
- Apply a strict maximum rewind window.
- Reject impossible timestamps and invalid firing actions.

Do not allow unlimited rewind.

This system should improve fair hit registration without allowing clients to manipulate historical positions.

## 11.5 Input reliability

Movement inputs must be processed in a consistent order.

Do not allow stale W input to continue after key release.

Movement simulation should use a stable fixed timestep.

Do not integrate acceleration differently on the client and server.

---

# PART 12 — SHOOTING GAME HUD AND VISUAL DESIGN

Improve the HUD substantially.

The current HUD is functional but needs better presentation.

Keep it clean, attractive and readable.

## 12.1 Top HUD

Display:
- Team Red score.
- Team Blue score.
- Team Green score.
- Match timer.
- Match mode.
- Score limit.

Use clear team colours.

## 12.2 Bottom-left HUD

Display:
- Player health.
- Armor, if enabled.
- Team identification.
- Appropriate health indicators.

## 12.3 Bottom-right HUD

Display:
- Current weapon.
- Weapon category.
- Magazine ammunition.
- Reserve ammunition.
- Reload state.
- Weapon readiness.

## 12.4 Crosshair and hit feedback

Display:
- Normal crosshair.
- Aiming crosshair.
- Scoped reticle.
- Hit marker.
- Headshot feedback.
- Elimination feedback.

## 12.5 Kill feed

Display recent eliminations:

Example:

```text
PLAYER A  [RIFLE ICON]  PLAYER B
PLAYER C  [SNIPER ICON] PLAYER D
```

The kill feed must use server-confirmed results.

## 12.6 Death and respawn UI

Display:
- Eliminated notification.
- Respawn countdown.
- Weapon selection.
- Spectator controls if supported.
- Team score.

Keep the weapon selection interface easy to use.

---

# PART 13 — SOUND AND GAME FEEDBACK

Introduce appropriate original or properly licensed sounds.

Include:
- Weapon firing.
- Reloading.
- Weapon switching.
- Footsteps.
- Jumping.
- Landing.
- Bullet impacts.
- Hit confirmation.
- Headshot confirmation.
- Death.
- Respawn.
- Match start.
- Match end.

Use spatial audio where practical.

Avoid overly loud or repetitive effects.

Allow users to configure:
- Master volume.
- Music volume.
- Sound effects volume.
- Voice volume.

Do not use copyrighted music or game sound effects without permission.

---

# PART 14 — PERFORMANCE AND VISUAL OPTIMIZATION

The game must run smoothly on ordinary laptops, including integrated graphics.

Prioritize:
- Low-poly optimized models.
- Efficient materials.
- Shared geometry.
- Instanced meshes.
- Frustum culling.
- Efficient shadows.
- Texture optimization.
- LOD.
- Simplified collision geometry.
- Efficient physics updates.
- Efficient network synchronization.

Avoid:
- Excessive dynamic lights.
- Unnecessary high-resolution shadows.
- Huge numbers of individual draw calls.
- Excessive physics bodies.
- Expensive post-processing effects by default.

Add scalable graphics settings where useful:

- Low.
- Medium.
- High.

Graphics settings should not change gameplay fairness.

Measure actual FPS and performance.

Do not claim performance targets have been achieved without measurement.

---

# PART 15 — BROWSER TESTING IS MANDATORY

You have browser-testing capabilities.

Use the actual browser to test the running game.

Do not stop after modifying the code.

Do not mark features as working based only on TypeScript checks.

## 15.1 Grounding tests

Test:
- Initial player spawn.
- Flat ground.
- Elevated ground.
- Lower ground.
- Ramps.
- Building entrances.
- Walking.
- Sprinting.
- Jumping.
- Landing.

Verify that the complete character remains visible and does not sink into the ground.

## 15.2 Movement tests

Perform the following:

| Test | Action | Expected result |
|---|---|---|
| 1 | Hold W | Move forward |
| 2 | Release W | Stop forward input |
| 3 | Press S | Move backward |
| 4 | Press A | Move left |
| 5 | Press D | Move right |
| 6 | Hold W + A | Move diagonally |
| 7 | Hold W + Shift | Sprint forward |
| 8 | Hold S + Shift | Sprint backward if supported |
| 9 | Rapidly switch W to S | Smooth direction reversal |
| 10 | Rapidly switch A to D | Smooth direction reversal |
| 11 | Release all keys | No unwanted continuous movement |
| 12 | Lose browser focus while moving | Input safely clears |
| 13 | Re-enter the game | Controls work normally |
| 14 | Release pointer lock | No stuck movement |
| 15 | Repeated movement for 60 seconds | No persistent input or drift |

Pay particular attention to the original W-key bug.

It must be completely resolved.

## 15.3 Aiming tests

Test:
- Normal third-person camera.
- Right-click aiming.
- Camera transition.
- Mouse movement while aiming.
- Crosshair positioning.
- Left-click firing.
- Aim release.
- Scope activation.
- Scope deactivation.
- Weapon switching.

Verify that the actual shot direction matches the player's aiming direction.

## 15.4 Weapon tests

Test every implemented weapon.

Verify:
- Fire rate.
- Ammunition.
- Reloading.
- Weapon switching.
- Recoil.
- Spread.
- Range.
- Damage.
- Scope behaviour where applicable.

## 15.5 Body-part damage tests

Use controlled test scenarios.

Shoot:
- Head.
- Upper torso.
- Abdomen.
- Arms.
- Legs.

Verify that damage matches the server's actual hit-region calculation.

Verify that a headshot produces the intended higher damage.

## 15.6 Respawn tests

Test:
1. Player dies.
2. Death interface appears.
3. Respawn countdown begins.
4. Weapon selection is available.
5. Player selects a different weapon.
6. Respawn occurs.
7. Selected weapon is equipped.
8. Health and ammunition are correct.
9. Spawn position is valid.
10. Spawn protection behaves correctly.

## 15.7 Multiplayer tests

Use multiple browser sessions where possible.

Verify:
- Players can join the same room.
- Movement synchronizes.
- Team colours are correct.
- Players can aim independently.
- One player's camera does not affect another.
- Shots register correctly.
- Damage is consistent.
- Death is synchronized.
- Respawn works.
- Team scores update.
- Match completion works.

## 15.8 Performance and console tests

Inspect:
- Browser console.
- WebGL errors.
- Network errors.
- Physics warnings.
- Rendering performance.
- FPS.
- Memory usage where observable.

Document actual findings.

Do not invent test results.

---

# PART 16 — PROJECT MEMORY

Update the existing project-memory system.

Keep records concise.

Record:
- Player grounding correction.
- Movement input correction.
- Input focus handling.
- Character animation improvements.
- Bright urban environment redesign.
- Aiming and scope system.
- Recoil system.
- Weapon selection during respawn.
- Body-part hit detection.
- Browser test results.
- Remaining known issues.

Do not document every function or file modification.

Do not mark planned features as implemented.

---

# PART 17 — IMPLEMENTATION ORDER

This task is too large to implement safely in one code change.

Work in the following order.

## M0 — Physics and movement stabilization
- Fix character grounding.
- Fix the persistent forward movement bug.
- Correct input-state management.
- Handle lost keyboard focus.
- Validate direction changes.
- Validate sprint.
- Validate jumping.
- Run browser movement tests.

Do not proceed until the major movement and grounding bugs are fixed.

## M1 — Visual environment overhaul
- Bright lighting.
- Better sky.
- Improved ground materials.
- Better building materials.
- Improved environment composition.
- Better cover.
- Improved player visibility.
- Optimize the map.

## M2 — Character and animation improvements
- Better character model.
- Proper weapon attachment.
- Animation state machine.
- Walking.
- Running.
- Aiming.
- Shooting.
- Reloading.
- Death.
- Respawn.

## M3 — Aiming and weapon framework
- Camera-based aiming.
- Crosshair.
- ADS.
- Scope system.
- Weapon configuration.
- Weapon switching.
- Ammunition.
- Reloading.

## M4 — Recoil and combat
- Weapon-specific recoil.
- Spread.
- Hit detection.
- Body-part hitboxes.
- Server-authoritative damage.
- Hit feedback.

## M5 — Death and respawn
- Death handling.
- Respawn timer.
- Weapon selection.
- Loadout persistence.
- Spawn validation.
- Spawn protection.

## M6 — Settings and controls
- Mouse sensitivity.
- Aim sensitivity.
- Scoped sensitivity.
- Key remapping.
- Left-handed preset.
- Persistent preferences.

## M7 — Multiplayer validation
- Client-side prediction.
- Server reconciliation.
- Remote interpolation.
- Lag compensation.
- Combat validation.
- Multiplayer testing.

## M8 — Final polish
- Sound.
- HUD.
- Visual effects.
- Performance.
- Browser compatibility.
- Full regression testing.

Complete a coherent working increment at each milestone.

Do not leave the project in a broken intermediate state.

---

# PART 18 — DEVELOPMENT RULES

1. Inspect the existing repository before making changes.
2. Preserve the approved platform architecture.
3. Preserve the existing Mafia game.
4. Do not rebuild unrelated systems.
5. Do not introduce another physics engine.
6. Keep movement logic separate from camera logic.
7. Keep weapon configuration separate from weapon rendering.
8. Keep hit detection separate from UI.
9. Keep server-authoritative damage.
10. Never trust client-reported health or damage.
11. Never trust client-reported body-part hit results.
12. Avoid stale keyboard input.
13. Do not allow movement to continue after all movement keys are released.
14. Do not allow sprint to trigger jumping.
15. Do not allow shooting while dead.
16. Do not allow firing during reload.
17. Do not allow unauthorized weapon selection.
18. Do not make every weapon behave identically.
19. Do not use extremely dark lighting.
20. Do not use placeholder geometry as final visual assets.
21. Do not sacrifice gameplay responsiveness for unnecessary graphics.
22. Do not mark browser tests successful without performing them.
23. Maintain the project-memory files.
24. Do not ask me to reconfirm already-approved project decisions.

If you encounter a genuine technical blocker, document it and recommend a solution.

---

# PART 19 — FINAL REPORT

After each milestone, report:

### 1. What changed?
Briefly describe the implemented improvements.

### 2. Root causes
Explain the actual causes of:
- Character sinking.
- Persistent movement.
- Any other major physics issue.

### 3. Gameplay
Report the working status of:
- Movement.
- Sprint.
- Jump.
- Aiming.
- Shooting.
- Recoil.
- Hit detection.
- Weapon switching.
- Respawn.
- Weapon selection.

### 4. Browser testing

Provide an actual PASS/FAIL table.

### 5. Multiplayer testing

Report which interactions were tested with multiple sessions.

### 6. Performance

Report measured FPS and relevant performance observations if available.

### 7. Remaining issues

List anything unfinished or unverified.

### 8. Project memory

Confirm the relevant memory files were updated.

---

# FINAL PRODUCT VISION

I want this shooting game to feel like a complete, polished multiplayer experience.

The player should be able to:

- Enter a beautiful, bright urban combat map.
- Move smoothly in every direction.
- Stop and reverse direction immediately and naturally.
- Sprint without unwanted jumping.
- Hide behind buildings and cover.
- Look around using the mouse.
- Aim using the configured controls.
- Shoot accurately.
- Experience realistic but controlled recoil.
- Use different rifles, pistols, SMGs, shotguns and sniper rifles.
- Use scopes on appropriate weapons.
- Hit different body regions for different damage.
- Eliminate opponents.
- Die and enter a respawn screen.
- Choose a different weapon while waiting.
- Respawn with the selected loadout.
- Compete with friends in multiple teams.

The map should be bright, colourful, detailed and enjoyable to explore.

The character models should look polished.

The movement should feel responsive.

The shooting should feel satisfying.

The multiplayer experience should be stable.

**Start with M0. Fix the actual physics and input bugs first. Then progressively improve the environment and combat experience. Test every major feature in the browser before declaring it complete.**