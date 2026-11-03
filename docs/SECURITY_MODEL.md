# MAFIA 3D — Security & Anti-Cheat Model

## 1. Core Threat Model & Guiding Principles
The server is the **single source of truth**. Web browser clients are inherently untrusted environments where malicious players can inspect memory, manipulate WebSockets, edit local storage, and modify JavaScript code.

---

## 2. Secret Role Secrecy & Network Transmission

### 2.1 The Vulnerability of Public Synchronization
In frameworks like Colyseus, room schemas are synchronized across all connected WebSockets. If a `role` field is placed inside a player schema, any player opening Chrome DevTools or inspecting WebSocket frames can trivially inspect the entire lobby's roles. Transport Layer Security (WSS / TLS) only prevents third-party eavesdropping; it provides **zero** protection against a connected player inspecting packets sent to their own client.

### 2.2 Our Architecture: Zero-Knowledge Public Schemas
1. **Public State:** The Colyseus `PlayerState` contains only public data:
   - `id`, `displayName`, `isAlive`, `isHost`, `isConnected`, `x`, `y`, `z`, `rotationY`, `animationState`.
2. **Private Role Dispatch:** Secret roles are communicated **only** via directed private messages:
   ```typescript
   // On the server:
   if (player.role === Role.CITIZEN) {
     client.send("ROLE_ASSIGNMENT", { role: Role.CITIZEN });
   } else if (player.role === Role.MAFIA) {
     const mafiaTeammates = room.getLivingMafiaTeammates(player.id);
     client.send("ROLE_ASSIGNMENT", {
       role: Role.MAFIA,
       teammates: mafiaTeammates.map(t => ({ id: t.id, displayName: t.displayName }))
     });
   }
   ```
3. **Citizen Verification:** A Citizen's client memory, network tab, and React component tree will **never** contain the identities of Mafia members during gameplay.

---

## 3. Voice Communication Security (LiveKit SFU)

Voice eavesdropping and ghost-speaking can destroy social deduction games. We enforce role-based access control (RBAC) via backend-generated LiveKit JWT tokens:

1. **Phase-Gated Access Tokens:**
   - Tokens include short expiration timestamps (e.g., 5 minutes) and specific room permissions (`canPublish`, `canSubscribe`).
2. **Channel Segregation:**
   - `room-{code}-public`: Active during `DAY_DISCUSSION`. Granted to living players.
   - `room-{code}-mafia`: Active during `NIGHT`. Granted strictly to authenticated, living Mafia members.
   - `room-{code}-dead`: Active for eliminated players.
3. **Immediate Revocation Upon Death (Correction #4):**
   - When a Mafia member or Citizen is killed (Night or Day), the game server immediately issues a LiveKit server-side disconnect / permission update removing them from living channels.
   - Eliminated Mafia members **cannot** continue speaking or listening to living Mafia during the night.

---

## 4. Movement Validation & Physics Security

While physics and movement are client-predicted for silky 60fps responsiveness, the server validates movement at 20Hz:
1. **Delta Velocity Bounds:**
   $$\Delta \text{distance} \le (\text{maxSpeed} + \epsilon) \times \Delta t$$
   Any packet where movement exceeds the physical speed limit triggers a server-side position correction (rubberbanding).
2. **Boundary Clamping:** Positions outside the playable village map boundaries or inside solid building collision meshes are rejected.
3. **Phase Freezing:** During non-movement phases (`ROLE_ASSIGNMENT`, `MORNING_ANNOUNCEMENT`, `ELIMINATION_ANNOUNCEMENT`), client movement packets are ignored.

---

## 5. Authoritative Timers & Actions

1. **Timers:** The server sets `phaseStartedAt` and `phaseEndsAt` as absolute epoch timestamps. The client displays a visual countdown computed from `phaseEndsAt - Date.now()`. If a client freezes or alters their local clock, the server still terminates the phase on schedule.
2. **Vote Validation:**
   - Client sends: `CAST_VOTE { targetId }`.
   - Server validates:
     - Is the phase currently `DAY_VOTING` or `REVOTING`?
     - Is the voter alive?
     - Is the target alive?
     - Is the target an eligible candidate (e.g. In runoff)?
     - Has the voter already voted (if vote-changing is disabled)?
3. **Night Kill Validation:**
   - Client sends: `MAFIA_TARGET_VOTE { targetId }`.
   - Server validates:
     - Is the phase currently `NIGHT`?
     - Is the voter authenticated as a living Mafia member?
     - Is the target a living Citizen?

---

## 6. Disconnection & Reconnection Token Security

1. When a player connects, the server issues a cryptographically random, unguessable `reconnectionToken`.
2. If the socket drops, the player is marked `isConnected = false`, and a **60-second grace timer** begins.
3. To reconnect, the client presents the `reconnectionToken`. The server reattaches the existing `PlayerState` and socket without creating duplicate players or resetting role assignments.
4. Tokens are invalidated upon game conclusion or after the 60-second timeout expires.

