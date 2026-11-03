# Next Steps

## Current Immediate Task
**Milestone 5: Match History Persistence, Player Statistics & Production Polish**
Implement Prisma-backed PostgreSQL match recording on victory, player career statistics updates, and production deployment readiness.

---

## Remaining Tasks in Current Milestone (Milestone 5)
1. **Match Archival Service in `apps/game-server`:**
   - Instantiate Prisma client from `@mafia/database`.
   - On transition to `Phase.VICTORY`, record `GameSession` (room code, winner, duration, rounds).
   - Record `GamePlayer` records for each participant (role, survival status, eliminated by).
   - Asynchronously update or upsert `PlayerStats` (wins, losses, survival rates).
2. **Match History API & Web Viewer:**
   - Add endpoint or room message to fetch past match records.
   - Display match summary breakdown in the post-game screen.
3. **End-to-End Stress Testing & Health Verification:**
   - Full automated test suite across all milestones (50+ tests).
   - Production Docker / container verification for Colyseus and Next.js.

---

## Task Dependencies
```
[Milestone 4: WebRTC Voice & Web Audio SFX] (COMPLETED)
        │
        ▼
[Prisma Match Archival Service]
        │
        ▼
[Player Career Statistics Upsert]
        │
        ▼
[Production Deployment Verification]
```

---

## Blockers
- **None.** Monorepo health is pristine (49/49 tests passing, production build passing).

---

## Suggested Next Action
Implement the Prisma match archival handler in `apps/game-server/src/rooms/MafiaRoom.ts` triggering on `Phase.VICTORY`.
