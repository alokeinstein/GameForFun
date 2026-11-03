# MAFIA 3D — Authoritative Game State Machine

## 1. Overview
The game lifecycle is governed by a strict, server-authoritative finite state machine (FSM). Clients receive phase information through synchronized room schema fields (`phase`, `phaseStartedAt`, `phaseEndsAt`) and render appropriate UI/3D controls. Clients have zero authority to force phase transitions.

```
                           +----------------------+
                           | WAITING_FOR_PLAYERS  | <-------------------+
                           +----------+-----------+                     |
                                      | Host clicks Start               |
                                      v                                 |
                           +----------------------+                     |
                           |   ROLE_ASSIGNMENT    |                     |
                           +----------+-----------+                     |
                                      | Timer: 5s                       |
                                      v                                 |
                        +-----------> NIGHT                             |
                        |               | Timer: 30s                    |
                        |               v                               |
                        |     MORNING_ANNOUNCEMENT                      |
                        |               | Timer: 10s                    |
                        |               v                               |
                        |       [Victory Checked]                       |
                        |          /        \                           |
                        |     (Game Over)  (Continues)                  |
                        |         /            \                        |
                        |        v              v                       |
                        |     VICTORY     DAY_DISCUSSION                |
                        |                       | Timer: 120s           |
                        |                       v                       |
                        |                  DAY_VOTING                   |
                        |                       | Timer: 30s            |
                        |                       v                       |
                        |             [Evaluate 50% Rule]               |
                        |               /    |     \                    |
                        |  (Tied Runoff)     |      (No One >= 50%)     |
                        |       /            |              \           |
                        |      v             v               v          |
                        |   REVOTING    ELIMINATION_    [Direct to Night|
                        |     | Timer:  ANNOUNCEMENT     No Elimination]|
                        |     \  20s         | Timer: 8s     |          |
                        |      \             v               |          |
                        |       +---> [Victory Checked]      |          |
                        |                /        \          |          |
                        |           (Victors)  (Continues)   |          |
                        |               /            \       |          |
                        |              v              +------+          |
                        +--------- VICTORY                   |          |
                                                             +----------+
```

---

## 2. Phase Detailed Specifications

### Phase 1: `WAITING_FOR_PLAYERS` (Lobby)
* **Entry:** Room is created by host.
* **Duration:** Unlimited.
* **Server Responsibilities:**
  * Validate player connection and unique nickname in room.
  * Update connected players count and host status.
  * Listen for host setting changes (Mafia %, timers, role reveal toggle).
* **Allowed Actions:** Join, leave, change cosmetic avatar, toggle ready, update room settings (host only), start game (host only, $\ge \text{Min Players}$).
* **Disallowed Actions:** Moving 3D character, voting, night targeting, voice communication.
* **Exit Trigger:** Host initiates `startGame` with valid player count.

### Phase 2: `ROLE_ASSIGNMENT`
* **Entry:** Host starts game.
* **Duration:** 5 seconds.
* **Server Responsibilities:**
  * Execute cryptographic role distribution formula.
  * Assign roles to player session entities in private server memory.
  * Dispatch targeted direct messages (`ROLE_INFO`) to individual clients.
  * Set `phaseStartedAt = now`, `phaseEndsAt = now + 5000ms`.
* **Allowed Actions:** Acknowledge role modal.
* **Disallowed Actions:** Public chat, movement, voting.
* **Exit Trigger:** Timer reaches `phaseEndsAt`.

### Phase 3: `NIGHT`
* **Entry:** Following `ROLE_ASSIGNMENT` (Round 1) or following day voting/elimination.
* **Duration:** Configurable (default: 30s).
* **Server Responsibilities:**
  * Configure LiveKit permissions: open `room-{code}-mafia` voice channel to living Mafia; mute public channel.
  * Reset Mafia night ballots.
  * Accept target votes from living Mafia members.
* **Allowed Actions:** Living Mafia cast/change night target vote; living Mafia voice/text chat.
* **Disallowed Actions:** Citizens speaking/chatting; Citizens submitting targets; Mafia targeting teammates or self.
* **Exit Trigger:** Timer expires OR all living Mafia agree on a unanimous target.
* **Transition Logic:** Server tallies votes:
  * Unique plurality winner $\rightarrow$ victim assigned.
  * Tie or zero votes $\rightarrow$ no victim.
  * Transition to `MORNING_ANNOUNCEMENT`.

### Phase 4: `MORNING_ANNOUNCEMENT`
* **Entry:** Night finishes.
* **Duration:** Configurable (default: 10s).
* **Server Responsibilities:**
  * If victim exists: mark victim `isAlive = false`, record elimination in match history, trigger tombstone/elimination visual state.
  * Broadcast public announcement event (`"Player X was killed during the night."` or `"Nobody died during the night."`).
  * Check victory conditions.
* **Allowed Actions:** View announcement, observe camera pan to victim.
* **Disallowed Actions:** Movement, voting, open voice discussion.
* **Exit Trigger:** Timer expires.
  * If victory met $\rightarrow$ `VICTORY`.
  * Else $\rightarrow$ `DAY_DISCUSSION`.

### Phase 5: `DAY_DISCUSSION`
* **Entry:** Morning concludes with active match.
* **Duration:** Configurable (default: 120s).
* **Server Responsibilities:**
  * Grant public voice channel access to all living players.
  * Validate 3D movement bounds and speed at 20Hz.
* **Allowed Actions:** 3D character movement, jumping, gestures, public voice and text chat.
* **Disallowed Actions:** Voting, night kills. Dead players cannot speak to living players.
* **Exit Trigger:** Timer reaches `phaseEndsAt`. Transition to `DAY_VOTING`.

### Phase 6: `DAY_VOTING`
* **Entry:** Discussion timer finishes.
* **Duration:** Configurable (default: 30s).
* **Server Responsibilities:**
  * Accept votes cast by living players targeting other living players.
  * Validate voter is alive, target is alive, and no self-vote (unless enabled).
  * Keep vote ballots private until phase end.
* **Allowed Actions:** Cast ballot for one eligible candidate.
* **Disallowed Actions:** Dead players voting; voting for eliminated players; changing vote if `allowVoteChanging` is disabled.
* **Exit Trigger:** Timer expires OR all eligible living players have voted.
* **Transition Logic:**
  * Calculate: $\text{Candidate Votes} / \text{Eligible Living Voters} \ge 0.50$.
  * If candidate meets threshold $\rightarrow$ transition to `ELIMINATION_ANNOUNCEMENT`.
  * If highest votes are tied between 2+ candidates $\rightarrow$ transition to `REVOTING`.
  * If leading candidate $< 50\%$ and no tie $\rightarrow$ **transition directly to `NIGHT` (Architectural Correction #2: no false elimination announcement).**

### Phase 7: `REVOTING` (Runoff)
* **Entry:** Day voting ended in a tie for the top vote count.
* **Duration:** Configurable (default: 20s).
* **Server Responsibilities:**
  * Restrict eligible voting targets strictly to the candidates who tied.
  * Collect runoff ballots.
* **Allowed Actions:** Living players vote for one of the tied runoff candidates.
* **Disallowed Actions:** Voting for non-tied candidates; voting by dead players.
* **Exit Trigger:** Timer expires or all living players have voted.
* **Transition Logic:**
  * If a runoff candidate receives $\ge 50\%$ $\rightarrow$ `ELIMINATION_ANNOUNCEMENT`.
  * If revote fails to achieve $\ge 50\%$ or remains tied $\rightarrow$ **transition directly to `NIGHT`**.

### Phase 8: `ELIMINATION_ANNOUNCEMENT`
* **Entry:** Candidate successfully received $\ge 50\%$ votes in voting or revoting.
* **Duration:** Configurable (default: 8s).
* **Server Responsibilities:**
  * Mark candidate `isAlive = false`.
  * If `revealRoleOnDeath` is true, broadcast candidate's true role. Otherwise broadcast identity only.
  * Revoke candidate's living voice/chat access; grant dead-chat access.
  * Evaluate victory conditions.
* **Allowed Actions:** View announcement, observe elimination animation.
* **Disallowed Actions:** Movement, voting.
* **Exit Trigger:** Timer expires.
  * If victory met $\rightarrow$ `VICTORY`.
  * Else $\rightarrow$ `NIGHT` (increment `roundNumber`).

### Phase 9: `VICTORY` / `GAME_OVER`
* **Entry:** Victory condition triggered (Citizens eliminated all Mafia, or Mafia reached parity $\ge$ Citizens).
* **Duration:** 30s or until host returns to lobby.
* **Server Responsibilities:**
  * Halt all gameplay timers.
  * Reveal complete role distribution of all players.
  * Persist match results, player survival, and statistics to PostgreSQL via Prisma.
  * Open post-game voice channel to all players (living + dead).
* **Allowed Actions:** View match statistics, chat, return to lobby (host).
* **Exit Trigger:** Host triggers return to lobby or players disconnect.
