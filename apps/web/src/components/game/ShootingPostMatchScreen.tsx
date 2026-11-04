"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Target,
  Flame,
  RotateCcw,
  LogOut,
  Crown,
  Medal,
  Sparkles,
  Clock,
  Crosshair,
  Award,
  Zap,
  CheckCircle2,
  Users
} from "lucide-react";
import {
  ShootingPlayerState,
  ShootingTeamState,
  WeaponId,
  WEAPONS_CATALOG
} from "@mafia/shared";
import { combatAudio } from "../../utils/combatAudio";

interface ShootingPostMatchScreenProps {
  sessionId: string;
  players: ShootingPlayerState[];
  teams: ShootingTeamState[];
  winningTeamId: string;
  isHost: boolean;
  scoreLimit: number;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
}

export function ShootingPostMatchScreen({
  sessionId,
  players,
  teams,
  winningTeamId,
  isHost,
  scoreLimit,
  onReturnToLobby,
  onLeaveRoom
}: ShootingPostMatchScreenProps) {
  const [countdownSec, setCountdownSec] = useState(20);

  // Local player info
  const localPlayer = players.find((p) => p.id === sessionId);
  const myTeamId = localPlayer?.teamId || "";

  // Outcome status
  const isDraw = !winningTeamId;
  const isWinner = !isDraw && myTeamId === winningTeamId;
  const winningTeam = teams.find((t) => t.id === winningTeamId);

  // Trigger celebration audio on mount
  useEffect(() => {
    if (isWinner) {
      combatAudio.playVictoryFanfare();
    } else if (isDraw) {
      combatAudio.playHitmarker(true);
    } else {
      combatAudio.playDefeatStinger();
    }
  }, [isWinner, isDraw]);

  // Automated countdown to return to lobby
  useEffect(() => {
    if (countdownSec <= 0) {
      if (isHost) {
        onReturnToLobby();
      }
      return;
    }
    const timer = setInterval(() => {
      setCountdownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSec, isHost, onReturnToLobby]);

  // ---------------------------------------------------------------------------
  // MATCH ACCOLADES & PODIUM CALCULATIONS
  // ---------------------------------------------------------------------------
  const { sortedPlayers, mvp, topFragger, sharpshooter } = useMemo<{
    sortedPlayers: ShootingPlayerState[];
    mvp: ShootingPlayerState | null;
    topFragger: ShootingPlayerState | null;
    sharpshooter: ShootingPlayerState | null;
  }>(() => {
    const sorted = [...players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.deaths - b.deaths;
    });

    const mvpPlayer: ShootingPlayerState | null = sorted.length > 0 && sorted[0].score > 0 ? sorted[0] : null;

    let maxKills = 0;
    let fragger: ShootingPlayerState | null = null;
    sorted.forEach((p) => {
      if (p.kills > maxKills) {
        maxKills = p.kills;
        fragger = p;
      }
    });

    let bestKD = 0;
    let sniper: ShootingPlayerState | null = null;
    sorted.forEach((p) => {
      if (p.kills >= 1) {
        const kd = p.kills / Math.max(1, p.deaths);
        if (kd > bestKD) {
          bestKD = kd;
          sniper = p;
        }
      }
    });

    return {
      sortedPlayers: sorted,
      mvp: mvpPlayer,
      topFragger: fragger,
      sharpshooter: sniper
    };
  }, [players]);

  // Sort teams by final score
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.score - a.score);
  }, [teams]);

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-noir-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* -------------------------------------------------------------------- */}
      {/* 1. TOP BANNER: OUTCOME & WINNER ANNOUNCEMENT                         */}
      {/* -------------------------------------------------------------------- */}
      <div className="max-w-6xl w-full mx-auto text-center space-y-3 pt-2">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-noir-900/90 border border-noir-750 text-xs font-mono tracking-widest uppercase">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-noir-300">Match Completed • Target Limit: {scoreLimit} Kills</span>
        </div>

        {/* Big Outcome Title */}
        <h1
          className={`text-4xl sm:text-6xl lg:text-7xl font-black font-mono tracking-tight uppercase drop-shadow-2xl ${
            isDraw
              ? "text-amber-400"
              : isWinner
              ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400"
              : "text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-red-400 to-orange-400"
          }`}
        >
          {isDraw ? "STALEMATE DRAW" : isWinner ? "VICTORY ACHIEVED" : "MISSION DEFEAT"}
        </h1>

        <p className="text-sm sm:text-base font-mono text-noir-300 max-w-lg mx-auto">
          {isDraw ? (
            "Combat ended in a dead heat. Both factions held equal ground."
          ) : (
            <span>
              <strong className="text-white" style={{ color: winningTeam?.color }}>
                {winningTeam?.name}
              </strong>{" "}
              claimed battlefield supremacy with{" "}
              <strong className="text-white">{winningTeam?.score}</strong> confirmed eliminations.
            </span>
          )}
        </p>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. MATCH ACCOLADES CARDS (MVP, TOP FRAGGER, SHARPSHOOTER)            */}
      {/* -------------------------------------------------------------------- */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* MVP Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500/10 via-noir-900 to-noir-950 border border-amber-500/30 p-5 shadow-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-3 shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-amber-400">
            Battlefield MVP
          </span>
          <h3 className="text-lg font-black font-mono text-white mt-1">
            {mvp ? (mvp as ShootingPlayerState).displayName : "No Contest"}
          </h3>
          <p className="text-xs font-mono text-noir-400 mt-0.5">
            {mvp ? `${(mvp as ShootingPlayerState).score} Combat Score • ${(mvp as ShootingPlayerState).kills} Kills` : "0 Score registered"}
          </p>
          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-[11px] font-mono text-amber-300">
            <Sparkles className="w-3 h-3" />
            <span>Highest Impact</span>
          </div>
        </div>

        {/* Top Fragger Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-rose-500/10 via-noir-900 to-noir-950 border border-rose-500/30 p-5 shadow-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 mb-3 shadow-lg shadow-rose-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-rose-400">
            Most Eliminator
          </span>
          <h3 className="text-lg font-black font-mono text-white mt-1">
            {topFragger ? (topFragger as ShootingPlayerState).displayName : "No Eliminator"}
          </h3>
          <p className="text-xs font-mono text-noir-400 mt-0.5">
            {topFragger ? `${(topFragger as ShootingPlayerState).kills} Kills Confirmed` : "0 Eliminations"}
          </p>
          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-400/10 border border-rose-400/20 text-[11px] font-mono text-rose-300">
            <Zap className="w-3 h-3" />
            <span>Top Fragger</span>
          </div>
        </div>

        {/* Sharpshooter Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-500/10 via-noir-900 to-noir-950 border border-cyan-500/30 p-5 shadow-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-3 shadow-lg shadow-cyan-500/20">
            <Target className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-400">
            Sharpshooter
          </span>
          <h3 className="text-lg font-black font-mono text-white mt-1">
            {sharpshooter ? (sharpshooter as ShootingPlayerState).displayName : "No Qualifier"}
          </h3>
          <p className="text-xs font-mono text-noir-400 mt-0.5">
            {sharpshooter
              ? `${((sharpshooter as ShootingPlayerState).kills / Math.max(1, (sharpshooter as ShootingPlayerState).deaths)).toFixed(2)} K/D Ratio`
              : "0.00 K/D"}
          </p>
          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[11px] font-mono text-cyan-300">
            <Award className="w-3 h-3" />
            <span>Highest Precision</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. TEAM FINAL STANDINGS                                              */}
      {/* -------------------------------------------------------------------- */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {sortedTeams.map((t, idx) => {
          const isTeamWinner = t.id === winningTeamId;
          const isMyTeam = t.id === myTeamId;
          return (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border transition-all ${
                isTeamWinner
                  ? "bg-noir-900/90 border-white/30 shadow-xl ring-1 ring-white/20"
                  : "bg-noir-900/60 border-noir-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="font-mono text-sm font-bold text-white">
                    {t.name}
                    {isMyTeam && <span className="text-[10px] font-normal text-noir-400 ml-1.5">(YOU)</span>}
                  </span>
                </div>
                {isTeamWinner ? (
                  <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
                    Winner
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-noir-500 uppercase">
                    Rank #{idx + 1}
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between mt-3">
                <div className="text-3xl font-black font-mono text-white">
                  {t.score}{" "}
                  <span className="text-xs font-normal text-noir-400">Points</span>
                </div>
                <div className="text-xs font-mono text-noir-400">
                  {t.playerCount} {t.playerCount === 1 ? "Player" : "Players"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. COMPREHENSIVE PLAYER SCOREBOARD TABLE                             */}
      {/* -------------------------------------------------------------------- */}
      <div className="max-w-6xl w-full mx-auto bg-noir-900/90 border border-noir-800 rounded-2xl p-5 shadow-2xl flex-1 overflow-hidden flex flex-col mb-6">
        <div className="flex items-center justify-between border-b border-noir-800 pb-3 mb-3">
          <h2 className="font-mono text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Combat Leaderboard ({sortedPlayers.length} Soldiers)</span>
          </h2>
          <span className="text-xs font-mono text-noir-400">Ranked by Score</span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-noir-800 text-noir-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Soldier</th>
                <th className="py-2.5 px-3">Faction</th>
                <th className="py-2.5 px-3">Primary Weapon</th>
                <th className="py-2.5 px-3 text-center">Kills</th>
                <th className="py-2.5 px-3 text-center">Deaths</th>
                <th className="py-2.5 px-3 text-center">K/D</th>
                <th className="py-2.5 px-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-noir-850">
              {sortedPlayers.map((p, idx) => {
                const isMe = p.id === sessionId;
                const pTeam = teams.find((t) => t.id === p.teamId);
                const weapon = WEAPONS_CATALOG[p.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
                const kd = (p.kills / Math.max(1, p.deaths)).toFixed(2);

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isMe
                        ? "bg-white/5 font-semibold text-white"
                        : "hover:bg-noir-850/50 text-noir-200"
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-noir-400">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold">{p.displayName}</span>
                        {isMe && (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10">
                            YOU
                          </span>
                        )}
                        {p.isHost && (
                          <span title="Host">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                        style={{
                          backgroundColor: `${pTeam?.color || "#94a3b8"}15`,
                          borderColor: `${pTeam?.color || "#94a3b8"}35`,
                          color: pTeam?.color || "#ffffff"
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pTeam?.color }} />
                        <span>{pTeam?.name || "Independent"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5 text-noir-300">
                        <span>{weapon.iconEmoji}</span>
                        <span>{weapon.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-400">{p.kills}</td>
                    <td className="py-3 px-3 text-center text-rose-400">{p.deaths}</td>
                    <td className="py-3 px-3 text-center font-mono">{kd}</td>
                    <td className="py-3 px-3 text-right font-black text-amber-300 text-sm">{p.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 5. BOTTOM ACTIONS & COUNTDOWN BAR                                    */}
      {/* -------------------------------------------------------------------- */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-noir-800">
        {/* Countdown notice */}
        <div className="flex items-center space-x-2 text-xs font-mono text-noir-400">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>
            Returning to lobby in <strong className="text-white">{countdownSec}s</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={onLeaveRoom}
            className="px-4 py-2.5 rounded-xl bg-noir-900 hover:bg-noir-800 border border-noir-750 text-xs font-mono text-noir-300 hover:text-white font-bold transition flex items-center space-x-2 shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Game</span>
          </button>

          {isHost && (
            <button
              onClick={onReturnToLobby}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-mono text-xs font-bold tracking-wider uppercase transition shadow-xl shadow-emerald-950 flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rematch / Play Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
