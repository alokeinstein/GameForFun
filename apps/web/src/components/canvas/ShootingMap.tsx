"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { RigidBody, CuboidCollider, CylinderCollider } from "@react-three/rapier";

interface ShootingMapProps {
  mapName?: string;
}

export function ShootingMap({ mapName = "URBAN_DISTRICT" }: ShootingMapProps) {
  // ---------------------------------------------------------------------------
  // 1. Containers Setup (Shipping Yard Flanking Maze)
  // ---------------------------------------------------------------------------
  const containers = useMemo(() => {
    return [
      // Ground Tier Containers (y = 1.3, height 2.6m)
      { pos: [28, 1.3, 0], size: [6.0, 2.6, 2.44], rotY: 0, color: "#ea580c", name: "Cargo-Orange-1" },
      { pos: [28, 1.3, 4], size: [6.0, 2.6, 2.44], rotY: 0, color: "#2563eb", name: "Cargo-Blue-1" },
      { pos: [38, 1.3, 2], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#16a34a", name: "Cargo-Green-1" },
      { pos: [38, 1.3, 10], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#eab308", name: "Cargo-Yellow-1" },
      { pos: [30, 1.3, 16], size: [6.0, 2.6, 2.44], rotY: 0, color: "#06b6d4", name: "Cargo-Cyan-1" },
      { pos: [44, 1.3, 18], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#ea580c", name: "Cargo-Orange-2" },
      { pos: [24, 1.3, 24], size: [6.0, 2.6, 2.44], rotY: 0, color: "#2563eb", name: "Cargo-Blue-2" },
      { pos: [34, 1.3, 28], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#eab308", name: "Cargo-Yellow-2" },

      // Upper Tier Stacked Containers (y = 3.9, height 2.6m -> roof at y = 5.2m)
      { pos: [28, 3.9, 0], size: [6.0, 2.6, 2.44], rotY: 0, color: "#eab308", name: "Cargo-Upper-1" },
      { pos: [30, 3.9, 16], size: [6.0, 2.6, 2.44], rotY: 0, color: "#16a34a", name: "Cargo-Upper-2" },
      { pos: [44, 3.9, 18], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#2563eb", name: "Cargo-Upper-3" }
    ];
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Concrete Jersey Barriers & Modern Cover
  // ---------------------------------------------------------------------------
  const jerseyBarriers = useMemo(() => {
    return [
      // Central Avenue Chokepoints
      { pos: [0, 0.5, 16], rotY: 0 },
      { pos: [3, 0.5, 17], rotY: 0.2 },
      { pos: [-3, 0.5, -16], rotY: -0.15 },
      { pos: [0, 0.5, -17], rotY: 0 },
      { pos: [-16, 0.5, 0], rotY: Math.PI / 2 },
      { pos: [-16, 0.5, 3], rotY: Math.PI / 2 + 0.1 },
      { pos: [18, 0.5, -8], rotY: -0.3 },
      { pos: [21, 0.5, -9], rotY: -0.3 },

      // Team Red Approach
      { pos: [40, 0.5, -40], rotY: 0.78 },
      { pos: [43, 0.5, -37], rotY: 0.78 },
      { pos: [35, 0.5, -48], rotY: 0 },

      // Team Blue Approach
      { pos: [-40, 0.5, 40], rotY: 0.78 },
      { pos: [-37, 0.5, 43], rotY: 0.78 },
      { pos: [-48, 0.5, 35], rotY: Math.PI / 2 },

      // Team Green Approach
      { pos: [-40, 0.5, -40], rotY: -0.78 },
      { pos: [-37, 0.5, -43], rotY: -0.78 },
      { pos: [-48, 0.5, -35], rotY: Math.PI / 2 },

      // Sniper Avenue & Open Corridors
      { pos: [12, 0.5, 36], rotY: 0 },
      { pos: [-12, 0.5, 36], rotY: 0 }
    ];
  }, []);

  // ---------------------------------------------------------------------------
  // 3. Modern Stylized City Vehicles (Tactical Cover)
  // ---------------------------------------------------------------------------
  const vehicles = useMemo(() => {
    return [
      // Yellow City Taxi
      { pos: [-24, 1.1, 14], rotY: 0.35, color: "#eab308", type: "taxi" },
      // Red Sport Sedan
      { pos: [18, 1.1, -28], rotY: -0.5, color: "#ef4444", type: "sedan" },
      // Blue Electric Hatchback
      { pos: [-20, 1.1, -26], rotY: 1.2, color: "#0284c7", type: "hatchback" },
      // White Commercial Van
      { pos: [14, 1.3, 32], rotY: 0.1, color: "#f8fafc", type: "van" }
    ];
  }, []);

  // ---------------------------------------------------------------------------
  // 4. Urban Trees & Park Landscaping
  // ---------------------------------------------------------------------------
  const trees = useMemo(() => {
    return [
      { pos: [-26, 0, -6], scale: 1.1 },
      { pos: [-32, 0, -12], scale: 0.95 },
      { pos: [-24, 0, -18], scale: 1.2 },
      { pos: [22, 0, 14], scale: 1.0 },
      { pos: [26, 0, 22], scale: 1.15 },
      { pos: [-14, 0, 32], scale: 1.05 },
      { pos: [-6, 0, 34], scale: 0.9 },
      { pos: [10, 0, -22], scale: 1.1 },
      { pos: [34, 0, -22], scale: 0.95 },
      { pos: [-42, 0, 12], scale: 1.2 },
      { pos: [-36, 0, 24], scale: 1.0 }
    ];
  }, []);

  return (
    <group>
      {/* -------------------------------------------------------------------- */}
      {/* ATMOSPHERE & BRIGHT DAYTIME LIGHTING                                 */}
      {/* -------------------------------------------------------------------- */}
      {/* Crisp Daylight Ambient Illumination */}
      <ambientLight color="#f0fdf4" intensity={1.1} />

      {/* Radiant Sun: Bright Afternoon Daylight with Balanced Soft Shadows */}
      <directionalLight
        color="#fffbeb"
        intensity={2.2}
        position={[60, 90, 45]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={10}
        shadow-camera-far={220}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-bias={-0.0003}
      />

      {/* Warm Fill Light to eliminate harsh black pitch in shadows */}
      <directionalLight
        color="#bae6fd"
        intensity={0.65}
        position={[-50, 40, -40]}
      />

      {/* Soft Aerial Perspective Fog (Bright sky blue haze) */}
      <fog attach="fog" args={["#bae6fd", 80, 240]} />

      {/* Vibrant Sky Dome (Bright Azure Sky) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[160, 32, 16]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.BackSide} />
      </mesh>

      {/* Horizon Soft Gradient Band */}
      <mesh position={[0, -4, 0]}>
        <cylinderGeometry args={[158, 158, 45, 32, 1, true]} />
        <meshBasicMaterial color="#e0f2fe" side={THREE.BackSide} transparent opacity={0.8} />
      </mesh>

      {/* Sun Disc in Sky */}
      <mesh position={[75, 105, 55]}>
        <sphereGeometry args={[6.0, 16, 16]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Distant Modern City Skyline Silhouettes (Bright clean high-rises) */}
      {Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 120;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const height = 30 + ((i * 11) % 40);
        const width = 14 + ((i * 7) % 12);
        const colors = ["#f8fafc", "#e2e8f0", "#93c5fd", "#fef3c7", "#cbd5e1"];
        const col = colors[i % colors.length];
        return (
          <group key={`skyline-${i}`} position={[x, height / 2, z]}>
            <mesh>
              <boxGeometry args={[width, height, 6]} />
              <meshBasicMaterial color={col} />
            </mesh>
            {/* Window Rows Accent */}
            <mesh position={[0, 0, 3.1]}>
              <planeGeometry args={[width * 0.8, height * 0.7]} />
              <meshBasicMaterial color="#0284c7" transparent opacity={0.35} />
            </mesh>
          </group>
        );
      })}

      {/* -------------------------------------------------------------------- */}
      {/* GROUND TERRAIN & CLEAN ROADS (160m x 160m)                          */}
      {/* -------------------------------------------------------------------- */}
      <RigidBody type="fixed" colliders={false}>
        {/* Main Floor Collider (Flat Walkable Surface at y = 0.0) */}
        <CuboidCollider args={[80, 0.5, 80]} position={[0, -0.5, 0]} />

        {/* Clean Ground Base Asphalt */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[160, 0.1, 160]} />
          <meshStandardMaterial color="#475569" roughness={0.82} metalness={0.08} />
        </mesh>

        {/* North-South Primary Avenue (Clean Modern Asphalt) */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[18, 160]} />
          <meshStandardMaterial color="#334155" roughness={0.78} metalness={0.1} />
        </mesh>

        {/* East-West Primary Avenue */}
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
          <planeGeometry args={[18, 160]} />
          <meshStandardMaterial color="#334155" roughness={0.78} metalness={0.1} />
        </mesh>

        {/* Road Centerlines: Double Yellow Dashes */}
        {Array.from({ length: 30 }).map((_, i) => (
          <React.Fragment key={`road-mark-${i}`}>
            {/* North-South Double Yellow */}
            <mesh position={[-0.2, 0.02, -72 + i * 5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.2, 2.6]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>
            <mesh position={[0.2, 0.02, -72 + i * 5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.2, 2.6]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>

            {/* East-West Double Yellow */}
            <mesh position={[-72 + i * 5, 0.02, -0.2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[0.2, 2.6]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>
            <mesh position={[-72 + i * 5, 0.02, 0.2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[0.2, 2.6]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>
          </React.Fragment>
        ))}

        {/* Pedestrian Zebra Crossings at Central Intersection */}
        {[-14, 14].map((zOffset) => (
          <group key={`zebra-ns-${zOffset}`} position={[0, 0.025, zOffset]}>
            {[-6, -4, -2, 0, 2, 4, 6].map((xOffset) => (
              <mesh key={`z-bar-${xOffset}`} position={[xOffset, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.2, 3.2]} />
                <meshBasicMaterial color="#f8fafc" />
              </mesh>
            ))}
          </group>
        ))}

        {[-14, 14].map((xOffset) => (
          <group key={`zebra-ew-${xOffset}`} position={[xOffset, 0.025, 0]} rotation={[0, Math.PI / 2, 0]}>
            {[-6, -4, -2, 0, 2, 4, 6].map((zBar) => (
              <mesh key={`z-bar2-${zBar}`} position={[zBar, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.2, 3.2]} />
                <meshBasicMaterial color="#f8fafc" />
              </mesh>
            ))}
          </group>
        ))}
      </RigidBody>

      {/* -------------------------------------------------------------------- */}
      {/* RAISED SIDEWALKS & PEDESTRIAN PATHS (+0.12m elevation)               */}
      {/* -------------------------------------------------------------------- */}
      <RigidBody type="fixed" colliders={false}>
        {/* Sidewalk Northwest Quadrant */}
        <CuboidCollider args={[15, 0.06, 15]} position={[-25, 0.06, -25]} />
        <mesh position={[-25, 0.06, -25]} receiveShadow>
          <boxGeometry args={[30, 0.12, 30]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>

        {/* Sidewalk Northeast Quadrant */}
        <CuboidCollider args={[15, 0.06, 15]} position={[25, 0.06, -25]} />
        <mesh position={[25, 0.06, -25]} receiveShadow>
          <boxGeometry args={[30, 0.12, 30]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>

        {/* Sidewalk Southwest Quadrant */}
        <CuboidCollider args={[15, 0.06, 15]} position={[-25, 0.06, 25]} />
        <mesh position={[-25, 0.06, 25]} receiveShadow>
          <boxGeometry args={[30, 0.12, 30]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>

        {/* Sidewalk Southeast Quadrant */}
        <CuboidCollider args={[15, 0.06, 15]} position={[25, 0.06, 25]} />
        <mesh position={[25, 0.06, 25]} receiveShadow>
          <boxGeometry args={[30, 0.12, 30]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>

        {/* Granite Curb Trims */}
        <mesh position={[-9.6, 0.08, -25]}>
          <boxGeometry args={[0.3, 0.16, 30]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
        <mesh position={[9.6, 0.08, -25]}>
          <boxGeometry args={[0.3, 0.16, 30]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
        <mesh position={[-9.6, 0.08, 25]}>
          <boxGeometry args={[0.3, 0.16, 30]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
        <mesh position={[9.6, 0.08, 25]}>
          <boxGeometry args={[0.3, 0.16, 30]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* -------------------------------------------------------------------- */}
      {/* URBAN GREENERY: LUSH LAWN PARKS & GARDENS                            */}
      {/* -------------------------------------------------------------------- */}
      <group>
        {/* Northwest Park Lawn */}
        <mesh position={[-26, 0.13, -12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 18]} />
          <meshStandardMaterial color="#22c55e" roughness={0.9} />
        </mesh>

        {/* Southeast Park Lawn */}
        <mesh position={[24, 0.13, 18]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[18, 16]} />
          <meshStandardMaterial color="#22c55e" roughness={0.9} />
        </mesh>

        {/* 3D Stylized Low-Poly Trees */}
        {trees.map((t, idx) => (
          <group key={`tree-${idx}`} position={t.pos as [number, number, number]} scale={t.scale}>
            {/* Trunk */}
            <RigidBody type="fixed" colliders={false}>
              <CylinderCollider args={[1.2, 0.3]} position={[0, 1.2, 0]} />
              <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.35, 2.4, 8]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>
            </RigidBody>
            {/* Lush 3-Tier Canopy */}
            <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
              <coneGeometry args={[1.8, 2.2, 8]} />
              <meshStandardMaterial color="#15803d" roughness={0.7} />
            </mesh>
            <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
              <coneGeometry args={[1.4, 1.9, 8]} />
              <meshStandardMaterial color="#16a34a" roughness={0.7} />
            </mesh>
            <mesh position={[0, 5.0, 0]} castShadow receiveShadow>
              <coneGeometry args={[0.9, 1.5, 8]} />
              <meshStandardMaterial color="#22c55e" roughness={0.7} />
            </mesh>
          </group>
        ))}

        {/* Modern Park Benches (Wood & Steel) */}
        {[
          { pos: [-22, 0.12, -4], rotY: 0 },
          { pos: [-22, 0.12, -18], rotY: 0 },
          { pos: [20, 0.12, 10], rotY: Math.PI },
          { pos: [20, 0.12, 24], rotY: Math.PI }
        ].map((bench, idx) => (
          <group key={`bench-${idx}`} position={bench.pos as [number, number, number]} rotation={[0, bench.rotY, 0]}>
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={[1.0, 0.25, 0.35]} position={[0, 0.25, 0]} />
              {/* Wooden Slats Seat */}
              <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.0, 0.08, 0.6]} />
                <meshStandardMaterial color="#b45309" roughness={0.6} />
              </mesh>
              {/* Wooden Backrest */}
              <mesh position={[0, 0.72, -0.26]} castShadow receiveShadow>
                <boxGeometry args={[2.0, 0.4, 0.08]} />
                <meshStandardMaterial color="#b45309" roughness={0.6} />
              </mesh>
              {/* Black Iron Legs */}
              <mesh position={[-0.8, 0.22, 0]} castShadow>
                <boxGeometry args={[0.1, 0.44, 0.55]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
              <mesh position={[0.8, 0.22, 0]} castShadow>
                <boxGeometry args={[0.1, 0.44, 0.55]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
            </RigidBody>
          </group>
        ))}

        {/* Raised Concrete Flower Planters */}
        {[
          { pos: [-12, 0.12, -22], color: "#ec4899" },
          { pos: [-12, 0.12, 22], color: "#f59e0b" },
          { pos: [12, 0.12, -22], color: "#3b82f6" },
          { pos: [12, 0.12, 22], color: "#ec4899" }
        ].map((planter, idx) => (
          <group key={`planter-${idx}`} position={planter.pos as [number, number, number]}>
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={[1.2, 0.35, 1.2]} position={[0, 0.35, 0]} />
              {/* Concrete Basin */}
              <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 0.7, 2.4]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
              </mesh>
              {/* Soil */}
              <mesh position={[0, 0.68, 0]}>
                <boxGeometry args={[2.1, 0.1, 2.1]} />
                <meshStandardMaterial color="#451a03" roughness={0.9} />
              </mesh>
              {/* Blooming Flowers Bush */}
              <mesh position={[0, 0.9, 0]} castShadow>
                <sphereGeometry args={[0.7, 12, 8]} />
                <meshStandardMaterial color={planter.color} roughness={0.6} />
              </mesh>
            </RigidBody>
          </group>
        ))}
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE A: MODERN COMMERCIAL STREET & SHOPS (North: Z = -35 to -65)     */}
      {/* -------------------------------------------------------------------- */}
      <group>
        {/* Shop 1: "METRO CAFE" & Bistro (Warm Terracotta & Striped Awning) */}
        <group position={[-25, 0, -45]}>
          <RigidBody type="fixed" colliders={false}>
            {/* Building Body: 14m wide x 8m tall x 12m deep */}
            <CuboidCollider args={[7.0, 4.0, 6.0]} position={[0, 4.0, 0]} />
            <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
              <boxGeometry args={[14.0, 8.0, 12.0]} />
              <meshStandardMaterial color="#ea580c" roughness={0.7} />
            </mesh>

            {/* Ground Floor Storefront Glass */}
            <mesh position={[0, 2.0, 6.05]}>
              <planeGeometry args={[12.0, 3.6]} />
              <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} transparent opacity={0.7} />
            </mesh>

            {/* Cafe Entrance Door Frame */}
            <mesh position={[0, 1.4, 6.08]}>
              <boxGeometry args={[2.2, 2.8, 0.1]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>

            {/* Red & White Striped Sun Awning */}
            <group position={[0, 3.6, 6.9]} rotation={[0.3, 0, 0]}>
              <CuboidCollider args={[6.5, 0.05, 1.2]} />
              <mesh castShadow receiveShadow>
                <boxGeometry args={[13.0, 0.1, 2.4]} />
                <meshStandardMaterial color="#ef4444" roughness={0.5} />
              </mesh>
              {/* White Stripes Overlay */}
              {[-5, -3, -1, 1, 3, 5].map((sx) => (
                <mesh key={`awning-stripe-${sx}`} position={[sx, 0.06, 0]}>
                  <boxGeometry args={[1.0, 0.02, 2.42]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.5} />
                </mesh>
              ))}
            </group>

            {/* Cafe Signboard */}
            <mesh position={[0, 4.8, 6.1]}>
              <boxGeometry args={[6.0, 1.0, 0.2]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 4.8, 6.22]}>
              <planeGeometry args={[5.6, 0.8]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>

            {/* 2nd Floor Windows */}
            {[-4, 0, 4].map((wx) => (
              <mesh key={`cafe-win-${wx}`} position={[wx, 6.2, 6.05]}>
                <boxGeometry args={[2.0, 1.8, 0.1]} />
                <meshStandardMaterial color="#bae6fd" roughness={0.1} metalness={0.9} />
              </mesh>
            ))}

            {/* Rooftop Safety Parapet (Cover for Snipers) */}
            <CuboidCollider args={[7.0, 0.45, 0.15]} position={[0, 8.45, 5.85]} />
            <mesh position={[0, 8.45, 5.85]} castShadow receiveShadow>
              <boxGeometry args={[14.0, 0.9, 0.3]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.7} />
            </mesh>
          </RigidBody>
        </group>

        {/* Shop 2: "CYBER TECH & ELECTRONICS" (Teal & Glass Modern Facade) */}
        <group position={[-2, 0, -48]}>
          <RigidBody type="fixed" colliders={false}>
            {/* Building Body: 16m wide x 10m tall x 10m deep */}
            <CuboidCollider args={[8.0, 5.0, 5.0]} position={[0, 5.0, 0]} />
            <mesh position={[0, 5.0, 0]} castShadow receiveShadow>
              <boxGeometry args={[16.0, 10.0, 10.0]} />
              <meshStandardMaterial color="#0f766e" roughness={0.6} />
            </mesh>

            {/* Modern Glass Curtain Wall (Floors 1 & 2) */}
            <mesh position={[0, 4.5, 5.05]}>
              <planeGeometry args={[14.0, 7.5]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.1} metalness={0.8} transparent opacity={0.65} />
            </mesh>

            {/* Store Brand Header */}
            <mesh position={[0, 8.8, 5.1]}>
              <boxGeometry args={[10.0, 1.2, 0.2]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 8.8, 5.22]}>
              <planeGeometry args={[9.4, 0.9]} />
              <meshBasicMaterial color="#0891b2" />
            </mesh>

            {/* Rooftop Parapet */}
            <CuboidCollider args={[8.0, 0.45, 0.15]} position={[0, 10.45, 4.85]} />
            <mesh position={[0, 10.45, 4.85]} castShadow receiveShadow>
              <boxGeometry args={[16.0, 0.9, 0.3]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
            </mesh>
          </RigidBody>
        </group>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE B: MODERN RESIDENTIAL APARTMENTS (South: Z = 35 to 65)          */}
      {/* -------------------------------------------------------------------- */}
      <group>
        {/* Apartment Block 1: "SOLARIS APARTMENTS" (Sunny Amber & Sky Blue) */}
        <group position={[-25, 0, 45]}>
          <RigidBody type="fixed" colliders={false}>
            {/* 3-Story Apartment: 16m wide x 11m tall x 12m deep */}
            <CuboidCollider args={[8.0, 5.5, 6.0]} position={[0, 5.5, 0]} />
            <mesh position={[0, 5.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[16.0, 11.0, 12.0]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.7} />
            </mesh>

            {/* Balconies on 2nd and 3rd Floors */}
            {[-4, 4].map((bx) => (
              <React.Fragment key={`balc-${bx}`}>
                {/* 2nd floor balcony */}
                <CuboidCollider args={[1.8, 0.5, 0.8]} position={[bx, 4.5, -6.8]} />
                <mesh position={[bx, 4.5, -6.8]} castShadow receiveShadow>
                  <boxGeometry args={[3.6, 1.0, 1.6]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.6} />
                </mesh>
                {/* 3rd floor balcony */}
                <CuboidCollider args={[1.8, 0.5, 0.8]} position={[bx, 8.0, -6.8]} />
                <mesh position={[bx, 8.0, -6.8]} castShadow receiveShadow>
                  <boxGeometry args={[3.6, 1.0, 1.6]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.6} />
                </mesh>
              </React.Fragment>
            ))}

            {/* Windows Array */}
            {[-4, 0, 4].map((wx) => (
              <React.Fragment key={`win-apt-${wx}`}>
                <mesh position={[wx, 1.8, -6.05]}>
                  <boxGeometry args={[2.0, 1.8, 0.1]} />
                  <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} />
                </mesh>
                <mesh position={[wx, 5.5, -6.05]}>
                  <boxGeometry args={[2.0, 1.8, 0.1]} />
                  <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} />
                </mesh>
                <mesh position={[wx, 9.0, -6.05]}>
                  <boxGeometry args={[2.0, 1.8, 0.1]} />
                  <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} />
                </mesh>
              </React.Fragment>
            ))}

            {/* Rooftop Parapet */}
            <CuboidCollider args={[8.0, 0.45, 0.15]} position={[0, 11.45, -5.85]} />
            <mesh position={[0, 11.45, -5.85]} castShadow receiveShadow>
              <boxGeometry args={[16.0, 0.9, 0.3]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.8} />
            </mesh>
          </RigidBody>
        </group>

        {/* Apartment Block 2: "METRO RESIDENCES" (Sky Blue & White Modern Block) */}
        <group position={[-2, 0, 48]}>
          <RigidBody type="fixed" colliders={false}>
            {/* Building Body: 14m wide x 9m tall x 10m deep */}
            <CuboidCollider args={[7.0, 4.5, 5.0]} position={[0, 4.5, 0]} />
            <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[14.0, 9.0, 10.0]} />
              <meshStandardMaterial color="#60a5fa" roughness={0.6} />
            </mesh>

            {/* White Architectural Column Ribs */}
            {[-6, -2, 2, 6].map((cx) => (
              <mesh key={`col-${cx}`} position={[cx, 4.5, -5.1]} castShadow>
                <boxGeometry args={[0.5, 9.0, 0.3]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
              </mesh>
            ))}

            {/* Windows Matrix */}
            {[-4, 0, 4].map((wx) => (
              <React.Fragment key={`win-blue-${wx}`}>
                <mesh position={[wx, 2.5, -5.05]}>
                  <boxGeometry args={[2.2, 1.8, 0.1]} />
                  <meshStandardMaterial color="#bae6fd" roughness={0.1} metalness={0.8} />
                </mesh>
                <mesh position={[wx, 6.5, -5.05]}>
                  <boxGeometry args={[2.2, 1.8, 0.1]} />
                  <meshStandardMaterial color="#bae6fd" roughness={0.1} metalness={0.8} />
                </mesh>
              </React.Fragment>
            ))}

            {/* Rooftop Parapet */}
            <CuboidCollider args={[7.0, 0.45, 0.15]} position={[0, 9.45, -4.85]} />
            <mesh position={[0, 9.45, -4.85]} castShadow receiveShadow>
              <boxGeometry args={[14.0, 0.9, 0.3]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.8} />
            </mesh>
          </RigidBody>
        </group>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE C: MODERN LOGISTICS WAREHOUSE & DEPOT (Center: [0, 0, 0])       */}
      {/* Dimensions: 32m x 24m, Height: 7.5m with Catwalk at +3.5m            */}
      {/* -------------------------------------------------------------------- */}
      <group position={[0, 0, 0]}>
        {/* Interior Daylight Ambient Enhancement */}
        <pointLight color="#fef08a" intensity={1.5} distance={22} position={[0, 5.5, 0]} />
        <pointLight color="#60a5fa" intensity={1.2} distance={20} position={[-8, 4.5, 6]} />
        <pointLight color="#f97316" intensity={1.2} distance={20} position={[8, 4.5, -6]} />

        <RigidBody type="fixed" colliders={false}>
          {/* Concrete Warehouse Floor Slab */}
          <CuboidCollider args={[16.0, 0.15, 12.0]} position={[0, 0.15, 0]} />
          <mesh position={[0, 0.15, 0]} receiveShadow>
            <boxGeometry args={[32.0, 0.3, 24.0]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>

          {/* North Wall with Open Hangar Door (8m wide doorway in center) */}
          <CuboidCollider args={[6.0, 3.75, 0.6]} position={[-10.0, 3.75, -12.0]} />
          <mesh position={[-10.0, 3.75, -12.0]} castShadow receiveShadow>
            <boxGeometry args={[12.0, 7.5, 1.2]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          <CuboidCollider args={[6.0, 3.75, 0.6]} position={[10.0, 3.75, -12.0]} />
          <mesh position={[10.0, 3.75, -12.0]} castShadow receiveShadow>
            <boxGeometry args={[12.0, 7.5, 1.2]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          {/* North Door Lintel */}
          <CuboidCollider args={[4.0, 1.25, 0.6]} position={[0, 6.25, -12.0]} />
          <mesh position={[0, 6.25, -12.0]} castShadow receiveShadow>
            <boxGeometry args={[8.0, 2.5, 1.2]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.6} />
          </mesh>

          {/* South Wall with Open Hangar Door (8m wide doorway in center) */}
          <CuboidCollider args={[6.0, 3.75, 0.6]} position={[-10.0, 3.75, 12.0]} />
          <mesh position={[-10.0, 3.75, 12.0]} castShadow receiveShadow>
            <boxGeometry args={[12.0, 7.5, 1.2]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          <CuboidCollider args={[6.0, 3.75, 0.6]} position={[10.0, 3.75, 12.0]} />
          <mesh position={[10.0, 3.75, 12.0]} castShadow receiveShadow>
            <boxGeometry args={[12.0, 7.5, 1.2]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          {/* South Door Lintel */}
          <CuboidCollider args={[4.0, 1.25, 0.6]} position={[0, 6.25, 12.0]} />
          <mesh position={[0, 6.25, 12.0]} castShadow receiveShadow>
            <boxGeometry args={[8.0, 2.5, 1.2]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.6} />
          </mesh>

          {/* West Wall with Side Bay Opening (6m doorway in center) */}
          <CuboidCollider args={[0.6, 3.75, 4.5]} position={[-16.0, 3.75, -7.5]} />
          <mesh position={[-16.0, 3.75, -7.5]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7.5, 9.0]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          <CuboidCollider args={[0.6, 3.75, 4.5]} position={[-16.0, 3.75, 7.5]} />
          <mesh position={[-16.0, 3.75, 7.5]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7.5, 9.0]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          {/* West Door Lintel */}
          <CuboidCollider args={[0.6, 1.25, 3.0]} position={[-16.0, 6.25, 0]} />
          <mesh position={[-16.0, 6.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 2.5, 6.0]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.6} />
          </mesh>

          {/* East Wall with Side Bay Opening (6m doorway in center) */}
          <CuboidCollider args={[0.6, 3.75, 4.5]} position={[16.0, 3.75, -7.5]} />
          <mesh position={[16.0, 3.75, -7.5]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7.5, 9.0]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          <CuboidCollider args={[0.6, 3.75, 4.5]} position={[16.0, 3.75, 7.5]} />
          <mesh position={[16.0, 3.75, 7.5]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7.5, 9.0]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          {/* East Door Lintel */}
          <CuboidCollider args={[0.6, 1.25, 3.0]} position={[16.0, 6.25, 0]} />
          <mesh position={[16.0, 6.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 2.5, 6.0]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.6} />
          </mesh>

          {/* Safety Yellow Steel Structural Columns */}
          {[-15.2, 15.2].map((cx) =>
            [-11.2, 0, 11.2].map((cz) => (
              <mesh key={`steel-col-${cx}-${cz}`} position={[cx, 3.75, cz]} castShadow>
                <boxGeometry args={[0.6, 7.5, 0.6]} />
                <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.7} />
              </mesh>
            ))
          )}

          {/* ---------------------------------------------------------------- */}
          {/* ELEVATED INTERIOR CATWALK (+3.5m elevation, 2.6m wide walkway)   */}
          {/* ---------------------------------------------------------------- */}
          {/* West Catwalk Corridor */}
          <CuboidCollider args={[1.3, 0.1, 10.0]} position={[-13.5, 3.5, 0]} />
          <mesh position={[-13.5, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.2, 20.0]} />
            <meshStandardMaterial color="#64748b" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* West Catwalk Safety Railing */}
          <CuboidCollider args={[0.05, 0.45, 10.0]} position={[-12.2, 4.05, 0]} />
          <mesh position={[-12.2, 4.05, 0]}>
            <boxGeometry args={[0.1, 0.9, 20.0]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.7} />
          </mesh>

          {/* East Catwalk Corridor */}
          <CuboidCollider args={[1.3, 0.1, 10.0]} position={[13.5, 3.5, 0]} />
          <mesh position={[13.5, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.2, 20.0]} />
            <meshStandardMaterial color="#64748b" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* East Catwalk Safety Railing */}
          <CuboidCollider args={[0.05, 0.45, 10.0]} position={[12.2, 4.05, 0]} />
          <mesh position={[12.2, 4.05, 0]}>
            <boxGeometry args={[0.1, 0.9, 20.0]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.7} />
          </mesh>

          {/* ---------------------------------------------------------------- */}
          {/* INDUSTRIAL APPROACH STAIRS / RAMPS (Leading to +3.5m Catwalk)   */}
          {/* Incline angle: atan2(3.5, 8.0) ≈ 23.6 deg                        */}
          {/* ---------------------------------------------------------------- */}
          {/* West Stair Ramp (South -> North Ascent) */}
          <group position={[-13.5, 1.75, 4.0]} rotation={[-Math.atan2(3.5, 8.0), 0, 0]}>
            <CuboidCollider args={[1.2, 0.1, 4.37]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.2, 8.74]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.6} metalness={0.4} />
            </mesh>
          </group>

          {/* East Stair Ramp (North -> South Ascent) */}
          <group position={[13.5, 1.75, -4.0]} rotation={[Math.atan2(3.5, 8.0), 0, 0]}>
            <CuboidCollider args={[1.2, 0.1, 4.37]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.2, 8.74]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.6} metalness={0.4} />
            </mesh>
          </group>

          {/* ---------------------------------------------------------------- */}
          {/* WAREHOUSE GROUND FLOOR CRATES & TACTICAL COVER                   */}
          {/* ---------------------------------------------------------------- */}
          {/* Center Cover Crate Cluster */}
          <CuboidCollider args={[1.2, 0.8, 1.2]} position={[-3.5, 0.8, -2.5]} />
          <mesh position={[-3.5, 0.8, -2.5]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 1.6, 2.4]} />
            <meshStandardMaterial color="#d97706" roughness={0.8} />
          </mesh>

          <CuboidCollider args={[1.0, 0.6, 1.0]} position={[3.5, 0.6, 2.5]} />
          <mesh position={[3.5, 0.6, 2.5]} castShadow receiveShadow>
            <boxGeometry args={[2.0, 1.2, 2.0]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.8} />
          </mesh>

          {/* Metal Storage Barrels */}
          <CylinderCollider args={[0.5, 0.4]} position={[-5.5, 0.5, 3.5]} />
          <mesh position={[-5.5, 0.5, 3.5]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 1.0, 16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.5} />
          </mesh>
          <CylinderCollider args={[0.5, 0.4]} position={[-6.2, 0.5, 4.2]} />
          <mesh position={[-6.2, 0.5, 4.2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 1.0, 16]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.5} />
          </mesh>
        </RigidBody>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE D: SHIPPING CONTAINER YARD (East Sector)                        */}
      {/* -------------------------------------------------------------------- */}
      <group>
        {containers.map((c) => (
          <RigidBody key={c.name} type="fixed" colliders={false}>
            <CuboidCollider
              args={[c.size[0] / 2, c.size[1] / 2, c.size[2] / 2]}
              position={c.pos as [number, number, number]}
              rotation={[0, c.rotY, 0]}
            />
            <mesh
              position={c.pos as [number, number, number]}
              rotation={[0, c.rotY, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={c.size as [number, number, number]} />
              <meshStandardMaterial color={c.color} roughness={0.65} metalness={0.35} />
            </mesh>
          </RigidBody>
        ))}

        {/* Container Approach Ramp (Ground to +2.6m Container Roof) */}
        <group position={[28, 1.3, -6.5]} rotation={[-Math.atan2(2.6, 7.0), 0, 0]}>
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.5, 0.1, 3.73]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.0, 0.2, 7.46]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.7} metalness={0.4} />
            </mesh>
          </RigidBody>
        </group>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE E: ELEVATED SNIPER WATCHTOWERS (+5.2m Vantage Platform)         */}
      {/* -------------------------------------------------------------------- */}
      {/* Tower 1 (South-East: [42, 0, 42]) */}
      <group position={[42, 0, 42]}>
        <RigidBody type="fixed" colliders={false}>
          {/* Steel Corner Truss Legs */}
          {[-2.2, 2.2].map((tx) =>
            [-2.2, 2.2].map((tz) => (
              <React.Fragment key={`truss-1-${tx}-${tz}`}>
                <CylinderCollider args={[2.6, 0.15]} position={[tx, 2.6, tz]} />
                <mesh position={[tx, 2.6, tz]} castShadow>
                  <cylinderGeometry args={[0.15, 0.15, 5.2, 8]} />
                  <meshStandardMaterial color="#64748b" metalness={0.8} />
                </mesh>
              </React.Fragment>
            ))
          )}

          {/* Elevated Sniper Platform (+5.2m elevation) */}
          <CuboidCollider args={[2.7, 0.125, 2.7]} position={[0, 5.2, 0]} />
          <mesh position={[0, 5.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.4, 0.25, 5.4]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} metalness={0.4} />
          </mesh>

          {/* Parapet Railing */}
          <CuboidCollider args={[2.6, 0.45, 0.2]} position={[0, 5.75, -2.5]} />
          <mesh position={[0, 5.75, -2.5]} castShadow receiveShadow>
            <boxGeometry args={[5.2, 0.9, 0.4]} />
            <meshStandardMaterial color="#facc15" roughness={0.5} metalness={0.6} />
          </mesh>
          <CuboidCollider args={[0.2, 0.45, 2.6]} position={[-2.5, 5.75, 0]} />
          <mesh position={[-2.5, 5.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.9, 5.2]} />
            <meshStandardMaterial color="#facc15" roughness={0.5} metalness={0.6} />
          </mesh>
          <CuboidCollider args={[0.2, 0.45, 2.6]} position={[2.5, 5.75, 0]} />
          <mesh position={[2.5, 5.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.9, 5.2]} />
            <meshStandardMaterial color="#facc15" roughness={0.5} metalness={0.6} />
          </mesh>

          {/* Access Ramp */}
          <group position={[0, 2.6, -7.0]} rotation={[-Math.atan2(5.2, 9.0), 0, 0]}>
            <CuboidCollider args={[1.2, 0.1, 5.19]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.2, 10.38]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.7} metalness={0.4} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* Tower 2 (North-West: [-42, 0, -18]) */}
      <group position={[-42, 0, -18]}>
        <RigidBody type="fixed" colliders={false}>
          {/* Elevated Sniper Platform (+5.2m elevation) */}
          <CuboidCollider args={[2.7, 0.125, 2.7]} position={[0, 5.2, 0]} />
          <mesh position={[0, 5.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.4, 0.25, 5.4]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} metalness={0.4} />
          </mesh>

          {/* Parapet */}
          <CuboidCollider args={[2.6, 0.45, 0.2]} position={[0, 5.75, 2.5]} />
          <mesh position={[0, 5.75, 2.5]} castShadow receiveShadow>
            <boxGeometry args={[5.2, 0.9, 0.4]} />
            <meshStandardMaterial color="#facc15" roughness={0.5} metalness={0.6} />
          </mesh>
          <CuboidCollider args={[0.2, 0.45, 2.6]} position={[2.5, 5.75, 0]} />
          <mesh position={[2.5, 5.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.9, 5.2]} />
            <meshStandardMaterial color="#facc15" roughness={0.5} metalness={0.6} />
          </mesh>

          {/* Access Ramp */}
          <group position={[0, 2.6, 7.0]} rotation={[Math.atan2(5.2, 9.0), 0, 0]}>
            <CuboidCollider args={[1.2, 0.1, 5.19]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.2, 10.38]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.7} metalness={0.4} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE F: CONCRETE JERSEY BARRIERS NETWORK                             */}
      {/* -------------------------------------------------------------------- */}
      {jerseyBarriers.map((b, idx) => (
        <RigidBody key={`barrier-${idx}`} type="fixed" colliders={false}>
          <CuboidCollider
            args={[1.2, 0.5, 0.3]}
            position={[b.pos[0], 0.5, b.pos[2]]}
            rotation={[0, b.rotY, 0]}
          />
          <mesh
            position={[b.pos[0], 0.5, b.pos[2]]}
            rotation={[0, b.rotY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.4, 1.0, 0.6]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
          </mesh>
          {/* Yellow Hazard Stripes Accent */}
          <mesh
            position={[b.pos[0], 0.5, b.pos[2]]}
            rotation={[0, b.rotY, 0]}
          >
            <boxGeometry args={[2.42, 0.18, 0.62]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
        </RigidBody>
      ))}

      {/* -------------------------------------------------------------------- */}
      {/* ZONE G: MODERN CITY VEHICLES (Tactical Heavy Cover)                  */}
      {/* -------------------------------------------------------------------- */}
      {vehicles.map((v, idx) => (
        <RigidBody key={`veh-${idx}`} type="fixed" colliders={false}>
          {/* Main Car Body Collider */}
          <CuboidCollider
            args={[2.4, 0.7, 1.1]}
            position={[v.pos[0], 0.7, v.pos[2]]}
            rotation={[0, v.rotY, 0]}
          />
          {/* Lower Chassis Mesh */}
          <mesh
            position={[v.pos[0], 0.65, v.pos[2]]}
            rotation={[0, v.rotY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[4.8, 0.8, 2.2]} />
            <meshStandardMaterial color={v.color} roughness={0.4} metalness={0.6} />
          </mesh>

          {/* Passenger Cabin Top */}
          <mesh
            position={[
              v.pos[0] - 0.3 * Math.cos(v.rotY),
              1.35,
              v.pos[2] + 0.3 * Math.sin(v.rotY)
            ]}
            rotation={[0, v.rotY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.6, 0.7, 1.9]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} transparent opacity={0.85} />
          </mesh>

          {/* Taxi Rooftop Light Accent */}
          {v.type === "taxi" && (
            <mesh
              position={[
                v.pos[0] - 0.3 * Math.cos(v.rotY),
                1.78,
                v.pos[2] + 0.3 * Math.sin(v.rotY)
              ]}
              rotation={[0, v.rotY, 0]}
            >
              <boxGeometry args={[0.8, 0.2, 0.4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          )}

          {/* Rubber Wheels */}
          {[-1.4, 1.4].map((wx) =>
            [-1.15, 1.15].map((wz) => (
              <mesh
                key={`wheel-${wx}-${wz}`}
                position={[
                  v.pos[0] + wx * Math.cos(v.rotY) - wz * Math.sin(v.rotY),
                  0.35,
                  v.pos[2] + wx * Math.sin(v.rotY) + wz * Math.cos(v.rotY)
                ]}
                rotation={[0, v.rotY, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} />
              </mesh>
            ))
          )}
        </RigidBody>
      ))}

      {/* -------------------------------------------------------------------- */}
      {/* ZONE H: TEAM BASES (Clean, High-Tech Spawn Enclosures)               */}
      {/* -------------------------------------------------------------------- */}
      {/* Team Red Base (North-East: [50, 0, -50]) */}
      <group position={[50, 0, -50]}>
        <pointLight color="#ef4444" intensity={2.0} distance={20} position={[0, 4, 0]} />
        <RigidBody type="fixed" colliders={false}>
          {/* Base Platform (+0.25m elevation) */}
          <CuboidCollider args={[7.0, 0.125, 7.0]} position={[0, 0.125, 0]} />
          <mesh position={[0, 0.125, 0]} receiveShadow>
            <boxGeometry args={[14.0, 0.25, 14.0]} />
            <meshStandardMaterial color="#fee2e2" roughness={0.6} />
          </mesh>

          {/* Red Team Decal Ring */}
          <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 4.2, 32]} />
            <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
          </mesh>

          {/* Team Crest Flagpole */}
          <CylinderCollider args={[3.2, 0.12]} position={[-5.5, 3.2, -5.5]} />
          <mesh position={[-5.5, 3.2, -5.5]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 6.4, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[-4.2, 5.4, -5.5]}>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial color="#ef4444" side={THREE.DoubleSide} />
          </mesh>

          {/* Modern Tactical Barrier Enclosure */}
          <CuboidCollider args={[6.5, 1.5, 0.6]} position={[0, 1.5, -6.5]} />
          <mesh position={[0, 1.5, -6.5]} castShadow receiveShadow>
            <boxGeometry args={[13.0, 3.0, 1.2]} />
            <meshStandardMaterial color="#f87171" roughness={0.7} />
          </mesh>
        </RigidBody>
      </group>

      {/* Team Blue Base (South-West: [-50, 0, 50]) */}
      <group position={[-50, 0, 50]}>
        <pointLight color="#3b82f6" intensity={2.0} distance={20} position={[0, 4, 0]} />
        <RigidBody type="fixed" colliders={false}>
          {/* Base Platform (+0.25m elevation) */}
          <CuboidCollider args={[7.0, 0.125, 7.0]} position={[0, 0.125, 0]} />
          <mesh position={[0, 0.125, 0]} receiveShadow>
            <boxGeometry args={[14.0, 0.25, 14.0]} />
            <meshStandardMaterial color="#dbeafe" roughness={0.6} />
          </mesh>

          {/* Blue Team Decal Ring */}
          <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 4.2, 32]} />
            <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} />
          </mesh>

          {/* Team Crest Flagpole */}
          <CylinderCollider args={[3.2, 0.12]} position={[5.5, 3.2, 5.5]} />
          <mesh position={[5.5, 3.2, 5.5]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 6.4, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[4.2, 5.4, 5.5]}>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial color="#3b82f6" side={THREE.DoubleSide} />
          </mesh>

          {/* Modern Tactical Barrier Enclosure */}
          <CuboidCollider args={[6.5, 1.5, 0.6]} position={[0, 1.5, 6.5]} />
          <mesh position={[0, 1.5, 6.5]} castShadow receiveShadow>
            <boxGeometry args={[13.0, 3.0, 1.2]} />
            <meshStandardMaterial color="#60a5fa" roughness={0.7} />
          </mesh>
        </RigidBody>
      </group>

      {/* Team Green Base (North-West: [-50, 0, -50]) */}
      <group position={[-50, 0, -50]}>
        <pointLight color="#10b981" intensity={2.0} distance={20} position={[0, 4, 0]} />
        <RigidBody type="fixed" colliders={false}>
          {/* Base Platform (+0.25m elevation) */}
          <CuboidCollider args={[7.0, 0.125, 7.0]} position={[0, 0.125, 0]} />
          <mesh position={[0, 0.125, 0]} receiveShadow>
            <boxGeometry args={[14.0, 0.25, 14.0]} />
            <meshStandardMaterial color="#d1fae5" roughness={0.6} />
          </mesh>

          {/* Green Team Decal Ring */}
          <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 4.2, 32]} />
            <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
          </mesh>

          {/* Team Crest Flagpole */}
          <CylinderCollider args={[3.2, 0.12]} position={[-5.5, 3.2, -5.5]} />
          <mesh position={[-5.5, 3.2, -5.5]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 6.4, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[-4.2, 5.4, -5.5]}>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial color="#10b981" side={THREE.DoubleSide} />
          </mesh>

          {/* Modern Tactical Barrier Enclosure */}
          <CuboidCollider args={[6.5, 1.5, 0.6]} position={[0, 1.5, -6.5]} />
          <mesh position={[0, 1.5, -6.5]} castShadow receiveShadow>
            <boxGeometry args={[13.0, 3.0, 1.2]} />
            <meshStandardMaterial color="#34d399" roughness={0.7} />
          </mesh>
        </RigidBody>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* PERIMETER BOUNDARY WALLS (+/- 78m) (Clean Modern Architectural Walls) */}
      {/* -------------------------------------------------------------------- */}
      <RigidBody type="fixed" colliders={false}>
        {/* North Wall */}
        <CuboidCollider args={[80, 4.0, 1.0]} position={[0, 4.0, -78]} />
        <mesh position={[0, 4.0, -78]} receiveShadow castShadow>
          <boxGeometry args={[160, 8.0, 2.0]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
        </mesh>
        {/* Decorative Blue Stripe */}
        <mesh position={[0, 7.0, -76.9]}>
          <planeGeometry args={[160, 0.8]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>

        {/* South Wall */}
        <CuboidCollider args={[80, 4.0, 1.0]} position={[0, 4.0, 78]} />
        <mesh position={[0, 4.0, 78]} receiveShadow castShadow>
          <boxGeometry args={[160, 8.0, 2.0]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
        </mesh>
        <mesh position={[0, 7.0, 76.9]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[160, 0.8]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>

        {/* East Wall */}
        <CuboidCollider args={[1.0, 4.0, 80]} position={[78, 4.0, 0]} />
        <mesh position={[78, 4.0, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.0, 8.0, 160]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
        </mesh>
        <mesh position={[76.9, 7.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[160, 0.8]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>

        {/* West Wall */}
        <CuboidCollider args={[1.0, 4.0, 80]} position={[-78, 4.0, 0]} />
        <mesh position={[-78, 4.0, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.0, 8.0, 160]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
        </mesh>
        <mesh position={[-76.9, 7.0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[160, 0.8]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
      </RigidBody>

      {/* -------------------------------------------------------------------- */}
      {/* MODERN CURVED STREETLIGHTS                                           */}
      {/* -------------------------------------------------------------------- */}
      {[
        [-18, 0, 18],
        [18, 0, -18],
        [-18, 0, -18],
        [18, 0, 18],
        [0, 0, 30],
        [0, 0, -30]
      ].map((pos, idx) => (
        <group key={`streetlight-${idx}`} position={pos as [number, number, number]}>
          <RigidBody type="fixed" colliders={false}>
            <CylinderCollider args={[3.2, 0.15]} position={[0, 3.2, 0]} />
            {/* Pole */}
            <mesh position={[0, 3.2, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.14, 6.4, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} />
            </mesh>
            {/* Lamp Arm */}
            <mesh position={[0.5, 6.3, 0]}>
              <boxGeometry args={[1.2, 0.1, 0.15]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} />
            </mesh>
            {/* LED Luminaire */}
            <mesh position={[1.0, 6.2, 0]}>
              <boxGeometry args={[0.6, 0.15, 0.35]} />
              <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={0.6} />
            </mesh>
          </RigidBody>
          <pointLight color="#fef08a" intensity={0.9} distance={15} position={[1.0, 6.0, 0]} />
        </group>
      ))}
    </group>
  );
}
