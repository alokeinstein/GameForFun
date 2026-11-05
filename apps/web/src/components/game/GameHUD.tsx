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
  VolumeX,
  X,
  MousePointer
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
  channel?: "PUBLIC" | "MAFIA" | "DEAD";
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
  myRole?: Role | null;
  mafiaTeammates?: Array<{ id: string; displayName: string }>;
  allRevealedRoles?: Record<string, { displayName: string; role: Role }> | null;
  onSendChat: (msg: string, channel?: "PUBLIC" | "MAFIA") => void;
  onReturnToLobby?: () => void;
  onLeaveRoom?: () => void;
}

function ChatWidget({
  isAlive,
  phase,
  myRole,
  chatMessages,
  onSendChat,
  heightClass = "h-[560px]"
}: {
  isAlive: boolean;
  phase: string;
  myRole: Role | null;
  chatMessages: ChatItem[];
  onSendChat: (msg: string, channel: "PUBLIC" | "MAFIA") => void;
  heightClass?: string;
}) {
  const [activeChannel, setActiveChannel] = useState<"PUBLIC" | "MAFIA">("PUBLIC");
  const [chatInput, setChatInput] = useState("");
  const isLivingMafia = myRole === Role.MAFIA && isAlive;

  // Non-mafia or eliminated players are restricted to PUBLIC
  const effectiveChannel = isLivingMafia ? activeChannel : "PUBLIC";

  const filteredMessages = useMemo(() => {
    return chatMessages.filter((msg) => {
      if (msg.isSystem) return true;
      if (effectiveChannel === "MAFIA") {
        return msg.channel === "MAFIA";
      }
      return msg.channel === "PUBLIC" || !msg.channel;
    });
  }, [chatMessages, effectiveChannel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim(), effectiveChannel);
    setChatInput("");
  };

  return (
    <div className={`bg-noir-900/90 backdrop-blur-md border ${
      effectiveChannel === "MAFIA" ? "border-blood-800/80 shadow-blood-950/40" : "border-noir-800"
    } rounded-2xl flex flex-col ${heightClass} shadow-xl overflow-hidden pointer-events-auto transition-colors`}>
      {/* Header and Channel Tabs */}
      <div className="border-b border-noir-800 bg-noir-950/70 p-2.5">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center space-x-2">
            {effectiveChannel === "MAFIA" ? (
              <Skull className="w-4 h-4 text-blood-400 animate-pulse" />
            ) : (
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-bold text-xs uppercase tracking-wider text-white">
              {effectiveChannel === "MAFIA" ? "Syndicate Channel" : "Town Hall Log"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-noir-400">
            {isAlive || phase === Phase.VICTORY ? "Speech Enabled" : "Spectator Muted"}
          </span>
        </div>

        {/* Channel Tabs (Strictly visible to living Mafia members) */}
        {isLivingMafia && (
          <div className="flex space-x-1.5 bg-noir-900/80 p-1 rounded-xl border border-noir-800">
            <button
              type="button"
              onClick={() => setActiveChannel("PUBLIC")}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center space-x-1.5 ${
                effectiveChannel === "PUBLIC"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-noir-400 hover:text-noir-200"
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Town Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChannel("MAFIA")}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center space-x-1.5 ${
                effectiveChannel === "MAFIA"
                  ? "bg-blood-600/30 text-blood-400 border border-blood-500/40 shadow-sm"
                  : "text-noir-400 hover:text-blood-300"
              }`}
            >
              <Skull className="w-3 h-3" />
              <span>Syndicate (Private)</span>
            </button>
          </div>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto font-sans text-xs">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-noir-500 text-center px-4">
            {effectiveChannel === "MAFIA"
              ? "No private Syndicate messages yet. Plot your moves here."
              : "No town announcements or chats yet."}
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg p-2.5 text-xs ${
                msg.isSystem
                  ? "bg-noir-950 border border-noir-800 text-amber-300 font-mono"
                  : msg.channel === "MAFIA"
                  ? "bg-blood-950/40 border border-blood-900/60 text-blood-100"
                  : "bg-noir-800/60 text-noir-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold font-mono text-[11px] flex items-center space-x-1.5 ${
                  msg.isSystem
                    ? "text-amber-400"
                    : msg.channel === "MAFIA"
                    ? "text-blood-400"
                    : "text-emerald-400"
                }`}>
                  {msg.channel === "MAFIA" && (
                    <span className="px-1 py-0.5 rounded bg-blood-900/60 text-blood-300 border border-blood-700/50 text-[9px] font-mono font-bold">
                      MAFIA
                    </span>
                  )}
                  <span>{msg.senderName}</span>
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

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-2.5 border-t border-noir-800 bg-noir-950/80 flex space-x-2">
        <input
          type="text"
          disabled={!isAlive && phase !== Phase.VICTORY}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={
            !isAlive && phase !== Phase.VICTORY
              ? "Eliminated players cannot speak to living players"
              : effectiveChannel === "MAFIA"
              ? "Send encrypted message to Syndicate..."
              : "Send message to town..."
          }
          className={`flex-1 bg-noir-900 border rounded-xl px-3 py-2 text-xs text-white placeholder-noir-500 focus:outline-none transition disabled:opacity-50 ${
            effectiveChannel === "MAFIA"
              ? "border-blood-800 focus:border-blood-500"
              : "border-noir-800 focus:border-emerald-500"
          }`}
        />
        <button
          type="submit"
          disabled={(!isAlive && phase !== Phase.VICTORY) || !chatInput.trim()}
          className={`px-3.5 py-2 rounded-xl text-white transition flex items-center justify-center disabled:opacity-40 ${
            effectiveChannel === "MAFIA"
              ? "bg-blood-600 hover:bg-blood-500"
              : "bg-emerald-600 hover:bg-emerald-500"
          }`}
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
  myRole: propMyRole,
  mafiaTeammates: propMafiaTeammates,
  allRevealedRoles: propAllRevealedRoles,
  onSendChat,
  onReturnToLobby,
  onLeaveRoom
}: GameHUDProps) {
  // --- Private Role State ---
  const [myRole, setMyRole] = useState<Role | null>(propMyRole || null);
  const [mafiaTeammates, setMafiaTeammates] = useState<Array<{ id: string; displayName: string }>>(propMafiaTeammates || []);
  const [allRevealedRoles, setAllRevealedRoles] = useState<Record<string, { displayName: string; role: Role }> | null>(propAllRevealedRoles || null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleRevealedInModal, setRoleRevealedInModal] = useState(false);
  const roleDismissedByUserRef = useRef(false);

  // Toggleable controls & viewport look guides in 3D mode
  const [showWasdHelp, setShowWasdHelp] = useState(true);
  const [showViewportHelp, setShowViewportHelp] = useState(true);

  const handleDismissRoleModal = () => {
    roleDismissedByUserRef.current = true;
    setShowRoleModal(false);
  };

  // Sync role state from parent props
  useEffect(() => {
    if (propMyRole) {
      setMyRole(propMyRole);
      voiceChatService.setRoleContext(propMyRole, propMafiaTeammates?.map((t) => t.id) || []);
      if (phase === Phase.ROLE_ASSIGNMENT && !roleDismissedByUserRef.current) {
        setShowRoleModal(true);
      }
    }
  }, [propMyRole, propMafiaTeammates, phase]);

  useEffect(() => {
    if (propMafiaTeammates && propMafiaTeammates.length > 0) {
      setMafiaTeammates(propMafiaTeammates);
    }
  }, [propMafiaTeammates]);

  useEffect(() => {
    if (propAllRevealedRoles) {
      setAllRevealedRoles(propAllRevealedRoles);
    }
  }, [propAllRevealedRoles]);

  // Self-heal: If match is active and myRole is not yet set, request it immediately from server
  useEffect(() => {
    if (room && !myRole && phase !== Phase.WAITING_FOR_PLAYERS) {
      room.send(ClientMessageType.GET_ROLE);
    }
  }, [room, myRole, phase]);

  // Release pointer lock whenever modal opens so cursor is free to click
  useEffect(() => {
    if (showRoleModal) {
      if (typeof document !== "undefined" && document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }, [showRoleModal]);

  // Support ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showRoleModal) {
        handleDismissRoleModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRoleModal]);

  // --- Voting & Targeting State ---
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [mafiaBallots, setMafiaBallots] = useState<Record<string, string>>({});
  const [mafiaVoteCounts, setMafiaVoteCounts] = useState<Record<string, number>>({});

  // --- Chat & View Mode ---
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
      roleDismissedByUserRef.current = false;
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
            voiceChatService.setRoleContext(data.role, data.teammates.map((t) => t.id));
          } else {
            voiceChatService.setRoleContext(data.role, []);
          }
          if (!roleDismissedByUserRef.current) {
            setShowRoleModal(true);
          }
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
    if (!room || !isAlive || (phase !== Phase.DAY_DISCUSSION && phase !== Phase.DAY_VOTING && phase !== Phase.REVOTING)) return;
    audioManager.playVoteConfirm();
    setSelectedTargetId(targetId);
    setHasVoted(true);
    room.send(ClientMessageType.CAST_VOTE, { targetId });
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
          title: "Town Discussion & Voting",
          subtitle: `Discuss suspects and cast votes concurrently. Strict 50% majority required (≥ ${votesRequired} votes). Change your vote any time.`,
          color: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
          icon: <Crosshair className="w-5 h-5 text-emerald-400" />
        };
      case Phase.DAY_VOTING:
        return {
          title: "Tribunal Voting",
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

      {/* 1. DOCKED TOP STATUS & CLOCK HUD BAR */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-noir-900/90 backdrop-blur-md border-b border-noir-800 shadow-2xl pointer-events-auto">
        {/* Progress bar along top edge */}
        <div className="h-1 w-full bg-noir-800">
          <div
            className="h-full bg-gradient-to-r from-blood-600 via-amber-500 to-emerald-500 transition-all duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
          {/* Left: Brand + Phase Icon & Info */}
          <div className="flex items-center space-x-3 min-w-0">
            {/* Compact Brand Logo */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blood-600 to-blood-500 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blood-600/30">
                M
              </div>
              <span className="font-extrabold text-sm tracking-wider text-white hidden sm:inline">
                MAFIA <span className="text-blood-500 text-[10px] font-mono px-1 py-0.5 rounded bg-blood-600/10 border border-blood-500/20">3D</span>
              </span>
            </div>

            <div className="h-5 w-px bg-noir-800 hidden sm:block" />

            {/* Phase Badge & Description */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`p-2 rounded-lg border shrink-0 ${phaseInfo.color}`}>
                {phaseInfo.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-noir-400 shrink-0">
                    Round {roundNumber}
                  </span>
                  <span className="text-noir-600">•</span>
                  <span className="font-bold text-white tracking-wide text-sm sm:text-base truncate">
                    {phaseInfo.title}
                  </span>
                </div>
                <p className="text-[11px] text-noir-300 truncate hidden lg:block">
                  {phaseInfo.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Timer, Survivors, Role, Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Countdown Timer */}
            <div className="flex items-center space-x-1.5 bg-noir-950/90 border border-noir-800 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-mono font-black text-lg sm:text-xl text-white tracking-wider">
                {secondsRemaining}s
              </span>
            </div>

            {/* Living Survivors Counter */}
            <div className="hidden sm:flex flex-col items-end bg-noir-950/60 border border-noir-800 px-2.5 py-1 rounded-lg text-right">
              <span className="text-[9px] font-mono uppercase tracking-wider text-noir-400">Survivors</span>
              <span className="text-xs font-bold text-emerald-400">
                {livingPlayers.length} / {players.length} Alive
              </span>
            </div>

            {/* Living / Dead status badge */}
            <div
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold font-mono uppercase tracking-wider ${
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

            {/* My Role Pill & Peek Button */}
            {myRole && (
              <button
                onClick={() => setShowRoleModal(true)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition ${
                  myRole === Role.MAFIA
                    ? "bg-blood-600/20 border-blood-500/50 text-blood-400 hover:bg-blood-600/30"
                    : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
                }`}
                title="View your secret dossier"
              >
                {myRole === Role.MAFIA ? <Skull className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  {myRole}
                </span>
              </button>
            )}

            {/* View Mode Switcher */}
            <button
              onClick={() => setViewMode(viewMode === "3d" ? "hud" : "3d")}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-noir-700 bg-noir-800/90 hover:bg-noir-700 text-xs font-mono font-bold text-white transition pointer-events-auto shadow-sm"
              title="Toggle between 3D Town View and Dossier View"
            >
              {viewMode === "3d" ? (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Dossier View</span>
                </>
              ) : (
                <>
                  <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">3D Town</span>
                </>
              )}
            </button>

            {/* WebRTC Voice Chat Controls */}
            <button
              onClick={() => {
                const muted = voiceChatService.toggleMute();
                setIsMicMuted(muted);
              }}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition pointer-events-auto shadow-sm text-xs font-mono font-bold ${
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
                className={`flex items-center px-2 py-1 rounded-lg border transition shadow-sm text-xs font-mono font-bold ${
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

      {/* 1.5 PERSISTENT PROMINENT ROLE INDICATOR BANNER (ALL VIEWPORTS & VIEWS) */}
      {myRole && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-35 pointer-events-none flex justify-center">
          <div
            className={`py-1.5 px-3.5 sm:px-5 rounded-full border backdrop-blur-md shadow-2xl flex items-center justify-between sm:justify-center space-x-2 sm:space-x-4 pointer-events-auto transition-all ${
              myRole === Role.MAFIA
                ? "bg-blood-950/95 border-blood-500/70 text-white shadow-blood-950/70 ring-1 ring-blood-500/40"
                : "bg-emerald-950/95 border-emerald-500/70 text-white shadow-emerald-950/70 ring-1 ring-emerald-500/40"
            }`}
          >
            <div className="flex items-center space-x-2 shrink-0">
              <div
                className={`p-1 rounded-full ${
                  myRole === Role.MAFIA ? "bg-blood-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {myRole === Role.MAFIA ? (
                  <Skull className="w-3.5 h-3.5" />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase">
                YOU ARE {myRole}
              </span>
            </div>

            {myRole === Role.MAFIA && (
              <div className="text-[11px] font-mono text-blood-300 truncate max-w-[180px] sm:max-w-none">
                <span className="text-blood-400 font-semibold">Syndicate:</span>{" "}
                {mafiaTeammates.filter((m) => m.id !== sessionId).length > 0
                  ? mafiaTeammates
                      .filter((m) => m.id !== sessionId)
                      .map((m) => m.displayName)
                      .join(", ")
                  : "Solo Operative"}
              </div>
            )}

            {myRole === Role.CITIZEN && (
              <span className="text-[11px] font-mono text-emerald-300 hidden md:inline">
                Protect Town • Eliminate Syndicate
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                roleDismissedByUserRef.current = false;
                setShowRoleModal(true);
              }}
              className="text-[10px] font-mono text-noir-400 hover:text-white underline shrink-0 transition cursor-pointer"
              title="Open Role Dossier"
            >
              Dossier
            </button>
          </div>
        </div>
      )}

      {/* 2. CONTROLS, VIEWPORT GUIDE & CHAT TOGGLE IN 3D MODE */}
      {viewMode === "3d" && (
        <div className="fixed top-14 sm:top-16 left-4 right-4 z-30 flex items-center justify-between pointer-events-none gap-2">
          {/* Left: Independent, Toggleable Guides (WASD & Viewport Look) */}
          <div className="flex items-center space-x-2 pointer-events-auto flex-wrap gap-y-1.5">
            {/* WASD Controls Guide */}
            {showWasdHelp ? (
              <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 rounded-full bg-noir-950/85 backdrop-blur-md border border-noir-800 text-noir-300 text-[11px] font-mono shadow-md animate-in fade-in zoom-in-95 duration-150">
                <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-white font-bold">WASD:</span>
                <span>Move</span>
                <span className="text-noir-600">•</span>
                <span className="text-amber-400 font-bold">Shift:</span>
                <span>Sprint</span>
                <span className="text-noir-600">•</span>
                <span className="text-emerald-400 font-bold">Space:</span>
                <span>Jump</span>
                <button
                  type="button"
                  onClick={() => setShowWasdHelp(false)}
                  className="ml-1 p-0.5 rounded-full hover:bg-noir-800 text-noir-400 hover:text-white transition cursor-pointer"
                  title="Close WASD controls guide"
                  aria-label="Close WASD controls guide"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowWasdHelp(true)}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-noir-950/85 backdrop-blur-md border border-noir-800 text-noir-300 hover:text-white text-[11px] font-mono shadow-md transition hover:border-noir-700 cursor-pointer animate-in fade-in duration-150"
                title="Click to show WASD movement controls"
                aria-label="Click to show WASD movement controls"
              >
                <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-bold">WASD</span>
              </button>
            )}

            {/* Viewport Look Guide */}
            {showViewportHelp ? (
              <div className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-noir-950/85 backdrop-blur-md border border-noir-800 text-[11px] font-mono text-noir-300 shadow-md animate-in fade-in zoom-in-95 duration-150">
                <MousePointer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-400 font-bold">Click viewport:</span>
                <span>Look</span>
                <span className="text-noir-600">•</span>
                <span className="text-rose-400 font-bold">ESC:</span>
                <span>Release</span>
                <button
                  type="button"
                  onClick={() => setShowViewportHelp(false)}
                  className="ml-1 p-0.5 rounded-full hover:bg-noir-800 text-noir-400 hover:text-white transition cursor-pointer"
                  title="Close viewport look guide"
                  aria-label="Close viewport look guide"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowViewportHelp(true)}
                className="hidden lg:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-noir-950/85 backdrop-blur-md border border-noir-800 text-noir-300 hover:text-white text-[11px] font-mono shadow-md transition hover:border-noir-700 cursor-pointer animate-in fade-in duration-150"
                title="Click to show mouse look guide"
                aria-label="Click to show mouse look guide"
              >
                <MousePointer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Mouse Look</span>
              </button>
            )}
          </div>

          {/* Right: Chat Toggle */}
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-noir-950/85 backdrop-blur-md border border-noir-800 text-noir-300 hover:text-white text-[11px] font-mono pointer-events-auto transition shadow-md shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isChatOpen ? "Hide Chat" : "Show Chat"}</span>
          </button>
        </div>
      )}

      {/* 3. DOSSIER VIEW CONTENT CONTAINER */}
      <div className={`relative z-10 max-w-7xl w-full mx-auto pt-20 p-4 sm:p-6 space-y-6 ${
        viewMode === "3d" ? "pointer-events-none" : "pointer-events-auto"
      }`}>

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
                    {mafiaTeammates.filter((m) => m.id !== sessionId).length > 0 ? (
                      <div className="text-xs font-mono bg-blood-950/40 border border-blood-800/40 px-3 py-1 rounded-lg text-blood-300">
                        Teammates: {mafiaTeammates.filter((m) => m.id !== sessionId).map((m) => m.displayName).join(", ")}
                      </div>
                    ) : (
                      <div className="text-xs font-mono bg-blood-950/40 border border-blood-800/40 px-3 py-1 rounded-lg text-blood-300">
                        Solo Syndicate Operative
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

          {/* Phase 4 & 5: UNIFIED DAY DISCUSSION & TRIBUNAL VOTING */}
          {(phase === Phase.DAY_DISCUSSION || phase === Phase.DAY_VOTING || phase === Phase.REVOTING) && (
            <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-noir-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center space-x-2">
                    {phase === Phase.REVOTING ? (
                      <AlertOctagon className="w-5 h-5 text-orange-400" />
                    ) : (
                      <Crosshair className="w-5 h-5 text-emerald-400" />
                    )}
                    <span>
                      {phase === Phase.REVOTING
                        ? "Runoff Revote Tribunal"
                        : "Town Discussion & Tribunal Voting"}
                    </span>
                  </h3>
                  <p className="text-xs text-noir-400 mt-0.5">
                    {phase === Phase.REVOTING
                      ? "Tie detected! Vote between tied runoff candidates."
                      : "Discuss theories and cast your vote concurrently. You can change your vote freely until the day timer expires."}
                  </p>
                </div>

                <div className="bg-noir-950/80 border border-noir-800 px-3 py-1.5 rounded-lg text-right">
                  <div className="text-[10px] font-mono text-noir-400 uppercase">Elimination Threshold</div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    ≥ {votesRequired} of {livingPlayers.length} votes required
                  </div>
                </div>
              </div>

              {/* Voting Candidates Grid */}
              {isAlive ? (
                <div className="space-y-4">
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
                              ? "bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-950/40 ring-1 ring-red-500/50"
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
                                {isSelf && <span className="text-[10px] text-noir-400 font-mono">(Self)</span>}
                                {(voiceChatService.isPeerSpeaking(target.id) || (target.id === sessionId && isSpeaking && !isMicMuted)) && (
                                  <Mic className="w-3 h-3 text-emerald-400 animate-pulse ml-1" />
                                )}
                              </div>
                              <div className="text-[11px] text-noir-400 font-mono">
                                {isSelf
                                  ? "Self-voting disabled"
                                  : isSelected
                                  ? "Vote active (click another to change)"
                                  : "Click to cast suspect vote"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            {isSelected ? (
                              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold flex items-center space-x-1 shadow-sm">
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

                  {hasVoted && selectedTargetId && (
                    <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 p-3 rounded-xl">
                      <Check className="w-4 h-4" />
                      <span>
                        Your vote is currently locked on{" "}
                        <strong className="text-white">
                          {players.find((p) => p.id === selectedTargetId)?.displayName}
                        </strong>
                        . You can freely change your vote anytime before the countdown expires.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-noir-400 text-sm">
                  <Ghost className="w-8 h-8 text-noir-500 mx-auto mb-2" />
                  You are eliminated and cannot cast votes.
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
            myRole={myRole}
            chatMessages={chatMessages}
            onSendChat={onSendChat}
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
            myRole={myRole}
            chatMessages={chatMessages}
            onSendChat={onSendChat}
            heightClass="h-[360px]"
          />
        </div>
      )}

      {/* Floating 3D Mode Day Voting Panel */}
      {viewMode === "3d" && (phase === Phase.DAY_DISCUSSION || phase === Phase.DAY_VOTING || phase === Phase.REVOTING) && (
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

      </div>

      {/* 3. SECRET ROLE DOSSIER MODAL */}
      {showRoleModal && myRole && (
        <div
          data-no-pointer-lock
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDismissRoleModal();
            }
          }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto select-none"
        >
          <div
            data-no-pointer-lock
            className="relative max-w-md w-full bg-noir-900 border border-noir-800 rounded-3xl p-6 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
          >
            {/* Top-right X button */}
            <button
              type="button"
              data-no-pointer-lock
              onClick={(e) => {
                e.stopPropagation();
                handleDismissRoleModal();
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-noir-400 hover:text-white hover:bg-noir-800 transition pointer-events-auto cursor-pointer"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" />
            </button>

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
              {myRole === Role.MAFIA && (
                <div className="mt-5 pt-4 border-t border-blood-900/50 text-left">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-blood-300 mb-2">
                    Syndicate Teammates:
                  </div>
                  {mafiaTeammates.filter((m) => m.id !== sessionId).length > 0 ? (
                    <div className="space-y-1">
                      {mafiaTeammates
                        .filter((m) => m.id !== sessionId)
                        .map((teammate) => (
                          <div key={teammate.id} className="text-xs text-white font-mono flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blood-500"></span>
                            <span>{teammate.displayName}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-xs text-noir-300 italic font-mono">
                      You are the lone Syndicate operative in town. Blend in with the Citizens!
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              data-no-pointer-lock
              onClick={(e) => {
                e.stopPropagation();
                handleDismissRoleModal();
              }}
              className="w-full py-3 rounded-xl bg-noir-800 hover:bg-noir-700 active:bg-noir-600 text-white font-bold text-sm tracking-wide transition border border-noir-700 pointer-events-auto cursor-pointer shadow-lg"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
