import colyseus from "colyseus";
const { Room } = colyseus;
type Client = colyseus.Client;
import {
  Phase,
  Role,
  calculateRoleCounts,
  validateMafiaPercentage,
  createReconnectionSession,
  ReconnectionSession
} from "@mafia/game-rules";
import {
  ClientMessageType,
  ServerMessageType,
  ROOM_CODE_LENGTH,
  ROOM_CODE_ALPHABET,
  TICK_INTERVAL_MS,
  ChatMessagePayload,
  MafiaRoomState,
  PlayerState
} from "@mafia/shared";

interface JoinOptions {
  displayName?: string;
  roomCode?: string;
  reconnectToken?: string;
}

export class MafiaRoom extends Room<MafiaRoomState> {
  // Authoritative private state (NEVER exposed to public schema)
  private secretRoles: Map<string, Role> = new Map();
  private reconnectionSessions: Map<string, ReconnectionSession> = new Map();

  onCreate(options: any) {
    this.setState(new MafiaRoomState());

    // Generate unique 5-character alphanumeric room code
    const generatedCode = options.roomCode || this.generateRoomCode();
    this.state.roomCode = generatedCode;
    this.setMetadata({ roomCode: generatedCode });

    // Enable custom room code lookup in Colyseus matchmaking
    this.setPatchRate(TICK_INTERVAL_MS); // 20Hz update loop

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
        if (typeof data.mafiaPercentage === "number") {
          validateMafiaPercentage(data.mafiaPercentage);
          this.state.config.mafiaPercentage = data.mafiaPercentage;
        }

        if (typeof data.nightDurationSec === "number" && data.nightDurationSec >= 10 && data.nightDurationSec <= 120) {
          this.state.config.nightDurationSec = data.nightDurationSec;
        }

        if (typeof data.discussionDurationSec === "number" && data.discussionDurationSec >= 15 && data.discussionDurationSec <= 300) {
          this.state.config.discussionDurationSec = data.discussionDurationSec;
        }

        if (typeof data.votingDurationSec === "number" && data.votingDurationSec >= 10 && data.votingDurationSec <= 120) {
          this.state.config.votingDurationSec = data.votingDurationSec;
        }

        if (typeof data.revealRoleOnDeath === "boolean") {
          this.state.config.revealRoleOnDeath = data.revealRoleOnDeath;
        }

        if (typeof data.isDevMode === "boolean") {
          this.state.config.isDevMode = data.isDevMode;
        }
      } catch (err: any) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: err.message || "Invalid configuration values."
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

      // Transition to Role Assignment
      this.state.phase = Phase.ROLE_ASSIGNMENT;
      this.state.phaseStartedAt = Date.now();
      this.state.phaseEndsAt = Date.now() + 5000; // 5s role reveal intro

      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: "Match starting! Roles are being assigned..."
      });
    });

    // 4. Lobby / Public Chat
    this.onMessage(ClientMessageType.SEND_CHAT, (client, data: { message: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const trimmed = (data.message || "").trim();
      if (!trimmed || trimmed.length > 250) return;

      const chatPayload: ChatMessagePayload = {
        senderId: player.id,
        senderName: player.displayName,
        channel: "PUBLIC",
        message: trimmed,
        timestamp: Date.now()
      };

      this.broadcast(ServerMessageType.CHAT_MESSAGE, chatPayload);
    });
  }

  onJoin(client: Client, options: JoinOptions) {
    const rawName = (options.displayName || "").trim();
    const displayName = rawName.length > 0 ? rawName.slice(0, 16) : `Player ${this.state.players.size + 1}`;

    const player = new PlayerState();
    player.id = client.sessionId;
    player.displayName = displayName;
    player.isConnected = true;
    player.isAlive = true;

    // First player is assigned host
    if (this.state.players.size === 0) {
      player.isHost = true;
      this.state.hostId = player.id;
    }

    this.state.players.set(client.sessionId, player);

    // Create secure reconnection session
    const session = createReconnectionSession(player.id, 60);
    this.reconnectionSessions.set(player.id, session);

    // Send private reconnection token to client
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
      // Voluntary departure: remove player immediately
      console.log(`[MafiaRoom] ${player.displayName} left voluntarily.`);
      this.removePlayer(client.sessionId);
      return;
    }

    // Involuntary disconnect: start 60s grace period
    console.log(`[MafiaRoom] ${player.displayName} disconnected unexpectedly. Starting 60s reconnection window...`);
    player.isConnected = false;

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `${player.displayName} disconnected. Waiting 60s for reconnection...`
    });

    try {
      // Colyseus handles socket reconnection wait
      await this.allowReconnection(client, 60);

      // Reconnected successfully within 60s!
      player.isConnected = true;
      console.log(`[MafiaRoom] ${player.displayName} successfully reconnected.`);
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: `${player.displayName} reconnected!`
      });
    } catch (err) {
      // 60s expired without reconnection
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

    // If host left and players remain, promote next player to host
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
      // In lobby, clean them up
      this.removePlayer(sessionId);
    } else {
      // In active match: mark as eliminated due to disconnection
      player.isAlive = false;
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: `${player.displayName} failed to reconnect and was eliminated.`
      });
    }
  }

  onDispose() {
    console.log(`[MafiaRoom] Disposed room ${this.state.roomCode}.`);
  }
}
