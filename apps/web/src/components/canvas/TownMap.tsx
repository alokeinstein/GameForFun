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

  // 16 Multi-Story City Buildings Framing the Park Perimeter
  const buildings = useMemo(() => {
    return [
      // North row (z ≈ -38)
      { pos: [-27, 10, -38], size: [14, 20, 12], color: "#1e293b", roofProps: "waterTower", awning: "#2563eb", floors: 6 },
      { pos: [-10, 12, -39], size: [16, 24, 12], color: "#7c2d12", roofProps: "hvac", awning: "#dc2626", floors: 7 },
      { pos: [8, 9, -38], size: [15, 18, 12], color: "#334155", roofProps: "antenna", awning: "#059669", floors: 5 },
      { pos: [26, 13, -39], size: [16, 26, 12], color: "#1e1b4b", roofProps: "penthouse", awning: "#d97706", floors: 8 },

      // South row (z ≈ +38)
      { pos: [-26, 11, 38], size: [15, 22, 12], color: "#334155", roofProps: "penthouse", awning: "#d97706", floors: 7 },
      { pos: [-8, 8.5, 39], size: [16, 17, 12], color: "#1e293b", roofProps: "antenna", awning: "#2563eb", floors: 5 },
      { pos: [9, 13, 38], size: [14, 26, 12], color: "#7c2d12", roofProps: "waterTower", awning: "#dc2626", floors: 8 },
      { pos: [27, 9.5, 39], size: [16, 19, 12], color: "#1e1b4b", roofProps: "hvac", awning: "#059669", floors: 6 },

      // West row (x ≈ -38)
      { pos: [-38, 11, -20], size: [12, 22, 15], color: "#1e1b4b", roofProps: "waterTower", awning: "#059669", floors: 7 },
      { pos: [-39, 9, -4], size: [12, 18, 14], color: "#334155", roofProps: "hvac", awning: "#2563eb", floors: 5 },
      { pos: [-38, 13, 12], size: [12, 26, 14], color: "#7c2d12", roofProps: "antenna", awning: "#dc2626", floors: 8 },
      { pos: [-39, 8, 27], size: [12, 16, 14], color: "#1e293b", roofProps: "penthouse", awning: "#d97706", floors: 5 },

      // East row (x ≈ +38)
      { pos: [38, 9, -20], size: [12, 18, 14], color: "#7c2d12", roofProps: "penthouse", awning: "#2563eb", floors: 5 },
      { pos: [39, 13, -4], size: [12, 26, 14], color: "#1e293b", roofProps: "waterTower", awning: "#d97706", floors: 8 },
      { pos: [38, 8.5, 12], size: [12, 17, 14], color: "#1e1b4b", roofProps: "hvac", awning: "#059669", floors: 5 },
      { pos: [39, 12, 27], size: [12, 24, 15], color: "#334155", roofProps: "antenna", awning: "#dc2626", floors: 7 }
    ];
  }, []);

  // 22 Varied Trees Distributed Across Park Lawn Quadrants
  const trees = useMemo(() => {
    return [
      // North-West Quadrant
      { pos: [-18, 0, -18], type: "oak", scale: 1.15 },
      { pos: [-26, 0, -14], type: "pine", scale: 1.2 },
      { pos: [-12, 0, -26], type: "birch", scale: 1.0 },
      { pos: [-24, 0, -25], type: "oak", scale: 0.95 },
      { pos: [-8, 0, -16], type: "pine", scale: 1.05 },

      // North-East Quadrant
      { pos: [18, 0, -18], type: "pine", scale: 1.2 },
      { pos: [26, 0, -14], type: "oak", scale: 1.1 },
      { pos: [14, 0, -25], type: "birch", scale: 1.0 },
      { pos: [24, 0, -26], type: "oak", scale: 1.05 },
      { pos: [8, 0, -16], type: "pine", scale: 0.9 },

      // South-West Quadrant
      { pos: [-18, 0, 18], type: "oak", scale: 1.1 },
      { pos: [-26, 0, 14], type: "birch", scale: 1.0 },
      { pos: [-13, 0, 26], type: "pine", scale: 1.25 },
      { pos: [-25, 0, 25], type: "oak", scale: 1.0 },
      { pos: [-8, 0, 16], type: "birch", scale: 0.95 },

      // South-East Quadrant
      { pos: [18, 0, 18], type: "birch", scale: 1.05 },
      { pos: [26, 0, 14], type: "pine", scale: 1.15 },
      { pos: [14, 0, 26], type: "oak", scale: 1.2 },
      { pos: [25, 0, 25], type: "pine", scale: 1.0 },
      { pos: [8, 0, 16], type: "oak", scale: 0.9 },

      // Outer Perimeter accents
      { pos: [-32, 0, -2], type: "pine", scale: 1.1 },
      { pos: [32, 0, 2], type: "oak", scale: 1.1 }
    ];
  }, []);

  // 8 Wooden Park Benches in Central Tribunal Circle
  const benches = useMemo(() => {
    const list = [];
    const count = 8;
    const radius = 8.5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      list.push({
        pos: [x, 0, z] as [number, number, number],
        rot: [0, -angle + Math.PI / 2, 0] as [number, number, number]
      });
    }
    return list;
  }, []);

  // 12 Ornamental Streetlamps along paths and plaza
  const streetlamps = useMemo(() => {
    return [
      // Central plaza periphery
      [-12, 0, -12],
      [12, 0, -12],
      [-12, 0, 12],
      [12, 0, 12],
      // Main walkways
      [-22, 0, -3.2],
      [22, 0, -3.2],
      [-3.2, 0, -22],
      [-3.2, 0, 22],
      [-22, 0, 3.2],
      [22, 0, 3.2],
      [3.2, 0, -22],
      [3.2, 0, 22]
    ];
  }, []);

  // Flowerbeds & Decorative Shrub Clusters
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
          <fog attach="fog" args={["#0c1322", 40, 105]} />
          <ambientLight intensity={0.42} color="#60a5fa" />
          <hemisphereLight args={["#334155", "#0f172a", 0.6]} />
          <directionalLight
            position={[-20, 35, -20]}
            intensity={0.9}
            color="#93c5fd"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
        </>
      ) : isDawn ? (
        <>
          <color attach="background" args={["#2d1722"]} />
          <fog attach="fog" args={["#2d1722", 45, 110]} />
          <ambientLight intensity={0.55} color="#fed7aa" />
          <hemisphereLight args={["#fdba74", "#2e7d32", 0.7]} />
          <directionalLight
            position={[30, 25, -15]}
            intensity={1.5}
            color="#fb923c"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
        </>
      ) : (
        <>
          <color attach="background" args={["#60a5fa"]} />
          <fog attach="fog" args={["#93c5fd", 65, 125]} />
          <ambientLight intensity={0.75} color="#ffffff" />
          <hemisphereLight args={["#93c5fd", "#2e7d32", 0.85]} />
          <directionalLight
            position={[25, 45, 20]}
            intensity={1.5}
            color="#fffbeb"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
        </>
      )}

      {/* 2. GROUND & WALKING PATHWAYS */}
      <RigidBody type="fixed" colliders={false}>
        {/* Main Solid Ground Physics Collider */}
        <CuboidCollider args={[45, 0.5, 45]} position={[0, -0.5, 0]} />

        {/* Vibrant Green Park Grass Lawn */}
        <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[84, 84]} />
          <meshStandardMaterial color="#2e7d32" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Stone Walking Cross Paths (North-South & East-West) */}
        {/* North-South Pathway */}
        <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.6, 82]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </mesh>
        {/* East-West Pathway */}
        <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[82, 4.6]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </mesh>

        {/* Stone Pathway Curbs / Edges */}
        <mesh position={[-2.4, 0.04, 0]} receiveShadow>
          <boxGeometry args={[0.2, 0.08, 82]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[2.4, 0.04, 0]} receiveShadow>
          <boxGeometry args={[0.2, 0.08, 82]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.04, -2.4]} receiveShadow>
          <boxGeometry args={[82, 0.08, 0.2]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.04, 2.4]} receiveShadow>
          <boxGeometry args={[82, 0.08, 0.2]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Outer Circular Plaza Paver Ring */}
        <mesh receiveShadow position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[10.5, 12.2, 48]} />
          <meshStandardMaterial color="#475569" roughness={0.75} />
        </mesh>

        {/* Central Tribunal Stone Plaza Circle */}
        <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[10.5, 48]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.65} />
        </mesh>

        {/* Inner Dais / Raised Podium for Voting Tribunal */}
        <mesh receiveShadow castShadow position={[0, 0.175, 0]}>
          <cylinderGeometry args={[4.4, 4.8, 0.35, 32]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* 3. CENTRAL CIVIC MONUMENT / FOUNTAIN (With Solid Collider) */}
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
          distance={12}
          decay={2}
        />
      </RigidBody>

      {/* 4. PARK BENCHES (With Solid Cuboid Colliders) */}
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

      {/* 5. TREES (With Solid Cylinder Colliders on Trunks) */}
      {trees.map((t, idx) => (
        <RigidBody
          key={idx}
          type="fixed"
          colliders={false}
          position={t.pos as [number, number, number]}
        >
          {/* Solid Trunk Collider prevents player from walking through trees */}
          <CylinderCollider args={[1.5, 0.32]} position={[0, 1.5, 0]} />

          {t.type === "oak" && (
            <group scale={t.scale}>
              {/* Oak Trunk */}
              <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.28, 0.42, 3.2, 8]} />
                <meshStandardMaterial color="#4a2e18" roughness={0.9} />
              </mesh>
              {/* Layered Foliage Spheres */}
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
              {/* Pine Trunk */}
              <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.2, 0.35, 3.6, 7]} />
                <meshStandardMaterial color="#382313" roughness={0.9} />
              </mesh>
              {/* Stacked Cones */}
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
              {/* Birch White Trunk */}
              <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.2, 0.28, 3.2, 8]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
              </mesh>
              {/* Birch Bark Details */}
              <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.21, 0.21, 0.3, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} />
              </mesh>
              {/* Birch Foliage */}
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

      {/* 6. FLOWER BEDS & SHRUB CLUSTERS */}
      {flowerBeds.map((fb, idx) => (
        <group key={idx} position={fb.pos as [number, number, number]}>
          {/* Raised Soil Mound */}
          <mesh receiveShadow position={[0, 0.08, 0]}>
            <cylinderGeometry args={[1.1, 1.3, 0.16, 12]} />
            <meshStandardMaterial color="#3e2723" roughness={0.95} />
          </mesh>
          {/* Flower Blossoms */}
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

      {/* 7. STREETLAMPS & WARM POINTLIGHTS */}
      {streetlamps.map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          {/* Lamp Base & Fluted Cast-Iron Post */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 0.4, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 3.8, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Lamp Cross-Arm Bracket */}
          <mesh position={[0, 4.0, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Lamp Lantern */}
          <mesh position={[0, 4.25, 0]}>
            <boxGeometry args={[0.45, 0.55, 0.45]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={isNight ? 3.0 : 1.0}
            />
          </mesh>
          {/* Warm Amber Point Light */}
          <pointLight
            position={[0, 4.1, 0]}
            color="#f59e0b"
            intensity={isNight ? 3.8 : 1.2}
            distance={15}
            decay={2}
          />
        </group>
      ))}

      {/* 8. SURROUNDING MULTI-STORY CITY BUILDINGS (With Solid Rapier Colliders) */}
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

      {/* 9. INVISIBLE PARK BOUNDARY WALLS (Prevents falling off world) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 6, -42]}>
        <CuboidCollider args={[44, 12, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 6, 42]}>
        <CuboidCollider args={[44, 12, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-42, 6, 0]}>
        <CuboidCollider args={[1, 12, 44]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[42, 6, 0]}>
        <CuboidCollider args={[1, 12, 44]} />
      </RigidBody>
    </group>
  );
}
