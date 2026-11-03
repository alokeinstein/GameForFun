"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Room } from "colyseus.js";
import {
  Phase,
  Role,
  WinningTeam
} from "@mafia/game-rules";
import {
  ClientMessageType,
  ServerMessageType,
  MafiaRoomState,
  PlayerState,
  ChatMessagePayload
} from "@mafia/shared";
import {
  Clock,
  Shield,
  Skull,
  Crosshair,
  Moon,
  Sun,
  MessageSquare,
  AlertOctagon,
  Trophy,
  RotateCcw,
  Check,
  Send,
  Eye,
  EyeOff,
  UserCheck,
  Ghost,
  Boxes,
  LayoutDashboard,
  Compass,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from "lucide-react";
import dynamic from "next/dynamic";
import { audioManager } from "../../services/audio";
import { voiceChatService } from "../../services/webrtc";

const GameScene = dynamic(
  () => import("../canvas/GameScene").then((mod) => mod.GameScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-noir-950 flex items-center justify-center text-noir-400 font-mono text-xs">
        Loading 3D Town Scene...
      </div>
    )
  }
);

export interface ChatItem {
  id: string;
  senderName: string;
  message: string;
  isSystem?: boolean;
  timestamp: number;
}

interface GameHUDProps {
  room: Room<MafiaRoomState>;
  sessionId: string;
  players: PlayerState[];
  phase: string;
  roundNumber: number;
  phaseStartedAt: number;
  phaseEndsAt: number;
  winningTeam: string;
  isHost: boolean;
  chatMessages: ChatItem[];
  onSendChat: (msg: string) => void;
  onReturnToLobby?: () => void;
  onLeaveRoom?: () => void;
}

function ChatWidget({
  isAlive,
  phase,
  chatMessages,
  chatInput,
  setChatInput,
  handleChatSubmit,
  heightClass = "h-[560px]"
}: {
  isAlive: boolean;
  phase: string;
  chatMessages: ChatItem[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleChatSubmit: (e: React.FormEvent) => void;
  heightClass?: string;
}) {
  return (
    <div className={`bg-noir-900/90 backdrop-blur-md border border-noir-800 rounded-2xl flex flex-col ${heightClass} shadow-xl overflow-hidden pointer-events-auto`}>
      <div className="p-3.5 border-b border-noir-800 bg-noir-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-white">
            Town Log & Chat
          </span>
        </div>
        <span className="text-[10px] font-mono text-noir-400">
          {isAlive || phase === Phase.VICTORY ? "Speech Enabled" : "Spectator Muted"}
        </span>
      </div>

      <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto font-sans text-xs">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-noir-500 text-center px-4">
            No town announcements or chats yet.
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg p-2.5 text-xs ${
                msg.isSystem
                  ? "bg-noir-950 border border-noir-800 text-amber-300 font-mono"
                  : "bg-noir-800/60 text-noir-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold font-mono text-[11px] ${
                  msg.isSystem ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {msg.senderName}
                </span>
                <span className="text-[10px] text-noir-500 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <p className="break-words leading-relaxed">{msg.message}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleChatSubmit} className="p-2.5 border-t border-noir-800 bg-noir-950/80 flex space-x-2">
        <input
          type="text"
          disabled={!isAlive && phase !== Phase.VICTORY}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={
            isAlive || phase === Phase.VICTORY
              ? "Send message to town..."
              : "Eliminated players cannot speak to living players"
          }
          className="flex-1 bg-noir-900 border border-noir-800 rounded-xl px-3 py-2 text-xs text-white placeholder-noir-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={(!isAlive && phase !== Phase.VICTORY) || !chatInput.trim()}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

export function GameHUD({
  room,
  sessionId,
  players,
  phase,
  roundNumber,
  phaseStartedAt,
  phaseEndsAt,
  winningTeam,
  isHost,
  chatMessages,
  onSendChat,
  onReturnToLobby,
  onLeaveRoom
}: GameHUDProps) {
  // --- Private Role State ---
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [mafiaTeammates, setMafiaTeammates] = useState<Array<{ id: string; displayName: string }>>([]);
  const [allRevealedRoles, setAllRevealedRoles] = useState<Record<string, { displayName: string; role: Role }> | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleRevealedInModal, setRoleRevealedInModal] = useState(false);

  // --- Voting & Targeting State ---
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [mafiaBallots, setMafiaBallots] = useState<Record<string, string>>({});
  const [mafiaVoteCounts, setMafiaVoteCounts] = useState<Record<string, number>>({});

  // --- Chat & View Mode ---
  const [chatInput, setChatInput] = useState("");
  const [viewMode, setViewMode] = useState<"3d" | "hud">("3d");
  const [isChatOpen, setIsChatOpen] = useState(true);

  // --- Audio & WebRTC Voice State ---
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(0.7);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [, setVoiceTick] = useState(0);

  // --- Authoritative Countdown Sync ---
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const lastTickSecRef = useRef<number>(-1);

  // Initialize Voice Chat and Audio Subscriptions
  useEffect(() => {
    if (!room) return;

    voiceChatService.init(room).catch((err) => {
      console.warn("Failed to initialize voice chat:", err);
    });

    setIsMicMuted(voiceChatService.getIsMuted());
    setIsSpeaking(voiceChatService.getIsSpeaking());
    setSfxMuted(audioManager.isMuted());
    setSfxVolume(audioManager.getVolume());

    const unsubVoice = voiceChatService.subscribe(() => {
      setIsMicMuted(voiceChatService.getIsMuted());
      setIsSpeaking(voiceChatService.getIsSpeaking());
      setVoiceTick((t) => t + 1);
    });

    const unsubAudio = audioManager.subscribe(() => {
      setSfxMuted(audioManager.isMuted());
      setSfxVolume(audioManager.getVolume());
    });

    return () => {
      unsubVoice();
      unsubAudio();
      voiceChatService.cleanup();
    };
  }, [room]);

  // Global keybind for Mic Toggle (M key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        const muted = voiceChatService.toggleMute();
        setIsMicMuted(muted);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Self player
  const me = useMemo(() => {
    return players.find((p) => p.id === sessionId);
  }, [players, sessionId]);

  const isAlive = me?.isAlive ?? true;

  // Living players
  const livingPlayers = useMemo(() => {
    return players.filter((p) => p.isAlive);
  }, [players]);

  // Dead players
  const deadPlayers = useMemo(() => {
    return players.filter((p) => !p.isAlive);
  }, [players]);

  // Living citizens (for Mafia targeting)
  const livingCitizensForMafia = useMemo(() => {
    if (myRole !== Role.MAFIA) return [];
    const mafiaIds = new Set(mafiaTeammates.map((m) => m.id));
    return livingPlayers.filter((p) => !mafiaIds.has(p.id));
  }, [livingPlayers, myRole, mafiaTeammates]);

  // Calculate vote threshold (>= 50% of living voters)
  const votesRequired = useMemo(() => {
    return Math.ceil(livingPlayers.length * 0.5);
  }, [livingPlayers.length]);

  // Timer loop with urgent clock ticks
  useEffect(() => {
    const updateClock = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((phaseEndsAt - now) / 1000));
      setSecondsRemaining(remaining);

      const total = Math.max(1000, phaseEndsAt - phaseStartedAt);
      const elapsed = Math.max(0, now - phaseStartedAt);
      const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
      setProgressPercent(pct);

      // Play clock tick for final 10 seconds of active debate / voting
      if (
        remaining <= 10 &&
        remaining > 0 &&
        remaining !== lastTickSecRef.current &&
        (phase === Phase.DAY_DISCUSSION || phase === Phase.DAY_VOTING || phase === Phase.REVOTING)
      ) {
        lastTickSecRef.current = remaining;
        audioManager.playClockTick(remaining <= 4);
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 200);
    return () => clearInterval(interval);
  }, [phaseStartedAt, phaseEndsAt, phase]);

  // Reset phase-specific selections and play phase audio sting on phase change
  useEffect(() => {
    setSelectedTargetId(null);
    setHasVoted(false);
    audioManager.playPhaseTransition(phase as Phase);

    if (phase === Phase.ROLE_ASSIGNMENT) {
      setShowRoleModal(true);
      setRoleRevealedInModal(false);
    }
  }, [phase]);

  // Listen for private messages from game server
  useEffect(() => {
    if (!room) return;

    // 1. Private Role Assignment & Final Post-Game Reveal
    const unregisterRole = room.onMessage(
      ServerMessageType.ROLE_ASSIGNMENT,
      (data: {
        role?: Role;
        teammates?: Array<{ id: string; displayName: string }>;
        isGameOverReveal?: boolean;
        allRoles?: Record<string, { displayName: string; role: Role }>;
        winningTeam?: string;
      }) => {
        if (data.isGameOverReveal && data.allRoles) {
          setAllRevealedRoles(data.allRoles);
        } else if (data.role) {
          setMyRole(data.role);
          if (data.teammates) {
            setMafiaTeammates(data.teammates);
          }
          setShowRoleModal(true);
        }
      }
    );

    // 2. Mafia Target Updates (living Mafia only)
    const unregisterMafiaUpdate = room.onMessage(
      ServerMessageType.MAFIA_TARGET_UPDATE,
      (data: { ballots: Record<string, string>; candidateVotes: Record<string, number> }) => {
        setMafiaBallots(data.ballots || {});
        setMafiaVoteCounts(data.candidateVotes || {});
      }
    );

    // 3. Vote Confirmed
    const unregisterVoteConfirm = room.onMessage(
      ServerMessageType.VOTE_CAST_CONFIRMED,
      (data: { targetId: string }) => {
        setSelectedTargetId(data.targetId);
        setHasVoted(true);
      }
    );

    return () => {
      // colyseus.js doesn't provide unregister directly, but handlers stay scoped to room lifecycle
    };
  }, [room]);

  // Handlers
  const handleMafiaTargetVote = (targetId: string) => {
    if (!room || !isAlive || myRole !== Role.MAFIA || phase !== Phase.NIGHT) return;
    audioManager.playVoteConfirm();
    setSelectedTargetId(targetId);
    room.send(ClientMessageType.MAFIA_TARGET_VOTE, { targetId });
  };

  const handleCastDayVote = (targetId: string) => {
    if (!room || !isAlive || (phase !== Phase.DAY_VOTING && phase !== Phase.REVOTING)) return;
    audioManager.playVoteConfirm();
    setSelectedTargetId(targetId);
    setHasVoted(true);
    room.send(ClientMessageType.CAST_VOTE, { targetId });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput("");
  };

  // Phase metadata badge
  const phaseInfo = useMemo(() => {
    switch (phase) {
      case Phase.ROLE_ASSIGNMENT:
        return {
          title: "Role Briefing",
          subtitle: "Read your private dossier. Your identity is classified.",
          color: "border-indigo-500/50 text-indigo-400 bg-indigo-500/10",
          icon: <Shield className="w-5 h-5 text-indigo-400" />
        };
      case Phase.NIGHT:
        return {
          title: "Night Falls",
          subtitle: "The city sleeps. The Syndicate coordinates in the shadows.",
          color: "border-blue-500/50 text-blue-400 bg-blue-500/10",
          icon: <Moon className="w-5 h-5 text-blue-400" />
        };
      case Phase.MORNING_ANNOUNCEMENT:
        return {
          title: "Dawn Awakens",
          subtitle: "The town discovers who survived the night.",
          color: "border-amber-500/50 text-amber-400 bg-amber-500/10",
          icon: <Sun className="w-5 h-5 text-amber-400" />
        };
      case Phase.DAY_DISCUSSION:
        return {
          title: "Town Assembly",
          subtitle: "Discuss suspicious behaviors and formulate theories.",
          color: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
          icon: <MessageSquare className="w-5 h-5 text-emerald-400" />
        };
      case Phase.DAY_VOTING:
        return {
          title: "Public Tribunal",
          subtitle: `Eliminate a suspect. Strict 50% majority required (≥ ${votesRequired} votes).`,
          color: "border-red-500/50 text-red-400 bg-red-500/10",
          icon: <Crosshair className="w-5 h-5 text-red-400" />
        };
      case Phase.REVOTING:
        return {
          title: "Runoff Revote",
          subtitle: "Tie detected! Vote between tied candidates only.",
          color: "border-orange-500/50 text-orange-400 bg-orange-500/10",
          icon: <AlertOctagon className="w-5 h-5 text-orange-400" />
        };
      case Phase.ELIMINATION_ANNOUNCEMENT:
        return {
          title: "Tribunal Verdict",
          subtitle: "The council executes judgment.",
          color: "border-rose-500/50 text-rose-400 bg-rose-500/10",
          icon: <Skull className="w-5 h-5 text-rose-400" />
        };
      case Phase.VICTORY:
        return {
          title: "Match Concluded",
          subtitle: winningTeam === WinningTeam.MAFIA ? "The Mafia reigns supreme." : "The Citizens restored peace.",
          color: "border-gold-500/50 text-gold-400 bg-gold-500/10",
          icon: <Trophy className="w-5 h-5 text-gold-400" />
        };
      default:
        return {
          title: phase,
          subtitle: "Waiting for game update...",
          color: "border-noir-700 text-noir-300 bg-noir-800/40",
          icon: <Clock className="w-5 h-5" />
        };
    }
  }, [phase, votesRequired, winningTeam]);

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">
      {/* 3D Scene Layer (Fixed Background Canvas) */}
      <GameScene
        room={room}
        sessionId={sessionId}
        players={players}
        phase={phase}
        isHost={isHost}
      />

      {/* Floating HUD Container (Overlays 3D Scene) */}
      <div className={`relative z-10 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 ${
        viewMode === "3d" ? "pointer-events-none" : "pointer-events-auto"
      }`}>
        {/* 1. TOP STATUS & CLOCK HUD */}
        <div className="bg-noir-900/85 backdrop-blur-md border border-noir-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden pointer-events-auto">
        {/* Progress bar along top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-noir-800">
          <div
            className="h-full bg-gradient-to-r from-blood-600 via-amber-500 to-emerald-500 transition-all duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Phase Badge & Description */}
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl border ${phaseInfo.color}`}>
              {phaseInfo.icon}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs uppercase tracking-widest text-noir-400">
                  Round {roundNumber}
                </span>
                <span className="text-noir-600">•</span>
                <span className="font-bold text-white tracking-wide text-lg">
                  {phaseInfo.title}
                </span>
              </div>
              <p className="text-xs text-noir-300 mt-0.5 max-w-md">
                {phaseInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Countdown & Alive Counter */}
          <div className="flex items-center space-x-4 self-end md:self-auto">
            {/* Countdown Timer */}
            <div className="flex items-center space-x-2 bg-noir-950/80 border border-noir-800 px-4 py-2.5 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="font-mono font-black text-2xl text-white tracking-wider">
                {secondsRemaining}s
              </div>
            </div>

            {/* Living Survivors Counter */}
            <div className="hidden sm:flex flex-col items-end bg-noir-950/60 border border-noir-800 px-3.5 py-2 rounded-xl text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-noir-400">Survivors</span>
              <span className="text-sm font-bold text-emerald-400">
                {livingPlayers.length} / {players.length} Alive
              </span>
            </div>

            {/* My Role Pill & Peek Button */}
            {myRole && (
              <button
                onClick={() => setShowRoleModal(true)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border transition ${
                  myRole === Role.MAFIA
                    ? "bg-blood-600/20 border-blood-500/50 text-blood-400 hover:bg-blood-600/30"
                    : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
                }`}
                title="View your secret dossier"
              >
                {myRole === Role.MAFIA ? <Skull className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  {myRole}
                </span>
              </button>
            )}

            {/* Living / Dead status badge */}
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono uppercase tracking-wider ${
                isAlive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-noir-800 border-noir-700 text-noir-400 flex items-center space-x-1"
              }`}
            >
              {isAlive ? "Alive" : (
                <>
                  <Ghost className="w-3.5 h-3.5 text-noir-400" />
                  <span>Eliminated</span>
                </>
              )}
            </div>

            {/* View Mode Switcher */}
            <button
              onClick={() => setViewMode(viewMode === "3d" ? "hud" : "3d")}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-noir-700 bg-noir-800/90 hover:bg-noir-700 text-xs font-mono font-bold text-white transition pointer-events-auto shadow-sm"
              title="Toggle between 3D Town View and Dossier View"
            >
              {viewMode === "3d" ? (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dossier View</span>
                </>
              ) : (
                <>
                  <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3D Town</span>
                </>
              )}
            </button>

            {/* WebRTC Voice Chat Controls */}
            <button
              onClick={() => {
                const muted = voiceChatService.toggleMute();
                setIsMicMuted(muted);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition pointer-events-auto shadow-sm text-xs font-mono font-bold ${
                isMicMuted
                  ? "bg-rose-950/40 border-rose-800/80 text-rose-400 hover:bg-rose-900/50"
                  : isSpeaking
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 animate-pulse"
                  : "bg-noir-800/90 border-noir-700 text-emerald-400 hover:bg-noir-700"
              }`}
              title={isMicMuted ? "Unmute Microphone (Key: M)" : "Mute Microphone (Key: M)"}
            >
              {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{isMicMuted ? "Muted" : isSpeaking ? "Speaking" : "Mic"}</span>
              <span className="text-[9px] text-noir-400 bg-noir-900/80 px-1 py-0.5 rounded border border-noir-700 ml-0.5">M</span>
            </button>

            {/* Procedural Audio SFX Controls */}
            <div className="relative pointer-events-auto flex items-center">
              <button
                onClick={() => {
                  const muted = audioManager.toggleMute();
                  setSfxMuted(muted);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowVolumeSlider(!showVolumeSlider);
                }}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border transition shadow-sm text-xs font-mono font-bold ${
                  sfxMuted
                    ? "bg-noir-900 border-noir-800 text-noir-500 hover:text-noir-300"
                    : "bg-noir-800/90 border-noir-700 text-amber-400 hover:bg-noir-700"
                }`}
                title={sfxMuted ? "Unmute Sound Effects (Right click for volume)" : "Mute Sound Effects (Right click for volume)"}
              >
                {sfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {showVolumeSlider && (
                <div className="absolute right-0 top-10 bg-noir-950/95 border border-noir-800 p-3 rounded-xl shadow-2xl z-50 flex items-center space-x-2">
                  <Volume2 className="w-3.5 h-3.5 text-noir-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxMuted ? 0 : sfxVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      audioManager.setVolume(val);
                      if (val > 0 && sfxMuted) {
                        audioManager.setMuted(false);
                      }
                    }}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-noir-300 w-6">
                    {Math.round(sfxVolume * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Hint Pill in 3D Mode */}
      {viewMode === "3d" && (
        <div className="flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-noir-950/80 backdrop-blur-md border border-noir-800/80 text-noir-300 text-[11px] font-mono pointer-events-auto shadow-md">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white font-bold">WASD:</span>
            <span>Move</span>
            <span className="text-noir-600">•</span>
            <span className="text-amber-400 font-bold">Shift:</span>
            <span>Sprint</span>
            <span className="text-noir-600">•</span>
            <span className="text-emerald-400 font-bold">M:</span>
            <span>Mic</span>
          </div>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-noir-950/80 backdrop-blur-md border border-noir-800/80 text-noir-300 hover:text-white text-[11px] font-mono pointer-events-auto transition shadow-md"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isChatOpen ? "Hide Chat" : "Show Chat"}</span>
          </button>
        </div>
      )}

      {/* 2. MAIN INTERACTIVE STAGE & CHAT LAYOUT */}
      <div className={`grid-cols-1 lg:grid-cols-3 gap-6 ${
        viewMode === "3d" && phase !== Phase.VICTORY ? "hidden" : "grid pointer-events-auto"
      }`}>
        {/* Left 2 Columns: Dynamic Phase Stage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phase 1: ROLE ASSIGNMENT */}
          {phase === Phase.ROLE_ASSIGNMENT && (
            <div className="bg-noir-900 border border-indigo-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Shield className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Assigning Classified Roles
              </h2>
              <p className="text-sm text-noir-300 max-w-md mx-auto">
                Roles are cryptographically distributed in secret. No player knows your identity. Check your role dossier.
              </p>
              <button
                onClick={() => setShowRoleModal(true)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide transition shadow-lg shadow-indigo-600/30"
              >
                Open Secret Dossier
              </button>
            </div>
          )}

          {/* Phase 2: NIGHT PHASE */}
          {phase === Phase.NIGHT && (
            <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6 space-y-6 shadow-xl">
              {myRole === Role.MAFIA && isAlive ? (
                /* Mafia Night Interface */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-blood-400 flex items-center space-x-2">
                        <Skull className="w-5 h-5 text-blood-500" />
                        <span>Syndicate Hit Order</span>
                      </h3>
                      <p className="text-xs text-noir-400 mt-0.5">
                        Select a citizen to assassinate. Strict PLURALITY decides the victim; tied votes result in NO kill.
                      </p>
                    </div>
                    {mafiaTeammates.length > 1 && (
                      <div className="text-xs font-mono bg-blood-950/40 border border-blood-800/40 px-3 py-1 rounded-lg text-blood-300">
                        Teammates: {mafiaTeammates.map((m) => m.displayName).join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Citizen Target Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {livingCitizensForMafia.map((citizen) => {
                      const isSelected = selectedTargetId === citizen.id;
                      const votesOnCandidate = mafiaVoteCounts[citizen.id] || 0;

                      return (
                        <button
                          key={citizen.id}
                          onClick={() => handleMafiaTargetVote(citizen.id)}
                          className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-blood-950/40 border-blood-500 text-white shadow-lg shadow-blood-900/30"
                              : "bg-noir-950/60 border-noir-800 hover:border-noir-700 text-noir-200"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                              isSelected ? "bg-blood-600 text-white" : "bg-noir-800 text-noir-300"
                            }`}>
                              {citizen.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{citizen.displayName}</div>
                              <div className="text-[11px] text-noir-400">Citizen Target</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {votesOnCandidate > 0 && (
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blood-600/30 border border-blood-500/40 text-blood-300 font-bold">
                                {votesOnCandidate} {votesOnCandidate === 1 ? "Hit Vote" : "Hit Votes"}
                              </span>
                            )}
                            <Crosshair className={`w-4 h-4 ${isSelected ? "text-blood-400" : "text-noir-600"}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedTargetId && (
                    <div className="flex items-center space-x-2 text-xs font-mono text-blood-400 bg-blood-950/30 border border-blood-800/30 p-3 rounded-xl">
                      <Check className="w-4 h-4" />
                      <span>
                        Target locked on{" "}
                        <strong className="text-white">
                          {players.find((p) => p.id === selectedTargetId)?.displayName}
                        </strong>
                        . You can change your target until the night timer expires.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Citizen or Dead Player Night Screen */
                <div className="py-12 px-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                    <Moon className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-wide">
                    The Town is Asleep
                  </h3>
                  <p className="text-sm text-noir-400 max-w-sm mx-auto">
                    The streets are shrouded in darkness. The Mafia is plotting in the shadows. Dawn breaks when the timer strikes zero.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Phase 3: MORNING ANNOUNCEMENT */}
          {phase === Phase.MORNING_ANNOUNCEMENT && (
            <div className="bg-noir-900 border border-amber-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Sun className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Dawn Over the City
              </h2>
              <p className="text-sm text-noir-300 max-w-md mx-auto">
                The morning bell tolls. Check the town notification feed to see if anyone was murdered during the night.
              </p>
            </div>
          )}

          {/* Phase 4: DAY DISCUSSION */}
          {phase === Phase.DAY_DISCUSSION && (
            <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    <span>Town Discussion Phase</span>
                  </h3>
                  <p className="text-xs text-noir-400 mt-0.5">
                    Question suspects, analyze night outcomes, and coordinate before public voting begins.
                  </p>
                </div>
              </div>

              {/* Player Roster Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border flex items-center space-x-3 ${
                      p.isAlive
                        ? "bg-noir-950/60 border-noir-800"
                        : "bg-noir-950/30 border-noir-800/40 opacity-50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                      p.isAlive ? "bg-noir-800 text-noir-200" : "bg-noir-900 text-noir-500"
                    }`}>
                      {p.isAlive ? p.displayName.charAt(0).toUpperCase() : <Skull className="w-4 h-4 text-noir-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate flex items-center space-x-1.5">
                        <span>{p.displayName}</span>
                        {p.id === sessionId && (
                          <span className="text-[10px] text-noir-400 font-mono">(You)</span>
                        )}
                        {(voiceChatService.isPeerSpeaking(p.id) || (p.id === sessionId && isSpeaking && !isMicMuted)) && (
                          <Mic className="w-3 h-3 text-emerald-400 animate-pulse ml-1" />
                        )}
                      </div>
                      <div className="text-xs font-mono">
                        {p.isAlive ? (
                          <span className="text-emerald-400">Alive</span>
                        ) : (
                          <span className="text-noir-500">Eliminated</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 5 & 6: DAY VOTING & RUNOFF REVOTING */}
          {(phase === Phase.DAY_VOTING || phase === Phase.REVOTING) && (
            <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-noir-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center space-x-2">
                    <Crosshair className="w-5 h-5 text-red-500" />
                    <span>{phase === Phase.REVOTING ? "Runoff Vote" : "Secret Ballot Voting"}</span>
                  </h3>
                  <p className="text-xs text-noir-400 mt-0.5">
                    {phase === Phase.REVOTING
                      ? "Vote for one of the tied runoff candidates."
                      : "Votes are confidential until tallied. Mandatory ≥ 50% majority required to eliminate."}
                  </p>
                </div>

                <div className="bg-noir-950/80 border border-noir-800 px-3 py-1.5 rounded-lg text-right">
                  <div className="text-[10px] font-mono text-noir-400 uppercase">Elimination Threshold</div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    ≥ {votesRequired} of {livingPlayers.length} votes required
                  </div>
                </div>
              </div>

              {isAlive ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {livingPlayers.map((target) => {
                    const isSelf = target.id === sessionId;
                    const isSelected = selectedTargetId === target.id;

                    return (
                      <button
                        key={target.id}
                        disabled={isSelf}
                        onClick={() => handleCastDayVote(target.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-950/40"
                            : isSelf
                            ? "bg-noir-950/20 border-noir-800/40 opacity-40 cursor-not-allowed"
                            : "bg-noir-950/60 border-noir-800 hover:border-noir-700 text-noir-200"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isSelected ? "bg-red-600 text-white" : "bg-noir-800 text-noir-300"
                          }`}>
                            {target.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm flex items-center space-x-1.5">
                              <span>{target.displayName}</span>
                              {isSelf && <span className="text-[10px] text-noir-400">(Self)</span>}
                              {(voiceChatService.isPeerSpeaking(target.id) || (target.id === sessionId && isSpeaking && !isMicMuted)) && (
                                <Mic className="w-3 h-3 text-emerald-400 animate-pulse ml-1" />
                              )}
                            </div>
                            <div className="text-[11px] text-noir-400">
                              {isSelf ? "Self-voting disabled" : "Click to eliminate"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          {isSelected ? (
                            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold flex items-center space-x-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Voted</span>
                            </span>
                          ) : (
                            <Crosshair className="w-4 h-4 text-noir-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-noir-400 text-sm">
                  <Ghost className="w-8 h-8 text-noir-500 mx-auto mb-2" />
                  You are eliminated and cannot cast votes.
                </div>
              )}

              {hasVoted && (
                <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 p-3 rounded-xl">
                  <Check className="w-4 h-4" />
                  <span>
                    Your vote has been cast. The council will announce results once the voting timer expires.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Phase 7: ELIMINATION ANNOUNCEMENT */}
          {phase === Phase.ELIMINATION_ANNOUNCEMENT && (
            <div className="bg-noir-900 border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Skull className="w-8 h-8 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Judgment Executed
              </h2>
              <p className="text-sm text-noir-300 max-w-md mx-auto">
                The town tribunal reached its consensus. Review the notification feed to see the outcome and revealed role.
              </p>
            </div>
          )}

          {/* Phase 8: VICTORY SCREEN */}
          {phase === Phase.VICTORY && (
            <div className="bg-noir-900 border border-gold-500/40 rounded-2xl p-8 space-y-6 shadow-2xl">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400">
                  <Trophy className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-wide">
                  {winningTeam === WinningTeam.CITIZENS ? (
                    <span className="text-emerald-400">CITIZENS PREVAIL</span>
                  ) : (
                    <span className="text-blood-500">MAFIA DOMINATION</span>
                  )}
                </h2>
                <p className="text-sm text-noir-300 max-w-md mx-auto">
                  {winningTeam === WinningTeam.CITIZENS
                    ? "All Mafia syndicate members have been eliminated. The city is safe!"
                    : "The Mafia reached parity with the Citizens. The city falls under syndicate control!"}
                </p>
              </div>

              {/* Complete Post-Game Role Reveal Table */}
              {allRevealedRoles && (
                <div className="border border-noir-800 rounded-xl overflow-hidden">
                  <div className="bg-noir-950 px-4 py-2.5 border-b border-noir-800 font-mono text-xs font-bold text-noir-400 uppercase tracking-wider">
                    Full Roster Role Reveal
                  </div>
                  <div className="divide-y divide-noir-800">
                    {Object.entries(allRevealedRoles).map(([id, info]) => {
                      const isMafia = info.role === Role.MAFIA;
                      const player = players.find((p) => p.id === id);

                      return (
                        <div key={id} className="px-4 py-3 flex items-center justify-between bg-noir-900/50">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isMafia ? "bg-blood-600 text-white" : "bg-emerald-600 text-white"
                            }`}>
                              {info.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{info.displayName}</div>
                              <div className="text-[11px] font-mono text-noir-400">
                                {player?.isAlive ? (
                                  <span className="text-emerald-400">Survived</span>
                                ) : (
                                  <span className="text-rose-400">Eliminated</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider ${
                            isMafia
                              ? "bg-blood-600/20 border border-blood-500/40 text-blood-400"
                              : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                          }`}>
                            {info.role}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center space-x-4 pt-2">
                {isHost ? (
                  <button
                    onClick={onReturnToLobby}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-noir-950 font-bold text-sm tracking-wide transition shadow-lg shadow-gold-500/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Return to Lobby</span>
                  </button>
                ) : (
                  <div className="text-xs font-mono text-noir-400">
                    Waiting for room host to return to lobby...
                  </div>
                )}
                {onLeaveRoom && (
                  <button
                    onClick={onLeaveRoom}
                    className="px-6 py-3 rounded-xl bg-noir-800 hover:bg-noir-700 text-white font-bold text-sm transition border border-noir-700"
                  >
                    Leave Room
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Town Hall Chat & Event Feed */}
        <div className="space-y-4">
          <ChatWidget
            isAlive={isAlive}
            phase={phase}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChatSubmit={handleChatSubmit}
            heightClass="h-[560px]"
          />
        </div>
      </div>

      {/* Floating 3D Mode Widgets */}
      {viewMode === "3d" && isChatOpen && phase !== Phase.VICTORY && (
        <div className="fixed bottom-6 right-6 z-30 w-80 sm:w-96 shadow-2xl pointer-events-auto">
          <ChatWidget
            isAlive={isAlive}
            phase={phase}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChatSubmit={handleChatSubmit}
            heightClass="h-[360px]"
          />
        </div>
      )}

      {/* Floating 3D Mode Day Voting Panel */}
      {viewMode === "3d" && (phase === Phase.DAY_VOTING || phase === Phase.REVOTING) && (
        <div className="fixed bottom-6 left-6 z-30 max-w-md w-full bg-noir-900/90 backdrop-blur-md border border-noir-800 rounded-2xl p-4 shadow-2xl pointer-events-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-red-500" />
              <span className="font-bold text-xs uppercase tracking-wider text-white">
                {phase === Phase.REVOTING ? "Runoff Vote" : "Tribunal Vote"}
              </span>
            </div>
            <div className="text-[10px] font-mono text-amber-400 font-bold">
              ≥ {votesRequired} votes needed
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {livingPlayers.map((target) => {
              const isSelf = target.id === sessionId;
              const isSelected = selectedTargetId === target.id;

              return (
                <button
                  key={target.id}
                  disabled={isSelf || !isAlive}
                  onClick={() => handleCastDayVote(target.id)}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    isSelected
                      ? "bg-red-600 border-red-500 text-white"
                      : isSelf
                      ? "bg-noir-950/40 border-noir-800/40 opacity-40 cursor-not-allowed text-noir-400"
                      : "bg-noir-950 border-noir-800 hover:border-noir-700 text-white"
                  }`}
                >
                  <span className="truncate flex items-center space-x-1">
                    <span>{target.displayName}</span>
                    {(voiceChatService.isPeerSpeaking(target.id) || (target.id === sessionId && isSpeaking && !isMicMuted)) && (
                      <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                    )}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-white ml-1 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating 3D Mode Mafia Night Hit Panel */}
      {viewMode === "3d" && phase === Phase.NIGHT && myRole === Role.MAFIA && isAlive && (
        <div className="fixed bottom-6 left-6 z-30 max-w-md w-full bg-blood-950/90 backdrop-blur-md border border-blood-800/80 rounded-2xl p-4 shadow-2xl pointer-events-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skull className="w-4 h-4 text-blood-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-blood-300">
                Syndicate Hit
              </span>
            </div>
            <span className="text-[10px] font-mono text-blood-400">Plurality wins</span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {livingCitizensForMafia.map((citizen) => {
              const isSelected = selectedTargetId === citizen.id;
              const votes = mafiaVoteCounts[citizen.id] || 0;

              return (
                <button
                  key={citizen.id}
                  onClick={() => handleMafiaTargetVote(citizen.id)}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    isSelected
                      ? "bg-blood-600 border-blood-500 text-white"
                      : "bg-blood-950/60 border-blood-900/60 hover:border-blood-700 text-blood-200"
                  }`}
                >
                  <span className="truncate">{citizen.displayName}</span>
                  {votes > 0 && (
                    <span className="text-[10px] bg-blood-800/80 px-1.5 py-0.5 rounded text-white font-mono ml-1">
                      {votes}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SECRET ROLE DOSSIER MODAL */}
      {showRoleModal && myRole && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-noir-900 border border-noir-800 rounded-3xl p-6 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-noir-400">Classified Dossier</span>
              <h3 className="text-xl font-bold text-white tracking-wide">Identity Assignment</h3>
            </div>

            {/* Role Card Graphic */}
            <div
              className={`p-8 rounded-2xl border transition-all ${
                myRole === Role.MAFIA
                  ? "bg-blood-950/30 border-blood-500/50 shadow-xl shadow-blood-950/40"
                  : "bg-emerald-950/30 border-emerald-500/50 shadow-xl shadow-emerald-950/40"
              }`}
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner">
                {myRole === Role.MAFIA ? (
                  <Skull className="w-10 h-10 text-blood-400" />
                ) : (
                  <Shield className="w-10 h-10 text-emerald-400" />
                )}
              </div>

              <div className="font-mono text-xs uppercase tracking-widest text-noir-400 mb-1">Your Role Is</div>
              <div className={`text-3xl font-black tracking-widest uppercase ${
                myRole === Role.MAFIA ? "text-blood-400" : "text-emerald-400"
              }`}>
                {myRole}
              </div>

              <p className="text-xs text-noir-300 mt-3 leading-relaxed">
                {myRole === Role.MAFIA
                  ? "You are part of the Mafia underworld. Eliminate citizens under the cover of night, blend into the discussion, and achieve parity."
                  : "You are an honest Citizen. Uncover the Mafia operatives through debate and eliminate them during Day Voting."}
              </p>

              {/* Mafia Teammates list */}
              {myRole === Role.MAFIA && mafiaTeammates.length > 0 && (
                <div className="mt-5 pt-4 border-t border-blood-900/50 text-left">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-blood-300 mb-2">
                    Syndicate Teammates:
                  </div>
                  <div className="space-y-1">
                    {mafiaTeammates.map((teammate) => (
                      <div key={teammate.id} className="text-xs text-white font-mono flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blood-500"></span>
                        <span>{teammate.displayName}</span>
                        {teammate.id === sessionId && <span className="text-noir-500">(You)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full py-3 rounded-xl bg-noir-800 hover:bg-noir-700 text-white font-bold text-sm tracking-wide transition border border-noir-700"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
