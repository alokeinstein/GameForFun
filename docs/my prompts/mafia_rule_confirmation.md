# Mafia Game — Gameplay Rules & Implementation Audit

## Objective

I want you to conduct a thorough audit of the existing Mafia game implementation.

Your task is to verify whether the game follows the rules described below.

**IMPORTANT: This is an audit task, not an implementation task.**

- Do not modify code.
- Do not add new features.
- Do not change existing game logic.
- Do not assume that a feature exists just because a UI element is present.
- Inspect the actual frontend, backend, game state machine, networking, database models, APIs, and server-side validation.
- Verify whether each feature genuinely works.
- If something is only partially implemented, explain exactly what is missing.
- If something is not implemented, clearly mark it as missing.

The goal is to understand how closely the current Mafia game matches the actual gameplay rules.

---

# 1. Player Count and Mafia Configuration

Example game:

- Total players: 10
- Mafia: 3
- Citizens: 7

The numbers above are examples. They must be configurable.

The game should support configurable Mafia and Citizen counts, subject to valid game-size rules.

### Mafia assignment methods

The game should support two possible assignment methods:

**Method A — Random assignment**
- The game randomly selects the configured number of Mafia players.
- For example, with 10 players and 3 Mafia, the game randomly selects 3 players.
- Every other player becomes a Citizen.

**Method B — Host-controlled assignment**
- The host can manually select which players will become Mafia.
- The remaining players automatically become Citizens.
- The selected number of Mafia must respect the configured Mafia count.

Audit whether both methods exist and whether the assignment is validated by the server.

Also verify:
- Whether duplicate assignments are prevented.
- Whether the Mafia count is correct.
- Whether all players receive exactly one role.
- Whether role assignment happens only when the game starts.
- Whether a player can change their role through client manipulation or API requests.

# 2. Secret Roles and Role Privacy

There are only two roles in this basic version:

1. Mafia
2. Citizen

### Role visibility rules

- Every player must know their own role.
- Mafia players must know who their fellow Mafia members are.
- Citizens must know that they are Citizens.
- Citizens must not know who the Mafia players are.
- Mafia players must not have access to Citizen-only or other unauthorized information.

Most importantly:

**Nobody should be able to publicly see another player's role during the game.**

For example:
- A player cannot open a player profile and see whether that person is Mafia.
- The public player list must not expose roles.
- The game UI must not reveal roles through labels, colors, icons, API responses, or network messages.
- Browser developer tools must not expose unauthorized roles through publicly synchronized game state.

Players must convince each other through conversation.

A Citizen can claim to be Mafia. A Mafia player can claim to be a Citizen. The game must not automatically reveal whether someone is telling the truth.

Audit both frontend visibility and backend information security.

# 3. Voice Chat / Microphone Feature

Voice communication is an important part of this game.

Players need to speak to each other just as they would when playing Mafia on Google Meet.

Audit whether the game has a working microphone and voice communication system.

Verify:

- Players can enable and disable their microphones.
- Players can hear other eligible players.
- Microphone permissions are handled correctly.
- Players can see who is speaking.
- Muted players cannot transmit voice.
- Audio is synchronized appropriately with the game phase.
- Reconnecting players can restore their voice connection.

### Voice communication rules

During the discussion phase:
- All living players should be able to communicate with each other.
- Mafia players should be able to pretend to be Citizens.
- Citizens should be able to question and accuse other players.

During the night:
- Living Citizens must not hear or communicate with Mafia players through a private Mafia channel.
- Mafia members should have a private communication channel to coordinate their kill selection, if the game supports this feature.

After elimination:
- Eliminated players must not communicate with living players through the living-player voice channel.
- If dead-player communication exists, it must remain isolated from living players.

Check whether these restrictions are enforced by the actual voice infrastructure and server-side permissions, not just by hiding microphone buttons.

Report whether the voice system is:
- Fully implemented and working.
- Partially implemented.
- UI-only.
- Missing.

# 4. Night Phase — Mafia Selects a Victim

After the game starts, the first night begins.

The Mafia players must secretly decide which player they want to eliminate.

Example:
- There are 10 players.
- Three players are Mafia.
- All three Mafia players can see their Mafia teammates.
- They discuss who should be killed.
- They select one living player as their target.

### Mafia selection rules

- Every living Mafia member should be able to select a target.
- Mafia members should be able to change their selection before the night timer expires.
- The game should collect their selections.
- The game should determine the final target according to the existing Mafia voting rules.
- Dead players must not be selectable.
- Mafia players must not be able to select themselves or another invalid target.
- Citizens must not be able to submit Mafia kill selections.

The final selection must be determined by server-side game logic.

Do not assume that the game is working just because the Mafia selection UI appears.

Inspect how votes are collected, stored, validated, and resolved.

# 5. Configurable Timers — Very Important

I do not want a separate timer for discussion and voting.

I want the entire phase to operate within one configurable timer.

The host should be able to configure the duration of different phases.

For example:

| Phase | Example duration |
|---|---:|
| Mafia night discussion and selection | 40 seconds |
| Morning announcement | Configurable |
| Day discussion and public voting | 40 seconds |

These are example values, not mandatory hardcoded values.

### Night timer behavior

When the night begins:

1. The night timer starts automatically.
2. Mafia players can discuss and select their target during the same timer.
3. Mafia players can change their selections while the timer is running.
4. There must not be an additional voting timer after the discussion timer.
5. When the timer expires, the server resolves the Mafia selections.
6. The selected victim is eliminated according to the game rules.
7. The city wakes up and receives the morning announcement.

### Day timer behavior

When the city wakes up:

1. The game announces who was killed during the night.
2. The day discussion timer starts.
3. All living players can discuss the situation.
4. Every living player can vote for the person they suspect of being Mafia while the SAME timer is running.
5. Players can change their votes before the timer expires, if this is supported by the current rules.
6. There must not be a separate 30-second voting timer after the discussion.
7. When the timer expires, the server resolves the public votes.
8. The game announces the result and proceeds to the next phase.

The host should be able to configure the duration of the night and day phases independently.

For example, the host could configure:
- Night: 50 seconds.
- Day: 40 seconds.

The system must use the configured values rather than hardcoded durations.

### Timer correctness

Verify:
- Timers are controlled by authoritative server time.
- All players see approximately the same remaining time.
- A player cannot extend the timer by changing their device clock.
- Refreshing the browser does not reset the timer.
- Reconnecting does not restart the phase.
- Votes and selections submitted after the deadline are rejected.
- The phase changes automatically when the timer expires.
- The timer does not continue running after the phase has ended.

# 6. Morning Announcement

When the night ends:

- The city wakes up.
- The game announces the person killed by the Mafia.
- The victim is marked as eliminated.
- All living players can see the announcement.
- The eliminated player's role should remain hidden unless the configured role-reveal setting allows it.

If the Mafia did not successfully select a valid victim, the game should handle that according to the existing rules.

Audit whether this announcement is actually synchronized across all connected clients.

# 7. Day Discussion and Public Voting

This is the most important social-deduction part of the game.

After the morning announcement, everyone discusses who they believe is Mafia.

### Important gameplay behavior

- Citizens can accuse Mafia players.
- Mafia players can accuse Citizens.
- Mafia players can pretend to be Citizens.
- Mafia players can convince Citizens to vote against another Citizen.
- Citizens can successfully eliminate another Citizen by mistake.
- Citizens can identify Mafia players and vote to eliminate them.

There should be no automatic indication that a player is lying.

### Public voting rules

- Every living player participates in the public voting phase.
- Mafia players also vote.
- Citizens also vote.
- Every player can vote for one eligible living player.
- A player must not be able to vote multiple times simultaneously.
- A player must not vote for themselves if self-voting is not allowed by the current rules.
- The server must validate all votes.

The voting should happen during the day discussion timer itself.

**There must not be an independent voting timer.**

When the day timer expires:
- Resolve the votes.
- Determine the candidate to eliminate according to the configured voting rules.
- Announce the result.
- Eliminate the selected player if the voting rules are satisfied.
- Continue to the next game phase.

Do not invent or silently change vote thresholds, tie-breaking rules, or revoting behavior. Inspect the existing implementation and report exactly what it currently does.

# 8. Repeating the Game Cycle

After the day voting and elimination process, the game should continue.

The basic cycle is:

1. Night begins.
2. Mafia discuss and select a victim within the night timer.
3. Night timer expires.
4. Server resolves the Mafia selection.
5. City wakes up.
6. Morning announcement appears.
7. Day discussion and public voting happen within one shared timer.
8. Day timer expires.
9. Server resolves public voting.
10. The eliminated player is announced.
11. The game checks whether the match has ended.
12. If the game is not over, the next night begins.

This cycle continues until the game's victory condition is reached.

Audit whether the existing game state machine follows this cycle correctly.

# 9. Eliminated Players

When a player dies:

- They must be marked as eliminated.
- They must no longer participate in living-player Mafia voting.
- They must not submit night kill selections.
- They must not submit public votes.
- They must not influence the living game through voice communication.
- Their role visibility must follow the configured reveal rules.

If a dead-player chat or voice channel exists, verify that it is isolated from living players.

# 10. Host Controls

The host should be able to configure the game before starting it.

Audit whether the host can configure:

- Total player capacity, within supported infrastructure limits.
- Number of Mafia players.
- Random or manual Mafia assignment.
- Night duration.
- Day discussion and voting duration.
- Role reveal settings, if implemented.

The host should not automatically receive secret gameplay information merely because they created the room.

If the host manually assigns Mafia players, document what role information the host can see and whether this affects fairness.

# 11. Backend and Multiplayer Security Audit

Do not only inspect the UI.

Verify that all important actions are validated by the authoritative game server.

Check:

- Role assignment.
- Role privacy.
- Mafia target selection.
- Public voting.
- Player elimination.
- Timer expiration.
- Phase transitions.
- Dead-player restrictions.
- Voice permissions.
- Reconnection behavior.

A modified browser client must not be able to:
- Change its own role.
- Read another player's secret role.
- Submit votes as another player.
- Submit Mafia selections as a Citizen.
- Vote after elimination.
- Kill a player without valid Mafia authorization.
- Submit actions after a phase deadline.
- Change the server's timer.

# 12. Required Audit and Testing

Perform a complete code audit and, wherever possible, test the game using multiple browser clients.

Use this example test scenario:

- 10 players.
- 3 Mafia.
- 7 Citizens.
- Random assignment.
- Night timer: 40 seconds.
- Day timer: 40 seconds.

Test the following:

1. Start a game with 10 players.
2. Confirm exactly 3 players become Mafia.
3. Confirm all 3 Mafia members know each other.
4. Confirm Citizens only know their own roles.
5. Confirm unauthorized clients cannot retrieve secret roles.
6. Confirm Mafia can select a victim during the night timer.
7. Confirm Mafia selections are resolved when the timer expires.
8. Confirm the morning announcement appears for all living players.
9. Confirm everyone can discuss and vote during the same day timer.
10. Confirm Mafia can vote like Citizens.
11. Confirm a Citizen can be eliminated through public voting.
12. Confirm a Mafia player can be eliminated through public voting.
13. Confirm eliminated players cannot vote or submit kill selections.
14. Confirm the game moves into the next night automatically.
15. Confirm voice communication follows phase and alive/dead restrictions.
16. Confirm reconnecting does not reset the timer or reveal secret information.

If multiple real browser clients are unavailable, clearly state which tests were not performed. Do not claim that multiplayer functionality works without testing it.

---

# 13. Final Deliverable — Implementation Audit Report

After the investigation, provide a detailed report using this structure.

## A. Overall Status

Give an honest assessment of how much of the requested Mafia gameplay is implemented.

## B. Feature-by-Feature Audit

Use this table:

| Feature | Status | Evidence / Relevant Files | Missing or Incorrect Behavior |
|---|---|---|---|
| Configurable Mafia count | Implemented / Partial / Missing | File references | Explanation |
| Random Mafia assignment | | | |
| Host-controlled Mafia assignment | | | |
| Secret role visibility | | | |
| Mafia teammate visibility | | | |
| Voice chat | | | |
| Private Mafia communication | | | |
| Night target selection | | | |
| Configurable night timer | | | |
| Day discussion and voting timer | | | |
| Voting during discussion | | | |
| Morning announcement | | | |
| Public voting | | | |
| Player elimination | | | |
| Dead-player restrictions | | | |
| Role reveal configuration | | | |
| Automatic phase transitions | | | |
| Reconnection handling | | | |
| Server-side validation | | | |

Use these status definitions:

- **Implemented:** Fully implemented and verified.
- **Partially Implemented:** Some functionality exists, but important requirements are missing.
- **Missing:** No meaningful implementation exists.
- **Not Verified:** The code suggests it exists, but it could not be tested.
- **Incorrect:** Existing behavior contradicts the requested rules.

## C. Critical Bugs and Security Issues

List any bugs, vulnerabilities, incorrect game transitions, role leaks, timer problems, or multiplayer synchronization problems.

Prioritize them:
- Critical
- High
- Medium
- Low

## D. Current Game Flow

Describe the actual current game flow from room creation to match completion.

Do not describe the intended flow here. Describe what the code currently implements.

## E. Gap Analysis

List everything that needs to be implemented or corrected to make the current game follow the requested rules.

Separate:
1. Missing functionality.
2. Incorrect existing functionality.
3. Security issues.
4. UI/UX issues.
5. Voice and networking issues.

## F. Recommended Implementation Order

Provide a phased implementation plan, ordered by dependencies and importance.

Do not implement anything yet.

## G. Final Conclusion

Answer these questions directly:

1. Can I currently play a complete 10-player Mafia game with 3 Mafia?
2. Can the host configure Mafia count?
3. Can the host manually assign Mafia?
4. Can the game randomly assign Mafia?
5. Are roles genuinely private?
6. Can players communicate through voice?
7. Can Mafia members privately coordinate?
8. Can Mafia select their victim within one night timer?
9. Can everyone discuss and vote within one shared day timer?
10. Does the game automatically repeat the night/day cycle?
11. Is the game secure against client-side manipulation?
12. What are the five most important missing things?

Be specific. Do not give me a generic summary.

**Final instruction: Do not modify the repository during this audit. First tell me what already exists, what works, what does not work, and what needs to be built.**
















## Additional Requirement — Chat System and Role Indicator

### 1. Public / Main Chat

There should be one main group chat containing **all players**:
- Mafia
- Citizens
- Any other active players

Everyone can chat in this group.

The main chat must **not reveal player roles**. Players should not be able to determine who is Mafia or Citizen from the chat UI, player list, API responses, or other client-side data.

### 2. Private Mafia Chat

There should be a separate **private Mafia-only group chat**.

- If there are 3 Mafia players, all 3 Mafia players are members of this chat.
- If there are 4 Mafia players, all 4 Mafia players are members.
- The number of members must dynamically match the number of Mafia players in the current game.
- Only living Mafia players should have access to this private Mafia chat, according to the game's alive/dead rules.
- Citizens must not be able to access, read, send messages to, or retrieve messages from the Mafia chat.
- Mafia players can use this chat to privately coordinate during the appropriate game phases.
- The backend must enforce access control; simply hiding the Mafia chat from Citizens in the UI is not sufficient.

Audit whether the private Mafia chat is actually isolated at the networking/API/backend level and whether a modified client can retrieve Mafia chat messages.

### 3. No Separate Citizen Chat

There should **not** be a separate Citizen-only chat.

Citizens communicate through the main public chat, which contains all players, including Mafia.

### 4. Persistent Role Indicator

While playing the game, every player should have a clearly visible role indicator somewhere in the game UI, preferably in the navbar/header or another persistent location.

Examples:
- **You are Mafia**
- **You are Citizen**

This indicator is only for the current player's own role.

It must:
- Remain visible throughout the game so players do not forget their role.
- Never expose another player's role.
- Correctly update according to the player's assigned role.
- Be sourced securely from the authoritative game state and not be editable by the client.

Audit whether this role indicator exists and whether it correctly respects the role-privacy requirements.