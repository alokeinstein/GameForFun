"use client";

import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PlayerState } from "@mafia/shared";
import { CharacterAvatar } from "./CharacterAvatar";
import { voiceChatService } from "../../services/webrtc";

interface RemotePlayerProps {
  player: PlayerState;
  isSpeaking: boolean;
}

function RemotePlayer({ player, isSpeaking }: RemotePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    // Smoothly interpolate position towards server transform (60 FPS visual smoothness)
    const targetX = player.x || 0;
    const targetY = player.y || 0;
    const targetZ = player.z || 0;

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.25);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.25);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.25);

    // Smoothly interpolate yaw rotation
    const targetRotY = player.rotationY || 0;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.25);
  });

  return (
    <group ref={groupRef} position={[player.x || 0, player.y || 0, player.z || 0]}>
      <CharacterAvatar
        displayName={player.displayName}
        isLocal={false}
        isAlive={player.isAlive}
        isHost={player.isHost}
        isSpeaking={isSpeaking}
        animationState={player.animationState || "idle"}
      />
    </group>
  );
}

interface RemotePlayersProps {
  players: PlayerState[];
  localSessionId: string;
}

export function RemotePlayers({ players, localSessionId }: RemotePlayersProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = voiceChatService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const remoteList = players.filter((p) => p.id !== localSessionId);

  return (
    <group>
      {remoteList.map((player) => (
        <RemotePlayer
          key={player.id}
          player={player}
          isSpeaking={voiceChatService.isPeerSpeaking(player.id)}
        />
      ))}
    </group>
  );
}


