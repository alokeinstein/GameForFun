# Next Steps

## Current Immediate Task
**Milestone 4: Positional WebRTC Audio & Social Atmosphere**
Implement ambient sound effects, phase transition audio cues, and WebRTC proximity voice chat architecture.

---

## Remaining Tasks in Current Milestone (Milestone 4)
1. **Audio Manager & Sound Effects (`apps/web/src/services/audio.ts`):**
   - Synthesized / web-audio cues for clock ticks, dawn bells, night crickets, tribunal gavel, and victory stings.
   - Master volume and mute toggles in game settings.
2. **WebRTC Proximity Voice Signaling:**
   - Colyseus room signaling for WebRTC peer connection offer/answer/ICE exchange.
   - Spatial audio gain nodes based on Euclidean distance in 3D town square ($d = \sqrt{\Delta x^2 + \Delta z^2}$).
3. **Dead Player Voice Isolation:**
   - Dead players cannot speak to living players during active rounds (spectator dead channel).

---

## Task Dependencies
```
[Web Audio SFX Manager]
        │
        ▼
[Colyseus WebRTC Voice Signaling]
        │
        ▼
[Spatial 3D Distance Attenuation]
        │
        ▼
[Dead Player Channel Isolation]
```

---

## Blockers
- **None.** Monorepo health is pristine (46/46 tests passing).

---

## Suggested Next Action
Implement `apps/web/src/services/audio.ts` with procedural Web Audio API phase stings and UI audio feedback.
