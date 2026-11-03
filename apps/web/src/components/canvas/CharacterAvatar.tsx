"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

interface CharacterAvatarProps {
  displayName: string;
  isLocal?: boolean;
  isAlive?: boolean;
  isHost?: boolean;
  isSpeaking?: boolean;
  animationState?: string;
  color?: string;
}

export function CharacterAvatar({
  displayName,
  isLocal = false,
  isAlive = true,
  isHost = false,
  isSpeaking = false,
  animationState = "idle",
  color
}: CharacterAvatarProps) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  // Procedural limb animation (walk/run cycle)
  useFrame((state) => {
    if (!isAlive) return;

    const t = state.clock.getElapsedTime();
    const isMoving = animationState === "walk" || animationState === "run";
    const speedMultiplier = animationState === "run" ? 14 : 9;
    const amplitude = animationState === "run" ? 0.65 : 0.45;

    if (isMoving) {
      const swing = Math.sin(t * speedMultiplier) * amplitude;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.9;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.9;
      if (torsoRef.current) torsoRef.current.position.y = 0.95 + Math.abs(Math.sin(t * speedMultiplier * 2)) * 0.06;
    } else {
      // Gentle idle breathing
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (torsoRef.current) torsoRef.current.position.y = 0.95 + Math.sin(t * 2) * 0.02;
    }
  });

  const bodyColor = isAlive ? (color || (isLocal ? "#3b82f6" : "#64748b")) : "#94a3b8";
  const coatColor = isAlive ? (isLocal ? "#1e3a8a" : "#1e293b") : "#cbd5e1";

  return (
    <group position={[0, isAlive ? 0 : 0.5, 0]}>
      {/* Floating Name Tag */}
      <Html position={[0, 2.35, 0]} center distanceFactor={14}>
        <div className="flex flex-col items-center pointer-events-none select-none">
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full bg-noir-950/80 border shadow-lg text-[11px] font-bold font-mono tracking-wide text-white whitespace-nowrap transition-colors ${
            isSpeaking ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-noir-700/80"
          }`}>
            {isHost && <span className="text-amber-400">👑</span>}
            <span className={isLocal ? "text-blue-400" : isAlive ? "text-white" : "text-noir-400"}>
              {displayName}
            </span>
            {isLocal && <span className="text-[9px] text-blue-300 ml-0.5">(You)</span>}
            {isSpeaking && <span className="text-[10px] text-emerald-400 animate-pulse ml-0.5">🎙️</span>}
            {!isAlive && <span className="text-[9px] text-rose-400 ml-0.5">💀</span>}
          </div>
        </div>
      </Html>

      {/* Speaking Sound Ring */}
      {isSpeaking && isAlive && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.78, 32]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
        </mesh>
      )}

      {/* Local Player Selection Ring */}
      {isLocal && isAlive && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.65, 32]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.65} />
        </mesh>
      )}

      {/* Ghost aura for dead players */}
      {!isAlive && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.15} wireframe />
        </mesh>
      )}

      {/* Torso Group */}
      <group ref={torsoRef} position={[0, 0.95, 0]}>
        {/* Main Trenchcoat / Body */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.52, 0.7, 0.3]} />
          <meshStandardMaterial
            color={coatColor}
            roughness={0.7}
            transparent={!isAlive}
            opacity={isAlive ? 1 : 0.4}
          />
        </mesh>

        {/* Head */}
        <group position={[0, 0.58, 0]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.32, 0.32, 0.3]} />
            <meshStandardMaterial
              color={bodyColor}
              roughness={0.6}
              transparent={!isAlive}
              opacity={isAlive ? 1 : 0.4}
            />
          </mesh>

          {/* Noir Fedora / Hat */}
          {isAlive && (
            <group position={[0, 0.16, 0]}>
              {/* Hat Brim */}
              <mesh castShadow position={[0, 0.02, 0]}>
                <boxGeometry args={[0.52, 0.04, 0.5]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
              {/* Hat Crown */}
              <mesh castShadow position={[0, 0.14, 0]}>
                <boxGeometry args={[0.3, 0.22, 0.28]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
              {/* Hat Ribbon */}
              <mesh position={[0, 0.06, 0]}>
                <boxGeometry args={[0.31, 0.05, 0.29]} />
                <meshBasicMaterial color={isLocal ? "#3b82f6" : "#dc2626"} />
              </mesh>
            </group>
          )}

          {/* Visor / Eye Shadow */}
          <mesh position={[0, 0.02, 0.16]}>
            <boxGeometry args={[0.26, 0.08, 0.02]} />
            <meshBasicMaterial color={isAlive ? "#020617" : "#bfdbfe"} />
          </mesh>
        </group>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.34, 0.22, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.14, 0.55, 0.16]} />
            <meshStandardMaterial
              color={coatColor}
              roughness={0.7}
              transparent={!isAlive}
              opacity={isAlive ? 1 : 0.4}
            />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.34, 0.22, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.14, 0.55, 0.16]} />
            <meshStandardMaterial
              color={coatColor}
              roughness={0.7}
              transparent={!isAlive}
              opacity={isAlive ? 1 : 0.4}
            />
          </mesh>
        </group>
      </group>

      {/* Legs */}
      <group ref={leftLegRef} position={[-0.14, 0.6, 0]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.2]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.8}
            transparent={!isAlive}
            opacity={isAlive ? 1 : 0.4}
          />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.14, 0.6, 0]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.2]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.8}
            transparent={!isAlive}
            opacity={isAlive ? 1 : 0.4}
          />
        </mesh>
      </group>
    </group>
  );
}

