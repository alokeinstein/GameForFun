"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  WifiOff
} from "lucide-react";
import {
  ClientMessageType,
  ServerMessageType,
  MafiaRoomState,
  PlayerState,
  ChatMessagePayload
} from "@mafia/shared";
import { calculateRoleCounts } from "@mafia/game-rules";
import {
  joinOrCreateMafiaRoom,
  getSavedPlayerName,
  saveReconnectionToken
} from "../../../services/colyseus";
import { GameHUD } from "../../../components/game/GameHUD";

interface ChatItem {
  id: string;
  senderName: string;
  message: string;
  isSystem?: boolean;
  timestamp: number;
}

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = ((params.roomCode as string) || "").toUpperCase();

  const [room, setRoom] = useState<Room<MafiaRoomState> | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState("WAITING_FOR_PLAYERS");
  const [roundNumber, setRoundNumber] = useState(1);
  const [phaseStartedAt, setPhaseStartedAt] = useState(0);
  const [phaseEndsAt, setPhaseEndsAt] = useState(0);
  const [winningTeam, setWinningTeam] = useState("");
  const [config, setConfig] = useState({
    mafiaPercentage: 20,
    nightDurationSec: 30,
    discussionDurationSec: 120,
    votingDurationSec: 30,
    revealRoleOnDeath: true,
    isDevMode: false
  });

  const [chatMessages, setChatMessages] = useState<ChatItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: "error" | "info" } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!roomCode) return;

    let activeRoom: Room<MafiaRoomState> | null = null;
    let isSubscribed = true;

    async function connect() {
      try {
        setConnectionStatus("connecting");
        const displayName = getSavedPlayerName() || `Player_${Math.floor(Math.random() * 1000)}`;
        const r = await joinOrCreateMafiaRoom(roomCode, displayName);

        if (!isSubscribed) {
          r.leave();
          return;
        }

        activeRoom = r;
        setRoom(r);
        setSessionId(r.sessionId);
        setConnectionStatus("connected");

        // Sync initial state
        const updateState = (state: MafiaRoomState) => {
          if (!state) return;
          setPhase(state.phase);
          setRoundNumber(state.roundNumber || 1);
          setPhaseStartedAt(state.phaseStartedAt || 0);
          setPhaseEndsAt(state.phaseEndsAt || 0);
          setWinningTeam(state.winningTeam || "");

          const playerList: PlayerState[] = [];
          state.players.forEach((p) => playerList.push(p));
          setPlayers([...playerList]);

          const me = state.players.get(r.sessionId);
          if (me) {
            setIsHost(me.isHost);
            setIsReady(me.isReady);
          }

          if (state.config) {
            setConfig({
              mafiaPercentage: state.config.mafiaPercentage,
              nightDurationSec: state.config.nightDurationSec,
              discussionDurationSec: state.config.discussionDurationSec,
              votingDurationSec: state.config.votingDurationSec,
              revealRoleOnDeath: state.config.revealRoleOnDeath,
              isDevMode: state.config.isDevMode
            });
          }
        };

        r.onStateChange((state) => {
          updateState(state);
        });

        // Listen for private reconnection token
        r.onMessage(ServerMessageType.RECONNECTION_TOKEN, (data: { token: string }) => {
          saveReconnectionToken(roomCode, data.token);
        });

        // Listen for system notifications
        r.onMessage(ServerMessageType.SYSTEM_NOTIFICATION, (data: { message: string }) => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              senderName: "SYSTEM",
              message: data.message,
              isSystem: true,
              timestamp: Date.now()
            }
          ]);
        });

        // Listen for server errors
        r.onMessage(ServerMessageType.ERROR_NOTIFICATION, (data: { message: string }) => {
          setNotification({ text: data.message, type: "error" });
          setTimeout(() => setNotification(null), 5000);
        });

        // Listen for chat messages
        r.onMessage(ServerMessageType.CHAT_MESSAGE, (data: ChatMessagePayload) => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              senderName: data.senderName,
              message: data.message,
              timestamp: data.timestamp
            }
          ]);
        });

        r.onLeave((code) => {
          setConnectionStatus("disconnected");
        });
      } catch (err: any) {
        console.error("Failed to connect to room:", err);
        setConnectionStatus("disconnected");
        setNotification({
          text: err.message || "Failed to connect to multiplayer game server. Ensure server is running.",
          type: "error"
        });
      }
    }

    connect();

    return () => {
      isSubscribed = false;
      if (activeRoom) {
        activeRoom.leave();
      }
    };
  }, [roomCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    if (room) {
      room.send(ClientMessageType.READY_TOGGLE);
    }
  };

  const handleConfigChange = (patch: Partial<typeof config>) => {
    if (!room || !isHost) return;
    const nextConfig = { ...config, ...patch };
    setConfig(nextConfig);
    room.send(ClientMessageType.UPDATE_CONFIG, patch);
  };

  const handleStartGame = () => {
    if (!room || !isHost) return;
    room.send(ClientMessageType.START_GAME);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !chatInput.trim()) return;
    room.send(ClientMessageType.SEND_CHAT, { message: chatInput.trim() });
    setChatInput("");
  };

  const handleReturnToLobby = () => {
    if (!room || !isHost) return;
    room.send(ClientMessageType.RESET_TO_LOBBY);
  };

  const handleLeaveRoom = () => {
    if (room) {
      room.leave();
    }
    router.push("/");
  };

  // If match has started, render authoritative in-game HUD
  if (room && phase !== "WAITING_FOR_PLAYERS") {
    return (
      <GameHUD
        room={room}
        sessionId={sessionId}
        players={players}
        phase={phase}
        roundNumber={roundNumber}
        phaseStartedAt={phaseStartedAt}
        phaseEndsAt={phaseEndsAt}
        winningTeam={winningTeam}
        isHost={isHost}
        chatMessages={chatMessages}
        onSendChat={(msg) => {
          room.send(ClientMessageType.SEND_CHAT, { message: msg });
        }}
        onReturnToLobby={handleReturnToLobby}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Calculate live role counts for display
  const minRequired = config.isDevMode ? 3 : 5;
  const canStart = players.length >= minRequired;
  const roleBreakdown = players.length >= (config.isDevMode ? 3 : 5)
    ? calculateRoleCounts(players.length, config.mafiaPercentage, config.isDevMode)
    : null;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-noir-900 border border-noir-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-xs font-mono text-noir-400 uppercase tracking-wider">Room Code</div>
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
          <div className="h-8 w-px bg-noir-800"></div>
          <div>
            <div className="text-xs font-mono text-noir-400 uppercase tracking-wider">Players</div>
            <div className="text-xl font-bold text-white mt-0.5 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-blood-500" />
              <span>{players.length} Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2 text-xs font-mono">
            {connectionStatus === "connected" && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Wifi className="w-3.5 h-3.5" />
                <span>SYNCED</span>
              </span>
            )}
            {connectionStatus === "connecting" && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>CONNECTING...</span>
              </span>
            )}
            {connectionStatus === "disconnected" && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blood-500/10 text-blood-400 border border-blood-500/20">
                <WifiOff className="w-3.5 h-3.5" />
                <span>DISCONNECTED</span>
              </span>
            )}
          </div>

          <button
            onClick={() => router.push("/")}
            className="text-xs font-mono text-noir-400 hover:text-white px-3 py-1.5 rounded-lg bg-noir-800 hover:bg-noir-700 transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center space-x-2 p-3 rounded-xl border text-sm font-mono ${
            notification.type === "error"
              ? "bg-blood-600/10 border-blood-500/30 text-blood-300"
              : "bg-noir-800 border-noir-700 text-noir-200"
          }`}
        >
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
              <span>Lobby Players ({players.length})</span>
            </h2>
            <span className="text-xs font-mono text-noir-400">
              Min {minRequired} to start
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {players.map((p) => {
              const isMe = p.id === sessionId;
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
                            <Crown className="w-3.5 h-3.5 text-gold-500 inline ml-1" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-noir-400">
                        {p.isConnected ? "Online" : "Reconnecting (60s)"}
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-noir-800 text-noir-400 text-xs font-mono">
                        Waiting
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Player Ready & Host Start Actions */}
          <div className="pt-3 border-t border-noir-800 space-y-2.5">
            <button
              onClick={handleToggleReady}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center space-x-2 ${
                isReady
                  ? "bg-noir-800 hover:bg-noir-700 text-noir-200 border border-noir-700"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{isReady ? "Cancel Ready" : "I'm Ready"}</span>
            </button>

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center space-x-2 ${
                  canStart
                    ? "bg-gradient-to-r from-blood-600 to-blood-500 hover:from-blood-500 hover:to-blood-400 text-white shadow-lg shadow-blood-600/30 active:scale-[0.98]"
                    : "bg-noir-800 text-noir-500 cursor-not-allowed border border-noir-800"
                }`}
              >
                <Play className="w-4 h-4" />
                <span>
                  {canStart
                    ? "Start Game"
                    : `Need ${minRequired - players.length} more player${
                        minRequired - players.length > 1 ? "s" : ""
                      } to start`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Game Settings & Chat (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Game Settings Panel */}
          <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-noir-800 pb-3">
              <h2 className="font-bold text-white text-base flex items-center space-x-2">
                <Settings className="w-4 h-4 text-blood-500" />
                <span>Game Configuration {isHost ? "(Host Controls)" : "(Host Synced)"}</span>
              </h2>
              {isHost ? (
                <span className="text-xs font-mono text-blood-400">Editable by you</span>
              ) : (
                <span className="text-xs font-mono text-noir-400">Read-only</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Mafia Percentage */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                  <span>MAFIA PERCENTAGE</span>
                  <span className="text-blood-400 font-bold">{config.mafiaPercentage}%</span>
                </label>
                <div className="flex space-x-1.5">
                  {[10, 15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      disabled={!isHost}
                      onClick={() => handleConfigChange({ mafiaPercentage: pct })}
                      className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                        config.mafiaPercentage === pct
                          ? "bg-blood-600 text-white"
                          : "bg-noir-800 text-noir-300 hover:bg-noir-700 disabled:hover:bg-noir-800"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Night Timer */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                  <span>NIGHT DURATION</span>
                  <span className="font-mono text-white font-bold">{config.nightDurationSec}s</span>
                </label>
                <select
                  disabled={!isHost}
                  value={config.nightDurationSec}
                  onChange={(e) => handleConfigChange({ nightDurationSec: Number(e.target.value) })}
                  className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blood-500 disabled:opacity-75"
                >
                  <option value={20}>20 seconds</option>
                  <option value={30}>30 seconds (Default)</option>
                  <option value={45}>45 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>

              {/* Discussion Timer */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                  <span>DAY DISCUSSION</span>
                  <span className="font-mono text-white font-bold">{config.discussionDurationSec}s</span>
                </label>
                <select
                  disabled={!isHost}
                  value={config.discussionDurationSec}
                  onChange={(e) => handleConfigChange({ discussionDurationSec: Number(e.target.value) })}
                  className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blood-500 disabled:opacity-75"
                >
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>120 seconds (Default)</option>
                  <option value={180}>180 seconds</option>
                </select>
              </div>

              {/* Voting Timer */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                  <span>PUBLIC VOTING</span>
                  <span className="font-mono text-white font-bold">{config.votingDurationSec}s</span>
                </label>
                <select
                  disabled={!isHost}
                  value={config.votingDurationSec}
                  onChange={(e) => handleConfigChange({ votingDurationSec: Number(e.target.value) })}
                  className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blood-500 disabled:opacity-75"
                >
                  <option value={20}>20 seconds</option>
                  <option value={30}>30 seconds (Default)</option>
                  <option value={45}>45 seconds</option>
                </select>
              </div>
            </div>

            {/* Role Reveal & Dev Mode Toggles */}
            <div className="pt-2 border-t border-noir-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={config.revealRoleOnDeath}
                  onChange={(e) => handleConfigChange({ revealRoleOnDeath: e.target.checked })}
                  className="rounded bg-noir-950 border-noir-700 text-blood-600 focus:ring-0 disabled:opacity-75 w-4 h-4"
                />
                <span className="text-noir-300">Reveal role upon elimination (Open Grave)</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={config.isDevMode}
                  onChange={(e) => handleConfigChange({ isDevMode: e.target.checked })}
                  className="rounded bg-noir-950 border-noir-700 text-blood-600 focus:ring-0 disabled:opacity-75 w-4 h-4"
                />
                <span className="text-amber-400 font-mono">Dev Testing Mode (Min 3 players)</span>
              </label>
            </div>

            {/* Live Role Preview Banner */}
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

          {/* Lobby Real-Time Chat Box */}
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
                    {!msg.isSystem && (
                      <span className="font-bold text-white mr-1.5">{msg.senderName}:</span>
                    )}
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

