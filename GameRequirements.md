# PROJECT MASTER PROMPT — MAFIA 3D MULTIPLAYER GAME

## 1. YOUR ROLE AND MISSION

You are an autonomous senior game engineer, multiplayer systems architect, full-stack developer, 3D game developer, UI/UX designer, database architect, and technical lead.

Your responsibility is to help design and develop a browser-based, real-time, multiplayer 3D social-deduction game called **MAFIA**.

You must approach this as a serious software product, not as a small demonstration project.

You are expected to:
- Understand the complete game concept and requirements.
- Design a maintainable and scalable architecture.
- Build the frontend, game client, multiplayer server, and supporting backend.
- Implement secure, server-authoritative game mechanics.
- Create a lightweight, optimized 3D multiplayer environment.
- Implement room creation, joining, player management, roles, Mafia communication, voting, eliminations, timers, and victory conditions.
- Build a responsive and polished user interface.
- Test game mechanics, multiplayer synchronization, edge cases, and security.
- Maintain proper documentation.

Do not sacrifice architectural quality for development speed.

Do not blindly generate the entire application in one step. Work incrementally, maintain a working codebase, and validate each development milestone.

The ultimate goal is to produce a playable, production-oriented multiplayer game that can be accessed through a web browser.

---

# 2. GAME VISION

## 2.1 Core concept

The game is a multiplayer social-deduction game inspired by traditional Mafia/Werewolf games and Among Us.

It combines:

1. Traditional Mafia gameplay and secret roles.
2. Among Us-style deception, suspicion, accusations, and eliminations.
3. Skribbl.io-style room creation and joining using room codes.
4. Deadshot.io-inspired lightweight 3D graphics and smooth browser performance.
5. GTA-like character interaction and movement, but within a small, controlled environment rather than an enormous open world.
6. Real-time voice communication.
7. Multiplayer synchronization.

Players enter a shared room, receive secret roles, interact with other players, and attempt to identify and eliminate the opposing team.

The two primary teams are:

- MAFIA
- CITIZENS

Mafia members know the identities of their Mafia teammates.

Citizens know only their own role.

Nobody should have access to other players' secret roles during normal gameplay.

## 2.2 Product philosophy

The game should be:

- Easy to join.
- Easy to understand.
- Fun with friends.
- Fast and responsive.
- Visually immersive.
- Lightweight enough for ordinary computers.
- Fair in voting and role distribution.
- Secure against clients attempting to manipulate the game.
- Designed for future expansion.

The social-deduction experience is the primary product.

The 3D environment should support and improve the social experience, not unnecessarily complicate it.

---

# 3. VISUAL DIRECTION AND GRAPHICS

## 3.1 Primary graphical reference: Deadshot.io

Use Deadshot.io as the primary reference for the graphical philosophy.

Reference:
https://deadshot.io/

The goal is to achieve a similar lightweight browser-game experience.

Important characteristics:

- Low-poly or simplified 3D models.
- Clean geometry.
- Lightweight materials.
- Optimized textures.
- Simple but attractive environments.
- Smooth player movement.
- Good frame rates.
- Fast loading.
- Minimal GPU requirements.
- Consistent visual design.

Do not reproduce Deadshot.io's copyrighted models, maps, branding, UI, textures, or proprietary assets.

Develop an original visual identity for Mafia.

## 3.2 Performance requirements

The game should run smoothly on laptops without dedicated graphics cards.

Performance is a first-class requirement.

Optimize:

- Polygon count.
- Draw calls.
- Texture resolution.
- Shader complexity.
- Lighting calculations.
- Shadow rendering.
- Animation complexity.
- Network update frequency.
- Asset loading.
- Memory consumption.

Implement quality settings:

- Low.
- Medium.
- High.

Low quality should prioritize compatibility with integrated graphics.

Avoid expensive real-time global illumination, excessive post-processing, and unnecessary high-resolution textures.

Use baked lighting or simplified lighting where appropriate.

The game should progressively load resources rather than downloading every asset before the player can enter the experience.

## 3.3 Camera perspective

Initial recommendation: third-person camera.

The player should be able to see their character while navigating the environment.

The camera should support:

- Mouse-controlled rotation.
- Smooth camera following.
- Adjustable camera distance.
- Collision-aware positioning.
- Reasonable vertical rotation limits.

Keep the camera implementation modular so first-person or alternative camera modes can be added later.

## 3.4 Environment

Build a small, explorable 3D town or village.

The environment may contain:

- Houses.
- Streets.
- Streetlights.
- Trees.
- Small buildings.
- Open public areas.
- A central meeting location.
- Designated discussion areas.
- Environmental decorations.

Do not build an enormous open world.

The initial map should be relatively small and optimized for multiplayer performance.

Create a clear and recognizable meeting area where players can gather during discussions and voting.

The map should be designed around game mechanics.

## 3.5 Characters

Every connected player should have a visible 3D character.

Character requirements:

- Walk.
- Run.
- Jump.
- Idle.
- Turn.
- Look around.
- Basic hand movements.
- Basic gestures.
- Movement animations.
- Elimination/death animation.
- Optional emotes.

Characters should be customizable in future versions.

Do not display Mafia or Citizen labels above characters.

No player should be able to identify another player's secret role through character appearance, color, clothing, animation, or other visual indicators.

All roles should use the same character appearance rules.

---

# 4. TECHNOLOGY STACK

Use a TypeScript-based monorepo.

Do not introduce unnecessary technologies without explaining why they are required.

## 4.1 Frontend

- Next.js with App Router.
- React.
- TypeScript.
- CSS or a carefully structured component styling system.
- React Three Fiber.
- Three.js.
- Zustand or another lightweight client-state solution where appropriate.

Next.js should handle:

- Landing page.
- Authentication.
- User dashboard.
- Profile.
- Room creation.
- Room joining.
- Lobby.
- Game interface.
- Settings.
- Game history.

The 3D game should be implemented as a dedicated client-side experience.

Do not attempt to render the actual 3D world through server components.

Use client components only where necessary.

## 4.2 Multiplayer backend

Use:

- Node.js.
- TypeScript.
- Colyseus.

Colyseus will manage:

- Multiplayer rooms.
- Room creation.
- Room joining.
- Player connections.
- Player synchronization.
- Game state synchronization.
- Room lifecycle.
- Server-authoritative game logic.

Use the official Colyseus documentation:
https://docs.colyseus.io/

The multiplayer server must remain independent of the Next.js frontend.

## 4.3 3D engine

Use:

- Three.js.
- React Three Fiber.
- Drei where useful.
- Rapier for physics.

Responsibilities:

- Rendering.
- Character models.
- Character movement.
- Camera controls.
- Environment.
- Animations.
- Collision detection.
- Lighting.
- Interactions.

## 4.4 Database

Use:

- PostgreSQL.
- Prisma ORM.

Persistent entities may include:

- User.
- Profile.
- GameSession.
- GamePlayer.
- GameRound.
- GameEvent.
- MatchStatistics.
- PlayerStatistics.

Keep temporary gameplay state in the multiplayer server.

Do not use the database as a replacement for real-time game-state synchronization.

## 4.5 Voice communication

Use LiveKit and WebRTC.

Official documentation:
https://docs.livekit.io/

Implement separate logical voice channels for:

1. Public discussion.
2. Private Mafia communication.
3. Optional spectator communication.

Access to voice rooms must be controlled by the server.

A Citizen must never be able to join a private Mafia voice channel.

Dead players must not be allowed to participate in living-player voice discussions.

## 4.6 Redis

Redis can be introduced for:

- Cross-server coordination.
- Temporary coordination data.
- Distributed room management.
- Scaling.
- Rate limiting where appropriate.

Do not make Redis mandatory for the first local development milestone unless the selected architecture requires it.

## 4.7 Monorepo

Use Turborepo or an equivalent TypeScript monorepo architecture.

Suggested structure:

mafia-game/
  apps/
    web/
    game-server/
  packages/
    game-client/
    shared/
    database/
    game-rules/
    ui/
  docs/
  package.json

Adjust this structure if there is a clear architectural reason.

Maintain strict separation between frontend, shared types, server logic, database access, and 3D rendering.

---

# 5. ROOM CREATION AND LOBBY SYSTEM

## 5.1 Room creation

A user should be able to create a new Mafia room.

The creator automatically becomes the host.

The host must also be an actual player in the game.

The host must not be excluded from role assignment.

For example:

Alok creates a room.

Nine friends join.

Total players: 10.

Alok is included in the random role assignment and can become either Mafia or Citizen.

The host must not automatically become a Citizen or Mafia.

The host should not receive access to hidden information simply because they created the room.

## 5.2 Room code

Each room should have a unique, easy-to-share room code.

Example:

M8K92

Users should be able to:

- Create a room.
- Copy the room code.
- Share the room code.
- Join using a room code.
- Leave a room.
- See connected players.
- See the host.
- See the player count.

Room codes must be unique while their rooms remain active.

Implement expiration and cleanup for abandoned rooms.

## 5.3 Lobby

The lobby should display:

- Room code.
- Host identity.
- Connected players.
- Player count.
- Maximum player count.
- Game settings.
- Connection status.
- Ready status if implemented.
- Start Game button.

Only the host can start the game.

The host is included in the player count and game.

## 5.4 Player management

Handle:

- Players joining.
- Players leaving.
- Duplicate connections.
- Reconnection.
- Connection interruptions.
- Host disconnection.
- Room closure.
- Minimum-player validation.

Prevent the game from starting when the configured minimum player count has not been reached.

Once a game starts, do not allow new players to join the active match by default.

They may join as spectators only if spectator joining is enabled.

---

# 6. GAME SETTINGS AND ROLE DISTRIBUTION

This is a core requirement.

## 6.1 Mafia percentage

The default Mafia percentage must be 20%.

The host can configure the percentage between:

- Minimum: 10%.
- Maximum: 30%.

Use 5-percentage-point increments initially:

10%, 15%, 20%, 25%, 30%.

The default selection is 20%.

Never permit a percentage below 10% or above 30%.

## 6.2 Role distribution formula

Use:

Mafia Count = floor(Total Players × Mafia Percentage / 100)

Citizen Count = Total Players − Mafia Count

However, account for small-player-count edge cases.

There must be at least one Mafia and at least one Citizen in a valid game.

Therefore:

- Minimum Mafia count: 1.
- Maximum Mafia count: Total Players − 1.
- The maximum Mafia percentage remains 30%.

If rounding would otherwise produce zero Mafia members, use one Mafia member, subject to minimum player requirements.

Examples:

10 players, 20% Mafia:

- 2 Mafia.
- 8 Citizens.

15 players, 20% Mafia:

- 3 Mafia.
- 12 Citizens.

20 players, 20% Mafia:

- 4 Mafia.
- 16 Citizens.

10 players, 30% Mafia:

- 3 Mafia.
- 7 Citizens.

5 players, 10% Mafia:

- 1 Mafia.
- 4 Citizens.

The server must calculate the actual distribution.

Never trust a client-submitted role count.

## 6.3 Manual Mafia count

The host may also be given an exact Mafia count configuration.

If manual count mode is implemented:

- The count must remain within the 10–30% allowed range, subject to the minimum-one-Mafia rounding exception.
- At least one Citizen must remain.
- The server validates the count.
- The UI must clearly display the resulting Citizen count.

Percentage mode should remain the default.

## 6.4 Random assignment

The server must randomly distribute roles.

Use a cryptographically secure random source for role assignment.

Do not assign roles in the frontend.

Do not assign the host a special role.

Do not reveal the complete role distribution to all players.

Randomize assignments fairly.

Ensure the result is not predictable from player order, join order, usernames, or room codes.

---

# 7. SECRET ROLE SYSTEM

There are two initial roles.

## 7.1 Mafia

A Mafia player:

- Knows their own role.
- Knows all other Mafia members.
- Can communicate privately with Mafia teammates during the permitted Mafia phase.
- Can collectively select a player to kill.
- Can participate in public discussion as a normal player.
- Can lie.
- Can accuse Citizens.
- Can defend other Mafia members.
- Can vote during public voting while alive.

Mafia members must never be automatically identified to Citizens.

## 7.2 Citizen

A Citizen:

- Knows their own role.
- Does not know who the Mafia members are.
- Participates in public discussion.
- Can accuse suspicious players.
- Can defend themselves.
- Can vote during public voting while alive.
- Cannot access Mafia communication.
- Cannot access hidden Mafia information.

## 7.3 Role visibility

There must be no public Mafia/Citizen badge above characters.

A player must not be able to inspect another player's role through:

- Browser developer tools.
- Network responses.
- Client-side state.
- Room state.
- Debug endpoints.
- Public API responses.

The server must maintain the complete secret role assignments.

Each player should receive only the role information they are authorized to know.

This is a strict security requirement.

## 7.4 Mafia information

When Mafia receives their role:

They should see a private Mafia panel containing:

- Their own Mafia identity.
- Other Mafia teammates.
- Teammate names.
- Teammate character identifiers.
- Private communication controls.
- Mafia target selection interface when the night phase permits it.

Citizens must never receive this panel or its underlying data.

---

# 8. GAME PHASES AND STATE MACHINE

Implement a server-authoritative game state machine.

Suggested phases:

1. WAITING_FOR_PLAYERS
2. ROLE_ASSIGNMENT
3. NIGHT
4. MORNING_ANNOUNCEMENT
5. DAY_DISCUSSION
6. DAY_VOTING
7. REVOTING
8. ELIMINATION_ANNOUNCEMENT
9. VICTORY
10. GAME_OVER

The server must control all phase transitions.

The frontend must render the current phase based on server state.

Never allow the frontend to independently decide that a phase has ended.

## 8.1 Night phase

When night begins:

- Public discussion ends.
- Public voting is disabled.
- Living Mafia members receive access to the Mafia interface.
- Mafia members can privately communicate.
- Mafia members select a target.
- The Mafia timer begins.

The Mafia must collectively select one target.

The target must be alive.

Mafia members must not be allowed to kill themselves or another Mafia member.

The final target should be selected through a clear collective decision mechanism.

Recommended initial mechanism:

- Every living Mafia member can submit one target vote.
- The server counts Mafia votes.
- The candidate with the highest votes becomes the target.
- A tie triggers another short selection period or a defined server-side tie-break.
- If no valid selection is made before the timer expires, apply a clearly documented fallback rule.

Do not allow multiple night kills in a single standard night unless explicitly configured in the future.

## 8.2 Morning announcement

When the Mafia selection completes:

- The selected target is eliminated.
- The player becomes dead.
- The player's character receives a death state or death animation.
- The server updates the alive-player count.
- The public announcement appears.

Example:

"Player 8 was killed during the night."

The server must check victory conditions after elimination.

If the game is not over, proceed to discussion.

## 8.3 Day discussion

During discussion:

- Living players can talk publicly.
- Living players can accuse other players.
- Mafia members can pretend to be Citizens.
- Mafia members can defend each other.
- Citizens can discuss evidence and suspicious behaviour.
- Dead players cannot participate in living-player discussion.

The game should provide a discussion timer.

Default proposed duration: 120 seconds.

The host should be able to configure it.

## 8.4 Public voting

After discussion, public voting begins.

Each living player can cast one vote for another living player.

The server must:

- Validate that the voter is alive.
- Validate that the target is alive.
- Prevent duplicate votes.
- Prevent voting for oneself unless explicitly enabled.
- Prevent voting outside the voting phase.
- Keep individual votes private until voting closes.
- Record the result.
- Calculate the percentage using the eligible living-player population.

A player may change their vote only if the game settings permit it.

The initial recommended rule is one final vote per player.

## 8.5 Voting threshold: 50%

This is a mandatory game rule.

A player is eligible for elimination when they receive votes representing at least 50% of all eligible living voters.

Formula:

Vote Percentage = (Votes Received / Eligible Living Voters) × 100

Rules:

- Below 50%: No elimination.
- Exactly 50%: Elimination is permitted.
- Above 50%: Elimination is permitted.

Example:

8 living players.

Player 3 receives 4 votes.

4 / 8 = 50%.

Player 3 is eliminated.

Another example:

8 living players.

Player 3 receives 3 votes.

3 / 8 = 37.5%.

Player 3 is not eliminated.

Do not calculate the threshold using only the number of submitted votes.

Abstentions should not artificially lower the threshold.

## 8.6 Revoting

If no player reaches 50%:

- Do not eliminate anybody.
- Start another voting round.
- Use the configured revote timer.
- Allow living players to reconsider their votes.

If multiple candidates reach the threshold, do not eliminate multiple candidates automatically.

Recommended tie-handling rule:

- Conduct a revote between tied candidates.
- If the tie persists, no player is eliminated during that voting cycle.

Make the revoting process clear in the UI.

Avoid infinite voting loops. Use a configurable maximum number of revotes or another documented fallback rule.

## 8.7 Elimination

When a player is eliminated:

- Update their alive status on the server.
- Disable their voting.
- Disable their ability to perform Mafia kills.
- Remove them from living-player communication.
- Update the public alive-player list.
- Play an elimination animation.
- Display the elimination announcement.

Role reveal after elimination must be configurable.

Do not silently assume that every eliminated player's role should become public.

Make this a game setting, with the default documented and easily changeable.

## 8.8 Dead players and spectators

Dead players should not be able to:

- Vote.
- Kill.
- Participate in living-player discussion.
- Communicate with living players through public voice.
- Access private Mafia information unless they are still living Mafia members.

Recommended spectator experience:

- Dead players can watch the remaining players.
- Their characters may become ghost-like or move into spectator mode.
- They can see the public game state.
- They cannot influence the match.

A separate dead-player communication channel may be considered later.

---

# 9. VICTORY CONDITIONS

Implement victory detection on the server.

## 9.1 Citizen victory

Citizens win when all Mafia members have been eliminated.

## 9.2 Mafia victory

Mafia win when:

Living Mafia Count >= Living Citizen Count.

Example:

2 Mafia and 2 Citizens remain.

Mafia wins.

This prevents the game from continuing when Mafia have reached voting parity.

## 9.3 Victory handling

When victory is reached:

- Stop all timers.
- Disable all voting.
- Disable night actions.
- Stop the current phase.
- Reveal the final result.
- Display the winning team.
- Display the final role distribution.
- Update match history.
- Update player statistics.
- Allow players to return to the lobby or start another game.

The victory calculation must always use authoritative server state.

---

# 10. CONFIGURABLE GAME SETTINGS

The room host should have a game settings interface.

The following settings should be supported.

| Setting | Default | Configuration |
|---|---:|---|
| Mafia percentage | 20% | 10–30%, 5% increments |
| Mafia count | Automatic | Optional manual mode |
| Mafia night timer | 30 seconds | Configurable |
| Day discussion timer | 120 seconds | Configurable |
| Public voting timer | 30 seconds | Configurable |
| Revoting timer | 20 seconds | Configurable |
| Morning announcement | 10 seconds | Configurable |
| Maximum revotes | 1 | Configurable |
| Role reveal after elimination | Pending decision | On/off |
| Self-voting | Disabled | On/off |
| Vote changing | Disabled | On/off |

All durations should be validated by the server.

Use sensible minimum and maximum bounds.

The UI should show the effect of each configuration immediately.

The host cannot change important game settings after the game starts unless a particular setting is explicitly designed to be changeable during gameplay.

---

# 11. VOICE COMMUNICATION

Voice communication is a major feature.

Use LiveKit/WebRTC.

Implement role-aware voice access.

## 11.1 Public voice channel

During the public discussion phase:

- All living players can communicate.
- Dead players cannot transmit or receive living-player discussion.
- Mafia players can participate as normal players.

## 11.2 Mafia private voice

During the Mafia phase:

- Living Mafia members can communicate privately.
- Citizens cannot join the channel.
- Dead Mafia members cannot continue to participate in living Mafia discussions.

The server must authorize voice-channel access.

Do not rely only on hiding buttons in the frontend.

## 11.3 Voice controls

Provide:

- Microphone permission handling.
- Mute/unmute.
- Speaking indicator.
- Microphone status.
- Connection status.
- Audio device selection where supported.
- Error handling.
- Reconnection handling.

Voice should be opt-in or require microphone permission.

Do not record voice conversations by default.

## 11.4 Phase-based access

The game should automatically switch communication permissions when phases change.

For example:

NIGHT:
- Mafia private voice enabled.
- Public voice disabled.

DAY DISCUSSION:
- Public voice enabled.
- Mafia private voice disabled.

DAY VOTING:
- Voice behavior should follow a configurable rule.

GAME OVER:
- Communication can be returned to a shared post-game channel if enabled.

---

# 12. CHARACTER MOVEMENT AND 3D MULTIPLAYER

## 12.1 Movement

Players should control their characters through standard keyboard controls.

Initial desktop controls:

- W: Forward.
- S: Backward.
- A: Left.
- D: Right.
- Space: Jump.
- Shift: Run.
- Mouse: Camera rotation.
- E: Interact where applicable.

Make the controls configurable in future versions.

## 12.2 Character synchronization

Every player must see the other players moving in real time.

Synchronize:

- Position.
- Rotation.
- Movement state.
- Jump state.
- Animation state.
- Death state.
- Interaction state.

Use server-authoritative or appropriately validated movement synchronization.

Do not allow players to teleport arbitrarily or submit impossible movement values.

Use client-side prediction and interpolation where appropriate.

Avoid sending unnecessarily frequent full state updates.

## 12.3 Physics

Use Rapier for:

- Gravity.
- Collision.
- Character movement.
- Jumping.
- Ground detection.
- Environmental collision.

Keep the physics simulation optimized.

## 12.4 Interaction

Allow characters to:

- Move around the map.
- Look at other players.
- Enter designated areas.
- Interact with game objects where appropriate.
- Perform basic gestures.

The initial game should not require complicated combat or weapon systems.

This is a social-deduction game, not a shooter.

---

# 13. SECURITY AND ANTI-CHEAT

Security is a non-negotiable requirement.

The server is the source of truth.

Never trust the client for:

- Player roles.
- Alive/dead status.
- Mafia target selection.
- Vote validity.
- Voting results.
- Victory conditions.
- Timer expiration.
- Phase transitions.
- Room ownership.
- Voice permissions.

Implement:

- Server-side validation.
- Authorization.
- Rate limiting.
- Duplicate action prevention.
- Secure room membership.
- Secret role filtering.
- Connection validation.
- Input validation.
- Abuse protection.

Do not expose internal role assignments through publicly synchronized room state.

Do not expose the Mafia member list to Citizens.

Do not rely on client-side checks for secret information.

Use private server-to-client messages or equivalent access-controlled mechanisms.

Test whether a Citizen can discover Mafia identities by inspecting:

- WebSocket messages.
- API responses.
- Client state.
- React state.
- Browser storage.
- Network requests.

The answer must be no.

---

# 14. DATABASE DESIGN

Use PostgreSQL and Prisma.

Design a normalized and maintainable schema.

Suggested models:

## User

- id
- username
- email
- password/authentication reference
- avatar
- createdAt
- updatedAt

## GameSession

- id
- roomCode
- hostUserId
- status
- configuration
- playerCount
- winner
- startedAt
- endedAt
- createdAt

## GamePlayer

- id
- gameSessionId
- userId
- displayName
- role
- team
- status
- joinedAt
- eliminatedAt

Important: The role field must never be exposed through ordinary public player queries.

## GameRound

- id
- gameSessionId
- roundNumber
- phase
- startedAt
- endedAt

## GameEvent

- id
- gameSessionId
- roundId
- eventType
- publicPayload
- createdAt

Be careful not to store sensitive secret information in publicly accessible event payloads.

## MatchStatistics

- id
- userId
- gamesPlayed
- gamesWon
- mafiaWins
- citizenWins
- eliminations
- survivalCount

Adjust the schema as implementation requirements become clearer.

Do not persist every movement update to PostgreSQL.

Real-time positions belong in the multiplayer layer.

Persist important match events and final results.

---

# 15. USER INTERFACE AND EXPERIENCE

Create a polished browser-game interface.

The UI should feel like a real multiplayer game, not an ordinary administrative dashboard.

## 15.1 Landing page

Include:

- Game logo and name.
- Play button.
- Create room.
- Join room.
- How to play.
- Game information.
- Optional account/profile access.

## 15.2 Room creation screen

Include:

- Player limit.
- Mafia percentage.
- Manual Mafia count if supported.
- Night duration.
- Discussion duration.
- Voting duration.
- Revoting duration.
- Other game settings.
- Create room button.

## 15.3 Lobby

Include:

- Room code.
- Copy button.
- Player list.
- Host identification.
- Player count.
- Game settings.
- Start button for host.

## 15.4 Role reveal

When the game begins, each player should receive a private role reveal.

For example:

MAFIA:
"You are Mafia. Work with your teammates and eliminate the Citizens."

CITIZEN:
"You are a Citizen. Find the Mafia members and eliminate them through voting."

The reveal should be visible only to the relevant player.

## 15.5 In-game HUD

Display:

- Current phase.
- Remaining time.
- Alive players.
- Dead players.
- Player names.
- Microphone controls.
- Chat or communication controls.
- Relevant game actions.

Do not reveal secret roles in the HUD.

## 15.6 Mafia panel

Visible only to authorized living Mafia members.

Display:

- Mafia teammates.
- Private voice controls.
- Mafia target selection.
- Selection status.
- Night timer.

## 15.7 Voting interface

Display eligible living players.

Each player should be selectable.

Display voting progress without exposing individual votes before the voting deadline.

After voting ends, display the results and elimination outcome.

## 15.8 Death and victory screens

Create attractive animations and clear announcements.

Examples:

"Player 8 was eliminated."

"THE MAFIA HAVE WON."

"CITIZENS WIN."

Use consistent typography, colors, spacing, and visual effects.

---

# 16. DEVELOPMENT AND PROJECT STRUCTURE

Use a clean monorepo architecture.

Suggested structure:

mafia-game/
|
|-- apps/
|   |
|   |-- web/
|   |   |-- app/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- public/
|   |
|   |-- game-server/
|       |-- src/
|       |   |-- rooms/
|       |   |-- game/
|       |   |-- phases/
|       |   |-- services/
|       |   |-- security/
|       |   |-- voice/
|       |   |-- schemas/
|
|-- packages/
|   |
|   |-- game-client/
|   |-- shared/
|   |-- game-rules/
|   |-- database/
|   |-- ui/
|
|-- docs/
|   |-- GAME_DESIGN.md
|   |-- ARCHITECTURE.md
|   |-- DATABASE.md
|   |-- GAME_RULES.md
|   |-- SECURITY.md
|   |-- DEVELOPMENT_PLAN.md
|
|-- package.json
|-- turbo.json

You can refine this structure as needed.

Do not create unnecessary abstraction layers.

Use shared TypeScript types for communication contracts.

Keep game rules independent of UI components.

---

# 17. TESTING REQUIREMENTS

Implement unit tests, integration tests, and multiplayer tests.

Critical test cases:

## Role assignment

- 10 players at 20% produces 2 Mafia.
- 10 players at 30% produces 3 Mafia.
- Host can receive either role.
- Role assignment is randomized.
- No Citizen receives Mafia teammate information.
- Invalid Mafia percentages are rejected.
- At least one Citizen remains.

## Voting

- 8 players, 4 votes for a candidate: elimination threshold reached.
- 8 players, 3 votes: threshold not reached.
- 10 players, 5 votes: threshold reached.
- Dead players cannot vote.
- Duplicate votes are rejected.
- Invalid targets are rejected.
- A tied result triggers the correct revote procedure.
- Abstentions do not lower the threshold.
- Voting outside the correct phase is rejected.

## Night phase

- Only Mafia can submit Mafia selections.
- Mafia cannot target dead players.
- Mafia cannot target themselves or teammates.
- Citizens cannot access Mafia controls.
- A valid target is selected.
- Only one night kill occurs.
- Night timer expires correctly.

## Victory

- All Mafia eliminated: Citizens win.
- Mafia count equals Citizen count: Mafia win.
- Mafia count exceeds Citizen count: Mafia win.
- No actions are accepted after the game ends.

## Multiplayer

- Ten players can join the same room.
- All players see synchronized positions.
- Players receive the same phase and timer.
- Reconnection works.
- Host disconnection is handled.
- Room cleanup works.

## Security

- Citizens cannot inspect Mafia identities.
- Unauthorized users cannot join private voice.
- Dead players cannot vote.
- Clients cannot manipulate timers.
- Clients cannot directly trigger eliminations.
- Clients cannot submit forged game results.

---

# 18. DEVELOPMENT MILESTONES

Develop the game incrementally.

Do not attempt to complete every feature simultaneously.

## MILESTONE 0 — REPOSITORY AND ARCHITECTURE AUDIT

Before coding:

1. Inspect the existing repository.
2. Identify existing technologies.
3. Inspect package files.
4. Inspect existing application architecture.
5. Identify reusable components.
6. Identify conflicts and missing dependencies.
7. Review current documentation.
8. Prepare an implementation plan.

Do not overwrite an existing working project without understanding it.

If the repository is empty, initialize the proposed monorepo.

Deliverables:

- Architecture proposal.
- Folder structure.
- Technology decisions.
- Development milestones.
- Risks and dependencies.

## MILESTONE 1 — MULTIPLAYER ROOM FOUNDATION

Implement:

- Room creation.
- Room codes.
- Joining rooms.
- Player lists.
- Host management.
- Lobby.
- Game configuration.
- Start game.
- Player connection management.

Test with multiple browser sessions.

## MILESTONE 2 — COMPLETE GAME LOGIC

Implement:

- Random role assignment.
- Mafia information distribution.
- Night phase.
- Mafia selection.
- Morning announcement.
- Discussion timer.
- Public voting.
- 50% threshold.
- Revoting.
- Elimination.
- Victory detection.

Initially, the game can use a simple 2D or UI-based interface.

The purpose is to validate the complete game engine before investing heavily in 3D.

## MILESTONE 3 — 3D ENVIRONMENT

Implement:

- Three.js setup.
- Environment.
- Map.
- Characters.
- Camera.
- Movement.
- Jumping.
- Collision.
- Animations.
- Multiplayer position synchronization.

## MILESTONE 4 — VOICE

Implement:

- LiveKit integration.
- Public voice.
- Mafia private voice.
- Phase-based voice authorization.
- Microphone controls.
- Connection recovery.

## MILESTONE 5 — COMPLETE GAME EXPERIENCE

Integrate:

- 3D gameplay.
- Game UI.
- Role panels.
- Timers.
- Voting.
- Death animations.
- Spectator experience.
- Voice.

## MILESTONE 6 — TESTING AND OPTIMIZATION

Test:

- Ordinary integrated-graphics laptops.
- Multiple browsers.
- Network interruptions.
- High latency.
- Multiple simultaneous rooms.
- Role secrecy.
- Multiplayer synchronization.
- Performance.

Optimize loading time, frame rate, memory and server usage.

## MILESTONE 7 — DEPLOYMENT

Prepare:

- Production frontend deployment.
- Dedicated multiplayer server deployment.
- PostgreSQL deployment.
- LiveKit configuration.
- Environment variables.
- Logging.
- Monitoring.
- Error handling.
- Backup strategy.
- Production documentation.

Do not hardcode production credentials.

---

# 19. DEVELOPMENT RULES FOR THE AGENT

These rules must be followed throughout development.

1. Always inspect existing code before modifying it.
2. Use TypeScript strictly.
3. Avoid unnecessary `any` types.
4. Use reusable components.
5. Maintain clear separation of responsibilities.
6. Keep game logic on the server.
7. Do not expose secret roles.
8. Validate every important client action.
9. Do not trust client-side timers.
10. Do not trust client-side voting results.
11. Avoid unnecessary database writes.
12. Optimize the 3D world for ordinary hardware.
13. Avoid unnecessary dependencies.
14. Do not introduce a complex microservices architecture for the MVP.
15. Write tests for important game rules.
16. Maintain documentation as the project evolves.
17. Do not silently change agreed gameplay rules.
18. If a requirement is ambiguous, document it and ask for clarification when it materially affects architecture or gameplay.
19. Do not invent additional gameplay mechanics without approval.
20. Keep the application playable after each milestone.

When a milestone is complete, provide:

- What was implemented.
- Files created.
- Files modified.
- Architecture decisions.
- Commands to run.
- Tests executed.
- Test results.
- Remaining work.
- Known limitations.

Never claim something works without testing it.

---

# 20. FIRST TASK — WHAT YOU MUST DO NOW

Do not immediately generate the entire game.

Start with the following tasks:

### Task 1: Understand the project

Inspect the available repository and development environment.

Determine whether an existing codebase exists.

### Task 2: Prepare architecture

Create a detailed technical architecture for this game.

Explain:

- Frontend architecture.
- 3D rendering architecture.
- Multiplayer architecture.
- Game state management.
- Database architecture.
- Voice architecture.
- Security architecture.

### Task 3: Design the game state machine

Document every game phase and transition.

Include:

- Allowed actions.
- Disallowed actions.
- Timer behavior.
- Player eligibility.
- Elimination behavior.
- Victory conditions.

### Task 4: Design the database

Prepare the initial Prisma schema.

Keep sensitive information protected.

### Task 5: Prepare the implementation plan

Break the work into small, testable tasks.

Identify dependencies between tasks.

### Task 6: Begin implementation

Once the architecture is documented and the initial decisions are resolved, start Milestone 1.

Do not spend excessive time creating documentation without building a playable product.

The objective is to establish a working multiplayer foundation as early as possible.

---

# 21. FINAL PRODUCT EXPECTATION

The final product should allow a group of friends to:

1. Open the Mafia website.
2. Create a room.
3. Share a room code.
4. Invite friends.
5. Enter the lobby.
6. Configure Mafia percentage and game timers.
7. Start the game.
8. Receive randomly assigned secret roles.
9. Enter a shared 3D environment.
10. Move their characters around.
11. Communicate through voice.
12. Let Mafia members privately coordinate.
13. Eliminate players at night.
14. Discuss suspicious behaviour during the day.
15. Vote to eliminate suspected Mafia members.
16. Conduct revoting when the threshold is not reached.
17. Continue until one team wins.
18. See the final result and match statistics.

The game should feel like a real multiplayer browser game.

It should not feel like a static website with a voting form.

**The priority is a smooth, lightweight, secure, enjoyable multiplayer experience with a polished 3D world.**

Build the foundation correctly, validate the mechanics, and then expand the experience.

Your first responsibility is to understand the project and propose the architecture. Your second responsibility is to make the first playable version. Your third responsibility is to continuously improve it without compromising the core game rules.

**Project name: MAFIA — A 3D Multiplayer Social Deduction Game.**