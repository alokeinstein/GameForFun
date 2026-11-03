"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Phase } from "@mafia/game-rules";

interface TownMapProps {
  phase: string;
}

export function TownMap({ phase }: TownMapProps) {
  const isNight = phase === Phase.NIGHT;
  const isDawn = phase === Phase.MORNING_ANNOUNCEMENT;

  // Perimeter building configurations
  const buildings = useMemo(() => {
    return [
      // North row
      { pos: [-24, 6, -30], size: [12, 12, 10], color: "#1e2433" },
      { pos: [-10, 8, -32], size: [14, 16, 12], color: "#181d29" },
      { pos: [6, 7, -30], size: [14, 14, 10], color: "#22293a" },
      { pos: [22, 9, -32], size: [14, 18, 12], color: "#1a1f2c" },

      // South row
      { pos: [-22, 7, 30], size: [14, 14, 10], color: "#181d29" },
      { pos: [-6, 9, 32], size: [14, 18, 12], color: "#1e2433" },
      { pos: [10, 6, 30], size: [14, 12, 10], color: "#22293a" },
      { pos: [24, 8, 32], size: [12, 16, 12], color: "#1a1f2c" },

      // West row
      { pos: [-32, 8, -12], size: [10, 16, 14], color: "#1a1f2c" },
      { pos: [-32, 7, 6], size: [10, 14, 14], color: "#181d29" },
      { pos: [-32, 9, 20], size: [10, 18, 12], color: "#22293a" },

      // East row
      { pos: [32, 7, -12], size: [10, 14, 14], color: "#22293a" },
      { pos: [32, 9, 6], size: [10, 18, 14], color: "#1a1f2c" },
      { pos: [32, 6, 20], size: [10, 12, 12], color: "#181d29" }
    ];
  }, []);

  // Streetlamp positions
  const streetlamps = useMemo(() => {
    return [
      [-14, 0, -14],
      [14, 0, -14],
      [-14, 0, 14],
      [14, 0, 14],
      [-20, 0, 0],
      [20, 0, 0],
      [0, 0, -20],
      [0, 0, 20]
    ];
  }, []);

  // Stone benches in central tribunal circle
  const benches = useMemo(() => {
    const list = [];
    const count = 8;
    const radius = 9;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      list.push({
        pos: [x, 0.4, z] as [number, number, number],
        rot: [0, -angle, 0] as [number, number, number]
      });
    }
    return list;
  }, []);

  return (
    <group>
      {/* 1. ATMOSPHERIC LIGHTING & FOG */}
      {isNight ? (
        <>
          <color attach="background" args={["#08090f"]} />
          <fog attach="fog" args={["#08090f", 12, 55]} />
          <ambientLight intensity={0.15} color="#43507a" />
          <directionalLight
            position={[-15, 30, -15]}
            intensity={0.35}
            color="#6b8aff"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
        </>
      ) : isDawn ? (
        <>
          <color attach="background" args={["#1c1618"]} />
          <fog attach="fog" args={["#1c1618", 18, 65]} />
          <ambientLight intensity={0.4} color="#fcd34d" />
          <directionalLight
            position={[25, 20, -15]}
            intensity={1.2}
            color="#fbbf24"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
        </>
      ) : (
        <>
          <color attach="background" args={["#0f172a"]} />
          <fog attach="fog" args={["#0f172a", 25, 80]} />
          <ambientLight intensity={0.5} color="#cbd5e1" />
          <directionalLight
            position={[18, 35, 18]}
            intensity={1.4}
            color="#ffffff"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
        </>
      )}

      {/* 2. GROUND & TRIBUNAL PLAZA */}
      <RigidBody type="fixed" colliders={false}>
        {/* Main Cobblestone Floor */}
        <CuboidCollider args={[40, 0.5, 40]} position={[0, -0.5, 0]} />
        <mesh receiveShadow position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#12151e" roughness={0.9} metalness={0.1} />
        </mesh>

        {/* Outer Circular Plaza Border */}
        <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[11, 14, 48]} />
          <meshStandardMaterial color="#1b202e" roughness={0.8} />
        </mesh>

        {/* Central Tribunal Stone Circle */}
        <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[11, 48]} />
          <meshStandardMaterial color="#222838" roughness={0.7} />
        </mesh>

        {/* Inner Dais / Podium for Voting Tribunal */}
        <mesh receiveShadow position={[0, 0.15, 0]}>
          <cylinderGeometry args={[4, 4.3, 0.3, 32]} />
          <meshStandardMaterial color="#2d354a" roughness={0.6} />
        </mesh>

        {/* Center Tribunal Emblem */}
        <mesh receiveShadow position={[0, 0.31, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.05, 16]} />
          <meshStandardMaterial
            color={isNight ? "#dc2626" : "#f59e0b"}
            roughness={0.4}
            metalness={0.3}
            emissive={isNight ? "#7f1d1d" : "#78350f"}
            emissiveIntensity={isNight ? 0.6 : 0.3}
          />
        </mesh>
      </RigidBody>

      {/* 3. TRIBUNAL BENCHES */}
      {benches.map((bench, idx) => (
        <RigidBody key={idx} type="fixed" colliders="cuboid" position={bench.pos} rotation={bench.rot}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.45, 0.8]} />
            <meshStandardMaterial color="#333b52" roughness={0.8} />
          </mesh>
        </RigidBody>
      ))}

      {/* 4. PERIMETER BUILDINGS & BOUNDARY WALLS */}
      {buildings.map((b, idx) => (
        <RigidBody key={idx} type="fixed" colliders="cuboid" position={b.pos as [number, number, number]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={b.size as [number, number, number]} />
            <meshStandardMaterial color={b.color} roughness={0.9} />
          </mesh>
          {/* Glowing Windows on buildings */}
          <mesh position={[0, 0, (b.size[2] / 2) + 0.05]}>
            <planeGeometry args={[b.size[0] * 0.6, b.size[1] * 0.4]} />
            <meshBasicMaterial
              color={isNight ? "#f59e0b" : "#94a3b8"}
              opacity={isNight ? 0.75 : 0.3}
              transparent
            />
          </mesh>
        </RigidBody>
      ))}

      {/* Boundary Invisible Wall Colliders (prevents walking out of town) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 5, -36]}>
        <CuboidCollider args={[40, 10, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 5, 36]}>
        <CuboidCollider args={[40, 10, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-36, 5, 0]}>
        <CuboidCollider args={[1, 10, 40]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[36, 5, 0]}>
        <CuboidCollider args={[1, 10, 40]} />
      </RigidBody>

      {/* 5. STREETLAMPS & WARM POINT LIGHTS */}
      {streetlamps.map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          {/* Lamp Pole */}
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 4, 8]} />
            <meshStandardMaterial color="#0f1117" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Lamp Lantern */}
          <mesh position={[0, 4.1, 0]}>
            <boxGeometry args={[0.4, 0.5, 0.4]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={isNight ? 2.5 : 0.8}
            />
          </mesh>
          {/* Warm Amber Point Light */}
          <pointLight
            position={[0, 3.9, 0]}
            color="#f59e0b"
            intensity={isNight ? 3.5 : 1.2}
            distance={14}
            decay={2}
            castShadow={false}
          />
        </group>
      ))}
    </group>
  );
}

