# Mafia Game — Implementation of Audit Findings and Missing Features

You have already received my original Mafia gameplay requirements and have conducted a complete implementation audit of the existing codebase.

I am now providing the audit report containing the discrepancies, missing features, partially implemented features, and architectural issues.

**Your task is to implement the identified gaps and correct the existing behavior so that the application follows my original Mafia gameplay requirements.**

This is an implementation task, not another audit.

## 1. First Understand the Existing Implementation

Before modifying anything:

- Read the original Mafia gameplay requirements.
- Read the complete audit report.
- Inspect the relevant frontend, backend, game state machine, networking, database models, APIs, and existing tests.
- Understand the current architecture and how the existing features communicate.
- Identify dependencies between the features being modified.

Do not blindly rewrite existing modules or replace working functionality.

## 2. Implement the Following Changes

### A. Unified Day Discussion and Voting Timer — Highest Priority

Currently, the game has two separate sequential phases:

- DAY_DISCUSSION: Discussion timer.
- DAY_VOTING: Separate voting timer.

This contradicts my requirements.

**Required implementation:**

- Combine discussion and public voting into one shared day phase.
- Use a single configurable day timer.
- All living players must be able to discuss and vote simultaneously.
- Players must be able to change their votes before the timer expires, if supported by the existing voting rules.
- Remove the separate voting countdown.
- When the shared timer expires, the server must resolve the votes and proceed automatically.
- Preserve the existing voting threshold, tally, and runoff behavior wherever possible.
- Ensure runoff handling does not introduce another independent day timer.
- Make the server authoritative for the timer and voting deadline.

Update the frontend, backend, state machine, and relevant tests.

### B. Private Mafia Text Chat

Currently, only the public chat exists. Mafia members can see each other's night ballots, but cannot privately communicate through text chat.

Implement two distinct chat channels:

**1. Main/Public Chat**
- Contains all players, including Mafia and Citizens.
- Everyone can communicate through this chat.
- No player role should be exposed.

**2. Private Mafia Chat**
- Contains all living Mafia members.
- Automatically includes every Mafia member, regardless of whether there are 2, 3, 4, or more Mafia players.
- Mafia members can communicate privately.
- Citizens must never be able to access or retrieve Mafia messages.
- Dead Mafia members must lose access according to the living/dead communication rules.

Important security requirements:
- Implement actual backend channel authorization.
- Validate sender identity and role on the server.
- Prevent unauthorized API requests and modified clients from retrieving Mafia messages.
- Do not rely on frontend visibility or hidden chat tabs for security.

Do not create a separate Citizen chat.

### C. Host-Controlled Mafia Assignment

Currently, Mafia assignment is random only.

Implement both assignment methods:

**Random Assignment**
- Preserve the existing cryptographically secure random assignment.

**Manual Assignment**
- Allow the host to select specific players as Mafia before starting the game.
- Automatically assign all remaining players as Citizens.
- Validate that the selected Mafia count exactly matches the configured count.
- Prevent duplicate assignments and invalid selections.
- Only allow the host to perform this operation.
- Do not allow role changes after the game starts.

The server must validate and authorize all manual assignments.

### D. Exact Mafia Count Configuration

Currently, the host configures Mafia using a percentage rather than an exact number.

Improve the configuration so the host can specify the actual Mafia count.

For example:
- 10 players → 3 Mafia → 7 Citizens.
- 12 players → 4 Mafia → 8 Citizens.

Requirements:
- Host can configure the exact number of Mafia.
- Validate the number against total player capacity and existing game-size constraints.
- Preserve existing percentage-based behavior only if needed for backward compatibility.
- Ensure both random and manual assignment use the same configured Mafia count.

### E. Private Mafia Voice Communication at Night

Currently, the WebRTC implementation uses spatial proximity. Mafia and Citizens may potentially hear each other during the night.

Correct this.

Requirements:
- During the day, all living players can communicate through the public voice channel.
- During the night, living Mafia members must have a private voice communication channel.
- Citizens must not hear Mafia conversations.
- Mafia must not hear Citizens through the private night channel.
- Dead players must not communicate with living players.
- Enforce these restrictions through actual audio/network permissions, not merely UI controls.
- Preserve existing microphone controls, mute functionality, speaking indicators, and reconnect behavior.

Inspect the current WebRTC architecture before deciding how to implement channel isolation.

### F. Persistent Role Indicator

Currently, the role indicator exists but is small and disappears on mobile.

Improve it.

Requirements:
- Every player must always be able to see their own role.
- Display a prominent indicator such as:
  - "You are Mafia"
  - "You are Citizen"
- Keep it visible throughout the active game.
- Support desktop, tablet, and mobile layouts.
- Make it visible even when the player is interacting with the 3D game environment.
- Never expose another player's role.
- Get the role from the authoritative private game state.

Do not compromise role privacy to implement this feature.

## 3. Preserve Existing Working Functionality

The audit identified several features that are already implemented correctly.

Do not break or unnecessarily rewrite:

- Random Mafia assignment.
- Secret role storage and privacy.
- Mafia teammate visibility.
- Night target selection and voting.
- Server-authoritative night timer.
- Morning announcements.
- Existing public voting threshold and tally rules.
- Player elimination.
- Role reveal configuration.
- Automatic night/day transitions.
- Reconnection handling.
- Existing victory conditions.
- Server-side game validation.
- Public chat functionality.
- Existing WebRTC microphone and speaking indicators.

Improve these systems only when necessary to support the new requirements.

## 4. Additional Gameplay Rules and Scope Restrictions

The audit also identified several optional gameplay mechanics:

- Doctor / Medic.
- Detective / Inspector.
- Godfather.
- Vigilante.
- Night 0.
- Mafia friendly fire.
- Dead-player chat.
- Dead-player voice channel.
- Last words and defense phase.
- Abstain / No Lynch voting.

**Do not implement these additional roles or gameplay mechanics in this task.**

They are not part of my current two-role Mafia/Citizen game unless explicitly required by the original gameplay specification.

Preserve existing behavior for these areas rather than introducing new rules.

In particular, do not silently change voting thresholds, tie-breaking, role-reveal behavior, or victory conditions.

## 5. Security and Multiplayer Requirements

All new and modified functionality must follow the existing authoritative server architecture.

Verify that:

- Citizens cannot retrieve Mafia chat messages.
- Citizens cannot join the Mafia voice channel.
- Players cannot change their own roles.
- Non-hosts cannot manually assign Mafia.
- Dead players cannot vote or select night targets.
- Players cannot submit votes or actions after the deadline.
- Players cannot bypass phase restrictions through modified clients.
- Reconnecting players receive the correct private role and chat permissions.
- Public game state never exposes secret role information.

## 6. Testing Requirements

Implement or update automated tests wherever applicable.

Test at least the following scenarios:

**Scenario 1: Ten-player game**
- 10 players.
- 3 Mafia.
- 7 Citizens.
- Random assignment.

**Scenario 2: Manual assignment**
- Host selects 3 specific Mafia players.
- Remaining 7 become Citizens.
- Unauthorized manual assignment is rejected.

**Scenario 3: Private communication**
- All 3 Mafia members can communicate privately.
- Citizens cannot read or send Mafia messages.
- Public chat remains accessible to everyone eligible.

**Scenario 4: Voice communication**
- Daytime voice communication works for all living players.
- Nighttime Mafia communication is isolated.
- Citizens cannot hear Mafia conversations.

**Scenario 5: Unified day timer**
- Day timer starts.
- Discussion and voting are simultaneously available.
- Players can change votes before expiration.
- Votes are resolved automatically when the timer expires.
- No separate voting timer is started.

**Scenario 6: Role indicator**
- Mafia sees "You are Mafia".
- Citizens see "You are Citizen".
- Indicator remains visible on desktop and mobile.
- No other player's role is exposed.

**Scenario 7: Complete multiplayer cycle**
- Start the game.
- Complete Mafia night selection.
- Display the morning announcement.
- Complete unified day discussion and voting.
- Eliminate a player.
- Automatically transition to the next night.
- Continue until the existing victory condition is reached.

Test unauthorized API requests, reconnects, timer boundaries, and multiple simultaneous clients wherever possible.

Do not claim a feature is tested if it was only inspected in code.

## 7. Implementation Quality

- Follow the existing project architecture and coding conventions.
- Reuse existing components and utilities where appropriate.
- Avoid unnecessary dependencies.
- Avoid duplicating game logic between frontend and backend.
- Keep server-side validation authoritative.
- Maintain backward compatibility where practical.
- Ensure the UI works on desktop and mobile.
- Update relevant types, schemas, APIs, and tests.
- Do not leave placeholder implementations or UI-only features.

## 8. Final Deliverable

After implementation, provide a report containing:

1. **Implemented Changes:** Every feature modified or added.
2. **Files Modified:** List the relevant files and explain the changes.
3. **Backend Changes:** APIs, server validation, state machine, networking, and database changes.
4. **Frontend Changes:** Chat UI, role indicator, lobby configuration, and game interface.
5. **Security Verification:** Explain how role privacy, Mafia chat isolation, and voice restrictions are enforced.
6. **Testing Results:** Which tests passed, failed, or could not be performed.
7. **Remaining Issues:** Any incomplete functionality or architectural limitations.
8. **Final Status:** Whether the original Mafia gameplay requirements are now satisfied.

### Final Instructions

This time, actually implement the changes in the repository.

Do not simply provide an implementation plan or another audit report.

Prioritize correctness, multiplayer synchronization, server-side security, and preserving existing working functionality.

Do not introduce unrelated features or redesign the entire application.

**The final application should follow the original Mafia gameplay requirements together with the additional requirements specified in this prompt.**