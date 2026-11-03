# MAFIA 3D — Open & Unresolved Product Decisions

This document tracks unresolved product and gameplay questions. Each item includes the context, available options, and the recommended engineering default so implementation is never blocked.

---

## 1. Disconnection Timeout Consequence (Post-60s Abandonment)

* **Context:** A disconnected player has a 60-second window to reconnect. What occurs if the 60 seconds expire without reconnection?
* **Available Options:**
  1. **Immediate Elimination:** The player is authoritatively marked dead (`eliminationCause: DISCONNECTED`), triggering a public announcement and a victory condition check.
  2. **Frozen / Inactive:** The player remains alive but cannot vote or perform night kills, continuing to count toward the living player denominator.
  3. **Room Cancellation:** If player count drops below minimum, abort the match.
* **Engineering Recommendation:** **Option 1 (Immediate Elimination).**
* **Rationale:** In social deduction games, a permanently missing player who cannot be eliminated ruins voting mathematics and stalls the game.
* **Status:** Open for final product confirmation. Defaulting to Option 1 in the logic engine.

---

## 2. Revoting Loop Cap vs Unlimited Revotes

* **Context:** The requirement mentions unlimited revotes until someone is eliminated, but also mentions proceeding to night if a revote fails.
* **Available Options:**
  1. **Configurable Cap (Default: 1 Runoff):** Day vote $\rightarrow$ if tie $\rightarrow$ 1 Runoff $\rightarrow$ if still no one $\ge 50\% \rightarrow$ Night.
  2. **Strict Loop (True Unlimited):** Revote repeats continuously until players coalesce on a candidate with $\ge 50\%$.
* **Engineering Recommendation:** **Option 1 (Default: 1 Runoff).**
* **Rationale:** True unlimited revotes risk infinite deadlocks if two stubborn factions refuse to change their ballots, leading to player frustration and game abandonment.
* **Status:** Governed by configurable `maxRevotes` (default: 1).

---

## 3. Maximum Room Capacity Infrastructure Limit

* **Context:** Room capacity is an infrastructure setting rather than a hardcoded game rule.
* **Available Options:**
  1. 10 players maximum.
  2. 16 players maximum.
  3. 24 players maximum.
* **Engineering Recommendation:** **16 players.**
* **Rationale:** 16 players allows large friend groups while maintaining clean low-poly draw calls, sub-50ms network payloads, and coherent voice discussions.
* **Status:** Open for infrastructure capacity scaling.

---

## 4. Dead-Player Voice Channel vs Text-Only Dead Chat

* **Context:** Dead players are isolated from living communication. Should dead players have a dedicated WebRTC voice channel, or text-only chat?
* **Available Options:**
  1. Dedicated `room-{code}-dead` WebRTC voice channel + text chat.
  2. Text-only dead chat (zero voice bandwidth).
* **Engineering Recommendation:** **Option 1 (Voice + Text for dead players).**
* **Rationale:** Watching friends play while chatting in spectator "ghost chat" is one of the most entertaining aspects of Among Us and Mafia.
* **Status:** Targeted for Milestone 4 (Voice implementation).

