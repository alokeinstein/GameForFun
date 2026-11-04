"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Room } from "colyseus.js";
import {
  Users,
  Crown,
  CheckCircle2,
  Clock,
  Play,
  Copy,
  Check,
  Send,
  AlertTriangle,
  Settings,
  Shield,
  Skull,
  UserCheck,
  Radio,
  Wifi,
  WifiOff,
  Crosshair,
  Trophy,
  RotateCcw
} from "lucide-react";
import {
  GameMode,
  ClientMessageType,
  ServerMessageType,
  MafiaRoomState,
  PlayerState,
  ShootingRoomState,
  ShootingPlayerState,
  ShootingTeamState,
  ChatMessagePayload
} from "@mafia/shared";
import { calculateRoleCounts } from "@mafia/game-rules";
import {
  joinOrCreateMafiaRoom,
  joinOrCreateShootingRoom,
  queryRoomInfo,
  getSavedPlayerName,
  saveReconnectionToken
} from "../../../services/colyseus";
import { GameHUD } from "../../../components/game/GameHUD";
import { GameSelectionScreen } from "../../../components/game/GameSelectionScreen";
import { ShootingLobby } from "../../../components/game/ShootingLobby";
import { ShootingGameScene } from "../../../components/canvas/ShootingGameScene";
import { ShootingCombatHUD } from "../../../components/game/ShootingCombatHUD";
import { ShootingPostMatchScreen } from "../../../components/game/ShootingPostMatchScreen";

interface ChatItem {
  id: string;
  senderName: string;
  message: string;
  isSystem?: boolean;
  timestamp: number;
}

export default function LobbyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = ((params.roomCode as string) || "").toUpperCase();

  // Active Game Mode
  const [activeGameMode, setActiveGameMode] = useState<GameMode>(GameMode.UNSELECTED);

  // Mafia Room State
  const [mafiaRoom, setMafiaRoom] = useState<Room<MafiaRoomState> | null>(null);
  const [mafiaSessionId, setMafiaSessionId] = useState<string>("");
  const [mafiaPlayers, setMafiaPlayers] = useState<PlayerState[]>([]);
  const [mafiaIsHost, setMafiaIsHost] = useState(false);
  const [mafiaIsReady, setMafiaIsReady] = useState(false);
  const [mafiaPhase, setMafiaPhase] = useState("WAITING_FOR_PLAYERS");
  const [mafiaRoundNumber, setMafiaRoundNumber] = useState(1);
  const [mafiaPhaseStartedAt, setMafiaPhaseStartedAt] = useState(0);
  const [mafiaPhaseEndsAt, setMafiaPhaseEndsAt] = useState(0);
  const [mafiaWinningTeam, setMafiaWinningTeam] = useState("");
  const [mafiaConfig, setMafiaConfig] = useState({
    mafiaPercentage: 20,
    nightDurationSec: 30,
    discussionDurationSec: 120,
    votingDurationSec: 30,
    revealRoleOnDeath: true,
    isDevMode: false
  });

  // Shooting Room State
  const [shootingRoom, setShootingRoom] = useState<Room<ShootingRoomState> | null>(null);
  const [shootingSessionId, setShootingSessionId] = useState<string>("");
  const [shootingPlayers, setShootingPlayers] = useState<ShootingPlayerState[]>([]);
  const [shootingTeams, setShootingTeams] = useState<ShootingTeamState[]>([]);
  const [shootingIsHost, setShootingIsHost] = useState(false);
  const [shootingIsReady, setShootingIsReady] = useState(false);
  const [shootingStatus, setShootingStatus] = useState("LOBBY");
  const [shootingPhaseStartedAt, setShootingPhaseStartedAt] = useState(0);
  const [shootingPhaseEndsAt, setShootingPhaseEndsAt] = useState(0);
  const [shootingWinningTeamId, setShootingWinningTeamId] = useState("");
  const [shootingConfig, setShootingConfig] = useState({
    matchDurationSec: 300,
    scoreLimit: 30,
    selectedMap: "URBAN_DISTRICT",
    respawnDelaySec: 3,
    friendlyFire: false
  });

  // Common UI State
  const [chatMessages, setChatMessages] = useState<ChatItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: "error" | "info" } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Connect & Mode Routing Lifecycle
  useEffect(() => {
    if (!roomCode) return;

    let isSubscribed = true;
    let activeMafiaRoom: Room<MafiaRoomState> | null = null;
    let activeShootingRoom: Room<ShootingRoomState> | null = null;

    async function initRoomRouting() {
      try {
        setConnectionStatus("connecting");
        const displayName = getSavedPlayerName() || `Player_${Math.floor(Math.random() * 1000)}`;

        // Check if query param specifies the game
        const queryGame = searchParams.get("game")?.toLowerCase();

        // 1. Query server for existing room
        const roomInfo = await queryRoomInfo(roomCode);

        if (roomInfo) {
          // Room already exists on server: route directly into its gameMode
          if (roomInfo.gameMode === GameMode.SHOOTING) {
            connectToShooting(displayName);
          } else {
            connectToMafia(displayName);
          }
        } else if (queryGame === "shooting") {
          // Creator chose Shooting Game
          connectToShooting(displayName);
        } else if (queryGame === "mafia") {
          // Creator chose Mafia 3D
          connectToMafia(displayName);
        } else {
          // Creator hasn't chosen a game yet: show GameSelectionScreen
          setConnectionStatus("connected");
          setActiveGameMode(GameMode.UNSELECTED);
        }
      } catch (err: any) {
        console.error("Room routing initialization error:", err);
        setConnectionStatus("disconnected");
      }
    }

    async function connectToMafia(displayName: string) {
      try {
        setActiveGameMode(GameMode.MAFIA);
        setConnectionStatus("connecting");
        const r = await joinOrCreateMafiaRoom(roomCode, displayName);
        if (!isSubscribed) {
          r.leave();
          return;
        }

        activeMafiaRoom = r;
        setMafiaRoom(r);
        setMafiaSessionId(r.sessionId);
        setConnectionStatus("connected");

        // Sync Mafia State
        const updateMafiaState = (state: MafiaRoomState) => {
          if (!state) return;
          setMafiaPhase(state.phase);
          setMafiaRoundNumber(state.roundNumber || 1);
          setMafiaPhaseStartedAt(state.phaseStartedAt || 0);
          setMafiaPhaseEndsAt(state.phaseEndsAt || 0);
          setMafiaWinningTeam(state.winningTeam || "");

          const playerList: PlayerState[] = [];
          state.players.forEach((p) => playerList.push(p));
          setMafiaPlayers([...playerList]);

          const me = state.players.get(r.sessionId);
          if (me) {
            setMafiaIsHost(me.isHost);
            setMafiaIsReady(me.isReady);
          }

          if (state.config) {
            setMafiaConfig({
              mafiaPercentage: state.config.mafiaPercentage,
              nightDurationSec: state.config.nightDurationSec,
              discussionDurationSec: state.config.discussionDurationSec,
              votingDurationSec: state.config.votingDurationSec,
              revealRoleOnDeath: state.config.revealRoleOnDeath,
              isDevMode: state.config.isDevMode
            });
          }
        };

        r.onStateChange(updateMafiaState);

        r.onMessage(ServerMessageType.RECONNECTION_TOKEN, (data: { token: string }) => {
          saveReconnectionToken(roomCode, data.token);
        });

        r.onMessage(ServerMessageType.SYSTEM_NOTIFICATION, (data: { message: string }) => {
          setChatMessages((prev) => [
            ...prev,
            { id: Math.random().toString(), senderName: "SYSTEM", message: data.message, isSystem: true, timestamp: Date.now() }
          ]);
        });

        r.onMessage(ServerMessageType.CHAT_MESSAGE, (data: ChatMessagePayload) => {
          setChatMessages((prev) => [
            ...prev,
            { id: Math.random().toString(), senderName: data.senderName, message: data.message, timestamp: data.timestamp }
          ]);
        });

        r.onMessage(ServerMessageType.ERROR_NOTIFICATION, (data: { message: string }) => {
          setNotification({ text: data.message, type: "error" });
          setTimeout(() => setNotification(null), 5000);
        });
      } catch (err: any) {
        setConnectionStatus("disconnected");
        setNotification({ text: err.message || "Failed to connect to Mafia room.", type: "error" });
      }
    }

    async function connectToShooting(displayName: string) {
      try {
        setActiveGameMode(GameMode.SHOOTING);
        setConnectionStatus("connecting");
        const r = await joinOrCreateShootingRoom(roomCode, displayName);
        if (!isSubscribed) {
          r.leave();
          return;
        }

        activeShootingRoom = r;
        setShootingRoom(r);
        setShootingSessionId(r.sessionId);
        setConnectionStatus("connected");
        if (typeof window !== "undefined") {
          (window as any).__shootingRoom = r;
        }

        // Sync Shooting State
        const updateShootingState = (state: ShootingRoomState) => {
          if (!state) return;
          setShootingStatus(state.status || "LOBBY");
          setShootingPhaseStartedAt(state.phaseStartedAt || 0);
          setShootingPhaseEndsAt(state.phaseEndsAt || 0);
          setShootingWinningTeamId(state.winningTeamId || "");

          const playerList: ShootingPlayerState[] = [];
          state.players.forEach((p) => playerList.push(p));
          setShootingPlayers([...playerList]);

          const teamList: ShootingTeamState[] = [];
          state.teams.forEach((t) => teamList.push(t));
          setShootingTeams([...teamList]);

          const me = state.players.get(r.sessionId);
          if (me) {
            setShootingIsHost(me.isHost);
            setShootingIsReady(me.isReady);
          }

          if (state.config) {
            setShootingConfig({
              matchDurationSec: state.config.matchDurationSec,
              scoreLimit: state.config.scoreLimit,
              selectedMap: state.config.selectedMap,
              respawnDelaySec: state.config.respawnDelaySec,
              friendlyFire: state.config.friendlyFire
            });
          }
        };

        r.onStateChange(updateShootingState);

        r.onMessage(ServerMessageType.RECONNECTION_TOKEN, (data: { token: string }) => {
          saveReconnectionToken(roomCode, data.token);
        });

        r.onMessage(ServerMessageType.SYSTEM_NOTIFICATION, (data: { message: string }) => {
          setChatMessages((prev) => [
            ...prev,
            { id: Math.random().toString(), senderName: "SYSTEM", message: data.message, isSystem: true, timestamp: Date.now() }
          ]);
        });

        r.onMessage(ServerMessageType.CHAT_MESSAGE, (data: ChatMessagePayload) => {
          setChatMessages((prev) => [
            ...prev,
            { id: Math.random().toString(), senderName: data.senderName, message: data.message, timestamp: data.timestamp }
          ]);
        });

        r.onMessage(ServerMessageType.ERROR_NOTIFICATION, (data: { message: string }) => {
          setNotification({ text: data.message, type: "error" });
          setTimeout(() => setNotification(null), 5000);
        });
      } catch (err: any) {
        setConnectionStatus("disconnected");
        setNotification({ text: err.message || "Failed to connect to Shooting room.", type: "error" });
      }
    }

    initRoomRouting();

    return () => {
      isSubscribed = false;
      if (activeMafiaRoom) activeMafiaRoom.leave();
      if (activeShootingRoom) activeShootingRoom.leave();
    };
  }, [roomCode, searchParams]);

  // Host Selects Game Mode from GameSelectionScreen
  const handleHostSelectGame = (mode: GameMode) => {
    const displayName = getSavedPlayerName() || `Player_${Math.floor(Math.random() * 1000)}`;
    if (mode === GameMode.SHOOTING) {
      router.push(`/lobby/${roomCode}?game=shooting`);
    } else {
      router.push(`/lobby/${roomCode}?game=mafia`);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMafiaReadyToggle = () => {
    mafiaRoom?.send(ClientMessageType.READY_TOGGLE);
  };

  const handleMafiaConfigChange = (delta: Partial<typeof mafiaConfig>) => {
    mafiaRoom?.send(ClientMessageType.UPDATE_CONFIG, { ...mafiaConfig, ...delta });
  };

  const handleMafiaStartGame = () => {
    mafiaRoom?.send(ClientMessageType.START_GAME);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (activeGameMode === GameMode.MAFIA && mafiaRoom) {
      mafiaRoom.send(ClientMessageType.SEND_CHAT, { message: chatInput.trim() });
    } else if (activeGameMode === GameMode.SHOOTING && shootingRoom) {
      shootingRoom.send(ClientMessageType.SEND_CHAT, { message: chatInput.trim() });
    }

    setChatInput("");
  };

  const handleLeaveRoom = () => {
    if (mafiaRoom) mafiaRoom.leave();
    if (shootingRoom) shootingRoom.leave();
    router.push("/");
  };

  // ---------------------------------------------------------------------------------
  // RENDER VIEW 1: GAME SELECTION SCREEN (UNSELECTED)
  // ---------------------------------------------------------------------------------
  if (activeGameMode === GameMode.UNSELECTED) {
    return (
      <GameSelectionScreen
        roomCode={roomCode}
        isHost={true}
        onSelectGame={handleHostSelectGame}
        onCancel={() => router.push("/")}
      />
    );
  }

  // ---------------------------------------------------------------------------------
  // RENDER VIEW 2: SHOOTING GAME LOBBY & COMBAT ARENA
  // ---------------------------------------------------------------------------------
  if (activeGameMode === GameMode.SHOOTING) {
    if (shootingRoom && shootingStatus === "ACTIVE") {
      // 3D Battlefield Arena & Tactical Combat HUD
      return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-noir-950">
          <ShootingGameScene
            room={shootingRoom}
            sessionId={shootingSessionId}
            players={shootingPlayers}
            mapName={shootingConfig.selectedMap}
            isHost={shootingIsHost}
          />

          <ShootingCombatHUD
            room={shootingRoom}
            sessionId={shootingSessionId}
            players={shootingPlayers}
            teams={shootingTeams}
            phaseEndsAt={shootingPhaseEndsAt}
            scoreLimit={shootingConfig.scoreLimit}
            selectedMap={shootingConfig.selectedMap}
            isHost={shootingIsHost}
            onReturnToLobby={() => shootingRoom.send(ClientMessageType.RESET_TO_LOBBY)}
            onLeaveRoom={handleLeaveRoom}
          />
        </div>
      );
    }

    if (shootingRoom && shootingStatus === "MATCH_OVER") {
      // 3D Battlefield Backdrop & Dedicated Post-Match Victory Podium Screen
      return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-noir-950">
          <ShootingGameScene
            room={shootingRoom}
            sessionId={shootingSessionId}
            players={shootingPlayers}
            mapName={shootingConfig.selectedMap}
            isHost={shootingIsHost}
          />

          <ShootingPostMatchScreen
            sessionId={shootingSessionId}
            players={shootingPlayers}
            teams={shootingTeams}
            winningTeamId={shootingWinningTeamId}
            isHost={shootingIsHost}
            scoreLimit={shootingConfig.scoreLimit}
            onReturnToLobby={() => shootingRoom.send(ClientMessageType.RESET_TO_LOBBY)}
            onLeaveRoom={handleLeaveRoom}
          />
        </div>
      );
    }

    if (shootingRoom) {
      return (
        <ShootingLobby
          room={shootingRoom}
          sessionId={shootingSessionId}
          roomCode={roomCode}
          players={shootingPlayers}
          teams={shootingTeams}
          isHost={shootingIsHost}
          isReady={shootingIsReady}
          config={shootingConfig}
          chatMessages={chatMessages}
          onSendChat={(msg) => shootingRoom.send(ClientMessageType.SEND_CHAT, { message: msg })}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center text-noir-400 font-mono text-xs">
        Connecting to Shooting Game Lobby...
      </div>
    );
  }

  // ---------------------------------------------------------------------------------
  // RENDER VIEW 3: MAFIA 3D (ACTIVE GAMEPLAY HUD)
  // ---------------------------------------------------------------------------------
  if (mafiaRoom && mafiaPhase !== "WAITING_FOR_PLAYERS") {
    return (
      <GameHUD
        room={mafiaRoom}
        sessionId={mafiaSessionId}
        players={mafiaPlayers}
        phase={mafiaPhase}
        roundNumber={mafiaRoundNumber}
        phaseStartedAt={mafiaPhaseStartedAt}
        phaseEndsAt={mafiaPhaseEndsAt}
        winningTeam={mafiaWinningTeam}
        isHost={mafiaIsHost}
        chatMessages={chatMessages}
        onSendChat={(msg) => {
          mafiaRoom.send(ClientMessageType.SEND_CHAT, { message: msg });
        }}
        onReturnToLobby={() => mafiaRoom.send(ClientMessageType.RESET_TO_LOBBY)}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // ---------------------------------------------------------------------------------
  // RENDER VIEW 4: MAFIA 3D LOBBY
  // ---------------------------------------------------------------------------------
  const minRequired = mafiaConfig.isDevMode ? 3 : 5;
  const canStart = mafiaPlayers.length >= minRequired;
  const roleBreakdown = mafiaPlayers.length >= (mafiaConfig.isDevMode ? 3 : 5)
    ? calculateRoleCounts(mafiaPlayers.length, mafiaConfig.mafiaPercentage, mafiaConfig.isDevMode)
    : null;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-noir-900 border border-noir-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-xs font-mono text-blood-400 uppercase tracking-wider font-semibold">Mafia 3D Lobby</div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="font-mono text-3xl font-black tracking-widest text-white">{roomCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-noir-800 hover:bg-noir-700 text-noir-300 hover:text-white transition"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="h-8 w-px bg-noir-800" />
          <div>
            <div className="text-xs font-mono text-noir-400 uppercase tracking-wider">Players</div>
            <div className="text-xl font-bold text-white mt-0.5 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-blood-500" />
              <span>{mafiaPlayers.length} Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
            <Wifi className="w-3.5 h-3.5" />
            <span>ONLINE</span>
          </span>

          <button
            onClick={handleLeaveRoom}
            className="text-xs font-mono text-noir-400 hover:text-white px-3 py-1.5 rounded-lg bg-noir-800 hover:bg-noir-700 transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`flex items-center space-x-2 p-3 rounded-xl border text-sm font-mono ${
          notification.type === "error"
            ? "bg-blood-600/10 border-blood-500/30 text-blood-300"
            : "bg-noir-800 border-noir-700 text-noir-200"
        }`}>
          <AlertTriangle className="w-4 h-4 text-blood-400 flex-shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Grid: Roster, Settings, Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Player Roster (5 cols) */}
        <div className="lg:col-span-5 bg-noir-900 border border-noir-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-noir-800 pb-3">
            <h2 className="font-bold text-white text-base flex items-center space-x-2">
              <Users className="w-4 h-4 text-blood-500" />
              <span>Lobby Players ({mafiaPlayers.length})</span>
            </h2>
            <span className="text-xs font-mono text-noir-400">Min {minRequired} to start</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {mafiaPlayers.map((p) => {
              const isMe = p.id === mafiaSessionId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isMe
                      ? "bg-blood-600/10 border-blood-500/30 text-white"
                      : "bg-noir-950/60 border-noir-800 text-noir-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-noir-800 flex items-center justify-center font-bold text-xs text-white uppercase">
                      {p.displayName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 font-bold text-sm">
                        <span>{p.displayName}</span>
                        {isMe && <span className="text-[10px] font-mono text-blood-400 font-normal">(YOU)</span>}
                        {p.isHost && (
                          <span title="Room Host">
                            <Crown className="w-3.5 h-3.5 text-amber-400 inline ml-1" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-noir-400">
                        {p.isConnected ? "Online" : "Reconnecting"}
                      </div>
                    </div>
                  </div>

                  <div>
                    {p.isReady ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-noir-800 text-noir-400 text-xs font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Waiting</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-noir-800 flex space-x-3">
            <button
              onClick={handleMafiaReadyToggle}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center space-x-2 ${
                mafiaIsReady
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500"
                  : "bg-noir-800 hover:bg-noir-700 text-noir-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{mafiaIsReady ? "READY" : "SET READY"}</span>
            </button>

            {mafiaIsHost && (
              <button
                disabled={!canStart}
                onClick={handleMafiaStartGame}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blood-600 to-blood-500 hover:from-blood-500 hover:to-blood-400 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-blood-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>START MATCH</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Settings + Chat (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-noir-800 pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-blood-500" />
                <h3 className="font-bold text-white text-sm">Mafia Game Settings</h3>
              </div>
              {!mafiaIsHost && <span className="text-[11px] font-mono text-noir-400">Host Managed</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                  <span>MAFIA RATIO</span>
                  <span className="font-mono text-blood-400 font-bold">{mafiaConfig.mafiaPercentage}%</span>
                </label>
                <select
                  disabled={!mafiaIsHost}
                  value={mafiaConfig.mafiaPercentage}
                  onChange={(e) => handleMafiaConfigChange({ mafiaPercentage: Number(e.target.value) })}
                  className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blood-500 disabled:opacity-75"
                >
                  <option value={15}>15% (Light)</option>
                  <option value={20}>20% (Standard)</option>
                  <option value={25}>25% (High Danger)</option>
                  <option value={30}>30% (Mayhem)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                  <span>NIGHT DURATION</span>
                  <span className="font-mono text-white font-bold">{mafiaConfig.nightDurationSec}s</span>
                </label>
                <select
                  disabled={!mafiaIsHost}
                  value={mafiaConfig.nightDurationSec}
                  onChange={(e) => handleMafiaConfigChange({ nightDurationSec: Number(e.target.value) })}
                  className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blood-500 disabled:opacity-75"
                >
                  <option value={20}>20 seconds</option>
                  <option value={30}>30 seconds (Default)</option>
                  <option value={45}>45 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                  <span>DAY DISCUSSION</span>
                  <span className="font-mono text-white font-bold">{mafiaConfig.discussionDurationSec}s</span>
                </label>
                <select
                  disabled={!mafiaIsHost}
                  value={mafiaConfig.discussionDurationSec}
                  onChange={(e) => handleMafiaConfigChange({ discussionDurationSec: Number(e.target.value) })}
                  className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blood-500 disabled:opacity-75"
                >
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>120 seconds (Default)</option>
                  <option value={180}>180 seconds</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                  <span>PUBLIC VOTING</span>
                  <span className="font-mono text-white font-bold">{mafiaConfig.votingDurationSec}s</span>
                </label>
                <select
                  disabled={!mafiaIsHost}
                  value={mafiaConfig.votingDurationSec}
                  onChange={(e) => handleMafiaConfigChange({ votingDurationSec: Number(e.target.value) })}
                  className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blood-500 disabled:opacity-75"
                >
                  <option value={20}>20 seconds</option>
                  <option value={30}>30 seconds (Default)</option>
                  <option value={45}>45 seconds</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-noir-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!mafiaIsHost}
                  checked={mafiaConfig.revealRoleOnDeath}
                  onChange={(e) => handleMafiaConfigChange({ revealRoleOnDeath: e.target.checked })}
                  className="rounded bg-noir-950 border-noir-700 text-blood-600 focus:ring-0 disabled:opacity-75 w-4 h-4"
                />
                <span className="text-noir-300">Reveal role upon elimination</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!mafiaIsHost}
                  checked={mafiaConfig.isDevMode}
                  onChange={(e) => handleMafiaConfigChange({ isDevMode: e.target.checked })}
                  className="rounded bg-noir-950 border-noir-700 text-blood-600 focus:ring-0 disabled:opacity-75 w-4 h-4"
                />
                <span className="text-amber-400 font-mono">Dev Mode (Min 3 players)</span>
              </label>
            </div>

            {roleBreakdown && (
              <div className="p-3 bg-noir-950 border border-noir-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-noir-400">At current settings:</span>
                <div className="flex items-center space-x-4">
                  <span className="text-blood-400 flex items-center space-x-1">
                    <Skull className="w-3.5 h-3.5 inline" />
                    <span>{roleBreakdown.mafiaCount} Mafia</span>
                  </span>
                  <span className="text-blue-400 flex items-center space-x-1">
                    <Shield className="w-3.5 h-3.5 inline" />
                    <span>{roleBreakdown.citizenCount} Citizens</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lobby Chat */}
          <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5 space-y-3 flex flex-col h-[280px]">
            <div className="flex items-center justify-between border-b border-noir-800 pb-2">
              <h3 className="font-bold text-white text-sm">Lobby Chat</h3>
              <span className="text-[11px] font-mono text-noir-400">Public Channel</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-noir-600 font-mono">
                  Say hi to your lobby mates...
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`leading-relaxed ${
                      msg.isSystem ? "text-amber-400/90 font-mono italic" : "text-noir-200"
                    }`}
                  >
                    {!msg.isSystem && <span className="font-bold text-white mr-1.5">{msg.senderName}:</span>}
                    <span>{msg.message}</span>
                  </div>
                ))
              )}
              <div ref={chatScrollRef} />
            </div>

            <form onSubmit={handleSendChat} className="flex space-x-2 pt-2 border-t border-noir-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a lobby message..."
                className="flex-1 px-3 py-2 bg-noir-950 border border-noir-700 rounded-xl text-xs text-white placeholder-noir-600 focus:outline-none focus:border-blood-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-noir-800 hover:bg-noir-700 text-white rounded-xl transition flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
