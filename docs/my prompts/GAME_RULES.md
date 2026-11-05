# MAFIA 3D — Core Game Rules & Mechanics

## 1. Status of Rules
* **Confirmed Requirements:** Player role formulas, 50% voting threshold, night plurality tie rules, victory conditions, and 60s disconnection grace window.
* **Provisional Interpretations:** Detailed resolution of the revote runoff sequence (detailed below).
* **Unresolved Product Decisions:** Consequences of permanent abandonment after the 60s disconnection timeout.

---

## 2. Room & Player Configuration

### 2.1 Minimum Player Counts
| Environment | Minimum Players | Rationale |
|---|---:|---|
| **Production** | **5** | Minimum balance for authentic deduction (e.g., 1 Mafia, 4 Citizens). |
| **Development / Testing** | **3** | Allows rapid local testing (1 Mafia, 2 Citizens) without juggling 5+ clients. |

*Safety Rule:* Development mode must be guarded by environment flags (`NODE_ENV !== "production"`) and never enabled in production.

### 2.2 Host Role & Participation
- The room creator is a normal participating player.
- The host is included in the cryptographic random role shuffle.
- The host has zero visibility into other players' secret roles.
- Room capacity is an infrastructure-configurable setting rather than an arbitrary hardcoded limit.

---

## 3. Mafia Percentage & Role Distribution

### 3.1 Distribution Formula
* **Default Mafia Percentage:** 20%
* **Configurable Range:** 10% to 30% (5% increments: 10%, 15%, 20%, 25%, 30%)
* **Mathematical Calculation:**
  $$\text{Mafia Count} = \max\left(1, \left\lfloor \frac{\text{Total Players} \times \text{Mafia Percentage}}{100} \right\rfloor\right)$$
  $$\text{Citizen Count} = \text{Total Players} - \text{Mafia Count}$$

### 3.2 Constraints & Invariants
1. There must be at least **1 Mafia** and at least **1 Citizen** in any valid game.
2. In production ($\ge 5$ players), the Mafia count must never exceed 30% of total players.
3. Cryptographically secure random assignment (`node:crypto` / Web Crypto API) ensures join order, ping, or host status cannot predict role distribution.

---

## 4. Secret Roles & Information Visibility

### 4.1 Mafia
- Knows their own role.
- Knows the identities and display names of all fellow living Mafia members.
- Has access to the private Mafia coordination panel and voice/chat channel during the `NIGHT` phase.
- **Rule on Death:** When a Mafia member is eliminated, they are immediately stripped of access to living Mafia communication and moved to dead chat.

### 4.2 Citizen
- Knows only their own Citizen role.
- Has zero access to Mafia identities, Mafia communication, or night targeting choices.

### 4.3 Role Revelation on Elimination
- **Setting:** Host-configurable (`revealRoleOnDeath: boolean`).
- **Default:** **Enabled (True)**. The public announcement explicitly states the player's true role (e.g., *"Player 3 was eliminated. They were MAFIA."*).
- **Alternative:** **Disabled (False)**. The announcement states only that the player was eliminated, keeping their role secret until the game concludes.

---

## 5. Night Actions & Collective Mafia Selection

1. During `NIGHT`, each living Mafia member submits one target vote from the pool of eligible living Citizens.
2. Mafia members cannot target themselves or fellow Mafia members.
3. **Plurality Rule:** The target receiving the highest number of Mafia votes is selected for elimination.
4. **Tie Rule:** If the highest vote count is tied between two or more targets, **nobody dies**.
5. **No Selection Rule:** If no Mafia votes are submitted before the night timer expires, **nobody dies**.
6. There is no host override, no coin toss, and no random tie-breaker.

---

## 6. Day Discussion & Public Voting

### 6.1 The 50% Threshold Requirement
A candidate is eligible for elimination **if and only if** they receive votes representing **at least 50% of all eligible living players**.
$$\text{Vote Percentage} = \frac{\text{Votes Received}}{\text{Eligible Living Voters}} \ge 0.50$$

- The denominator is strictly the count of **all living players eligible to vote**, NOT the number of submitted ballots.
- Abstentions or missing votes do NOT lower the threshold.
- Exactly 50% meets the threshold.

*Examples:*
- 10 living players: Candidate needs $\ge 5$ votes.
- 8 living players: Candidate needs $\ge 4$ votes.
- 7 living players: Candidate needs $\ge 4$ votes ($\lceil 7 \times 0.5 \rceil = 4$).
- 6 living players: Candidate needs $\ge 3$ votes.

### 6.2 Revoting & Runoff Mechanics

#### Conflict Identification
The project requirements specify both "unlimited revoting until someone is eliminated" and "if revote fails to eliminate, nobody dies and next night begins."

#### Provisional Implementation Interpretation
To maintain deterministic, non-looping gameplay without deadlocks:
1. **First Vote Round:**
   - If a candidate receives $\ge 50\%$, they are eliminated immediately.
   - If a single candidate has the most votes but $< 50\%$, **no runoff occurs**; the day ends without elimination, and the game proceeds to `NIGHT`.
   - If two or more candidates tie for the highest vote count, a **runoff revote** is triggered exclusively between those tied candidates.
2. **Runoff Round:**
   - Only living players can vote, and votes may only be cast for the tied runoff candidates.
   - If a runoff candidate achieves $\ge 50\%$ of all eligible living players, they are eliminated.
   - If a tie persists, another runoff may occur up to the configured `maxRevotes` (default: 1).
   - If no candidate achieves $\ge 50\%$ after the runoff, **nobody is eliminated**, and the game transitions directly to `NIGHT`.

---

## 7. Disconnection and Reconnection Rules

1. When a player disconnects, they are flagged as `disconnected`, but are **NOT eliminated**.
2. A **60-second grace window** starts.
3. If the player reconnects within 60 seconds with their session token, their state, role, and socket association are restored without duplicating player instances.
4. If a player remains disconnected when voting or night timers expire, their vote is treated as an abstention.
5. If the 60-second window expires, the consequence (forfeit/elimination vs bot/afk) is governed by the room abandonment setting.

---

## 8. Victory Conditions

The server evaluates victory conditions after every elimination (Night kill, Day vote, or abandonment):

### 8.1 Citizen Victory
$$\text{Living Mafia Count} = 0$$
Citizens win immediately when the last Mafia member is eliminated.

### 8.2 Mafia Victory
$$\text{Living Mafia Count} \ge \text{Living Citizen Count}$$
Mafia wins immediately when living Mafia achieve numerical parity or a majority over living Citizens, as Citizens can no longer mathematically reach a 50% majority in public voting.

