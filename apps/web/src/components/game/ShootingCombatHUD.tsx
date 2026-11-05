"use client";

import React, { useState, useEffect } from "react";
import { Room } from "colyseus.js";
import {
  Crosshair,
  Shield,
  RotateCcw,
  Clock,
  Trophy,
  ChevronRight,
  Settings
} from "lucide-react";
import {
  ServerMessageType,
  ShootingRoomState,
  ShootingPlayerState,
  ShootingTeamState,
  WeaponId,
  WEAPONS_CATALOG,
  ShootingHitEventPayload,
  ShootingKillFeedPayload
} from "@mafia/shared";
import { combatAudio } from "../../utils/combatAudio";
import { ShootingSniperScope } from "../canvas/ShootingSniperScope";
import { ShootingDeathLoadoutModal } from "./ShootingDeathLoadoutModal";
import { ShootingSettingsModal } from "./ShootingSettingsModal";
import {
  loadShootingSettings,
  ShootingControlSettings
} from "../../utils/shootingSettings";

interface ShootingCombatHUDProps {
  room: Room<ShootingRoomState>;
  sessionId: string;
  players: ShootingPlayerState[];
  teams: ShootingTeamState[];
  phaseEndsAt: number;
  scoreLimit: number;
  selectedMap: string;
  isHost: boolean;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
}

export function ShootingCombatHUD({
  room,
  sessionId,
  players,
  teams,
  phaseEndsAt,
  scoreLimit,
  selectedMap,
  isHost,
  onReturnToLobby,
  onLeaveRoom
}: ShootingCombatHUDProps) {
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [hitmarker, setHitmarker] = useState<{ active: boolean; isHeadshot: boolean } | null>(null);
  const [killfeed, setKillfeed] = useState<Array<ShootingKillFeedPayload & { id: string }>>([]);
  const [isAiming, setIsAiming] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ShootingControlSettings>(loadShootingSettings());

  useEffect(() => {
    const updateTime = () => {
      const remaining = Math.max(0, Math.floor((phaseEndsAt - Date.now()) / 1000));
      setTimeLeftSec(remaining);
    };
    updateTime();
    const interval = setInterval(updateTime, 500);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  useEffect(() => {
    const handleAdsEvent = (e: any) => {
      setIsAiming(!!e.detail?.isAiming);
    };
    window.addEventListener("shooting:ads", handleAdsEvent);

    room.onMessage(ServerMessageType.SHOOTING_HIT_EVENT, (payload: ShootingHitEventPayload) => {
      if (payload.attackerId === sessionId) {
        setHitmarker({ active: true, isHeadshot: payload.isHeadshot });
        combatAudio.playHitmarker(payload.isHeadshot);
        setTimeout(() => {
          setHitmarker(null);
        }, 180);
      }
    });

    room.onMessage(ServerMessageType.SHOOTING_KILL_FEED, (payload: ShootingKillFeedPayload) => {
      if (payload.killerId === sessionId) {
        combatAudio.playKillConfirmed();
      }
      const entry = { ...payload, id: `${payload.timestamp}-${Math.random().toString(36).slice(2, 6)}` };
      setKillfeed((prev) => [entry, ...prev.slice(0, 4)]);

      setTimeout(() => {
        setKillfeed((prev) => prev.filter((item) => item.id !== entry.id));
      }, 5000);
    });

    return () => {
      window.removeEventListener("shooting:ads", handleAdsEvent);
    };
  }, [room, sessionId]);

  const localPlayer = players.find((p) => p.id === sessionId);
  const myTeamId = localPlayer?.teamId || "team-red";
  const myTeam = teams.find((t) => t.id === myTeamId);

  const weaponId = (localPlayer?.weaponId as WeaponId) || WeaponId.ASSAULT_RIFLE;
  const currentWeapon = WEAPONS_CATALOG[weaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
  const isSniperAiming = isAiming && weaponId === WeaponId.SNIPER_RIFLE;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSaveSettings = (newSettings: ShootingControlSettings) => {
    setSettings(newSettings);
    window.dispatchEvent(new CustomEvent("shooting:settings_updated"));
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-20 select-none">
      {/* -------------------------------------------------------------------- */}
      {/* FULL-SCREEN SNIPER OPTIC SCOPE OVERLAY                               */}
      {/* -------------------------------------------------------------------- */}
      <ShootingSniperScope active={isSniperAiming} />

      {/* -------------------------------------------------------------------- */}
      {/* SETTINGS MODAL                                                       */}
      {/* -------------------------------------------------------------------- */}
      <ShootingSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* -------------------------------------------------------------------- */}
      {/* DEATH & RESPAWN WEAPON SELECTION OVERLAY                             */}
      {/* -------------------------------------------------------------------- */}
      {localPlayer && (
        <ShootingDeathLoadoutModal
          room={room}
          currentWeaponId={weaponId}
          respawnDelaySec={room.state.config?.respawnDelaySec || 4}
          isAlive={localPlayer.isAlive}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TOP HUD: MATCH STATUS, SCORES, TIMER & SETTINGS                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
        {/* Left: Mode & Map Badge */}
        <div className="flex items-center space-x-3 bg-noir-950/85 backdrop-blur-md border border-noir-800 rounded-2xl px-4 py-2.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
              Team Deathmatch
            </div>
            <div className="text-xs font-bold text-white tracking-wide">
              {selectedMap.replace(/_/g, " ")}
            </div>
          </div>
        </div>

        {/* Center: Live Team Scoreboard Tally */}
        <div className="flex items-center space-x-2 sm:space-x-3 bg-noir-950/90 backdrop-blur-md border border-noir-800 rounded-2xl p-2 px-4 shadow-2xl">
          {teams.map((t) => {
            const isMine = t.id === myTeamId;
            return (
              <div
                key={t.id}
                className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition ${
                  isMine
                    ? "bg-noir-900 border-noir-700 ring-1 ring-white/20"
                    : "bg-noir-950/50 border-noir-850"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="font-mono text-xs font-bold text-noir-300 hidden sm:inline">{t.name}</span>
                <span className="font-mono text-base sm:text-lg font-black text-white">{t.score}</span>
              </div>
            );
          })}

          <div className="h-6 w-px bg-noir-800" />

          {/* Match Countdown */}
          <div className="flex items-center space-x-1.5 px-2 text-xs font-mono font-bold text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeftSec)}</span>
          </div>
        </div>

        {/* Right: Score Goal, Settings & Host Rematch Action */}
        <div className="flex items-center space-x-2.5 pointer-events-auto">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-noir-950/80 border border-noir-800 text-[11px] font-mono text-noir-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Limit: <strong className="text-white">{scoreLimit} Kills</strong></span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-noir-900/90 hover:bg-noir-800 border border-noir-700 text-noir-300 hover:text-white transition shadow-lg"
            title="Open Controls & Mouse Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isHost && (
            <button
              onClick={onReturnToLobby}
              className="px-3.5 py-2 rounded-xl bg-noir-900/90 hover:bg-noir-800 border border-noir-700 text-xs font-mono text-white font-bold flex items-center space-x-1.5 shadow-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return to Lobby</span>
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* TOP-RIGHT LIVE KILLFEED STACK                                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="absolute top-20 right-6 flex flex-col items-end space-y-1.5 pointer-events-none z-30">
        {killfeed.map((kf) => {
          const killerTeam = teams.find((t) => t.id === kf.killerTeamId);
          const victimTeam = teams.find((t) => t.id === kf.victimTeamId);
          const weapon = WEAPONS_CATALOG[kf.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
          const isMeKiller = kf.killerId === sessionId;
          const isMeVictim = kf.victimId === sessionId;

          return (
            <div
              key={kf.id}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono shadow-xl transition-all duration-300 ${
                isMeKiller
                  ? "bg-emerald-950/85 border-emerald-500/50 text-emerald-200"
                  : isMeVictim
                  ? "bg-rose-950/85 border-rose-500/50 text-rose-200"
                  : "bg-noir-950/80 border-noir-800 text-white"
              }`}
            >
              <span className="font-bold" style={{ color: killerTeam?.color || "#ffffff" }}>
                {kf.killerName}
              </span>
              <span className="text-base leading-none">{weapon.iconEmoji}</span>
              {kf.isHeadshot && <span className="text-rose-400 font-bold text-[10px] bg-rose-500/20 px-1 py-0.5 rounded">HEADSHOT</span>}
              <ChevronRight className="w-3 h-3 text-noir-500" />
              <span className="font-bold" style={{ color: victimTeam?.color || "#94a3b8" }}>
                {kf.victimName}
              </span>
            </div>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* CENTER CROSSHAIR & DYNAMIC HITMARKER (Hidden when Sniper Scope active) */}
      {/* -------------------------------------------------------------------- */}
      {!isSniperAiming && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Center Precision Dot */}
            <div
              className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all duration-150 ${
                isAiming
                  ? "bg-rose-500 shadow-rose-500/80 scale-125"
                  : "bg-emerald-400 shadow-emerald-400/80"
              }`}
            />
            {/* Reticle Hairlines */}
            <div
              className="absolute top-0 w-0.5 bg-white/75 transition-all duration-150"
              style={{ height: isAiming ? "6px" : "8px" }}
            />
            <div
              className="absolute bottom-0 w-0.5 bg-white/75 transition-all duration-150"
              style={{ height: isAiming ? "6px" : "8px" }}
            />
            <div
              className="absolute left-0 h-0.5 bg-white/75 transition-all duration-150"
              style={{ width: isAiming ? "6px" : "8px" }}
            />
            <div
              className="absolute right-0 h-0.5 bg-white/75 transition-all duration-150"
              style={{ width: isAiming ? "6px" : "8px" }}
            />

            {/* Hitmarker 'X' Display */}
            {hitmarker && hitmarker.active && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`relative w-6 h-6 flex items-center justify-center ${
                    hitmarker.isHeadshot ? "text-rose-500 scale-125" : "text-amber-300"
                  }`}
                >
                  <div className="absolute w-5 h-0.5 bg-current rotate-45 shadow-sm shadow-black" />
                  <div className="absolute w-5 h-0.5 bg-current -rotate-45 shadow-sm shadow-black" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* BOTTOM HUD: HEALTH, SHIELD, WEAPON AMMO & CONTROLS                   */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4 pointer-events-none">
        {/* Bottom-Left: Health & Shield Vitals */}
        <div className="bg-noir-950/85 backdrop-blur-md border border-noir-800 rounded-2xl p-4 w-full sm:w-64 space-y-2.5 shadow-2xl">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5"
              style={{ color: myTeam?.color || "#10b981" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: myTeam?.color || "#10b981" }} />
              <span>{myTeam?.name || "Soldier"}</span>
            </span>
            <span className="text-xs font-mono text-white font-black">
              {localPlayer?.health ?? 100} / {localPlayer?.maxHealth ?? 100} HP
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full h-3 bg-noir-900 border border-noir-750 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, localPlayer?.health ?? 100))}%` }}
            />
          </div>

          {/* Shield Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-blue-400">
            <span className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Armor Shield</span>
            </span>
            <span className="font-bold text-white">
              {localPlayer?.shield ?? 50} / {localPlayer?.maxShield ?? 50}
            </span>
          </div>
          <div className="w-full h-1.5 bg-noir-900 border border-noir-750 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-200"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (((localPlayer?.shield ?? 50) / (localPlayer?.maxShield ?? 50)) * 100))
                )}%`
              }}
            />
          </div>
        </div>

        {/* Center: Desktop Controls Hint Banner */}
        <div className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-full bg-noir-950/75 backdrop-blur-md border border-noir-800/80 text-[11px] font-mono text-noir-300">
          <span>WASD: Move</span>
          <span>•</span>
          <span>Shift: Sprint</span>
          <span>•</span>
          <span>C: Crouch</span>
          <span>•</span>
          <span>Space: Jump</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">L-Click: Fire</span>
          <span>•</span>
          <span className="text-blue-400 font-bold">R-Click: ADS Zoom</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">[R]: Reload</span>
          <span>•</span>
          <span className="text-indigo-400 font-bold">[1-5]: Switch</span>
        </div>

        {/* Bottom-Right: Equipped Weapon & Ammunition */}
        <div className="bg-noir-950/85 backdrop-blur-md border border-noir-800 rounded-2xl p-4 w-full sm:w-56 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between border-b border-noir-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{currentWeapon.iconEmoji}</span>
              <div>
                <div className="text-xs font-bold text-white leading-tight">{currentWeapon.name}</div>
                <div className="text-[10px] font-mono uppercase text-noir-400">{currentWeapon.category}</div>
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {localPlayer?.ammo ?? currentWeapon.magazineCapacity}
              <span className="text-sm font-normal text-noir-500 ml-1">
                / {localPlayer?.maxAmmo ?? currentWeapon.magazineCapacity}
              </span>
            </div>
            <div className="text-right">
              {localPlayer?.isReloading ? (
                <div className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse">
                  RELOADING...
                </div>
              ) : (localPlayer?.ammo ?? currentWeapon.magazineCapacity) === 0 ? (
                <div className="text-[11px] font-mono text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded animate-bounce">
                  PRESS [R]
                </div>
              ) : (
                <div className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  READY
                </div>
              )}
              <div className="text-[10px] font-mono text-noir-400 mt-0.5">
                {localPlayer?.reserveAmmo ?? currentWeapon.maxReserveAmmo} reserve
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
