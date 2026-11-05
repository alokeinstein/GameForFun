"use client";

import React, { useState, useEffect } from "react";
import { Room } from "colyseus.js";
import {
  WeaponId,
  WEAPONS_CATALOG,
  ClientMessageType,
  ShootingRoomState
} from "@mafia/shared";
import { Check, ShieldAlert, Crosshair, Zap, Gauge } from "lucide-react";

interface ShootingDeathLoadoutModalProps {
  room: Room<ShootingRoomState>;
  currentWeaponId: WeaponId;
  respawnDelaySec: number;
  isAlive: boolean;
}

export function ShootingDeathLoadoutModal({
  room,
  currentWeaponId,
  respawnDelaySec = 5,
  isAlive
}: ShootingDeathLoadoutModalProps) {
  const [countdown, setCountdown] = useState(respawnDelaySec);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>(currentWeaponId);

  useEffect(() => {
    if (isAlive) {
      setCountdown(respawnDelaySec);
      return;
    }

    setCountdown(respawnDelaySec);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const rem = Math.max(0, respawnDelaySec - elapsed);
      setCountdown(rem);
      if (rem <= 0) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [isAlive, respawnDelaySec]);

  if (isAlive) return null;

  const handleSelectWeapon = (wId: WeaponId) => {
    setSelectedWeapon(wId);
    room.send(ClientMessageType.SHOOTING_SELECT_LOADOUT, { weaponId: wId });
  };

  const weaponList = Object.values(WEAPONS_CATALOG);

  return (
    <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none pointer-events-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-noir-950/95 border border-rose-600/40 rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col space-y-5">
        {/* Elimination Banner & Countdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-noir-800 pb-4 gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-rose-400 text-xl animate-pulse">
              💀
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-mono text-white tracking-wider">
                ELIMINATED
              </h2>
              <p className="text-xs font-mono text-rose-300/80">
                Choose your respawn loadout below before timer expires
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-noir-900 border border-noir-750 px-4 py-2 rounded-2xl">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono text-noir-300">RESPAWN IN:</span>
            <span className="text-lg font-mono font-black text-amber-400 min-w-[36px]">
              {countdown.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Loadout Selection Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-noir-400 px-1">
            <span>SELECT RE-ARMAMENT (SLOTS 1-5)</span>
            <span className="text-emerald-400 font-bold">READY ON SPAWN</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {weaponList.map((w, index) => {
              const isSelected = selectedWeapon === w.id;
              return (
                <div
                  key={w.id}
                  onClick={() => handleSelectWeapon(w.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-noir-900/90 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/50"
                      : "bg-noir-900/40 hover:bg-noir-900/70 border-noir-800 hover:border-noir-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{w.iconEmoji}</span>
                      <div>
                        <div className="text-xs font-bold text-white font-mono leading-tight">
                          {w.name}
                        </div>
                        <div className="text-[10px] font-mono uppercase text-noir-400">
                          Slot {index + 1} • {w.category}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-noir-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Weapon Stats Bar */}
                  <div className="mt-3 pt-2.5 border-t border-noir-800/80 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-noir-300">
                    <div>DMG: <strong className="text-white">{w.baseDamage}{w.pelletCount > 1 ? `x${w.pelletCount}` : ""}</strong></div>
                    <div>FIRE: <strong className="text-white">{w.fireRateHz} Hz</strong></div>
                    <div>MAG: <strong className="text-white">{w.magazineCapacity}</strong></div>
                    <div>RANGE: <strong className="text-white">{w.effectiveRangeM}m</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Confirmation Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-noir-900/70 border border-noir-800 text-xs font-mono">
          <span className="text-noir-300">Equipping on next drop:</span>
          <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
            <span>{WEAPONS_CATALOG[selectedWeapon]?.name}</span>
            <span>({WEAPONS_CATALOG[selectedWeapon]?.magazineCapacity} RDS)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
