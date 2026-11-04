"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Crosshair,
  UserCheck,
  Target,
  Wifi,
  WifiOff,
  Radio,
  ArrowRightLeft,
  Scale,
  Edit3,
  Flame,
  Zap,
  Sparkles
} from "lucide-react";
import {
  ClientMessageType,
  ServerMessageType,
  ShootingRoomState,
  ShootingPlayerState,
  ShootingTeamState,
  WeaponId,
  WEAPONS_CATALOG
} from "@mafia/shared";

interface ChatItem {
  id: string;
  senderName: string;
  message: string;
  isSystem?: boolean;
  timestamp: number;
}

interface ShootingLobbyProps {
  room: Room<ShootingRoomState>;
  sessionId: string;
  roomCode: string;
  players: ShootingPlayerState[];
  teams: ShootingTeamState[];
  isHost: boolean;
  isReady: boolean;
  config: {
    matchDurationSec: number;
    scoreLimit: number;
    selectedMap: string;
    respawnDelaySec: number;
    friendlyFire: boolean;
  };
  chatMessages: ChatItem[];
  onSendChat: (msg: string) => void;
  onLeaveRoom: () => void;
}

export function ShootingLobby({
  room,
  sessionId,
  roomCode,
  players,
  teams,
  isHost,
  isReady,
  config,
  chatMessages,
  onSendChat,
  onLeaveRoom
}: ShootingLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    room.send(ClientMessageType.READY_TOGGLE);
  };

  const handleJoinTeam = (teamId: string) => {
    room.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId });
  };

  const handleHostAssignTeam = (targetPlayerId: string, teamId: string) => {
    room.send(ClientMessageType.SHOOTING_ASSIGN_TEAM, { targetPlayerId, teamId });
  };

  const handleAutoBalance = () => {
    room.send(ClientMessageType.SHOOTING_AUTO_BALANCE);
  };

  const handleSelectWeapon = (weaponId: WeaponId) => {
    room.send(ClientMessageType.SHOOTING_SELECT_LOADOUT, { weaponId });
  };

  const handleStartRenameTeam = (teamId: string, currentName: string) => {
    setEditingTeamId(teamId);
    setEditingTeamName(currentName);
  };

  const handleSaveRenameTeam = (teamId: string) => {
    if (editingTeamName.trim().length >= 2) {
      room.send(ClientMessageType.SHOOTING_RENAME_TEAM, { teamId, name: editingTeamName.trim() });
    }
    setEditingTeamId(null);
  };

  const handleConfigChange = (delta: Partial<typeof config>) => {
    room.send(ClientMessageType.SHOOTING_UPDATE_CONFIG, { ...config, ...delta });
  };

  const handleStartMatch = () => {
    room.send(ClientMessageType.SHOOTING_START_MATCH);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput);
    setChatInput("");
  };

  const teamList = teams.length > 0 ? teams : [
    { id: "team-red", name: "Team Red", color: "#ef4444", score: 0, playerCount: 0 } as ShootingTeamState,
    { id: "team-blue", name: "Team Blue", color: "#3b82f6", score: 0, playerCount: 0 } as ShootingTeamState,
    { id: "team-green", name: "Team Green", color: "#10b981", score: 0, playerCount: 0 } as ShootingTeamState
  ];

  const myPlayer = players.find((p) => p.id === sessionId);
  const myTeamId = myPlayer?.teamId || "team-red";
  const myWeaponId = (myPlayer?.weaponId as WeaponId) || WeaponId.ASSAULT_RIFLE;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-noir-900 border border-noir-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              Shooting Game Lobby
            </div>
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
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{players.length} Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          {isHost && (
            <button
              onClick={handleAutoBalance}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition flex items-center space-x-1.5"
              title="Auto-balance connected players evenly across teams"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Auto-Balance Teams</span>
            </button>
          )}

          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
            <Wifi className="w-3.5 h-3.5" />
            <span>ONLINE</span>
          </span>

          <button
            onClick={onLeaveRoom}
            className="text-xs font-mono text-noir-400 hover:text-white px-3 py-1.5 rounded-lg bg-noir-800 hover:bg-noir-700 transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Team Rosters Grid (3 Teams: Red, Blue, Green) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {teamList.map((team) => {
          const members = players.filter((p) => p.teamId === team.id);
          const isMyTeam = myTeamId === team.id;

          const teamHeaderColor =
            team.id === "team-red"
              ? "border-rose-500/40 bg-rose-950/20 text-rose-400"
              : team.id === "team-blue"
              ? "border-blue-500/40 bg-blue-950/20 text-blue-400"
              : "border-emerald-500/40 bg-emerald-950/20 text-emerald-400";

          return (
            <div
              key={team.id}
              className={`bg-noir-900 border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition ${
                isMyTeam ? "border-noir-700 ring-2 ring-emerald-500/30" : "border-noir-800"
              }`}
            >
              <div className="space-y-3">
                {/* Team Header */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${teamHeaderColor}`}>
                  {editingTeamId === team.id ? (
                    <div className="flex items-center space-x-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingTeamName}
                        onChange={(e) => setEditingTeamName(e.target.value)}
                        maxLength={24}
                        className="px-2 py-0.5 text-xs bg-noir-950 border border-noir-700 rounded text-white focus:outline-none focus:border-emerald-500 w-full"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRenameTeam(team.id);
                          if (e.key === "Escape") setEditingTeamId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveRenameTeam(team.id)}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="font-bold text-sm tracking-wide">{team.name}</span>
                      {isHost && (
                        <button
                          onClick={() => handleStartRenameTeam(team.id, team.name)}
                          className="p-1 text-noir-400 hover:text-white transition"
                          title="Rename team"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-noir-950/60 border border-noir-800">
                    {members.length} {members.length === 1 ? "Player" : "Players"}
                  </span>
                </div>

                {/* Team Roster Members List */}
                <div className="space-y-2 min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
                  {members.length === 0 ? (
                    <div className="h-[120px] flex items-center justify-center text-noir-600 font-mono text-xs italic">
                      No soldiers assigned
                    </div>
                  ) : (
                    members.map((p) => {
                      const isMe = p.id === sessionId;
                      const equippedWeapon =
                        WEAPONS_CATALOG[p.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                            isMe
                              ? "bg-noir-950 border-noir-700 text-white"
                              : "bg-noir-950/60 border-noir-850 text-noir-200"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-noir-800 flex items-center justify-center font-bold text-[11px] text-white uppercase">
                              {p.displayName.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold flex items-center space-x-1">
                                <span>{p.displayName}</span>
                                {isMe && <span className="text-[10px] text-emerald-400 font-normal">(YOU)</span>}
                                {p.isHost && <Crown className="w-3 h-3 text-amber-400 inline ml-0.5" />}
                              </div>
                              <div className="text-[10px] font-mono text-noir-400 flex items-center space-x-1 mt-0.5">
                                <span>{equippedWeapon.iconEmoji}</span>
                                <span>{equippedWeapon.name.split(" ")[0]}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {p.isReady ? (
                              <span className="text-emerald-400 text-[11px] font-mono flex items-center space-x-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Ready</span>
                              </span>
                            ) : (
                              <span className="text-noir-500 text-[11px] font-mono">Waiting</span>
                            )}

                            {/* Host Move Player Dropdown */}
                            {isHost && !isMe && (
                              <select
                                value={team.id}
                                onChange={(e) => handleHostAssignTeam(p.id, e.target.value)}
                                className="bg-noir-900 border border-noir-700 text-[10px] text-noir-300 rounded px-1 py-0.5"
                                title="Move player to another team"
                              >
                                <option value="team-red">Red</option>
                                <option value="team-blue">Blue</option>
                                <option value="team-green">Green</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Join Team Button */}
              <div>
                <button
                  onClick={() => handleJoinTeam(team.id)}
                  disabled={isMyTeam}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    isMyTeam
                      ? "bg-noir-800 text-noir-400 cursor-default"
                      : "bg-noir-800 hover:bg-noir-700 text-white hover:text-emerald-300"
                  }`}
                >
                  {isMyTeam ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Your Team</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Join {team.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weapon Loadout Selection Section */}
      <div className="bg-noir-900 border border-noir-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-noir-800 pb-3">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wide">
              Primary Weapon Loadout
            </h2>
          </div>
          <span className="text-[11px] font-mono text-noir-400">
            Equipped: <strong className="text-emerald-400">{WEAPONS_CATALOG[myWeaponId]?.name || "Assault Rifle"}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Object.values(WEAPONS_CATALOG).map((w) => {
            const isEquipped = myWeaponId === w.id;
            return (
              <div
                key={w.id}
                onClick={() => handleSelectWeapon(w.id)}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                  isEquipped
                    ? "bg-emerald-950/20 border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/50"
                    : "bg-noir-950/70 border-noir-800 hover:border-noir-700 hover:bg-noir-950"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{w.iconEmoji}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-noir-900 border border-noir-800 text-noir-400 font-semibold">
                      {w.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white leading-tight">{w.name}</h4>
                  <p className="text-[11px] text-noir-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {w.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-noir-800/80 text-[10px] font-mono">
                  <div className="flex justify-between text-noir-300">
                    <span>Base Dmg:</span>
                    <span className="font-bold text-white">{w.baseDamage}{w.pelletCount > 1 ? `x${w.pelletCount}` : ""}</span>
                  </div>
                  <div className="flex justify-between text-noir-300">
                    <span>Fire Rate:</span>
                    <span className="font-bold text-white">{w.fireRateHz} /s</span>
                  </div>
                  <div className="flex justify-between text-noir-300">
                    <span>Mag Capacity:</span>
                    <span className="font-bold text-white">{w.magazineCapacity} rds</span>
                  </div>
                  <div className="flex justify-between text-noir-300">
                    <span>Range:</span>
                    <span className="font-bold text-white">{w.effectiveRangeM}m</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      className={`w-full py-1.5 rounded-lg text-[11px] font-bold font-mono uppercase transition flex items-center justify-center space-x-1 ${
                        isEquipped
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : "bg-noir-800 hover:bg-noir-700 text-noir-300 hover:text-white"
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>EQUIPPED</span>
                        </>
                      ) : (
                        <span>EQUIP</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Configuration & Lobby Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Match Settings (7 cols) */}
        <div className="lg:col-span-7 bg-noir-900 border border-noir-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-noir-800 pb-3">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-white text-sm">Match Configuration</h2>
            </div>
            {!isHost && (
              <span className="text-[11px] font-mono text-noir-400">Host Managed</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Match Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                <span>MATCH DURATION</span>
                <span className="font-mono text-white font-bold">{Math.floor(config.matchDurationSec / 60)} min</span>
              </label>
              <select
                disabled={!isHost}
                value={config.matchDurationSec}
                onChange={(e) => handleConfigChange({ matchDurationSec: Number(e.target.value) })}
                className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-75"
              >
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes (Default)</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
              </select>
            </div>

            {/* Score Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                <span>SCORE LIMIT</span>
                <span className="font-mono text-white font-bold">{config.scoreLimit} kills</span>
              </label>
              <select
                disabled={!isHost}
                value={config.scoreLimit}
                onChange={(e) => handleConfigChange({ scoreLimit: Number(e.target.value) })}
                className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-75"
              >
                <option value={15}>15 kills</option>
                <option value={30}>30 kills (Default)</option>
                <option value={50}>50 kills</option>
                <option value={75}>75 kills</option>
              </select>
            </div>

            {/* Map Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                <span>COMBAT MAP</span>
                <span className="font-mono text-white font-bold">{config.selectedMap}</span>
              </label>
              <select
                disabled={!isHost}
                value={config.selectedMap}
                onChange={(e) => handleConfigChange({ selectedMap: e.target.value })}
                className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-75"
              >
                <option value="URBAN_DISTRICT">Urban District (152m Map)</option>
                <option value="INDUSTRIAL_COMPLEX">Industrial Complex</option>
                <option value="WAREHOUSE_COMBAT">Warehouse Combat</option>
              </select>
            </div>

            {/* Respawn Delay */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-noir-300 flex items-center justify-between">
                <span>RESPAWN DELAY</span>
                <span className="font-mono text-white font-bold">{config.respawnDelaySec}s</span>
              </label>
              <select
                disabled={!isHost}
                value={config.respawnDelaySec}
                onChange={(e) => handleConfigChange({ respawnDelaySec: Number(e.target.value) })}
                className="w-full bg-noir-950 border border-noir-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-75"
              >
                <option value={2}>2 seconds (Fast)</option>
                <option value={3}>3 seconds (Default)</option>
                <option value={5}>5 seconds</option>
              </select>
            </div>
          </div>

          {/* Start & Ready Controls */}
          <div className="pt-4 border-t border-noir-800 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleToggleReady}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center space-x-2 ${
                isReady
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500"
                  : "bg-noir-800 hover:bg-noir-700 text-noir-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isReady ? "READY FOR COMBAT" : "SET READY"}</span>
            </button>

            {isHost && (
              <button
                onClick={handleStartMatch}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>START MATCH</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Lobby Chat (5 cols) */}
        <div className="lg:col-span-5 bg-noir-900 border border-noir-800 rounded-2xl p-5 space-y-3 flex flex-col h-[280px]">
          <div className="flex items-center justify-between border-b border-noir-800 pb-2">
            <h3 className="font-bold text-white text-sm">Lobby Chat</h3>
            <span className="text-[11px] font-mono text-noir-400">Tactical Channel</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-noir-600 font-mono">
                Coordinate team assignments...
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`leading-relaxed ${
                    msg.isSystem ? "text-emerald-400/90 font-mono italic" : "text-noir-200"
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

          <form onSubmit={handleChatSubmit} className="flex space-x-2 pt-2 border-t border-noir-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a team message..."
              className="flex-1 px-3 py-2 bg-noir-950 border border-noir-700 rounded-xl text-xs text-white placeholder-noir-600 focus:outline-none focus:border-emerald-500"
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
  );
}

