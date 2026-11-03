"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Room } from "colyseus.js";
import { MafiaRoomState, PlayerState } from "@mafia/shared";
import { TownMap } from "./TownMap";
import { CharacterController } from "./CharacterController";
import { RemotePlayers } from "./RemotePlayers";

interface GameSceneProps {
  room: Room<MafiaRoomState>;
  sessionId: string;
  players: PlayerState[];
  phase: string;
  isHost?: boolean;
}

export function GameScene({
  room,
  sessionId,
  players,
  phase,
  isHost = false
}: GameSceneProps) {
  const localPlayer = players.find((p) => p.id === sessionId);
  const isSpectator = !localPlayer || !localPlayer.isAlive;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-noir-950 pointer-events-auto">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 8, 14], fov: 55 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -16, 0]}>
            {/* Town Square 3D Map */}
            <TownMap phase={phase} />

            {/* Local Player Controller */}
            {!isSpectator && localPlayer ? (
              <CharacterController
                room={room}
                player={localPlayer}
                isHost={isHost}
              />
            ) : (
              /* Spectator / Ghost Orbit Controls */
              <OrbitControls
                maxPolarAngle={Math.PI / 2.1}
                minDistance={4}
                maxDistance={35}
                enableDamping
              />
            )}

            {/* Other Remote Players */}
            <RemotePlayers players={players} localSessionId={sessionId} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
