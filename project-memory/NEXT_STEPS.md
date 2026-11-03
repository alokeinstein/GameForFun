# Next Steps

## Current Immediate Task
**Milestone 3: 3D Environment, Low-Poly Map & Synced Character Controller**
Install 3D dependencies (`three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`) in `@mafia/web` and configure Next.js WebGL compatibility.

---

## Remaining Tasks in Current Milestone
1. **Town Square 3D Map (`apps/web/src/components/canvas/TownMap.tsx`):**
   - Create stylized low-poly central tribunal circle with stone benches.
   - Add perimeter town buildings, cobblestone paths, and atmospheric streetlamps.
   - Implement dynamic day/night ambient lighting synced to the server's `phase`.
2. **Kinematic Character Controller (`apps/web/src/components/canvas/CharacterController.tsx`):**
   - WASD / Arrow keys input with sprint (`Shift`) modifier.
   - Rapier WASM physics capsule collider with ground clamping.
   - Smooth third-person follow / orbit camera.
3. **Multiplayer Transform Synchronization:**
   - Throttle local player movement updates and send to Colyseus server.
   - Broadcast player positions at 20 Hz.
   - Render remote player avatars with smooth linear interpolation (`lerp`).
4. **Overlay HUD with 3D Canvas:**
   - Mount 3D canvas behind the 2D Game HUD so players explore the town in 3D during Discussion and Night phases, while voting modals overlay crisply.

---

## Task Dependencies
```
[Install 3D Packages]
        │
        ▼
[Town Square Map Geometry & Lights]
        │
        ▼
[Rapier Character Controller & Camera]
        │
        ▼
[20 Hz Server Transform Sync & Lerp]
        │
        ▼
[Integrate 3D Canvas with 2D Game HUD]
```

---

## Blockers
- **None.** Architecture, state loop, and network protocols are fully operational and verified.

---

## Suggested Next Action
Run `npm --workspace=@mafia/web install three @types/three @react-three/fiber @react-three/drei @react-three/rapier` and verify clean build in Next.js.
