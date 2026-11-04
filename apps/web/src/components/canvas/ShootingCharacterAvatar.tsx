"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { WeaponId, WEAPONS_CATALOG } from "@mafia/shared";

interface ShootingCharacterAvatarProps {
  displayName: string;
  teamId: string; // "team-red" | "team-blue" | "team-green"
  weaponId?: string;
  isLocal?: boolean;
  isAlive?: boolean;
  health?: number;
  maxHealth?: number;
  animationState?: string;
}

export function ShootingCharacterAvatar({
  displayName,
  teamId = "team-red",
  weaponId = WeaponId.ASSAULT_RIFLE,
  isLocal = false,
  isAlive = true,
  health = 100,
  maxHealth = 100,
  animationState = "idle"
}: ShootingCharacterAvatarProps) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  const teamColors = {
    "team-red": { primary: "#ef4444", accent: "#991b1b", badge: "RED" },
    "team-blue": { primary: "#3b82f6", accent: "#1e40af", badge: "BLUE" },
    "team-green": { primary: "#10b981", accent: "#065f46", badge: "GREEN" }
  };

  const currentTeam = teamColors[teamId as keyof typeof teamColors] || teamColors["team-red"];
  const weapon = WEAPONS_CATALOG[weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];

  // Procedural limb animation
  useFrame((state) => {
    if (!isAlive) return;

    const t = state.clock.getElapsedTime();
    const isJumping = animationState === "jump";
    const isMoving = animationState === "walk" || animationState === "run";
    const speedMultiplier = animationState === "run" ? 13 : 8.5;
    const amplitude = animationState === "run" ? 0.65 : 0.42;

    if (isJumping) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0.35;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0.25;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.7;
      if (torsoRef.current) torsoRef.current.position.y = 0.95;
    } else if (isMoving) {
      const swing = Math.sin(t * speedMultiplier) * amplitude;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      // Tactical weapon carry: right arm stays raised holding weapon, left arm balances
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.4 - 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.65 + swing * 0.1;
      if (torsoRef.current) torsoRef.current.position.y = 0.95;
    } else {
      // Idle combat stance: weapon held at ready
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.45 + Math.sin(t * 2) * 0.03;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.65 + Math.sin(t * 2) * 0.03;
      if (torsoRef.current) torsoRef.current.position.y = 0.95 + Math.sin(t * 2) * 0.015;
    }
  });

  return (
    <group>
      {/* Overhead Team & Health Nametag */}
      <Html position={[0, 2.3, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
        <div className="flex flex-col items-center pointer-events-none select-none">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-noir-950/85 border border-noir-700/80 shadow-md">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentTeam.primary }}
            />
            <span className="font-bold text-[11px] text-white tracking-wide">
              {displayName}
            </span>
            {isLocal && (
              <span className="text-[9px] font-mono text-emerald-400 font-semibold">(YOU)</span>
            )}
            <span className="text-[10px]">{weapon.iconEmoji}</span>
          </div>

          {/* Mini Health Bar */}
          <div className="w-16 h-1.5 bg-noir-900/90 border border-noir-800 rounded-full mt-1 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${Math.max(0, Math.min(100, (health / maxHealth) * 100))}%`,
                backgroundColor: health > 30 ? currentTeam.primary : "#ef4444"
              }}
            />
          </div>
        </div>
      </Html>

      {/* Main Stylized Humanoid Avatar Mesh */}
      <group position={[0, -0.9, 0]}>
        {/* Torso & Tactical Armor */}
        <group ref={torsoRef} position={[0, 0.95, 0]}>
          {/* Base Shirt/Fatigues */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.55, 0.65, 0.32]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>

          {/* Tactical Team Vest */}
          <mesh position={[0, 0, 0.02]} castShadow receiveShadow>
            <boxGeometry args={[0.58, 0.58, 0.34]} />
            <meshStandardMaterial color={currentTeam.accent} roughness={0.6} metalness={0.2} />
          </mesh>

          {/* Team Chest Insignia / Stripes */}
          <mesh position={[0, 0.1, 0.2]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.35, 0.12]} />
            <meshBasicMaterial color={currentTeam.primary} />
          </mesh>

          {/* Head & Helmet */}
          <group position={[0, 0.52, 0]}>
            {/* Face/Head Base */}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color="#fcd34d" roughness={0.6} />
            </mesh>

            {/* Combat Helmet */}
            <mesh position={[0, 0.06, 0]} castShadow>
              <sphereGeometry args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
            </mesh>

            {/* Tactical Visor / Goggles */}
            <mesh position={[0, 0.02, 0.18]} castShadow>
              <boxGeometry args={[0.3, 0.08, 0.1]} />
              <meshStandardMaterial
                color={currentTeam.primary}
                roughness={0.2}
                metalness={0.8}
                emissive={currentTeam.primary}
                emissiveIntensity={0.4}
              />
            </mesh>
          </group>
        </group>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.38, 1.2, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.6, 0.16]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
        </group>

        {/* Right Arm & 3D Weapon Model */}
        <group ref={rightArmRef} position={[0.38, 1.2, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.6, 0.16]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>

          {/* 3D Weapon Held in Hand */}
          <group position={[0, -0.5, 0.28]} rotation={[-0.2, 0, 0]}>
            {/* Receiver Frame */}
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.14, 0.55]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
            </mesh>

            {/* Barrel */}
            <mesh position={[0, 0.02, 0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry
                args={[
                  weaponId === WeaponId.SNIPER_RIFLE ? 0.035 : 0.025,
                  weaponId === WeaponId.SNIPER_RIFLE ? 0.035 : 0.025,
                  weaponId === WeaponId.SNIPER_RIFLE ? 0.55 : 0.35,
                  8
                ]}
              />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Magazine */}
            <mesh position={[0, -0.12, 0.05]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.06, 0.18, 0.08]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} />
            </mesh>

            {/* Sniper Scope Cylinder (Only for Sniper) */}
            {weaponId === WeaponId.SNIPER_RIFLE && (
              <mesh position={[0, 0.12, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.28, 12]} />
                <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
              </mesh>
            )}
          </group>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.18, 0.65, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 0.7, 0.22]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* Combat Boot */}
          <mesh position={[0, -0.68, 0.04]} castShadow>
            <boxGeometry args={[0.22, 0.14, 0.3]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.18, 0.65, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 0.7, 0.22]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* Combat Boot */}
          <mesh position={[0, -0.68, 0.04]} castShadow>
            <boxGeometry args={[0.22, 0.14, 0.3]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

