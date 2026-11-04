"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ShootingPlayerState } from "@mafia/shared";
import { ShootingCharacterAvatar } from "./ShootingCharacterAvatar";

interface ShootingRemotePlayerProps {
  player: ShootingPlayerState;
}

function ShootingRemotePlayer({ player }: ShootingRemotePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const targetX = player.x || 0;
    const targetY = player.y || 0;
    const targetZ = player.z || 0;

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.25);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.25);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.25);

    const targetRotY = player.rotationY || 0;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.25);
  });

  return (
    <group ref={groupRef} position={[player.x || 0, player.y || 0, player.z || 0]}>
      <ShootingCharacterAvatar
        displayName={player.displayName}
        teamId={player.teamId}
        weaponId={player.weaponId}
        isLocal={false}
        isAlive={player.isAlive}
        health={player.health}
        maxHealth={player.maxHealth}
        animationState={player.animationState || "idle"}
      />
    </group>
  );
}

interface ShootingRemotePlayersProps {
  players: ShootingPlayerState[];
  localSessionId: string;
}

export function ShootingRemotePlayers({ players, localSessionId }: ShootingRemotePlayersProps) {
  const remotes = players.filter((p) => p.id !== localSessionId);

  return (
    <group>
      {remotes.map((p) => (
        <ShootingRemotePlayer key={p.id} player={p} />
      ))}
    </group>
  );
}

