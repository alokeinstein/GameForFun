"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, ArrowRight, Shield, Skull, Eye, Radio, Sparkles, Trophy, Award, History } from "lucide-react";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@mafia/shared";
import { getSavedPlayerName, savePlayerName, HTTP_SERVER_URL } from "../services/colyseus";

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<any | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    const saved = getSavedPlayerName() || "";
    setNickname(saved);
    if (saved.trim()) {
      fetchStats(saved.trim());
    }
  }, []);

  const fetchStats = async (name: string) => {
    try {
      const res = await fetch(`${HTTP_SERVER_URL}/api/stats/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setPlayerStats(data.stats);
      } else {
        setPlayerStats(null);
      }
    } catch {
      setPlayerStats(null);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 16);
    setNickname(val);
    savePlayerName(val);
  };

  const handleNameBlur = () => {
    if (nickname.trim()) {
      fetchStats(nickname.trim());
    }
  };

  const handleCreateRoom = () => {
    const name = nickname.trim();
    if (!name) {
      setError("Please enter a nickname before creating a room.");
      return;
    }
    setError(null);

    // Generate random 5-character room code
    let code = "";
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }

    router.push(`/lobby/${code}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nickname.trim();
    const code = joinCode.trim().toUpperCase();

    if (!name) {
      setError("Please enter a nickname first.");
      return;
    }
    if (!code || code.length < 3) {
      setError("Please enter a valid room code.");
      return;
    }
    setError(null);

    router.push(`/lobby/${code}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="border-b border-noir-800 bg-noir-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blood-600 to-blood-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blood-600/30">
              M
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">
              MAFIA <span className="text-blood-500 text-xs font-mono px-1.5 py-0.5 rounded bg-blood-600/10 border border-blood-500/20">3D</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono text-noir-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SERVER ONLINE</span>
            </span>
            <span>v0.1.0</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background radial atmosphere */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blood-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-4xl w-full mx-auto space-y-10 z-10">
        {/* Hero Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-noir-850 border border-noir-700 text-noir-200 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blood-500" />
            <span>Server-Authoritative Real-Time 3D Social Deduction</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase">
            Trust <span className="text-blood-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]">No One.</span>
          </h1>
          <p className="max-w-xl mx-auto text-noir-400 text-base sm:text-lg">
            A small town in the grip of deception. Uncover the secret Mafia before they eliminate every Citizen, or deceive your way to victory.
          </p>
        </div>

        {/* Global Player Identity Card */}
        <div className="max-w-md mx-auto bg-noir-900 border border-noir-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div>
            <label className="block text-xs font-mono text-noir-400 uppercase tracking-wider mb-2">
              Your Player Name
            </label>
            <input
              type="text"
              value={nickname}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              placeholder="e.g. Alok, Vito, Shadow"
              className="w-full px-4 py-3 bg-noir-950 border border-noir-700 rounded-xl text-white placeholder-noir-600 focus:outline-none focus:border-blood-500 focus:ring-1 focus:ring-blood-500 text-base font-semibold transition"
            />
          </div>

          {/* Career Record Badge */}
          {playerStats && (
            <div className="flex items-center justify-between px-3 py-2 bg-noir-950/70 border border-noir-800 rounded-xl">
              <div className="flex items-center space-x-2 text-xs font-mono">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white font-bold">{playerStats.gamesWon} Wins</span>
                <span className="text-noir-600">•</span>
                <span className="text-noir-400">{playerStats.gamesPlayed} Matches</span>
                <span className="text-noir-600">•</span>
                <span className="text-emerald-400">{playerStats.timesSurvived} Survived</span>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(true)}
                className="text-[11px] font-mono text-blood-400 hover:text-blood-300 underline font-bold"
              >
                Dossier
              </button>
            </div>
          )}

          {error && (
            <div className="text-xs font-mono text-blood-400 bg-blood-600/10 border border-blood-500/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Split: Create vs Join */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCreateRoom}
              className="flex items-center justify-center space-x-2 w-full py-3.5 px-4 bg-gradient-to-r from-blood-600 to-blood-500 hover:from-blood-500 hover:to-blood-400 text-white font-bold rounded-xl shadow-lg shadow-blood-600/25 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>

            <form onSubmit={handleJoinRoom} className="flex space-x-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="ROOM CODE"
                className="w-full px-3 py-3.5 bg-noir-950 border border-noir-700 rounded-xl text-center font-mono font-bold tracking-widest text-white placeholder-noir-600 focus:outline-none focus:border-blood-500"
              />
              <button
                type="submit"
                className="px-4 py-3.5 bg-noir-800 hover:bg-noir-700 border border-noir-700 text-white font-bold rounded-xl transition flex items-center justify-center"
                title="Join Room"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Feature Cards / How It Works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-noir-900/60 border border-noir-800 rounded-xl p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-blood-500/10 text-blood-400 flex items-center justify-center">
              <Skull className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Secret Mafia Team</h3>
            <p className="text-xs text-noir-400 leading-relaxed">
              Mafia members know each other and coordinate during the Night phase to eliminate Citizens via plurality voting.
            </p>
          </div>

          <div className="bg-noir-900/60 border border-noir-800 rounded-xl p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">50% Elimination Rule</h3>
            <p className="text-xs text-noir-400 leading-relaxed">
              During Day voting, a candidate must receive at least 50% of all eligible living players' votes to be executed.
            </p>
          </div>

          <div className="bg-noir-900/60 border border-noir-800 rounded-xl p-5 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Deadshot.io Inspired 3D</h3>
            <p className="text-xs text-noir-400 leading-relaxed">
              Optimized low-poly 3D village with smooth 60fps movement and server-authoritative state synchronization.
            </p>
          </div>
        </div>

        {/* Career Dossier Modal */}
        {showStatsModal && playerStats && (
          <div className="fixed inset-0 z-50 bg-noir-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-noir-900 border border-noir-800 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-noir-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-lg">Career Dossier</h3>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-noir-400 hover:text-white font-mono text-xs px-2.5 py-1 rounded-lg bg-noir-800 hover:bg-noir-700 transition"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950/60 border border-noir-800">
                  <span className="text-xs font-mono text-noir-400">Agent Alias</span>
                  <span className="text-sm font-bold text-white font-mono">{nickname}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-noir-950/60 border border-noir-800 text-center">
                    <span className="block text-[10px] font-mono uppercase text-noir-400">Total Matches</span>
                    <span className="text-2xl font-black text-white font-mono">{playerStats.gamesPlayed}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-noir-950/60 border border-noir-800 text-center">
                    <span className="block text-[10px] font-mono uppercase text-noir-400">Victories</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">{playerStats.gamesWon}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blood-950/20 border border-blood-900/30 text-center">
                    <span className="block text-[10px] font-mono uppercase text-blood-400">Mafia Wins</span>
                    <span className="text-2xl font-black text-blood-400 font-mono">{playerStats.mafiaWins}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-center">
                    <span className="block text-[10px] font-mono uppercase text-emerald-400">Citizen Wins</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{playerStats.citizenWins}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-noir-950/60 border border-noir-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-noir-400">Survival Tally</span>
                  <span className="text-emerald-400 font-bold">{playerStats.timesSurvived} Survived / {playerStats.timesEliminated} Casualties</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

