import colyseus from "colyseus";
const { Room } = colyseus;
type Client = colyseus.Client;
import {
  Phase,
  Role,
  WinningTeam,
  calculateRoleCounts,
  distributeRoles,
  distributeRolesManual,
  validateManualMafiaAssignment,
  validateExactMafiaCount,
  validateMafiaPercentage,
  countPublicVotes,
  countNightMafiaVotes,
  checkVictory,
  getNextPhaseAfterDayVote,
  getNextPhaseAfterRevote,
  createReconnectionSession,
  ReconnectionSession
} from "@mafia/game-rules";
import {
  ClientMessageType,
  ServerMessageType,
  ROOM_CODE_LENGTH,
  ROOM_CODE_ALPHABET,
  PlayerTransformPayload,
  TICK_INTERVAL_MS,
  ChatMessagePayload,
  VoiceSignalPayload,
  MafiaRoomState,
  PlayerState
} from "@mafia/shared";
import { recordCompletedMatch, MatchParticipantSummary } from "../services/matchArchival.js";

interface JoinOptions {
  displayName?: string;
  roomCode?: string;
  reconnectToken?: string;
}

export class MafiaRoom extends Room<MafiaRoomState> {
  // Authoritative private state (NEVER exposed to public schema)
  private secretRoles: Map<string, Role> = new Map();
  private reconnectionSessions: Map<string, ReconnectionSession> = new Map();
  private manualMafiaIds: string[] = [];

  // Active voting ballots
  private nightBallots: Map<string, string> = new Map(); // mafiaId -> targetCitizenId
  private dayBallots: Map<string, string> = new Map();   // voterId -> targetCandidateId
  private tiedRunoffCandidates: string[] = [];
  private currentRevoteCount: number = 0;

  // Active phase timer
  private phaseTimer: colyseus.Delayed | null = null;
  private nightVictimId: string | null = null;
  private eliminatedPlayerId: string | null = null;
  private matchStartedAt: number = 0;

  onCreate(options: any) {
    this.setState(new MafiaRoomState());

    const generatedCode = options.roomCode || this.generateRoomCode();
    this.state.roomCode = generatedCode;
    this.setMetadata({ roomCode: generatedCode });

    this.setPatchRate(TICK_INTERVAL_MS);

    console.log(`[MafiaRoom] Created room with code: ${this.state.roomCode}`);

    this.registerMessageHandlers();
  }

  private generateRoomCode(): string {
    let code = "";
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      const idx = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
      code += ROOM_CODE_ALPHABET[idx];
    }
    return code;
  }

  private registerMessageHandlers() {
    // 1. Ready toggle
    this.onMessage(ClientMessageType.READY_TOGGLE, (client) => {
      if (this.state.phase !== Phase.WAITING_FOR_PLAYERS) return;

      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = !player.isReady;
      }
    });

    // 2. Update configuration (Host only)
    this.onMessage(ClientMessageType.UPDATE_CONFIG, (client, data: any) => {
      if (this.state.phase !== Phase.WAITING_FOR_PLAYERS) return;
      if (client.sessionId !== this.state.hostId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only the room host can update game settings."
        });
        return;
      }

      try {
        if (typeof data.isDevMode === "boolean") {
          this.state.config.isDevMode = data.isDevMode;
        }

        const minDuration = this.state.config.isDevMode ? 1 : 5;

        if (typeof data.assignmentMethod === "string" && (data.assignmentMethod === "RANDOM" || data.assignmentMethod === "MANUAL")) {
          this.state.config.assignmentMethod = data.assignmentMethod;
        }

        if (typeof data.mafiaCount === "number" && Number.isInteger(data.mafiaCount) && data.mafiaCount >= 0) {
          if (data.mafiaCount > 0) {
            validateExactMafiaCount(this.state.players.size || 5, data.mafiaCount, this.state.config.isDevMode);
          }
          this.state.config.mafiaCount = data.mafiaCount;
        }

        if (typeof data.mafiaPercentage === "number") {
          validateMafiaPercentage(data.mafiaPercentage);
          this.state.config.mafiaPercentage = data.mafiaPercentage;
        }

        if (typeof data.dayDurationSec === "number" && data.dayDurationSec >= minDuration && data.dayDurationSec <= 300) {
          this.state.config.dayDurationSec = data.dayDurationSec;
          this.state.config.discussionDurationSec = data.dayDurationSec;
        }

        if (typeof data.nightDurationSec === "number" && data.nightDurationSec >= minDuration && data.nightDurationSec <= 120) {
          this.state.config.nightDurationSec = data.nightDurationSec;
        }

        if (typeof data.discussionDurationSec === "number" && data.discussionDurationSec >= minDuration && data.discussionDurationSec <= 300) {
          this.state.config.discussionDurationSec = data.discussionDurationSec;
          this.state.config.dayDurationSec = data.discussionDurationSec;
        }

        if (typeof data.votingDurationSec === "number" && data.votingDurationSec >= minDuration && data.votingDurationSec <= 120) {
          this.state.config.votingDurationSec = data.votingDurationSec;
        }

        if (typeof data.revoteDurationSec === "number" && data.revoteDurationSec >= minDuration && data.revoteDurationSec <= 60) {
          this.state.config.revoteDurationSec = data.revoteDurationSec;
        }

        if (typeof data.morningDurationSec === "number" && data.morningDurationSec >= minDuration && data.morningDurationSec <= 60) {
          this.state.config.morningDurationSec = data.morningDurationSec;
        }

        if (typeof data.eliminationDurationSec === "number" && data.eliminationDurationSec >= minDuration && data.eliminationDurationSec <= 60) {
          this.state.config.eliminationDurationSec = data.eliminationDurationSec;
        }

        if (typeof data.revealRoleOnDeath === "boolean") {
          this.state.config.revealRoleOnDeath = data.revealRoleOnDeath;
        }
      } catch (err: any) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: err.message || "Invalid configuration values."
        });
      }
    });

    // 2.1 Set manual Mafia selection (Host only, WAITING_FOR_PLAYERS only)
    this.onMessage(ClientMessageType.SET_MANUAL_MAFIA, (client, data: { mafiaPlayerIds: string[] }) => {
      if (this.state.phase !== Phase.WAITING_FOR_PLAYERS) return;
      if (client.sessionId !== this.state.hostId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only the room host can manually assign Mafia roles."
        });
        return;
      }

      try {
        const playerIds = Array.from(this.state.players.keys());
        const expectedCount = (this.state.config.mafiaCount && this.state.config.mafiaCount > 0)
          ? this.state.config.mafiaCount
          : calculateRoleCounts(playerIds.length, this.state.config.mafiaPercentage, this.state.config.isDevMode).mafiaCount;

        validateManualMafiaAssignment(playerIds, data.mafiaPlayerIds || [], expectedCount);
        this.manualMafiaIds = [...data.mafiaPlayerIds];
        client.send(ServerMessageType.MANUAL_MAFIA_CONFIRMED, {
          mafiaPlayerIds: this.manualMafiaIds
        });
      } catch (err: any) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: err.message || "Failed to set manual Mafia selection."
        });
      }
    });

    // 3. Start game (Host only)
    this.onMessage(ClientMessageType.START_GAME, (client) => {
      if (this.state.phase !== Phase.WAITING_FOR_PLAYERS) return;
      if (client.sessionId !== this.state.hostId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only the room host can start the match."
        });
        return;
      }

      const totalPlayers = this.state.players.size;
      const minRequired = this.state.config.isDevMode ? 3 : 5;

      if (totalPlayers < minRequired) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: `Cannot start match: Need at least ${minRequired} players (${this.state.config.isDevMode ? "Dev Mode" : "Production"}). Currently have ${totalPlayers}.`
        });
        return;
      }

      // If manual assignment method, validate selection before starting
      if (this.state.config.assignmentMethod === "MANUAL") {
        const playerIds = Array.from(this.state.players.keys());
        const expectedCount = (this.state.config.mafiaCount && this.state.config.mafiaCount > 0)
          ? this.state.config.mafiaCount
          : calculateRoleCounts(playerIds.length, this.state.config.mafiaPercentage, this.state.config.isDevMode).mafiaCount;

        try {
          validateManualMafiaAssignment(playerIds, this.manualMafiaIds, expectedCount);
        } catch (err: any) {
          client.send(ServerMessageType.ERROR_NOTIFICATION, {
            message: `Cannot start match: ${err.message}`
          });
          return;
        }
      }

      this.startGame();
    });

    // 3.5. On-Demand Role Retrieval (for client lifecycle & late HUD mounting)
    this.onMessage(ClientMessageType.GET_ROLE, (client) => {
      this.sendRoleToClient(client);
    });

    // 4. Night Mafia Target Vote
    this.onMessage(ClientMessageType.MAFIA_TARGET_VOTE, (client, data: { targetId: string }) => {
      if (this.state.phase !== Phase.NIGHT) return;

      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isAlive) return;

      const voterRole = this.secretRoles.get(client.sessionId);
      if (voterRole !== Role.MAFIA) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only living Mafia members can select night targets."
        });
        return;
      }

      const targetId = data.targetId;
      const targetPlayer = this.state.players.get(targetId);
      const targetRole = this.secretRoles.get(targetId);

      // Validate target is alive and is a Citizen
      if (!targetPlayer || !targetPlayer.isAlive || targetRole !== Role.CITIZEN) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Invalid target. You must target an alive Citizen."
        });
        return;
      }

      this.nightBallots.set(client.sessionId, targetId);

      // Broadcast updated ballots exclusively to living Mafia teammates
      this.broadcastToLivingMafia(ServerMessageType.MAFIA_TARGET_UPDATE, {
        ballots: Object.fromEntries(this.nightBallots),
        candidateVotes: this.computeNightVoteCounts()
      });
    });

    // 5. Day Public Vote (Unified day phase: DAY_DISCUSSION, or legacy DAY_VOTING / REVOTING)
    this.onMessage(ClientMessageType.CAST_VOTE, (client, data: { targetId: string }) => {
      if (
        this.state.phase !== Phase.DAY_DISCUSSION &&
        this.state.phase !== Phase.DAY_VOTING &&
        this.state.phase !== Phase.REVOTING
      ) return;

      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isAlive) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "Dead players cannot vote." });
        return;
      }

      const targetId = data.targetId;
      const targetPlayer = this.state.players.get(targetId);

      if (!targetPlayer || !targetPlayer.isAlive) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "Target must be an alive player." });
        return;
      }

      // If in runoff revote, validate target is in runoff
      if (this.state.phase === Phase.REVOTING && !this.tiedRunoffCandidates.includes(targetId)) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "In a runoff vote, you can only vote for the tied candidates."
        });
        return;
      }

      // Check self-voting
      if (!this.state.config.allowSelfVoting && targetId === client.sessionId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "Self-voting is not allowed." });
        return;
      }

      // Check vote changing
      if (!this.state.config.allowVoteChanging && this.dayBallots.has(client.sessionId)) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "You have already cast your vote." });
        return;
      }

      this.dayBallots.set(client.sessionId, targetId);
      client.send(ServerMessageType.VOTE_CAST_CONFIRMED, { targetId });

      // If all living players have voted, evaluate early
      const livingVoters = this.getLivingPlayerIds();
      if (this.dayBallots.size >= livingVoters.length) {
        this.clearPhaseTimer();
        if (this.state.phase === Phase.REVOTING) {
          this.evaluateRevote();
        } else {
          this.evaluateDayVoting();
        }
      }
    });

    // 6. 3D Player Transform Input
    this.onMessage(ClientMessageType.PLAYER_INPUT, (client, data: PlayerTransformPayload) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // Sanitize and update player transform with boundary clamping (expanded 160m map: [-85, 85])
      if (typeof data.x === "number" && !isNaN(data.x)) {
        player.x = Math.max(-85, Math.min(85, data.x));
      }
      if (typeof data.y === "number" && !isNaN(data.y)) {
        player.y = Math.max(-5, Math.min(30, data.y));
      }
      if (typeof data.z === "number" && !isNaN(data.z)) {
        player.z = Math.max(-85, Math.min(85, data.z));
      }
      if (typeof data.rotationY === "number" && !isNaN(data.rotationY)) {
        player.rotationY = data.rotationY;
      }
      if (typeof data.animationState === "string") {
        player.animationState = data.animationState;
      }
    });

    // 7. Public & Private Mafia Chat
    this.onMessage(ClientMessageType.SEND_CHAT, (client, data: { message: string; channel?: "PUBLIC" | "MAFIA" }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const trimmed = (data.message || "").trim();
      if (!trimmed || trimmed.length > 250) return;

      const channel = data.channel === "MAFIA" ? "MAFIA" : "PUBLIC";

      // Private Mafia Chat Authorization
      if (channel === "MAFIA") {
        const role = this.secretRoles.get(client.sessionId);
        if (role !== Role.MAFIA) {
          client.send(ServerMessageType.ERROR_NOTIFICATION, {
            message: "Access Denied: Only Mafia syndicate members can transmit on this channel."
          });
          return;
        }

        if (!player.isAlive) {
          client.send(ServerMessageType.ERROR_NOTIFICATION, {
            message: "Eliminated Mafia members cannot transmit in syndicate chat."
          });
          return;
        }

        const chatPayload: ChatMessagePayload = {
          senderId: player.id,
          senderName: player.displayName,
          channel: "MAFIA",
          message: trimmed,
          timestamp: Date.now()
        };

        // Broadcast STRICTLY to living Mafia members
        this.broadcastToLivingMafia(ServerMessageType.CHAT_MESSAGE, chatPayload);
        return;
      }

      // Public Chat Authorization
      if (
        this.state.phase !== Phase.WAITING_FOR_PLAYERS &&
        this.state.phase !== Phase.VICTORY &&
        !player.isAlive
      ) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Eliminated players cannot speak to living players."
        });
        return;
      }

      const chatPayload: ChatMessagePayload = {
        senderId: player.id,
        senderName: player.displayName,
        channel: "PUBLIC",
        message: trimmed,
        timestamp: Date.now()
      };

      this.broadcast(ServerMessageType.CHAT_MESSAGE, chatPayload);
    });

    // 7. Reset to Lobby (Host only, when in VICTORY)
    this.onMessage(ClientMessageType.RESET_TO_LOBBY, (client) => {
      if (this.state.phase !== Phase.VICTORY) return;
      if (client.sessionId !== this.state.hostId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only the room host can return the room to lobby."
        });
        return;
      }

      this.clearPhaseTimer();
      this.state.phase = Phase.WAITING_FOR_PLAYERS;
      this.state.winningTeam = "";
      this.state.roundNumber = 1;
      this.secretRoles.clear();
      this.nightBallots.clear();
      this.dayBallots.clear();
      this.nightVictimId = null;
      this.eliminatedPlayerId = null;
      this.tiedRunoffCandidates = [];
      this.currentRevoteCount = 0;
      this.manualMafiaIds = [];

      this.state.players.forEach((p) => {
        p.isAlive = true;
        p.isReady = false;
      });

      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: "The host has returned the room to the lobby. Ready up for the next match!"
      });
    });

    // 8. WebRTC Proximity & Role-Gated Voice Signaling
    this.onMessage(ClientMessageType.VOICE_SIGNAL, (client, data: VoiceSignalPayload) => {
      if (!data || !data.targetSessionId || !data.signal) return;

      const sender = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetSessionId);
      if (!sender || !target) return;

      const isMatchActive =
        this.state.phase !== Phase.WAITING_FOR_PLAYERS &&
        this.state.phase !== Phase.VICTORY;

      // 1. Dead player restriction: dead cannot transmit to living during active match
      if (isMatchActive && !sender.isAlive && target.isAlive) {
        return; // Dropped to preserve competitive integrity
      }

      // 2. Night Phase Voice Isolation:
      // During NIGHT, living Mafia have a private voice channel.
      // Citizens must not hear Mafia, Mafia must not hear Citizens, and sleeping Citizens cannot talk to each other.
      if (isMatchActive && this.state.phase === Phase.NIGHT) {
        const senderRole = this.secretRoles.get(client.sessionId);
        const targetRole = this.secretRoles.get(data.targetSessionId);

        const senderIsLivingMafia = senderRole === Role.MAFIA && sender.isAlive;
        const targetIsLivingMafia = targetRole === Role.MAFIA && target.isAlive;

        // Only allow signaling between two living Mafia members during the night
        if (!senderIsLivingMafia || !targetIsLivingMafia) {
          return;
        }
      }

      // Find target client connection
      const targetClient = this.clients.find((c) => c.sessionId === data.targetSessionId);
      if (targetClient) {
        targetClient.send(ServerMessageType.VOICE_SIGNAL, {
          fromSessionId: client.sessionId,
          signal: data.signal
        });
      }
    });

    // 9. Voice State (Muted / Speaking indicator)
    this.onMessage(ClientMessageType.VOICE_STATE, (client, data: { isMuted?: boolean; isSpeaking?: boolean }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      this.broadcast(ServerMessageType.VOICE_STATE, {
        sessionId: client.sessionId,
        isMuted: Boolean(data.isMuted),
        isSpeaking: Boolean(data.isSpeaking)
      });
    });
  }

  // --- GAME LIFECYCLE & STATE MACHINE ---

  private startGame() {
    this.clearPhaseTimer();
    this.matchStartedAt = Date.now();
    this.state.phase = Phase.ROLE_ASSIGNMENT;
    this.state.roundNumber = 1;
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = Date.now() + 5000;

    // Distribute roles authoritatively in private server memory
    const playerIds = Array.from(this.state.players.keys());
    if (this.state.config.assignmentMethod === "MANUAL") {
      const expectedCount = (this.state.config.mafiaCount && this.state.config.mafiaCount > 0)
        ? this.state.config.mafiaCount
        : calculateRoleCounts(playerIds.length, this.state.config.mafiaPercentage, this.state.config.isDevMode).mafiaCount;
      this.secretRoles = distributeRolesManual(playerIds, this.manualMafiaIds, expectedCount);
    } else {
      this.secretRoles = distributeRoles(
        playerIds,
        this.state.config.mafiaPercentage,
        this.state.config.isDevMode,
        this.state.config.mafiaCount > 0 ? this.state.config.mafiaCount : undefined
      );
    }

    // Identify living Mafia for teammate reveal
    const mafiaTeammates: Array<{ id: string; displayName: string }> = [];
    for (const [id, role] of this.secretRoles.entries()) {
      if (role === Role.MAFIA) {
        const p = this.state.players.get(id);
        if (p) mafiaTeammates.push({ id, displayName: p.displayName });
      }
    }

    // Dispatch STRICTLY PRIVATE messages to clients
    for (const client of this.clients) {
      this.sendRoleToClient(client);
    }

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: "The match has begun! Check your secret role card."
    });

    // Reveal phase (1s in dev mode, 5s default) -> transition to Night
    const introDuration = this.state.config.isDevMode ? 1 : 5;
    this.startPhaseTimer(introDuration, () => this.startNightPhase());
  }

  /**
   * Authoritatively sends secret role and Syndicate teammates to an individual client.
   */
  private sendRoleToClient(client: Client) {
    if (this.state.phase === Phase.WAITING_FOR_PLAYERS) return;
    const role = this.secretRoles.get(client.sessionId);
    if (!role) return;

    if (role === Role.MAFIA) {
      const mafiaTeammates: Array<{ id: string; displayName: string }> = [];
      for (const [id, r] of this.secretRoles.entries()) {
        if (r === Role.MAFIA) {
          const p = this.state.players.get(id);
          if (p) mafiaTeammates.push({ id, displayName: p.displayName });
        }
      }
      client.send(ServerMessageType.ROLE_ASSIGNMENT, {
        role: Role.MAFIA,
        teammates: mafiaTeammates
      });
    } else {
      client.send(ServerMessageType.ROLE_ASSIGNMENT, {
        role: Role.CITIZEN
      });
    }
  }

  private startNightPhase() {
    this.clearPhaseTimer();
    this.state.phase = Phase.NIGHT;
    this.nightBallots.clear();
    this.nightVictimId = null;

    const duration = this.state.config.nightDurationSec;
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = Date.now() + duration * 1000;

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `Night ${this.state.roundNumber} falls. The town is asleep while the Mafia chooses their target.`
    });

    this.startPhaseTimer(duration, () => this.evaluateNightKills());
  }

  private computeNightVoteCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const targetId of this.nightBallots.values()) {
      counts[targetId] = (counts[targetId] || 0) + 1;
    }
    return counts;
  }

  private evaluateNightKills() {
    this.clearPhaseTimer();

    const livingMafiaIds = this.getLivingMafiaIds();
    const eligibleCitizenIds = this.getLivingCitizenIds();

    const result = countNightMafiaVotes({
      ballots: Object.fromEntries(this.nightBallots),
      livingMafiaIds,
      eligibleTargetIds: eligibleCitizenIds
    });

    if (result.victimId) {
      const victim = this.state.players.get(result.victimId);
      if (victim) {
        victim.isAlive = false;
        this.nightVictimId = result.victimId;
      }
    } else {
      this.nightVictimId = null;
    }

    this.startMorningAnnouncement();
  }

  private startMorningAnnouncement() {
    this.clearPhaseTimer();
    this.state.phase = Phase.MORNING_ANNOUNCEMENT;

    const duration = this.state.config.morningDurationSec;
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = Date.now() + duration * 1000;

    if (this.nightVictimId) {
      const victim = this.state.players.get(this.nightVictimId);
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: `Morning broke. ${victim?.displayName || "A citizen"} was killed during the night!`
      });
    } else {
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: "Morning broke. A peaceful night: nobody was killed."
      });
    }

    // Evaluate victory condition
    const victory = this.checkGameVictory();
    if (victory.isGameOver) {
      this.startPhaseTimer(duration, () => this.handleVictory(victory.winningTeam!, victory.reason!));
    } else {
      this.startPhaseTimer(duration, () => this.startDayPhase());
    }
  }

  /**
   * Unified Day Phase:
   * Combines debate, discussion, and public voting under a single authoritative day timer.
   * Voting is live immediately upon day start.
   */
  private startDayPhase() {
    this.clearPhaseTimer();
    this.state.phase = Phase.DAY_DISCUSSION;
    this.dayBallots.clear();
    this.currentRevoteCount = 0;
    this.tiedRunoffCandidates = [];
    this.eliminatedPlayerId = null;

    const duration = this.state.config.discussionDurationSec;
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = Date.now() + duration * 1000;

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `Day ${this.state.roundNumber} has begun. Discuss evidence and cast your votes to eliminate suspects (Requires >= 50% majority).`
    });

    this.startPhaseTimer(duration, () => this.evaluateDayVoting());
  }

  // Compatibility aliases
  private startDayDiscussion() {
    this.startDayPhase();
  }

  private startDayVoting() {
    this.startDayPhase();
  }

  private evaluateDayVoting() {
    this.clearPhaseTimer();

    const eligibleVoters = this.getLivingPlayerIds();
    const eligibleCandidates = [...eligibleVoters];

    const tally = countPublicVotes({
      ballots: Object.fromEntries(this.dayBallots),
      eligibleVoterIds: eligibleVoters,
      eligibleCandidateIds: eligibleCandidates
    });

    const nextPhase = getNextPhaseAfterDayVote(tally, this.currentRevoteCount, this.state.config.maxRevotes);

    if (nextPhase === Phase.ELIMINATION_ANNOUNCEMENT && tally.winnerId) {
      this.eliminatedPlayerId = tally.winnerId;
      const eliminated = this.state.players.get(tally.winnerId);
      if (eliminated) eliminated.isAlive = false;
      this.startEliminationAnnouncement();
    } else if (nextPhase === Phase.REVOTING) {
      this.tiedRunoffCandidates = tally.tiedCandidateIds;
      this.currentRevoteCount++;
      this.startRevoting();
    } else {
      // Architectural Correction #2: Leading candidate < 50% transitions directly to Night
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: "No candidate achieved the mandatory 50% majority threshold. Nobody was eliminated today."
      });
      this.state.roundNumber++;
      this.startNightPhase();
    }
  }

  private startRevoting() {
    this.clearPhaseTimer();
    this.state.phase = Phase.REVOTING;
    this.dayBallots.clear();

    const duration = this.state.config.revoteDurationSec;
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = Date.now() + duration * 1000;

    const tiedNames = this.tiedRunoffCandidates
      .map(id => this.state.players.get(id)?.displayName || id)
      .join(" and ");

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `Tied vote! Runoff revote between: ${tiedNames}.`
    });

    this.startPhaseTimer(duration, () => this.evaluateRevote());
  }

  private evaluateRevote() {
    this.clearPhaseTimer();

    const eligibleVoters = this.getLivingPlayerIds();
    const tally = countPublicVotes({
      ballots: Object.fromEntries(this.dayBallots),
      eligibleVoterIds: eligibleVoters,
      eligibleCandidateIds: this.tiedRunoffCandidates
    });

    const nextPhase = getNextPhaseAfterRevote(tally, this.currentRevoteCount, this.state.config.maxRevotes);

    if (nextPhase === Phase.ELIMINATION_ANNOUNCEMENT && tally.winnerId) {
      this.eliminatedPlayerId = tally.winnerId;
      const eliminated = this.state.players.get(tally.winnerId);
      if (eliminated) eliminated.isAlive = false;
      this.startEliminationAnnouncement();
    } else {
      // Architectural Correction #2: Runoff failed or tie persisted -> directly to Night
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: "The runoff revote failed to produce a 50% elimination. Nobody was eliminated today."
      });
      this.state.roundNumber++;
      this.startNightPhase();
    }
  }

  private startEliminationAnnouncement() {
    this.clearPhaseTimer();
    this.state.phase = Phase.ELIMINATION_ANNOUNCEMENT;

    const duration = this.state.config.eliminationDurationSec;
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = Date.now() + duration * 1000;

    const player = this.eliminatedPlayerId ? this.state.players.get(this.eliminatedPlayerId) : null;
    const role = this.eliminatedPlayerId ? this.secretRoles.get(this.eliminatedPlayerId) : null;

    if (player) {
      if (this.state.config.revealRoleOnDeath && role) {
        this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
          message: `${player.displayName} was voted out and eliminated! They were ${role}.`
        });
      } else {
        this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
          message: `${player.displayName} was voted out and eliminated!`
        });
      }
    }

    // Check victory
    const victory = this.checkGameVictory();
    if (victory.isGameOver) {
      this.startPhaseTimer(duration, () => this.handleVictory(victory.winningTeam!, victory.reason!));
    } else {
      this.startPhaseTimer(duration, () => {
        this.state.roundNumber++;
        this.startNightPhase();
      });
    }
  }

  private handleVictory(winningTeam: WinningTeam, reason: string) {
    this.clearPhaseTimer();
    this.state.phase = Phase.VICTORY;
    this.state.winningTeam = winningTeam;

    // Reveal complete role distribution to all clients now that match concluded
    const allRoles: Record<string, { displayName: string; role: Role }> = {};
    for (const [id, role] of this.secretRoles.entries()) {
      const p = this.state.players.get(id);
      if (p) {
        allRoles[id] = { displayName: p.displayName, role };
      }
    }

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `GAME OVER! ${winningTeam === WinningTeam.MAFIA ? "THE MAFIA HAVE WON!" : "CITIZENS WIN!"} (${reason})`
    });

    this.broadcast(ServerMessageType.ROLE_ASSIGNMENT, {
      isGameOverReveal: true,
      winningTeam,
      allRoles
    });

    // Asynchronously persist match history & player statistics to database
    const participants: MatchParticipantSummary[] = [];
    for (const [id, player] of this.state.players.entries()) {
      const role = this.secretRoles.get(id) || Role.CITIZEN;
      participants.push({
        sessionId: id,
        displayName: player.displayName,
        role,
        isAlive: player.isAlive,
        eliminationCause: !player.isAlive
          ? id === this.nightVictimId
            ? "NIGHT_KILL"
            : id === this.eliminatedPlayerId
            ? "VOTED_OUT"
            : "DISCONNECTED"
          : null,
        eliminatedRound: player.isAlive ? null : this.state.roundNumber
      });
    }

    recordCompletedMatch({
      roomCode: this.state.roomCode,
      hostSessionId: this.state.hostId,
      winningTeam,
      startedAt: this.matchStartedAt || (Date.now() - 60000),
      endedAt: Date.now(),
      totalRounds: this.state.roundNumber,
      config: {
        isDevMode: this.state.config.isDevMode,
        mafiaPercentage: this.state.config.mafiaPercentage,
        nightDurationSec: this.state.config.nightDurationSec,
        discussionDurationSec: this.state.config.discussionDurationSec,
        votingDurationSec: this.state.config.votingDurationSec
      },
      participants
    }).catch((err) => {
      console.warn("[MafiaRoom] Failed to archive match to database:", err);
    });
  }

  private checkGameVictory() {
    const livingMafia = this.getLivingMafiaIds().length;
    const livingCitizens = this.getLivingCitizenIds().length;
    return checkVictory(livingMafia, livingCitizens);
  }

  private startPhaseTimer(durationSec: number, callback: () => void) {
    this.clearPhaseTimer();
    this.phaseTimer = this.clock.setTimeout(callback, durationSec * 1000);
  }

  private clearPhaseTimer() {
    if (this.phaseTimer) {
      this.phaseTimer.clear();
      this.phaseTimer = null;
    }
  }

  private getLivingPlayerIds(): string[] {
    const living: string[] = [];
    for (const [id, player] of this.state.players.entries()) {
      if (player.isAlive) living.push(id);
    }
    return living;
  }

  private getLivingMafiaIds(): string[] {
    const mafia: string[] = [];
    for (const [id, player] of this.state.players.entries()) {
      if (player.isAlive && this.secretRoles.get(id) === Role.MAFIA) {
        mafia.push(id);
      }
    }
    return mafia;
  }

  private getLivingCitizenIds(): string[] {
    const citizens: string[] = [];
    for (const [id, player] of this.state.players.entries()) {
      if (player.isAlive && this.secretRoles.get(id) === Role.CITIZEN) {
        citizens.push(id);
      }
    }
    return citizens;
  }

  private broadcastToLivingMafia(type: string, payload: any) {
    const livingMafiaIds = new Set(this.getLivingMafiaIds());
    for (const client of this.clients) {
      if (livingMafiaIds.has(client.sessionId)) {
        client.send(type, payload);
      }
    }
  }

  // --- CONNECTION MANAGEMENT ---

  onJoin(client: Client, options: JoinOptions) {
    const rawName = (options.displayName || "").trim();
    const displayName = rawName.length > 0 ? rawName.slice(0, 16) : `Player ${this.state.players.size + 1}`;

    const player = new PlayerState();
    player.id = client.sessionId;
    player.displayName = displayName;
    player.isConnected = true;
    player.isAlive = true;

    if (this.state.players.size === 0) {
      player.isHost = true;
      this.state.hostId = player.id;
    }

    this.state.players.set(client.sessionId, player);

    const session = createReconnectionSession(player.id, 60);
    this.reconnectionSessions.set(player.id, session);

    client.send(ServerMessageType.RECONNECTION_TOKEN, {
      token: session.token,
      gracePeriodSec: session.gracePeriodSec
    });

    console.log(`[MafiaRoom] ${displayName} (${client.sessionId}) joined room ${this.state.roomCode}. (Total: ${this.state.players.size})`);

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `${displayName} joined the lobby.`
    });
  }

  async onLeave(client: Client, consented?: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (consented) {
      console.log(`[MafiaRoom] ${player.displayName} left voluntarily.`);
      this.removePlayer(client.sessionId);
      return;
    }

    console.log(`[MafiaRoom] ${player.displayName} disconnected unexpectedly. Starting 60s reconnection window...`);
    player.isConnected = false;

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `${player.displayName} disconnected. Waiting 60s for reconnection...`
    });

    try {
      await this.allowReconnection(client, 60);
      player.isConnected = true;
      console.log(`[MafiaRoom] ${player.displayName} successfully reconnected.`);
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: `${player.displayName} reconnected!`
      });
      // Re-send classified role to reconnected player
      this.sendRoleToClient(client);
    } catch (err) {
      console.log(`[MafiaRoom] 60s grace window expired for ${player.displayName}.`);
      this.handlePlayerAbandoned(client.sessionId);
    }
  }

  private removePlayer(sessionId: string) {
    const player = this.state.players.get(sessionId);
    const wasHost = player?.isHost ?? false;

    this.state.players.delete(sessionId);
    this.reconnectionSessions.delete(sessionId);
    this.secretRoles.delete(sessionId);
    this.nightBallots.delete(sessionId);
    this.dayBallots.delete(sessionId);

    if (wasHost && this.state.players.size > 0) {
      const firstEntry = this.state.players.entries().next().value;
      if (firstEntry) {
        const [nextSessionId, nextPlayer] = firstEntry;
        nextPlayer.isHost = true;
        this.state.hostId = nextSessionId;
        this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
          message: `${nextPlayer.displayName} is now the host.`
        });
      }
    }
  }

  private handlePlayerAbandoned(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    if (this.state.phase === Phase.WAITING_FOR_PLAYERS) {
      this.removePlayer(sessionId);
    } else {
      player.isAlive = false;
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: `${player.displayName} failed to reconnect and was eliminated.`
      });

      const victory = this.checkGameVictory();
      if (victory.isGameOver) {
        this.handleVictory(victory.winningTeam!, victory.reason!);
      }
    }
  }

  onDispose() {
    this.clearPhaseTimer();
    console.log(`[MafiaRoom] Disposed room ${this.state.roomCode}.`);
  }
}
