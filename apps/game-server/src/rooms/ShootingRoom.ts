import colyseus from "colyseus";
const { Room } = colyseus;
type Client = colyseus.Client;
import crypto from "node:crypto";
import {
  GameMode,
  ClientMessageType,
  ServerMessageType,
  ROOM_CODE_LENGTH,
  ROOM_CODE_ALPHABET,
  TICK_INTERVAL_MS,
  ShootingRoomState,
  ShootingPlayerState,
  ShootingTeamState,
  PlayerTransformPayload,
  ChatMessagePayload,
  WeaponId,
  WEAPONS_CATALOG,
  HitRegion,
  HIT_REGION_MULTIPLIERS,
  ShootingFirePayload,
  ShootingMuzzleFlashPayload,
  ShootingHitEventPayload,
  ShootingKillFeedPayload,
  ShootingPlayerRespawnedPayload
} from "@mafia/shared";

const TEAM_SPAWN_POINTS: Record<string, [number, number, number]> = {
  "team-red": [50, 0.4, -50],
  "team-blue": [-50, 0.4, 50],
  "team-green": [-50, 0.4, -50]
};

interface JoinOptions {
  displayName?: string;
  roomCode?: string;
  reconnectToken?: string;
}

export class ShootingRoom extends Room<ShootingRoomState> {
  private reconnectionTokens: Map<string, string> = new Map(); // token -> sessionId
  private tokenBySession: Map<string, string> = new Map();     // sessionId -> token
  private matchTimer: colyseus.Delayed | null = null;
  private lastFireTime: Map<string, number> = new Map();
  private reloadTimers: Map<string, colyseus.Delayed> = new Map();
  private respawnTimers: Map<string, colyseus.Delayed> = new Map();

  onCreate(options: any) {
    this.setState(new ShootingRoomState());

    const generatedCode = options.roomCode || this.generateRoomCode();
    this.state.roomCode = generatedCode;
    this.state.gameMode = GameMode.SHOOTING;
    this.setMetadata({ roomCode: generatedCode, gameMode: GameMode.SHOOTING });

    this.setPatchRate(TICK_INTERVAL_MS);

    // Initialize 3 default teams (Red, Blue, Green)
    const teams = [
      { id: "team-red", name: "Team Red", color: "#ef4444" },
      { id: "team-blue", name: "Team Blue", color: "#3b82f6" },
      { id: "team-green", name: "Team Green", color: "#10b981" }
    ];

    teams.forEach((t) => {
      const team = new ShootingTeamState();
      team.id = t.id;
      team.name = t.name;
      team.color = t.color;
      team.score = 0;
      team.playerCount = 0;
      this.state.teams.set(t.id, team);
    });

    console.log(`[ShootingRoom] Created shooting room with code: ${this.state.roomCode}`);

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
      if (this.state.status !== "LOBBY") return;
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = !player.isReady;
      }
    });

    // 2. Team selection (Self-assignment)
    this.onMessage(ClientMessageType.SHOOTING_JOIN_TEAM, (client, data: { teamId: string }) => {
      if (this.state.status !== "LOBBY") return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const newTeam = this.state.teams.get(data.teamId);
      if (!newTeam) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "Invalid team selection." });
        return;
      }

      if (player.teamId === data.teamId) return;

      // Update player counts
      const oldTeam = this.state.teams.get(player.teamId);
      if (oldTeam) oldTeam.playerCount = Math.max(0, oldTeam.playerCount - 1);

      player.teamId = data.teamId;
      newTeam.playerCount++;

      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: `${player.displayName} joined ${newTeam.name}.`
      });
    });

    // 3. Host Team Assignment (Host manually organizes players)
    this.onMessage(
      ClientMessageType.SHOOTING_ASSIGN_TEAM,
      (client, data: { targetPlayerId: string; teamId: string }) => {
        if (this.state.status !== "LOBBY") return;
        if (client.sessionId !== this.state.hostId) {
          client.send(ServerMessageType.ERROR_NOTIFICATION, {
            message: "Only the room host can reassign team members."
          });
          return;
        }

        const targetPlayer = this.state.players.get(data.targetPlayerId);
        const newTeam = this.state.teams.get(data.teamId);

        if (!targetPlayer || !newTeam) {
          client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "Invalid player or team ID." });
          return;
        }

        if (targetPlayer.teamId === data.teamId) return;

        const oldTeam = this.state.teams.get(targetPlayer.teamId);
        if (oldTeam) oldTeam.playerCount = Math.max(0, oldTeam.playerCount - 1);

        targetPlayer.teamId = data.teamId;
        newTeam.playerCount++;

        this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
          message: `Host assigned ${targetPlayer.displayName} to ${newTeam.name}.`
        });
      }
    );

    // 4. Auto-balance teams (Host only)
    this.onMessage(ClientMessageType.SHOOTING_AUTO_BALANCE, (client) => {
      if (this.state.status !== "LOBBY") return;
      if (client.sessionId !== this.state.hostId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only the room host can auto-balance teams."
        });
        return;
      }

      this.autoBalanceTeams();
      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: "Room host auto-balanced all players across active teams."
      });
    });

    // 5. Select Weapon Loadout
    this.onMessage(ClientMessageType.SHOOTING_SELECT_LOADOUT, (client, data: { weaponId: WeaponId }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // Prevent instant reload-bypass or mid-combat exploit: loadout changes are permitted in LOBBY or while dead/respawning
      if (this.state.status === "ACTIVE" && player.isAlive) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Cannot change weapon loadout while alive in active combat. Select loadout during respawn."
        });
        return;
      }

      const weapon = WEAPONS_CATALOG[data.weaponId as WeaponId];
      if (!weapon) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "Invalid weapon selected." });
        return;
      }

      player.weaponId = weapon.id;
      player.ammo = weapon.magazineCapacity;
      player.maxAmmo = weapon.magazineCapacity;
      player.reserveAmmo = weapon.maxReserveAmmo;
      player.isReloading = false;

      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: `${player.displayName} equipped ${weapon.name}.`
      });
    });

    // 6. Rename Team (Host only)
    this.onMessage(ClientMessageType.SHOOTING_RENAME_TEAM, (client, data: { teamId: string; name: string }) => {
      if (this.state.status !== "LOBBY") return;
      if (client.sessionId !== this.state.hostId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only the room host can rename teams."
        });
        return;
      }

      const team = this.state.teams.get(data.teamId);
      if (!team) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "Team not found." });
        return;
      }

      const trimmedName = (data.name || "").trim().slice(0, 24);
      if (trimmedName.length < 2) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, { message: "Team name must be at least 2 characters." });
        return;
      }

      const oldName = team.name;
      team.name = trimmedName;

      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: `Host renamed ${oldName} to "${trimmedName}".`
      });
    });

    // 7. Update match configuration (Host only)
    this.onMessage(ClientMessageType.SHOOTING_UPDATE_CONFIG, (client, data: any) => {
      if (this.state.status !== "LOBBY") return;
      if (client.sessionId !== this.state.hostId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only the room host can update match configuration."
        });
        return;
      }

      if (typeof data.matchDurationSec === "number" && data.matchDurationSec >= 60 && data.matchDurationSec <= 1800) {
        this.state.config.matchDurationSec = data.matchDurationSec;
      }
      if (typeof data.scoreLimit === "number" && data.scoreLimit >= 1 && data.scoreLimit <= 500) {
        this.state.config.scoreLimit = data.scoreLimit;
      }
      if (typeof data.selectedMap === "string" && data.selectedMap.trim()) {
        this.state.config.selectedMap = data.selectedMap.trim();
      }
      if (typeof data.respawnDelaySec === "number" && data.respawnDelaySec >= 1 && data.respawnDelaySec <= 15) {
        this.state.config.respawnDelaySec = data.respawnDelaySec;
      }
      if (typeof data.friendlyFire === "boolean") {
        this.state.config.friendlyFire = data.friendlyFire;
      }
    });

    // 5. Start match (Host only)
    this.onMessage(ClientMessageType.SHOOTING_START_MATCH, (client) => {
      if (this.state.status !== "LOBBY") return;
      if (client.sessionId !== this.state.hostId) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Only the room host can start the match."
        });
        return;
      }

      const totalPlayers = this.state.players.size;
      if (totalPlayers < 1) {
        client.send(ServerMessageType.ERROR_NOTIFICATION, {
          message: "Cannot start match without players."
        });
        return;
      }

      this.startMatch();
    });

    // 6. 3D Player Transform Input
    this.onMessage(ClientMessageType.PLAYER_INPUT, (client, data: PlayerTransformPayload) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      if (typeof data.x === "number" && !isNaN(data.x) && isFinite(data.x)) {
        player.x = Math.max(-85, Math.min(85, data.x));
      }
      if (typeof data.y === "number" && !isNaN(data.y) && isFinite(data.y)) {
        player.y = Math.max(-5, Math.min(30, data.y));
      }
      if (typeof data.z === "number" && !isNaN(data.z) && isFinite(data.z)) {
        player.z = Math.max(-85, Math.min(85, data.z));
      }
      if (typeof data.rotationY === "number" && !isNaN(data.rotationY) && isFinite(data.rotationY)) {
        player.rotationY = data.rotationY;
      }
      if (typeof data.animationState === "string") {
        player.animationState = data.animationState.slice(0, 32);
      }
    });

    // 7. Lobby & Game Chat
    this.onMessage(ClientMessageType.SEND_CHAT, (client, data: { message: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const trimmed = (data.message || "").trim().slice(0, 200);
      if (!trimmed) return;

      const payload: ChatMessagePayload = {
        senderId: client.sessionId,
        senderName: player.displayName,
        channel: "PUBLIC",
        message: trimmed,
        timestamp: Date.now()
      };

      this.broadcast(ServerMessageType.CHAT_MESSAGE, payload);
    });

    // 8. Weapon Fire
    this.onMessage(ClientMessageType.SHOOTING_FIRE, (client, data: ShootingFirePayload) => {
      if (this.state.status !== "ACTIVE") return;
      const shooter = this.state.players.get(client.sessionId);
      if (!shooter || !shooter.isAlive || shooter.isReloading) return;
      if (shooter.ammo <= 0) return;
      if (!data || typeof data !== "object") return;

      const weapon = WEAPONS_CATALOG[shooter.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
      const now = Date.now();
      const lastShot = this.lastFireTime.get(client.sessionId) || 0;

      // Rate of fire validation (15% network tolerance)
      if (now - lastShot < weapon.fireIntervalMs * 0.85) {
        return;
      }
      this.lastFireTime.set(client.sessionId, now);

      // Decrement ammo
      shooter.ammo = Math.max(0, shooter.ammo - 1);

      // Sanitize origin & direction
      const safeOrigin = (data.origin && isFinite(data.origin.x) && isFinite(data.origin.y) && isFinite(data.origin.z))
        ? data.origin
        : { x: shooter.x, y: shooter.y + 1.2, z: shooter.z };
      const safeDirection = (data.direction && isFinite(data.direction.x) && isFinite(data.direction.y) && isFinite(data.direction.z))
        ? data.direction
        : { x: 0, y: 0, z: -1 };

      // Broadcast muzzle flash to all clients
      const muzzlePayload: ShootingMuzzleFlashPayload = {
        shooterId: client.sessionId,
        weaponId: weapon.id,
        origin: safeOrigin,
        direction: safeDirection
      };
      this.broadcast(ServerMessageType.SHOOTING_MUZZLE_FLASH, muzzlePayload);

      // Process target hit if reported
      if (data.targetPlayerId) {
        const target = this.state.players.get(data.targetPlayerId);
        if (!target || !target.isAlive || target.id === shooter.id) {
          if (shooter.ammo === 0 && shooter.reserveAmmo > 0) {
            this.startReload(client.sessionId);
          }
          return;
        }

        // Friendly fire validation
        if (!this.state.config.friendlyFire && target.teamId === shooter.teamId) {
          if (shooter.ammo === 0 && shooter.reserveAmmo > 0) {
            this.startReload(client.sessionId);
          }
          return;
        }

        // Range validation (within effective range + 35% tolerance)
        const dx = target.x - shooter.x;
        const dy = target.y - shooter.y;
        const dz = target.z - shooter.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > weapon.effectiveRangeM * 1.35) {
          if (shooter.ammo === 0 && shooter.reserveAmmo > 0) {
            this.startReload(client.sessionId);
          }
          return;
        }

        // Calculate damage with hit region multiplier
        const region = (data.hitRegion as HitRegion) || HitRegion.UPPER_TORSO;
        const multiplier = HIT_REGION_MULTIPLIERS[region] ?? 1.0;
        const isHeadshot = region === HitRegion.HEAD;
        const totalDamage = Math.round(weapon.baseDamage * multiplier);

        // Shield absorbs first, then health
        let remainingDamage = totalDamage;
        if (target.shield > 0) {
          const absorbed = Math.min(target.shield, remainingDamage);
          target.shield -= absorbed;
          remainingDamage -= absorbed;
        }

        if (remainingDamage > 0) {
          target.health = Math.max(0, target.health - remainingDamage);
        }

        // Broadcast hit confirmation event
        const hitPayload: ShootingHitEventPayload = {
          attackerId: client.sessionId,
          victimId: target.id,
          damage: totalDamage,
          hitRegion: region,
          isHeadshot,
          remainingHealth: target.health,
          remainingShield: target.shield
        };
        this.broadcast(ServerMessageType.SHOOTING_HIT_EVENT, hitPayload);

        // Target eliminated
        if (target.health <= 0) {
          target.isAlive = false;
          target.deaths++;
          shooter.kills++;
          shooter.score += (isHeadshot ? 150 : 100);

          const shooterTeam = this.state.teams.get(shooter.teamId);
          if (shooterTeam) {
            shooterTeam.score++;
          }

          // Broadcast kill feed notification
          const killPayload: ShootingKillFeedPayload = {
            killerId: shooter.id,
            killerName: shooter.displayName,
            killerTeamId: shooter.teamId,
            victimId: target.id,
            victimName: target.displayName,
            victimTeamId: target.teamId,
            weaponId: weapon.id,
            isHeadshot,
            timestamp: Date.now()
          };
          this.broadcast(ServerMessageType.SHOOTING_KILL_FEED, killPayload);

          // Schedule respawn
          this.scheduleRespawn(target);

          // Check win condition
          if (shooterTeam && shooterTeam.score >= this.state.config.scoreLimit) {
            this.endMatch("SCORE_LIMIT");
          }
        }
      }

      // Auto-reload if magazine empty
      if (shooter.ammo === 0 && shooter.reserveAmmo > 0) {
        this.startReload(client.sessionId);
      }
    });

    // 9. Weapon Reload
    this.onMessage(ClientMessageType.SHOOTING_RELOAD, (client) => {
      if (this.state.status !== "ACTIVE") return;
      this.startReload(client.sessionId);
    });

    // 10. Return to Lobby / Rematch
    this.onMessage(ClientMessageType.RESET_TO_LOBBY, (client) => {
      if (client.sessionId !== this.state.hostId) return;

      if (this.matchTimer) {
        this.matchTimer.clear();
        this.matchTimer = null;
      }
      this.reloadTimers.forEach((t) => t.clear());
      this.reloadTimers.clear();
      this.respawnTimers.forEach((t) => t.clear());
      this.respawnTimers.clear();
      this.lastFireTime.clear();

      this.state.status = "LOBBY";
      this.state.winningTeamId = "";
      this.state.phaseStartedAt = 0;
      this.state.phaseEndsAt = 0;

      // Reset team scores
      this.state.teams.forEach((t) => {
        t.score = 0;
      });

      // Reset player combat stats
      this.state.players.forEach((p) => {
        p.isReady = false;
        p.isAlive = true;
        p.health = p.maxHealth;
        p.shield = p.maxShield;
        p.kills = 0;
        p.deaths = 0;
        p.score = 0;
        p.isReloading = false;
        const w = WEAPONS_CATALOG[p.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
        p.ammo = w.magazineCapacity;
        p.reserveAmmo = w.maxReserveAmmo;
      });

      this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
        message: "Host returned room to Shooting Lobby."
      });
    });
  }

  private startReload(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player || !player.isAlive || player.isReloading) return;
    if (player.ammo >= player.maxAmmo || player.reserveAmmo <= 0) return;

    const weapon = WEAPONS_CATALOG[player.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
    player.isReloading = true;

    const existing = this.reloadTimers.get(sessionId);
    if (existing) existing.clear();

    const timer = this.clock.setTimeout(() => {
      this.reloadTimers.delete(sessionId);
      if (!player.isConnected || !player.isAlive) {
        player.isReloading = false;
        return;
      }

      const needed = player.maxAmmo - player.ammo;
      const toLoad = Math.min(needed, player.reserveAmmo);
      player.ammo += toLoad;
      player.reserveAmmo -= toLoad;
      player.isReloading = false;
    }, weapon.reloadDurationMs);

    this.reloadTimers.set(sessionId, timer);
  }

  private scheduleRespawn(player: ShootingPlayerState) {
    const sessionId = player.sessionId;
    const existing = this.respawnTimers.get(sessionId);
    if (existing) existing.clear();

    const delayMs = (this.state.config.respawnDelaySec || 3) * 1000;
    const timer = this.clock.setTimeout(() => {
      this.respawnTimers.delete(sessionId);
      if (!player.isConnected || this.state.status !== "ACTIVE") return;

      this.respawnPlayer(player);
    }, delayMs);

    this.respawnTimers.set(sessionId, timer);
  }

  private respawnPlayer(player: ShootingPlayerState) {
    const spawnBase = TEAM_SPAWN_POINTS[player.teamId] || [0, 0.4, 0];
    const jitterX = (Math.random() - 0.5) * 4;
    const jitterZ = (Math.random() - 0.5) * 4;

    player.x = spawnBase[0] + jitterX;
    player.y = spawnBase[1];
    player.z = spawnBase[2] + jitterZ;
    player.health = player.maxHealth;
    player.shield = player.maxShield;
    const weapon = WEAPONS_CATALOG[player.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
    player.ammo = weapon.magazineCapacity;
    player.maxAmmo = weapon.magazineCapacity;
    player.reserveAmmo = weapon.maxReserveAmmo;
    player.isReloading = false;
    player.isAlive = true;

    const respawnPayload: ShootingPlayerRespawnedPayload = {
      playerId: player.id,
      teamId: player.teamId,
      x: player.x,
      y: player.y,
      z: player.z,
      health: player.health,
      shield: player.shield
    };

    this.broadcast(ServerMessageType.SHOOTING_PLAYER_RESPAWNED, respawnPayload);
  }

  private startMatch() {
    this.state.status = "ACTIVE";
    this.state.phaseStartedAt = Date.now();
    this.state.phaseEndsAt = Date.now() + this.state.config.matchDurationSec * 1000;

    this.reloadTimers.forEach((t) => t.clear());
    this.reloadTimers.clear();
    this.respawnTimers.forEach((t) => t.clear());
    this.respawnTimers.clear();
    this.lastFireTime.clear();

    // Reset and spawn each player at their team base
    this.state.players.forEach((p) => {
      this.respawnPlayer(p);
    });

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `Match started! Mode: Team Deathmatch • Limit: ${this.state.config.scoreLimit} kills • Duration: ${Math.floor(this.state.config.matchDurationSec / 60)}m`
    });

    // Set match timer
    this.matchTimer = this.clock.setTimeout(() => {
      this.endMatch("TIME_LIMIT");
    }, this.state.config.matchDurationSec * 1000);
  }

  private endMatch(reason: "SCORE_LIMIT" | "TIME_LIMIT") {
    if (this.state.status !== "ACTIVE") return;
    this.state.status = "MATCH_OVER";
    this.state.phaseEndsAt = Date.now();

    if (this.matchTimer) {
      this.matchTimer.clear();
      this.matchTimer = null;
    }
    this.reloadTimers.forEach((t) => t.clear());
    this.reloadTimers.clear();
    this.respawnTimers.forEach((t) => t.clear());
    this.respawnTimers.clear();
    this.lastFireTime.clear();

    // Determine winning team and evaluate draws
    let highestScore = -1;
    let winningTeamId = "";
    let winningTeamName = "";
    let isDraw = false;

    this.state.teams.forEach((t) => {
      if (t.score > highestScore) {
        highestScore = t.score;
        winningTeamId = t.id;
        winningTeamName = t.name;
        isDraw = false;
      } else if (t.score === highestScore && highestScore > 0) {
        isDraw = true;
      }
    });

    if (isDraw || highestScore <= 0) {
      winningTeamId = "";
      winningTeamName = "Draw";
    }

    this.state.winningTeamId = winningTeamId;

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: winningTeamId
        ? `Match finished! ${winningTeamName} wins with ${highestScore} points!`
        : `Match ended in a draw!`
    });
  }

  private autoBalanceTeams() {
    const teamIds = ["team-red", "team-blue", "team-green"];
    const allPlayers: ShootingPlayerState[] = [];
    this.state.players.forEach((p) => allPlayers.push(p));

    // Reset team counts
    this.state.teams.forEach((t) => {
      t.playerCount = 0;
    });

    // Round-robin distribution
    allPlayers.forEach((player, index) => {
      const targetTeamId = teamIds[index % teamIds.length];
      player.teamId = targetTeamId;
      const team = this.state.teams.get(targetTeamId);
      if (team) {
        team.playerCount++;
      }
    });
  }

  onJoin(client: Client, options: JoinOptions) {
    const rawName = (options.displayName || "").trim();
    const displayName = rawName.slice(0, 16) || `Soldier_${client.sessionId.slice(0, 4)}`;

    // 1. Reconnection token check
    if (options.reconnectToken && this.reconnectionTokens.has(options.reconnectToken)) {
      const existingSessionId = this.reconnectionTokens.get(options.reconnectToken)!;
      const existingPlayer = this.state.players.get(existingSessionId);

      if (existingPlayer) {
        this.reconnectionTokens.delete(options.reconnectToken);
        this.state.players.delete(existingSessionId);

        existingPlayer.sessionId = client.sessionId;
        existingPlayer.id = client.sessionId;
        existingPlayer.isConnected = true;
        this.state.players.set(client.sessionId, existingPlayer);

        const newToken = crypto.randomBytes(16).toString("hex");
        this.reconnectionTokens.set(newToken, client.sessionId);
        this.tokenBySession.set(client.sessionId, newToken);
        client.send(ServerMessageType.RECONNECTION_TOKEN, { token: newToken });

        console.log(`[ShootingRoom] ${displayName} reconnected with token to room ${this.state.roomCode}`);
        return;
      }
    }

    // 2. New player join
    const isFirstPlayer = this.state.players.size === 0;
    const player = new ShootingPlayerState();
    player.id = client.sessionId;
    player.sessionId = client.sessionId;
    player.displayName = displayName;
    player.isHost = isFirstPlayer;
    player.isReady = isFirstPlayer; // Host is auto-ready
    player.isConnected = true;
    player.isAlive = true;

    if (isFirstPlayer) {
      this.state.hostId = client.sessionId;
    }

    // Auto-assign to team with fewest members
    let minCount = Infinity;
    let selectedTeamId = "team-red";

    this.state.teams.forEach((t) => {
      if (t.playerCount < minCount) {
        minCount = t.playerCount;
        selectedTeamId = t.id;
      }
    });

    player.teamId = selectedTeamId;
    const team = this.state.teams.get(selectedTeamId);
    if (team) team.playerCount++;

    // Default starting weapon loadout: Assault Rifle
    const defaultWeapon = WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
    player.weaponId = defaultWeapon.id;
    player.ammo = defaultWeapon.magazineCapacity;
    player.maxAmmo = defaultWeapon.magazineCapacity;
    player.reserveAmmo = defaultWeapon.maxReserveAmmo;
    player.shield = 50;
    player.maxShield = 50;
    player.isReloading = false;

    this.state.players.set(client.sessionId, player);

    // Issue private reconnection token
    const token = crypto.randomBytes(16).toString("hex");
    this.reconnectionTokens.set(token, client.sessionId);
    this.tokenBySession.set(client.sessionId, token);
    client.send(ServerMessageType.RECONNECTION_TOKEN, { token });

    console.log(`[ShootingRoom] ${displayName} (${client.sessionId}) joined ${this.state.roomCode} as ${team?.name || selectedTeamId}. Total: ${this.state.players.size}`);

    this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
      message: `${displayName} joined the shooting lobby.`
    });
  }

  async onLeave(client: Client, consented?: boolean) {
    this.reloadTimers.get(client.sessionId)?.clear();
    this.reloadTimers.delete(client.sessionId);
    this.respawnTimers.get(client.sessionId)?.clear();
    this.respawnTimers.delete(client.sessionId);
    this.lastFireTime.delete(client.sessionId);

    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (consented || this.state.status === "LOBBY") {
      // Voluntary departure or in lobby: remove immediately
      const team = this.state.teams.get(player.teamId);
      if (team) team.playerCount = Math.max(0, team.playerCount - 1);

      this.state.players.delete(client.sessionId);
      const token = this.tokenBySession.get(client.sessionId);
      if (token) {
        this.reconnectionTokens.delete(token);
        this.tokenBySession.delete(client.sessionId);
      }

      console.log(`[ShootingRoom] ${player.displayName} left room ${this.state.roomCode}.`);

      // Host transfer if host left
      if (player.isHost && this.state.players.size > 0) {
        const nextClient = this.state.players.values().next().value;
        if (nextClient) {
          nextClient.isHost = true;
          this.state.hostId = nextClient.sessionId;
          this.broadcast(ServerMessageType.SYSTEM_NOTIFICATION, {
            message: `Host left. ${nextClient.displayName} is now the host.`
          });
        }
      }
    } else {
      // Unexpected disconnect during active match: mark offline and allow 60s reconnection
      player.isConnected = false;
      try {
        await this.allowReconnection(client, 60);
        player.isConnected = true;
      } catch {
        // Reconnection timed out after 60s
        const team = this.state.teams.get(player.teamId);
        if (team) team.playerCount = Math.max(0, team.playerCount - 1);

        this.state.players.delete(client.sessionId);
        const token = this.tokenBySession.get(client.sessionId);
        if (token) {
          this.reconnectionTokens.delete(token);
          this.tokenBySession.delete(client.sessionId);
        }
      }
    }
  }

  onDispose() {
    if (this.matchTimer) {
      this.matchTimer.clear();
      this.matchTimer = null;
    }
    this.reloadTimers.forEach((t) => t.clear());
    this.reloadTimers.clear();
    this.respawnTimers.forEach((t) => t.clear());
    this.respawnTimers.clear();
    this.lastFireTime.clear();
    console.log(`[ShootingRoom] Disposed room ${this.state.roomCode}.`);
  }
}
