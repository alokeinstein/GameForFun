"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Room } from "colyseus.js";
import { ShootingRoomState, ShootingPlayerState } from "@mafia/shared";
import { ShootingMap } from "./ShootingMap";
import { ShootingCharacterController } from "./ShootingCharacterController";
import { ShootingRemotePlayers } from "./ShootingRemotePlayers";
import { ShootingCombatVFX } from "./ShootingCombatVFX";

interface ShootingGameSceneProps {
  room: Room<ShootingRoomState>;
  sessionId: string;
  players: ShootingPlayerState[];
  mapName?: string;
  isHost?: boolean;
}

export function ShootingGameScene({
  room,
  sessionId,
  players,
  mapName = "URBAN_DISTRICT",
  isHost = false
}: ShootingGameSceneProps) {
  const localPlayer = players.find((p) => p.id === sessionId);
  const isSpectator = !localPlayer || !localPlayer.isAlive;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-sky-200 pointer-events-auto">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 8, 14], fov: 60 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -18, 0]}>
            {/* Dedicated Urban Combat Shooting Map */}
            <ShootingMap mapName={mapName} />

            {/* Local Shooting Character Controller */}
            {!isSpectator && localPlayer ? (
              <ShootingCharacterController
                room={room}
                player={localPlayer}
                isHost={isHost}
              />
            ) : (
              /* Spectator / Respawning Camera Controls */
              <OrbitControls
                maxPolarAngle={Math.PI / 2.1}
                minDistance={4}
                maxDistance={45}
                enableDamping
              />
            )}

            {/* Remote Teammates & Enemies */}
            <ShootingRemotePlayers players={players} localSessionId={sessionId} />

            {/* Dynamic Combat Visual Effects (Muzzle Flashes, Tracers, Floating Damage) */}
            <ShootingCombatVFX room={room} localSessionId={sessionId} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}

