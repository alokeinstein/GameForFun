"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { RigidBody, CuboidCollider, CylinderCollider } from "@react-three/rapier";
import { Phase } from "@mafia/game-rules";

interface TownMapProps {
  phase: string;
}

export function TownMap({ phase }: TownMapProps) {
  const isNight = phase === Phase.NIGHT;
  const isDawn = phase === Phase.MORNING_ANNOUNCEMENT;

  // 24 Multi-Story Buildings Framing the Expanded City Map (152m x 152m World)
  const buildings = useMemo(() => {
    return [
      // ----------------------------------------------------
      // North Commercial Boulevard (z ≈ -60)
      // ----------------------------------------------------
      { pos: [-48, 12, -60], size: [16, 24, 14], color: "#1e293b", roofProps: "waterTower", awning: "#2563eb", name: "Metro Tower", floors: 7 },
      { pos: [-30, 15, -61], size: [18, 30, 14], color: "#0f172a", roofProps: "antenna", awning: "#059669", name: "Financial Plaza", floors: 9 },
      { pos: [-10, 11, -60], size: [16, 22, 14], color: "#7c2d12", roofProps: "hvac", awning: "#dc2626", name: "Grand Hotel", floors: 6 },
      { pos: [10, 16, -61], size: [18, 32, 14], color: "#1e1b4b", roofProps: "penthouse", awning: "#d97706", name: "Imperial Offices", floors: 10 },
      { pos: [30, 10, -60], size: [16, 20, 14], color: "#334155", roofProps: "waterTower", awning: "#2563eb", name: "Arcade Mall", floors: 5 },
      { pos: [48, 14, -61], size: [16, 28, 14], color: "#1e293b", roofProps: "antenna", awning: "#dc2626", name: "City Bank", floors: 8 },

      // ----------------------------------------------------
      // South Residential Brownstones & Apartments (z ≈ +60)
      // ----------------------------------------------------
      { pos: [-48, 9.5, 60], size: [16, 19, 14], color: "#78350f", roofProps: "hvac", awning: "#059669", name: "Oakhaven Flats", floors: 5 },
      { pos: [-30, 11, 61], size: [17, 22, 14], color: "#334155", roofProps: "waterTower", awning: "#d97706", name: "Parkview Condos", floors: 6 },
      { pos: [-10, 13, 60], size: [16, 26, 14], color: "#1e293b", roofProps: "penthouse", awning: "#2563eb", name: "Harbor Brownstones", floors: 7 },
      { pos: [10, 9, 61], size: [18, 18, 14], color: "#7c2d12", roofProps: "antenna", awning: "#dc2626", name: "Chestnut Manor", floors: 5 },
      { pos: [30, 12, 60], size: [16, 24, 14], color: "#1e1b4b", roofProps: "hvac", awning: "#059669", name: "Lexington Hall", floors: 7 },
      { pos: [48, 10, 61], size: [16, 20, 14], color: "#334155", roofProps: "waterTower", awning: "#d97706", name: "Riverside Residences", floors: 6 },

      // ----------------------------------------------------
      // West District (x ≈ -60)
      // ----------------------------------------------------
      { pos: [-60, 13, -36], size: [14, 26, 18], color: "#1e1b4b", roofProps: "waterTower", awning: "#059669", name: "Bayside Court", floors: 8 },
      { pos: [-61, 10, -18], size: [14, 20, 16], color: "#334155", roofProps: "hvac", awning: "#2563eb", name: "Trinity Suites", floors: 6 },
      { pos: [-60, 14, 0], size: [14, 28, 18], color: "#7c2d12", roofProps: "antenna", awning: "#dc2626", name: "Metropolitan Lofts", floors: 8 },
      { pos: [-61, 9.5, 18], size: [14, 19, 16], color: "#1e293b", roofProps: "penthouse", awning: "#d97706", name: "Westgate Apartments", floors: 5 },
      { pos: [-60, 12, 36], size: [14, 24, 18], color: "#78350f", roofProps: "waterTower", awning: "#059669", name: "Sunset Terrace", floors: 7 },

      // ----------------------------------------------------
      // East Commercial & Financial District (x ≈ +60)
      // ----------------------------------------------------
      { pos: [60, 11, -36], size: [14, 22, 18], color: "#334155", roofProps: "penthouse", awning: "#2563eb", name: "Eastside Commerce", floors: 6 },
      { pos: [61, 15, -18], size: [14, 30, 16], color: "#1e293b", roofProps: "waterTower", awning: "#d97706", name: "Starlight Center", floors: 9 },
      { pos: [60, 13, 0], size: [14, 26, 18], color: "#1e1b4b", roofProps: "hvac", awning: "#059669", name: "Midtown Complex", floors: 8 },
      { pos: [61, 10, 18], size: [14, 20, 16], color: "#7c2d12", roofProps: "antenna", awning: "#dc2626", name: "Broadway Studios", floors: 6 },
      { pos: [60, 14, 36], size: [14, 28, 18], color: "#0f172a", roofProps: "waterTower", awning: "#2563eb", name: "Crown Tower", floors: 8 }
    ];
  }, []);

  // 32 Varied Trees Distributed Across Park Quadrants and Street Boulevards
  const trees = useMemo(() => {
    return [
      // Central Park NW
      { pos: [-18, 0, -18], type: "oak", scale: 1.15 },
      { pos: [-28, 0, -14], type: "pine", scale: 1.2 },
      { pos: [-14, 0, -28], type: "birch", scale: 1.0 },
      { pos: [-26, 0, -26], type: "oak", scale: 0.95 },
      { pos: [-8, 0, -16], type: "pine", scale: 1.05 },

      // Central Park NE (near elevation test pavilion)
      { pos: [14, 0, -16], type: "pine", scale: 1.1 },
      { pos: [32, 0, -14], type: "oak", scale: 1.1 },
      { pos: [14, 0, -32], type: "birch", scale: 1.0 },
      { pos: [34, 0, -32], type: "oak", scale: 1.05 },
      { pos: [8, 0, -20], type: "pine", scale: 0.95 },

      // Central Park SW
      { pos: [-18, 0, 18], type: "oak", scale: 1.1 },
      { pos: [-28, 0, 14], type: "birch", scale: 1.0 },
      { pos: [-14, 0, 28], type: "pine", scale: 1.25 },
      { pos: [-26, 0, 26], type: "oak", scale: 1.0 },
      { pos: [-8, 0, 16], type: "birch", scale: 0.95 },

      // Central Park SE
      { pos: [18, 0, 18], type: "birch", scale: 1.05 },
      { pos: [28, 0, 14], type: "pine", scale: 1.15 },
      { pos: [14, 0, 28], type: "oak", scale: 1.2 },
      { pos: [26, 0, 26], type: "pine", scale: 1.0 },
      { pos: [8, 0, 16], type: "oak", scale: 0.9 },

      // Street Boulevard Sidewalk Trees
      { pos: [-42, 0, -12], type: "birch", scale: 1.0 },
      { pos: [-42, 0, 12], type: "birch", scale: 1.0 },
      { pos: [42, 0, -12], type: "birch", scale: 1.0 },
      { pos: [42, 0, 12], type: "birch", scale: 1.0 },
      { pos: [-12, 0, -42], type: "oak", scale: 1.0 },
      { pos: [12, 0, -42], type: "oak", scale: 1.0 },
      { pos: [-12, 0, 42], type: "oak", scale: 1.0 },
      { pos: [12, 0, 42], type: "oak", scale: 1.0 }
    ];
  }, []);

  // 12 Wooden Park Benches in Central Tribunal Circle & Plaza
  const benches = useMemo(() => {
    const list = [];
    const count = 8;
    const radius = 8.8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      list.push({
        pos: [x, 0, z] as [number, number, number],
        rot: [0, -angle + Math.PI / 2, 0] as [number, number, number]
      });
    }
    // Additional park benches
    list.push({ pos: [-20, 0, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] });
    list.push({ pos: [20, 0, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number] });
    list.push({ pos: [0, 0, -20] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] });
    list.push({ pos: [0, 0, 20] as [number, number, number], rot: [0, 0, 0] as [number, number, number] });
    return list;
  }, []);

  // 20 Ornamental Streetlamps along walkways, plaza, and city streets
  const streetlamps = useMemo(() => {
    return [
      // Central plaza periphery
      [-12, 0, -12],
      [12, 0, -12],
      [-12, 0, 12],
      [12, 0, 12],
      // Main park pathways
      [-24, 0, -3.2],
      [24, 0, -3.2],
      [-3.2, 0, -24],
      [-3.2, 0, 24],
      [-24, 0, 3.2],
      [24, 0, 3.2],
      [3.2, 0, -24],
      [3.2, 0, 24],
      // Outer Street intersections & sidewalks
      [-42, 0, -42],
      [42, 0, -42],
      [-42, 0, 42],
      [42, 0, 42],
      [-42, 0, 0],
      [42, 0, 0],
      [0, 0, -42],
      [0, 0, 42]
    ];
  }, []);

  // Flowerbeds & Shrub Clusters
  const flowerBeds = useMemo(() => {
    return [
      { pos: [-6, 0, -6], color: "#ef4444" },
      { pos: [6, 0, -6], color: "#f59e0b" },
      { pos: [-6, 0, 6], color: "#a855f7" },
      { pos: [6, 0, 6], color: "#ec4899" },
      { pos: [-16, 0, -4.5], color: "#ef4444" },
      { pos: [16, 0, -4.5], color: "#f59e0b" },
      { pos: [-16, 0, 4.5], color: "#3b82f6" },
      { pos: [16, 0, 4.5], color: "#10b981" },
      { pos: [-4.5, 0, -16], color: "#f59e0b" },
      { pos: [4.5, 0, -16], color: "#ec4899" },
      { pos: [-4.5, 0, 16], color: "#a855f7" },
      { pos: [4.5, 0, 16], color: "#ef4444" }
    ];
  }, []);

  return (
    <group>
      {/* 1. ATMOSPHERIC LIGHTING & FOG (Vibrant Daytime, Moonlit Night, Golden Dawn) */}
      {isNight ? (
        <>
          <color attach="background" args={["#0c1322"]} />
          <fog attach="fog" args={["#0c1322", 50, 140]} />
          <ambientLight intensity={0.42} color="#60a5fa" />
          <hemisphereLight args={["#334155", "#0f172a", 0.6]} />
          <directionalLight
            position={[-30, 45, -30]}
            intensity={0.9}
            color="#93c5fd"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
        </>
      ) : isDawn ? (
        <>
          <color attach="background" args={["#2d1722"]} />
          <fog attach="fog" args={["#2d1722", 55, 145]} />
          <ambientLight intensity={0.55} color="#fed7aa" />
          <hemisphereLight args={["#fdba74", "#2e7d32", 0.7]} />
          <directionalLight
            position={[40, 35, -25]}
            intensity={1.5}
            color="#fb923c"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
        </>
      ) : (
        <>
          <color attach="background" args={["#60a5fa"]} />
          <fog attach="fog" args={["#93c5fd", 75, 160]} />
          <ambientLight intensity={0.78} color="#ffffff" />
          <hemisphereLight args={["#93c5fd", "#2e7d32", 0.85]} />
          <directionalLight
            position={[35, 55, 30]}
            intensity={1.5}
            color="#fffbeb"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
        </>
      )}

      {/* 2. BASE GROUND & URBAN FOUNDATION */}
      <RigidBody type="fixed" colliders={false}>
        {/* Full Expanded Terrain Solid Ground Physics Collider (160m x 160m) */}
        <CuboidCollider args={[85, 0.5, 85]} position={[0, -0.5, 0]} />

        {/* Outer City Ground Bed */}
        <mesh receiveShadow position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[156, 156]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>

        {/* Central Park Grass Lawn (74m x 74m) */}
        <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[74, 74]} />
          <meshStandardMaterial color="#2e7d32" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Stone Walking Cross Paths (North-South & East-West) */}
        <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.8, 73]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </mesh>
        <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[73, 4.8]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </mesh>

        {/* Outer Circular Plaza Paver Ring */}
        <mesh receiveShadow position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[10.5, 12.6, 48]} />
          <meshStandardMaterial color="#475569" roughness={0.75} />
        </mesh>

        {/* Central Tribunal Stone Plaza Circle */}
        <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[10.5, 48]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.65} />
        </mesh>
      </RigidBody>

      {/* 3. CENTRAL VOTING DAIS (RAISED PODIUM WITH SOLID CYLINDER COLLIDER & APPROACH RAMPS) */}
      {/* Visual top is at y = 0.35m. Solid collider matches perfectly so feet stand cleanly on top! */}
      <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
        {/* Exact Cylinder Collider matching the dais height (0.35m) */}
        <CylinderCollider args={[0.175, 4.8]} position={[0, 0.175, 0]} />

        {/* Raised Dais Cylinder Mesh */}
        <mesh receiveShadow castShadow position={[0, 0.175, 0]}>
          <cylinderGeometry args={[4.5, 4.8, 0.35, 32]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>

        {/* 4 Cardinal Approach Ramps (North, South, East, West) from y=0 to dais top at y=0.35 */}
        {/* North Dais Ramp */}
        <mesh receiveShadow castShadow position={[0, 0.175, -5.2]} rotation={[0.24, 0, 0]}>
          <boxGeometry args={[2.4, 0.12, 1.4]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {/* South Dais Ramp */}
        <mesh receiveShadow castShadow position={[0, 0.175, 5.2]} rotation={[-0.24, 0, 0]}>
          <boxGeometry args={[2.4, 0.12, 1.4]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {/* East Dais Ramp */}
        <mesh receiveShadow castShadow position={[5.2, 0.175, 0]} rotation={[0, 0, -0.24]}>
          <boxGeometry args={[1.4, 0.12, 2.4]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {/* West Dais Ramp */}
        <mesh receiveShadow castShadow position={[-5.2, 0.175, 0]} rotation={[0, 0, 0.24]}>
          <boxGeometry args={[1.4, 0.12, 2.4]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* 4. DEDICATED MULTI-TIER ELEVATION TEST PAVILION (PART 1.5 VALIDATION TEST GROUND) */}
      {/* Features: Flat ground, 0.6m Elevated Terrace Platform, Smooth 8.5° Ramp, and 3-Step Staircase */}
      <group position={[25, 0, -25]}>
        {/* Main Elevated Terrace Platform (12m x 8m at y = 0.60m) */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.30, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[12, 0.60, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
        </RigidBody>

        {/* Platform Decorative Perimeter Balustrade / Low Curb */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.72, -3.85]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[12, 0.24, 0.3]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.72, 3.85]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[12, 0.24, 0.3]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[5.85, 0.72, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.24, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>
        </RigidBody>

        {/* Smooth Walkway Ramp (West Side: from x=-6 to x=-10, rising from y=0 to y=0.60m) */}
        {/* Ramp run = 4.0m, rise = 0.60m, slope = 8.53 deg (0.1489 rad), incline length = 4.045m */}
        <RigidBody
          type="fixed"
          colliders="cuboid"
          position={[-8.0, 0.30, 0]}
          rotation={[0, 0, -0.1489]}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.045, 0.20, 3.2]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.7} />
          </mesh>
        </RigidBody>

        {/* 3-Step Staircase (South Side: 3 stairs leading down to lawn) */}
        {/* Step 1: y = 0.20m */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.10, 5.2]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 0.20, 0.8]} />
            <meshStandardMaterial color="#64748b" roughness={0.7} />
          </mesh>
        </RigidBody>
        {/* Step 2: y = 0.40m */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.20, 4.4]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.6, 0.40, 0.8]} />
            <meshStandardMaterial color="#64748b" roughness={0.7} />
          </mesh>
        </RigidBody>

        {/* Terrace Overlook Benches */}
        <RigidBody type="fixed" colliders="cuboid" position={[2.5, 0.85, -2.5]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.12, 0.7]} />
            <meshStandardMaterial color="#854d0e" roughness={0.75} />
          </mesh>
        </RigidBody>
      </group>

      {/* 5. CENTRAL CIVIC MONUMENT / OBELISK */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.35, 0]}>
        {/* Monument Base */}
        <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[2.2, 0.6, 2.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* Monument Pillar / Obelisk */}
        <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.5, 0.75, 3.2, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        {/* Monument Crown / Flame Brazier */}
        <mesh position={[0, 4.0, 0]}>
          <octahedronGeometry args={[0.55]} />
          <meshStandardMaterial
            color={isNight ? "#dc2626" : isDawn ? "#f97316" : "#f59e0b"}
            roughness={0.3}
            metalness={0.4}
            emissive={isNight ? "#dc2626" : isDawn ? "#f97316" : "#f59e0b"}
            emissiveIntensity={isNight ? 2.5 : 1.2}
          />
        </mesh>
        {/* Monument Beacon Light */}
        <pointLight
          position={[0, 4.2, 0]}
          color={isNight ? "#dc2626" : "#f59e0b"}
          intensity={isNight ? 2.5 : 1.5}
          distance={14}
          decay={2}
        />
      </RigidBody>

      {/* 6. PARK BENCHES */}
      {benches.map((b, idx) => (
        <RigidBody
          key={idx}
          type="fixed"
          colliders="cuboid"
          position={[b.pos[0], 0.35, b.pos[2]]}
          rotation={b.rot}
        >
          {/* Wooden Bench Slat */}
          <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
            <boxGeometry args={[2.2, 0.12, 0.7]} />
            <meshStandardMaterial color="#854d0e" roughness={0.75} />
          </mesh>
          {/* Wooden Bench Backrest */}
          <mesh castShadow receiveShadow position={[0, 0.45, -0.28]}>
            <boxGeometry args={[2.2, 0.5, 0.08]} />
            <meshStandardMaterial color="#854d0e" roughness={0.75} />
          </mesh>
          {/* Cast Iron Legs */}
          <mesh castShadow position={[-0.95, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.35, 0.65]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh castShadow position={[0.95, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.35, 0.65]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>
        </RigidBody>
      ))}

      {/* 7. TREES (With Solid Trunk Cylinder Colliders) */}
      {trees.map((t, idx) => (
        <RigidBody
          key={idx}
          type="fixed"
          colliders={false}
          position={t.pos as [number, number, number]}
        >
          <CylinderCollider args={[1.5, 0.32]} position={[0, 1.5, 0]} />

          {t.type === "oak" && (
            <group scale={t.scale}>
              <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.28, 0.42, 3.2, 8]} />
                <meshStandardMaterial color="#4a2e18" roughness={0.9} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 3.8, 0]}>
                <dodecahedronGeometry args={[1.8, 1]} />
                <meshStandardMaterial color="#16a34a" roughness={0.8} />
              </mesh>
              <mesh castShadow receiveShadow position={[0.6, 4.4, 0.4]}>
                <dodecahedronGeometry args={[1.3, 1]} />
                <meshStandardMaterial color="#15803d" roughness={0.8} />
              </mesh>
              <mesh castShadow receiveShadow position={[-0.5, 4.3, -0.3]}>
                <dodecahedronGeometry args={[1.4, 1]} />
                <meshStandardMaterial color="#22c55e" roughness={0.8} />
              </mesh>
            </group>
          )}

          {t.type === "pine" && (
            <group scale={t.scale}>
              <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.2, 0.35, 3.6, 7]} />
                <meshStandardMaterial color="#382313" roughness={0.9} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 3.0, 0]}>
                <coneGeometry args={[1.9, 2.0, 7]} />
                <meshStandardMaterial color="#14532d" roughness={0.85} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 4.2, 0]}>
                <coneGeometry args={[1.5, 1.8, 7]} />
                <meshStandardMaterial color="#166534" roughness={0.85} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 5.2, 0]}>
                <coneGeometry args={[1.0, 1.5, 7]} />
                <meshStandardMaterial color="#15803d" roughness={0.85} />
              </mesh>
            </group>
          )}

          {t.type === "birch" && (
            <group scale={t.scale}>
              <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.2, 0.28, 3.2, 8]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
              </mesh>
              <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.21, 0.21, 0.3, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 3.6, 0]}>
                <icosahedronGeometry args={[1.6, 1]} />
                <meshStandardMaterial color="#4ade80" roughness={0.8} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 4.5, 0]}>
                <icosahedronGeometry args={[1.2, 1]} />
                <meshStandardMaterial color="#86efac" roughness={0.8} />
              </mesh>
            </group>
          )}
        </RigidBody>
      ))}

      {/* 8. FLOWER BEDS */}
      {flowerBeds.map((fb, idx) => (
        <group key={idx} position={fb.pos as [number, number, number]}>
          <mesh receiveShadow position={[0, 0.08, 0]}>
            <cylinderGeometry args={[1.1, 1.3, 0.16, 12]} />
            <meshStandardMaterial color="#3e2723" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 0.22, 0]}>
            <dodecahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial color={fb.color} roughness={0.6} />
          </mesh>
          <mesh castShadow position={[0.4, 0.18, 0.3]}>
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.6} />
          </mesh>
          <mesh castShadow position={[-0.35, 0.18, -0.3]}>
            <dodecahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color="#a78bfa" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* 9. STREETLAMPS WITH WARM ILLUMINATION */}
      {streetlamps.map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 0.4, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 3.8, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 4.0, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 4.25, 0]}>
            <boxGeometry args={[0.45, 0.55, 0.45]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={isNight ? 3.0 : 1.0}
            />
          </mesh>
          <pointLight
            position={[0, 4.1, 0]}
            color="#f59e0b"
            intensity={isNight ? 3.8 : 1.2}
            distance={16}
            decay={2}
          />
        </group>
      ))}

      {/* 10. ZONE B: SURROUNDING CITY STREETS & RAISED SIDEWALKS WITH SOLID COLLIDERS */}
      {/* North Avenue (z = -44, width 10m asphalt) */}
      <mesh receiveShadow position={[0, 0.01, -44]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* South Avenue (z = 44, width 10m asphalt) */}
      <mesh receiveShadow position={[0, 0.01, 44]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* West Boulevard (x = -44, width 10m asphalt) */}
      <mesh receiveShadow position={[-44, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 110]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* East Boulevard (x = 44, width 10m asphalt) */}
      <mesh receiveShadow position={[44, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 110]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Road Markings: Dashed Yellow Center Divider Lines */}
      <mesh position={[0, 0.02, -44]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[95, 0.2]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
      <mesh position={[0, 0.02, 44]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[95, 0.2]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
      <mesh position={[-44, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 95]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
      <mesh position={[44, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 95]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>

      {/* Raised Sidewalks with Solid Cuboid Colliders (height = 0.14m, top at y = 0.14m) */}
      {/* North Park Sidewalk */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.07, -38.2]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[78, 0.14, 2.4]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </RigidBody>
      {/* South Park Sidewalk */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.07, 38.2]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[78, 0.14, 2.4]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </RigidBody>
      {/* West Park Sidewalk */}
      <RigidBody type="fixed" colliders="cuboid" position={[-38.2, 0.07, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2.4, 0.14, 78]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </RigidBody>
      {/* East Park Sidewalk */}
      <RigidBody type="fixed" colliders="cuboid" position={[38.2, 0.07, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2.4, 0.14, 78]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Building Outer Sidewalks */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.07, -50]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[116, 0.14, 2.5]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.07, 50]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[116, 0.14, 2.5]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-50, 0.07, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2.5, 0.14, 116]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[50, 0.07, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2.5, 0.14, 116]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* 11. SURROUNDING MULTI-STORY CITY BUILDINGS (WITH SOLID RAPIER COLLIDERS) */}
      {buildings.map((b, idx) => (
        <RigidBody
          key={idx}
          type="fixed"
          colliders="cuboid"
          position={b.pos as [number, number, number]}
        >
          {/* Main Building Structure */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={b.size as [number, number, number]} />
            <meshStandardMaterial color={b.color} roughness={0.85} metalness={0.15} />
          </mesh>

          {/* Glowing Window Matrices */}
          <mesh position={[0, 1, (b.size[2] / 2) + 0.06]}>
            <planeGeometry args={[b.size[0] * 0.75, b.size[1] * 0.65]} />
            <meshStandardMaterial
              color={isNight ? "#fef08a" : "#cbd5e1"}
              emissive={isNight ? "#f59e0b" : "#475569"}
              emissiveIntensity={isNight ? 1.8 : 0.2}
              roughness={0.3}
            />
          </mesh>

          {/* Ground Floor Entrance Awning */}
          <mesh position={[0, -b.size[1] / 2 + 2.5, (b.size[2] / 2) + 1.2]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[b.size[0] * 0.4, 0.2, 2.2]} />
            <meshStandardMaterial color={b.awning} roughness={0.6} />
          </mesh>

          {/* Entrance Door Portal */}
          <mesh position={[0, -b.size[1] / 2 + 1.2, (b.size[2] / 2) + 0.08]}>
            <planeGeometry args={[2.4, 2.4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>

          {/* Rooftop Architecture Props */}
          {b.roofProps === "waterTower" && (
            <group position={[0, b.size[1] / 2 + 1.8, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[1.4, 1.4, 2.4, 12]} />
                <meshStandardMaterial color="#854d0e" roughness={0.9} />
              </mesh>
              <mesh position={[0, -1.4, 0]}>
                <boxGeometry args={[1.8, 0.4, 1.8]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
            </group>
          )}

          {b.roofProps === "hvac" && (
            <group position={[0, b.size[1] / 2 + 0.9, 0]}>
              <mesh castShadow>
                <boxGeometry args={[3.0, 1.6, 2.2]} />
                <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
          )}

          {b.roofProps === "antenna" && (
            <group position={[0, b.size[1] / 2 + 2.5, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.05, 0.1, 5.0, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} />
              </mesh>
              <mesh position={[0, 2.6, 0]}>
                <sphereGeometry args={[0.15]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            </group>
          )}

          {b.roofProps === "penthouse" && (
            <mesh position={[0, b.size[1] / 2 + 1.2, 0]} castShadow>
              <boxGeometry args={[b.size[0] * 0.5, 2.2, b.size[2] * 0.5]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
          )}
        </RigidBody>
      ))}

      {/* 12. INVISIBLE CITY BOUNDARY WALLS (Expanded 152m x 152m Perimeter) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 8, -76]}>
        <CuboidCollider args={[78, 16, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 8, 76]}>
        <CuboidCollider args={[78, 16, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-76, 8, 0]}>
        <CuboidCollider args={[1, 16, 78]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[76, 8, 0]}>
        <CuboidCollider args={[1, 16, 78]} />
      </RigidBody>
    </group>
  );
}
