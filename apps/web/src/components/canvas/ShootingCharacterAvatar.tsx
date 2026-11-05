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
  animationState?: string; // "idle" | "walk" | "run" | "jump" | "crouch" | "aim"
  isReloading?: boolean;
}

export function ShootingCharacterAvatar({
  displayName,
  teamId = "team-red",
  weaponId = WeaponId.ASSAULT_RIFLE,
  isLocal = false,
  isAlive = true,
  health = 100,
  maxHealth = 100,
  animationState = "idle",
  isReloading = false
}: ShootingCharacterAvatarProps) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const weaponMeshRef = useRef<THREE.Group>(null);

  const teamColors = {
    "team-red": { primary: "#ef4444", accent: "#991b1b", badge: "RED" },
    "team-blue": { primary: "#3b82f6", accent: "#1e40af", badge: "BLUE" },
    "team-green": { primary: "#10b981", accent: "#065f46", badge: "GREEN" }
  };

  const currentTeam = teamColors[teamId as keyof typeof teamColors] || teamColors["team-red"];
  const weapon = WEAPONS_CATALOG[weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];

  // Procedural limb animation state machine
  useFrame((state) => {
    if (!isAlive) return;

    const t = state.clock.getElapsedTime();
    const isJumping = animationState === "jump";
    const isCrouching = animationState === "crouch";
    const isMoving = animationState === "walk" || animationState === "run";
    const isAiming = animationState === "aim";
    const speedMultiplier = animationState === "run" ? 13 : 8.5;
    const amplitude = animationState === "run" ? 0.65 : 0.42;

    if (isCrouching) {
      // Crouching tactical stance: lowered center of gravity
      if (torsoRef.current) torsoRef.current.position.y = 0.55;
      if (leftLegRef.current) {
        leftLegRef.current.position.y = 0.55;
        leftLegRef.current.rotation.x = 0.55;
      }
      if (rightLegRef.current) {
        rightLegRef.current.position.y = 0.55;
        rightLegRef.current.rotation.x = 0.55;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.55;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.85;
    } else if (isJumping) {
      if (torsoRef.current) torsoRef.current.position.y = 0.85;
      if (leftLegRef.current) {
        leftLegRef.current.position.y = 0.85;
        leftLegRef.current.rotation.x = 0.35;
      }
      if (rightLegRef.current) {
        rightLegRef.current.position.y = 0.85;
        rightLegRef.current.rotation.x = 0.25;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.7;
    } else if (isMoving) {
      const swing = Math.sin(t * speedMultiplier) * amplitude;
      if (torsoRef.current) torsoRef.current.position.y = 0.85;
      if (leftLegRef.current) {
        leftLegRef.current.position.y = 0.85;
        leftLegRef.current.rotation.x = swing;
      }
      if (rightLegRef.current) {
        rightLegRef.current.position.y = 0.85;
        rightLegRef.current.rotation.x = -swing;
      }

      if (isAiming) {
        // Upper body steady ADS while moving
        if (leftArmRef.current) leftArmRef.current.rotation.x = -0.85;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -1.2;
      } else {
        if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.4 - 0.4;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.65 + swing * 0.1;
      }
    } else {
      // Idle combat stance
      if (torsoRef.current) torsoRef.current.position.y = 0.85 + Math.sin(t * 2) * 0.012;
      if (leftLegRef.current) {
        leftLegRef.current.position.y = 0.85;
        leftLegRef.current.rotation.x = 0;
      }
      if (rightLegRef.current) {
        rightLegRef.current.position.y = 0.85;
        rightLegRef.current.rotation.x = 0;
      }

      if (isAiming) {
        // Raised precision shoulder ADS pose
        if (leftArmRef.current) leftArmRef.current.rotation.x = -0.85;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -1.2;
      } else if (isReloading) {
        // Reloading: weapon dipped, left hand cycling magazine
        if (leftArmRef.current) leftArmRef.current.rotation.x = -0.3 + Math.sin(t * 8) * 0.2;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.4;
      } else {
        if (leftArmRef.current) leftArmRef.current.rotation.x = -0.45 + Math.sin(t * 2) * 0.03;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.65 + Math.sin(t * 2) * 0.03;
      }
    }
  });

  const isLocalSniperScoped = isLocal && animationState === "aim" && weaponId === WeaponId.SNIPER_RIFLE;

  return (
    <group>
      {/* Overhead Team & Health Nametag (Hidden during local sniper scope view or when dead) */}
      {!isLocalSniperScoped && isAlive && (
        <Html position={[0, animationState === "crouch" ? 1.75 : 2.15, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
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
      )}

      {/* Main Stylized Humanoid Avatar Mesh (Feet grounded at y = 0.0, collapses flat when dead) */}
      <group
        position={[0, !isAlive ? 0.2 : 0, 0]}
        rotation={!isAlive ? [-Math.PI / 2, 0, 0.4] : [0, 0, 0]}
      >
        {/* Torso & Tactical Armor (Waist at y = 0.85) */}
        <group ref={torsoRef} position={[0, 0.85, 0]}>
          {/* Base Shirt/Fatigues */}
          <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.55, 0.65, 0.32]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>

          {/* Tactical Team Vest */}
          <mesh position={[0, 0.32, 0.02]} castShadow receiveShadow>
            <boxGeometry args={[0.58, 0.58, 0.34]} />
            <meshStandardMaterial color={currentTeam.accent} roughness={0.6} metalness={0.2} />
          </mesh>

          {/* Team Chest Insignia / Stripes */}
          <mesh position={[0, 0.42, 0.2]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.35, 0.12]} />
            <meshBasicMaterial color={currentTeam.primary} />
          </mesh>

          {/* Head & Helmet (Neck at y = 0.65, Head at y = 0.78 above waist = 1.63m) */}
          <group position={[0, 0.78, 0]}>
            {/* Face/Head Base */}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#fcd34d" roughness={0.6} />
            </mesh>

            {/* Combat Helmet */}
            <mesh position={[0, 0.05, 0]} castShadow>
              <sphereGeometry args={[0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
            </mesh>

            {/* Tactical Visor / Goggles */}
            <mesh position={[0, 0.02, 0.16]} castShadow>
              <boxGeometry args={[0.28, 0.08, 0.1]} />
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

        {/* Left Arm (Shoulder at y = 1.45m) */}
        <group ref={leftArmRef} position={[-0.38, 1.45, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.56, 0.16]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
        </group>

        {/* Right Arm & 3D Weapon Model (Shoulder at y = 1.45m) */}
        <group ref={rightArmRef} position={[0.38, 1.45, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.56, 0.16]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>

          {/* 3D Weapon Held in Hand (Distinct Archetypes) */}
          <group ref={weaponMeshRef} position={[0, -0.48, 0.28]} rotation={[-0.2, 0, 0]}>
            {/* 1. M4-A1 Assault Rifle */}
            {weaponId === WeaponId.ASSAULT_RIFLE && (
              <group>
                <mesh castShadow>
                  <boxGeometry args={[0.09, 0.13, 0.52]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* Barrel */}
                <mesh position={[0, 0.02, 0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Curved Banana Mag */}
                <mesh position={[0, -0.14, 0.06]} rotation={[0.25, 0, 0]}>
                  <boxGeometry args={[0.05, 0.22, 0.08]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.7} />
                </mesh>
                {/* Tactical Stock */}
                <mesh position={[0, -0.02, -0.32]}>
                  <boxGeometry args={[0.06, 0.14, 0.2]} />
                  <meshStandardMaterial color="#334155" roughness={0.6} />
                </mesh>
              </group>
            )}

            {/* 2. Tactical Pump Shotgun */}
            {weaponId === WeaponId.SHOTGUN && (
              <group>
                <mesh castShadow>
                  <boxGeometry args={[0.11, 0.14, 0.48]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
                </mesh>
                {/* Heavy Wide Bore Barrel */}
                <mesh position={[0, 0.03, 0.36]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.04, 0.04, 0.42, 10]} />
                  <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
                </mesh>
                {/* Under-barrel Magazine Tube */}
                <mesh position={[0, -0.03, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.028, 0.028, 0.36, 8]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} />
                </mesh>
                {/* Pump Grip */}
                <mesh position={[0, -0.03, 0.24]}>
                  <boxGeometry args={[0.09, 0.08, 0.16]} />
                  <meshStandardMaterial color="#78350f" roughness={0.9} />
                </mesh>
              </group>
            )}

            {/* 3. AWM Heavy Sniper */}
            {weaponId === WeaponId.SNIPER_RIFLE && (
              <group>
                <mesh castShadow>
                  <boxGeometry args={[0.1, 0.14, 0.6]} />
                  <meshStandardMaterial color="#14532d" roughness={0.5} />
                </mesh>
                {/* Long Heavy Fluted Barrel with Muzzle Brake */}
                <mesh position={[0, 0.02, 0.54]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.032, 0.032, 0.65, 10]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Muzzle Brake */}
                <mesh position={[0, 0.02, 0.88]}>
                  <boxGeometry args={[0.08, 0.07, 0.09]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} />
                </mesh>
                {/* Elevated Scope Optic */}
                <mesh position={[0, 0.13, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.038, 0.038, 0.32, 12]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Scope Mount Rings */}
                <mesh position={[0, 0.08, -0.04]}>
                  <boxGeometry args={[0.06, 0.08, 0.04]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[0, 0.08, 0.14]}>
                  <boxGeometry args={[0.06, 0.08, 0.04]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
              </group>
            )}

            {/* 4. Vector Rapid SMG */}
            {weaponId === WeaponId.SMG && (
              <group>
                <mesh castShadow>
                  <boxGeometry args={[0.08, 0.16, 0.36]} />
                  <meshStandardMaterial color="#1e1e24" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Short Compact Barrel */}
                <mesh position={[0, 0.03, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} />
                </mesh>
                {/* Extended Vertical Stick Mag */}
                <mesh position={[0, -0.16, 0.08]} rotation={[0.1, 0, 0]}>
                  <boxGeometry args={[0.045, 0.26, 0.055]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.7} />
                </mesh>
              </group>
            )}

            {/* 5. Tactical Sidearm Pistol */}
            {weaponId === WeaponId.PISTOL && (
              <group>
                {/* Slide */}
                <mesh position={[0, 0.05, 0.06]} castShadow>
                  <boxGeometry args={[0.065, 0.07, 0.28]} />
                  <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* Polymer Grip */}
                <mesh position={[0, -0.06, -0.02]} rotation={[-0.25, 0, 0]}>
                  <boxGeometry args={[0.055, 0.14, 0.07]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.8} />
                </mesh>
              </group>
            )}
          </group>
        </group>

        {/* Left Leg (Hip Joint at y = 0.85m, Boot resting on y = 0.0) */}
        <group ref={leftLegRef} position={[-0.18, 0.85, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.18, 0.7, 0.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* Combat Boot */}
          <mesh position={[0, -0.77, 0.04]} castShadow>
            <boxGeometry args={[0.22, 0.16, 0.3]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
        </group>

        {/* Right Leg (Hip Joint at y = 0.85m, Boot resting on y = 0.0) */}
        <group ref={rightLegRef} position={[0.18, 0.85, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.18, 0.7, 0.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* Combat Boot */}
          <mesh position={[0, -0.77, 0.04]} castShadow>
            <boxGeometry args={[0.22, 0.16, 0.3]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
