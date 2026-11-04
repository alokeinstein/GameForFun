"use client";

import React from "react";
import { Users, Skull, Crosshair, Shield, Sparkles, ArrowRight, Trophy, Radio, Target } from "lucide-react";
import { GameMode } from "@mafia/shared";

interface GameSelectionScreenProps {
  roomCode: string;
  isHost: boolean;
  onSelectGame: (mode: GameMode) => void;
  onCancel?: () => void;
}

export function GameSelectionScreen({
  roomCode,
  isHost,
  onSelectGame,
  onCancel
}: GameSelectionScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blood-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto space-y-8 z-10">
        {/* Header Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-noir-850 border border-noir-700 text-noir-200 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blood-500" />
            <span>Multi-Game Platform • Room: <strong className="text-white tracking-widest">{roomCode}</strong></span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blood-500 via-amber-400 to-emerald-400">Game</span>
          </h1>
          <p className="text-sm sm:text-base text-noir-400 max-w-xl mx-auto font-sans">
            {isHost
              ? "Select which multiplayer game engine will run in this room. Your friends will join your selected game."
              : "Waiting for room host to select the game mode..."}
          </p>
        </div>

        {/* Game Selection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
          {/* ---------------- CARD 1: MAFIA 3D ---------------- */}
          <div className="group relative bg-noir-900/90 border border-noir-800 hover:border-blood-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-blood-600/20">
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blood-600/10 rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

            <div className="space-y-5">
              {/* Top Badges */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blood-600/15 border border-blood-500/30 text-blood-400 text-xs font-mono font-semibold uppercase tracking-wider">
                  <Skull className="w-3.5 h-3.5" />
                  <span>Social Deduction</span>
                </span>
                <span className="text-[11px] font-mono text-noir-500">3–20 Players</span>
              </div>

              {/* Visual Card Banner Preview */}
              <div className="h-44 rounded-2xl bg-gradient-to-br from-noir-950 via-noir-900 to-blood-950/40 border border-noir-800 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group-hover:border-blood-500/40 transition">
                <div className="w-16 h-16 rounded-2xl bg-blood-600/20 border border-blood-500/30 flex items-center justify-center shadow-lg shadow-blood-600/30 mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🕵️</span>
                </div>
                <div className="text-xs font-mono text-blood-400 font-bold uppercase tracking-widest">
                  Noir City Park
                </div>
                <div className="text-[11px] text-noir-400 font-mono mt-0.5">
                  Dynamic Night / Dawn / Day Lighting
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center justify-between">
                  <span>MAFIA 3D</span>
                  <span className="text-xs font-mono text-noir-500 font-normal">v1.0</span>
                </h2>
                <p className="text-xs sm:text-sm text-noir-300 leading-relaxed">
                  Find the Mafia, investigate suspicious behaviour, discuss, vote and survive.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-noir-300">
                <span className="px-2.5 py-1 rounded-lg bg-noir-950 border border-noir-800 flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-blue-400" />
                  <span>Secret Roles</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-noir-950 border border-noir-800 flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  <span>Proximity Voice</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-noir-950 border border-noir-800 flex items-center space-x-1">
                  <Users className="w-3 h-3 text-amber-400" />
                  <span>50% Day Voting</span>
                </span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-6 border-t border-noir-800 mt-6">
              <button
                onClick={() => onSelectGame(GameMode.MAFIA)}
                disabled={!isHost}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-blood-600 to-blood-500 hover:from-blood-500 hover:to-blood-400 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blood-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed group-hover:translate-y-[-1px]"
              >
                <span>Select Mafia 3D</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* ---------------- CARD 2: SHOOTING GAME ---------------- */}
          <div className="group relative bg-noir-900/90 border border-noir-800 hover:border-emerald-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-600/20">
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

            <div className="space-y-5">
              {/* Top Badges */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Team Combat</span>
                </span>
                <span className="text-[11px] font-mono text-noir-500">2–24 Players</span>
              </div>

              {/* Visual Card Banner Preview */}
              <div className="h-44 rounded-2xl bg-gradient-to-br from-noir-950 via-noir-900 to-emerald-950/40 border border-noir-800 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group-hover:border-emerald-500/40 transition">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎯</span>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
                  Urban Combat Arena
                </div>
                <div className="text-[11px] text-noir-400 font-mono mt-0.5">
                  Team Red • Team Blue • Team Green
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center justify-between">
                  <span>SHOOTING GAME</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">NEW</span>
                </h2>
                <p className="text-xs sm:text-sm text-noir-300 leading-relaxed">
                  Create teams, choose your weapons, enter the battlefield and compete with your friends.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-noir-300">
                <span className="px-2.5 py-1 rounded-lg bg-noir-950 border border-noir-800 flex items-center space-x-1">
                  <Target className="w-3 h-3 text-emerald-400" />
                  <span>Body-Part Damage</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-noir-950 border border-noir-800 flex items-center space-x-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>Team Deathmatch</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-noir-950 border border-noir-800 flex items-center space-x-1">
                  <Users className="w-3 h-3 text-purple-400" />
                  <span>Host Team Balancing</span>
                </span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-6 border-t border-noir-800 mt-6">
              <button
                onClick={() => onSelectGame(GameMode.SHOOTING)}
                disabled={!isHost}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed group-hover:translate-y-[-1px]"
              >
                <span>Select Shooting Game</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Back Button */}
        {onCancel && (
          <div className="text-center pt-2">
            <button
              onClick={onCancel}
              className="text-xs font-mono text-noir-400 hover:text-white transition"
            >
              ← Back to Main Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

