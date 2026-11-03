# MAFIA — Architecture Approval, Game Rules Finalization & Milestone 0 Authorization

You have already completed your initial repository audit and submitted the Technical Co-Founder Initial Architecture & Audit Deliverable.

I have now reviewed your architecture proposal and finalized the major architectural and gameplay decisions.

Your next responsibility is to incorporate these decisions into the project documentation and begin implementation.

**Do not ask me to repeat, reconfirm, or approve decisions that have already been provided.**

Act as the technical co-founder and lead software architect. Challenge technical problems when necessary, but do not unnecessarily delay implementation.

---

## 1. APPROVED ARCHITECTURE DECISIONS

These decisions are confirmed and must be treated as the project's architectural baseline.

### Package management
- npm workspaces.
- Turborepo.
- TypeScript monorepo.

### Database
- PostgreSQL from day one.
- Prisma ORM.
- Use PostgreSQL consistently across development, staging, and production.
- Do not plan an SQLite-to-PostgreSQL migration.

### Technology stack

- Frontend: Next.js App Router + TypeScript.
- 3D engine: Three.js + React Three Fiber.
- Physics: Rapier.
- Multiplayer: Node.js + Colyseus.
- Database: PostgreSQL + Prisma.
- Voice: LiveKit + WebRTC.
- State management: Zustand.
- Monorepo: npm workspaces + Turborepo.

Redis can be introduced when actual scaling or coordination requirements justify it.

### Graphics
Use Deadshot.io as inspiration for lightweight browser-based 3D performance and visual simplicity.

Do not copy its branding, assets, maps, models, or protected content.

The game must run smoothly on ordinary laptops, including systems with integrated graphics and no dedicated GPU.

---

## 2. CONFIRMED GAMEPLAY RULES

### Room and lobby
- Players create or join rooms using a room code.
- The room creator is also a normal player.
- The host participates in random role assignment.
- The host can receive either Mafia or Citizen.
- Hosting must never provide access to secret roles or unfair gameplay advantages.
- No fixed maximum player count has been decided yet.
- Design the room capacity as a configurable infrastructure setting rather than hardcoding a game-rule maximum.

### Mafia percentage
- Default Mafia percentage: 20%.
- Configurable range: 10%–30%.
- Mafia count formula:

  `floor(totalPlayers × mafiaPercentage / 100)`

- At least one Mafia and one Citizen must exist in a valid match.
- Apply a minimum-one-Mafia exception when the normal formula produces zero.
- The percentage setting must not allow Mafia to exceed the configured 30% limit in ordinary valid games.
- Do not introduce manual Mafia-count selection without a separate product decision.

### Secret roles
- Mafia knows its own role and the identities of its Mafia teammates.
- Citizens know only their own Citizen role.
- No visible role labels above characters.
- The host receives no special role visibility.
- Secret role information must never be exposed through public Colyseus state, ordinary API responses, public events, or unauthorized game-history endpoints.
- Use server-authoritative private messages for role information.

### Game phases

Implement the following state machine:

1. Waiting for players.
2. Role assignment.
3. Night.
4. Morning announcement.
5. Day discussion.
6. Public voting.
7. Revoting when applicable.
8. Elimination announcement.
9. Victory check.
10. Next night or game end.

The server must control all phase transitions.

### Night voting — Mafia

- Every living Mafia member receives one selection.
- Mafia privately coordinate.
- The server counts their final selections.
- The target with the highest number of Mafia selections is killed.
- Strict plurality is the rule.
- If the highest number of votes is tied, nobody dies.
- If nobody submits a selection, nobody dies.
- No random tie-breaker.
- No host priority.

### Public voting — Citizens and Mafia

The original voting requirement is mandatory:

**A candidate must receive at least 50% of all eligible living players' votes to be eliminated.**

The denominator is all eligible living players, not merely the number of submitted votes.

Exactly 50% is sufficient.

Examples:
- 10 eligible living players: at least 5 votes.
- 8 eligible living players: at least 4 votes.
- 6 eligible living players: at least 3 votes.

Living Mafia and Citizens both participate in public voting.

### Revoting

Confirmed decisions:
- Revoting is intended to be unlimited until someone is eliminated.
- Only candidates tied for the highest vote count participate in a runoff.
- The 50% threshold continues to apply.
- If a revote fails to produce an elimination, the previously specified rule says nobody is eliminated and the next night begins.

There is a potential logical conflict between unlimited revoting and proceeding to the next night after an unsuccessful revote.

Do not silently implement contradictory rules.

For Milestone 0:
1. Document the conflict explicitly.
2. Keep the voting logic isolated in a pure game-rules package.
3. Write tests for the agreed 50% threshold, tie detection, eligible runoff candidates, and no-elimination outcome.
4. Use the following provisional interpretation unless implementation demonstrates a better deterministic interpretation:
   - A unique leading candidate who fails to reach 50% does not trigger a runoff; the day ends without elimination.
   - A tie for the highest vote count triggers a runoff between those tied candidates.
   - Continue tied-candidate runoffs while a tie remains.
   - If a runoff produces a unique candidate with at least 50%, eliminate that candidate.
   - If a runoff produces a unique candidate below 50%, end the day without elimination and proceed to the next night.
5. Clearly mark this interpretation as provisional in the rules documentation.

Do not invent additional voting rules.

### Role revelation

- Host-configurable setting.
- Default: reveal the eliminated player's role immediately.
- Alternative: keep the role hidden until the match ends.
- The actual role must always remain available to the authoritative server.
- Role revelation must not expose information prematurely when hidden mode is enabled.

### Minimum players

| Environment | Minimum players |
|---|---:|
| Production | 5 |
| Development/testing | 3 |

Development mode must not accidentally be enabled in production.

### Disconnection and reconnection

- A disconnected player receives 60 seconds to reconnect.
- Preserve their identity and match state during the reconnection window.
- Do not immediately treat a temporary network disconnection as an elimination.
- Implement the reconnection system so that reconnection cannot duplicate a player or create unauthorized sessions.

The consequences of permanently abandoning a match after 60 seconds should be isolated as a configurable rule and explicitly documented as unresolved.

### Eliminated players

- Eliminated players receive a separate dead-player chat.
- Dead chat must be isolated from living-player communication.
- Living players must not be able to access dead chat.
- Eliminated players must not communicate through the living Mafia channel.
- Do not allow dead players to influence votes, kills, or living-player discussions.

---

## 3. SECURITY AND MULTIPLAYER REQUIREMENTS

The server is the single source of truth.

It controls:
- Role assignment.
- Role visibility.
- Player alive/dead status.
- Night kills.
- Public voting.
- Vote thresholds.
- Phase transitions.
- Timers.
- Victory conditions.
- Voice-channel authorization.
- Reconnection and player identity.

### Secret role protection

Never put secret roles inside publicly synchronized Colyseus state.

Use private directed messages to authorized clients.

Remember that TLS-protected WebSocket transport does not make an incorrectly exposed message private. Authorization must be enforced before sending the message.

### Voice security

Use LiveKit.

- Day discussion: living players.
- Night Mafia communication: living Mafia members only.
- Dead chat: eliminated players in their separate channel, according to the approved dead-chat design.
- Immediately revoke or remove unauthorized voice participants when their eligibility changes.
- Never rely on hiding UI controls as a security mechanism.

### Movement security

- Client-side prediction for responsive movement.
- Server-side validation.
- Validate movement speed, position boundaries, and impossible movement.
- Interpolate remote characters.
- Start with a 20Hz server update target, then profile performance.

### Timer security

Use server-authoritative timestamps:

- `phaseStartedAt`
- `phaseEndsAt`

Clients calculate their displayed countdown from the server deadline.

Clients must never determine when a game phase ends.

---

## 4. ARCHITECTURAL CORRECTIONS TO YOUR ORIGINAL PROPOSAL

Review your initial deliverable and incorporate these corrections:

1. Do not claim SQLite-to-PostgreSQL migration is a one-line configuration change.
2. Do not transition from an unsuccessful revote to an elimination announcement if nobody was actually eliminated.
3. Keep disconnecting separate from being killed or eliminated.
4. Do not allow eliminated Mafia members to retain access to living Mafia communication.
5. Do not expose persisted secret roles through public match-history APIs before the match concludes.
6. Keep the game rules independent of Next.js, Colyseus, React, and database code.
7. Ensure that the host remains an ordinary player for all gameplay decisions.
8. Keep room capacity configurable rather than imposing an arbitrary hardcoded maximum.
9. Avoid excessive React state updates for high-frequency 3D movement.
10. Profile performance before increasing networking frequency or adding expensive visual effects.

---

## 5. DOCUMENTATION TASKS

Before writing application code, update or create these documents:

- `docs/PROJECT_ARCHITECTURE.md`
- `docs/GAME_RULES.md`
- `docs/GAME_STATE_MACHINE.md`
- `docs/SECURITY_MODEL.md`
- `docs/DATABASE_DESIGN.md`
- `docs/TECHNICAL_DECISIONS.md`
- `docs/OPEN_DECISIONS.md`
- `docs/DEVELOPMENT_ROADMAP.md`

The documents must distinguish:

- Confirmed requirements.
- Approved technical decisions.
- Provisional implementation interpretations.
- Unresolved future decisions.

Do not describe provisional assumptions as user-approved decisions.

---

## 6. MILESTONE 0 — AUTHORIZATION TO IMPLEMENT

You are authorized to begin Milestone 0.

Your tasks:

### A. Repository foundation
- Initialize the npm workspace monorepo.
- Configure Turborepo.
- Configure TypeScript.
- Configure ESLint and formatting.
- Establish sensible shared configuration.
- Create the agreed project folder structure.

### B. Shared game rules

Create a framework-independent package, preferably:

`packages/game-rules`

Implement pure functions for:
- Mafia count calculation.
- Role distribution.
- Random role assignment.
- Public vote counting.
- 50% threshold calculation.
- Tie detection.
- Revote candidate selection.
- Night Mafia vote counting.
- Victory-condition evaluation.
- Phase-transition validation.

These functions must not depend on React, Next.js, Colyseus, or the database.

### C. Tests

Write automated unit tests for all critical rules.

At minimum, cover:
- 3-player development game.
- 5-player minimum production game.
- 10-player game with 20% Mafia.
- Mafia percentage boundaries.
- Exactly 50% public vote.
- Below 50% public vote.
- Missing votes.
- Tied public votes.
- Revote candidate restrictions.
- Mafia night voting ties.
- No Mafia night selections.
- All Mafia eliminated.
- Mafia reaching parity with Citizens.
- Disconnection and reconnection identity handling.

### D. Database foundation

- Configure Prisma for PostgreSQL.
- Prepare the initial database schema.
- Keep persistent user and match records separate from transient live-game state.
- Do not prematurely introduce unnecessary tables or complexity.

### E. Quality checks

Run:
- TypeScript checks.
- Linting.
- Unit tests.
- Build checks.

Document the results and any blockers.

---

## 7. DEVELOPMENT RULES

Follow these rules throughout the project:

1. Do not implement the entire game in one enormous code change.
2. Work milestone by milestone.
3. Keep the architecture modular.
4. Write tests before or alongside critical game logic.
5. Explain significant architectural decisions.
6. Do not introduce libraries without a clear reason.
7. Do not hardcode business rules that should be configurable.
8. Do not add unrequested gameplay mechanics.
9. Do not compromise server-side security for development convenience.
10. Do not start building elaborate 3D environments before the underlying game logic is validated.

If a genuinely blocking decision arises, document the exact issue, its consequences, and your recommended default. Continue all independent work.

---

## 8. REQUIRED RESPONSE AFTER MILESTONE 0

When Milestone 0 is complete, provide:

1. Updated project folder structure.
2. Updated architecture and rules documents.
3. Dependencies installed and their purposes.
4. Database configuration and migration status.
5. Implemented pure game-rule functions.
6. Automated test results.
7. TypeScript, lint and build results.
8. Remaining unresolved decisions.
9. Any deviations from the approved architecture.
10. The exact next tasks for Milestone 1.

**Final instruction:** The architecture has been approved. Stop repeatedly asking for approval of already-confirmed decisions. Incorporate the specifications, exercise technical judgment on implementation details, and begin Milestone 0 now.