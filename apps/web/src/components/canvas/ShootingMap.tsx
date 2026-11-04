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
      { pos: [28, 1.3, 0], size: [6.0, 2.6, 2.44], rotY: 0, color: "#c2410c", name: "Cargo-Rust-1" },
      { pos: [28, 1.3, 4], size: [6.0, 2.6, 2.44], rotY: 0, color: "#1e3a8a", name: "Cargo-Navy-1" },
      { pos: [38, 1.3, 2], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#3f6212", name: "Cargo-Olive-1" },
      { pos: [38, 1.3, 10], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#ca8a04", name: "Cargo-Yellow-1" },
      { pos: [30, 1.3, 16], size: [6.0, 2.6, 2.44], rotY: 0, color: "#0f766e", name: "Cargo-Teal-1" },
      { pos: [44, 1.3, 18], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#c2410c", name: "Cargo-Rust-2" },
      { pos: [24, 1.3, 24], size: [6.0, 2.6, 2.44], rotY: 0, color: "#1e3a8a", name: "Cargo-Navy-2" },
      { pos: [34, 1.3, 28], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#ca8a04", name: "Cargo-Yellow-2" },

      // Upper Tier Stacked Containers (y = 3.9, height 2.6m -> roof at y = 5.2m)
      { pos: [28, 3.9, 0], size: [6.0, 2.6, 2.44], rotY: 0, color: "#ca8a04", name: "Cargo-Upper-1" },
      { pos: [30, 3.9, 16], size: [6.0, 2.6, 2.44], rotY: 0, color: "#3f6212", name: "Cargo-Upper-2" },
      { pos: [44, 3.9, 18], size: [6.0, 2.6, 2.44], rotY: Math.PI / 2, color: "#1e3a8a", name: "Cargo-Upper-3" }
    ];
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Concrete Jersey Barriers & Half-Cover Network
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
  // 3. Heavy Armored Vehicles & Tactical Transport Props (Heavy Cover)
  // ---------------------------------------------------------------------------
  const vehicles = useMemo(() => {
    return [
      { pos: [-24, 1.3, 14], rotY: 0.35, color: "#334155", type: "apc" },
      { pos: [18, 1.4, -28], rotY: -0.5, color: "#1e293b", type: "truck" },
      { pos: [-20, 1.2, -26], rotY: 1.2, color: "#475569", type: "humvee" }
    ];
  }, []);

  return (
    <group>
      {/* -------------------------------------------------------------------- */}
      {/* ATMOSPHERE & LIGHTING                                                */}
      {/* -------------------------------------------------------------------- */}
      <ambientLight color="#94a3b8" intensity={0.55} />

      {/* Primary Tactical Sunlight */}
      <directionalLight
        color="#f8fafc"
        intensity={1.35}
        position={[45, 60, 30]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={10}
        shadow-camera-far={180}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
      />

      {/* Atmospheric Horizon Fog */}
      <fog attach="fog" args={["#0c1322", 40, 160]} />

      {/* Dynamic Tactical Twilight Sky Dome */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[140, 32, 16]} />
        <meshBasicMaterial color="#0c1322" side={THREE.BackSide} />
      </mesh>

      {/* Atmospheric Horizon Gradient Band */}
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[138, 138, 30, 32, 1, true]} />
        <meshBasicMaterial color="#1e293b" side={THREE.BackSide} transparent opacity={0.65} />
      </mesh>

      {/* Distant Urban Skyline Silhouettes */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const dist = 110;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const height = 25 + ((i * 7) % 30);
        const width = 12 + ((i * 5) % 10);
        return (
          <mesh key={`skyline-${i}`} position={[x, height / 2, z]}>
            <boxGeometry args={[width, height, 4]} />
            <meshBasicMaterial color="#090d16" />
          </mesh>
        );
      })}

      {/* High-Altitude Tactical Sun / Moon Disc */}
      <mesh position={[65, 80, 45]}>
        <sphereGeometry args={[4.5, 16, 16]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* -------------------------------------------------------------------- */}
      {/* GROUND TERRAIN & ROADS                                               */}
      {/* -------------------------------------------------------------------- */}
      <RigidBody type="fixed" colliders={false}>
        {/* Main 160m x 160m Asphalt Battlefield Slab */}
        <CuboidCollider args={[80, 0.5, 80]} position={[0, -0.5, 0]} />

        {/* Visual Ground Mesh */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[160, 0.1, 160]} />
          <meshStandardMaterial color="#1e2430" roughness={0.88} metalness={0.12} />
        </mesh>

        {/* Main Cross-City Avenues (Lighter Asphalt Roads) */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 160]} />
          <meshStandardMaterial color="#283040" roughness={0.82} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
          <planeGeometry args={[16, 160]} />
          <meshStandardMaterial color="#283040" roughness={0.82} metalness={0.1} />
        </mesh>

        {/* Road Markings: Dashed Yellow Dividers */}
        {Array.from({ length: 28 }).map((_, i) => (
          <React.Fragment key={`road-mark-${i}`}>
            <mesh position={[0, 0.02, -70 + i * 5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.25, 2.5]} />
              <meshBasicMaterial color="#eab308" />
            </mesh>
            <mesh position={[-70 + i * 5, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[0.25, 2.5]} />
              <meshBasicMaterial color="#eab308" />
            </mesh>
          </React.Fragment>
        ))}
      </RigidBody>

      {/* -------------------------------------------------------------------- */}
      {/* PERIMETER BOUNDARY WALLS (+/- 78m)                                    */}
      {/* -------------------------------------------------------------------- */}
      <RigidBody type="fixed" colliders={false}>
        {/* North Wall */}
        <CuboidCollider args={[80, 3.5, 1.0]} position={[0, 3.5, -78]} />
        <mesh position={[0, 3.5, -78]} receiveShadow castShadow>
          <boxGeometry args={[160, 7.0, 2.0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* South Wall */}
        <CuboidCollider args={[80, 3.5, 1.0]} position={[0, 3.5, 78]} />
        <mesh position={[0, 3.5, 78]} receiveShadow castShadow>
          <boxGeometry args={[160, 7.0, 2.0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* East Wall */}
        <CuboidCollider args={[1.0, 3.5, 80]} position={[78, 3.5, 0]} />
        <mesh position={[78, 3.5, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.0, 7.0, 160]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* West Wall */}
        <CuboidCollider args={[1.0, 3.5, 80]} position={[-78, 3.5, 0]} />
        <mesh position={[-78, 3.5, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.0, 7.0, 160]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE A: TEAM RED BASE (North-East: [50, 0, -50])                     */}
      {/* -------------------------------------------------------------------- */}
      <group position={[50, 0, -50]}>
        <pointLight color="#ef4444" intensity={2.8} distance={25} position={[0, 5, 0]} />

        <RigidBody type="fixed" colliders={false}>
          {/* Base Platform (+0.25m elevation) */}
          <CuboidCollider args={[7.0, 0.125, 7.0]} position={[0, 0.125, 0]} />
          <mesh position={[0, 0.125, 0]} receiveShadow>
            <boxGeometry args={[14.0, 0.25, 14.0]} />
            <meshStandardMaterial color="#3b1518" roughness={0.7} metalness={0.2} />
          </mesh>

          {/* Red Team Decal Ring */}
          <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 4.2, 32]} />
            <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
          </mesh>

          {/* Bunker Arch / Fortified Backdrop */}
          <CuboidCollider args={[6.5, 2.5, 0.8]} position={[0, 2.5, -6.5]} />
          <mesh position={[0, 2.5, -6.5]} castShadow receiveShadow>
            <boxGeometry args={[13.0, 5.0, 1.6]} />
            <meshStandardMaterial color="#221013" roughness={0.8} />
          </mesh>

          {/* Team Crest Flagpole */}
          <CylinderCollider args={[3.2, 0.12]} position={[-5.5, 3.2, -5.5]} />
          <mesh position={[-5.5, 3.2, -5.5]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 6.4, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          <mesh position={[-4.2, 5.4, -5.5]}>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial color="#ef4444" side={THREE.DoubleSide} />
          </mesh>

          {/* Sandbag Wall Enclosure */}
          <CuboidCollider args={[2.5, 0.5, 0.5]} position={[-4.5, 0.5, 6.0]} />
          <mesh position={[-4.5, 0.5, 6.0]} castShadow receiveShadow>
            <boxGeometry args={[5.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
          <CuboidCollider args={[2.5, 0.5, 0.5]} position={[4.5, 0.5, 6.0]} />
          <mesh position={[4.5, 0.5, 6.0]} castShadow receiveShadow>
            <boxGeometry args={[5.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
        </RigidBody>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE B: TEAM BLUE BASE (South-West: [-50, 0, 50])                    */}
      {/* -------------------------------------------------------------------- */}
      <group position={[-50, 0, 50]}>
        <pointLight color="#3b82f6" intensity={2.8} distance={25} position={[0, 5, 0]} />

        <RigidBody type="fixed" colliders={false}>
          {/* Base Platform (+0.25m elevation) */}
          <CuboidCollider args={[7.0, 0.125, 7.0]} position={[0, 0.125, 0]} />
          <mesh position={[0, 0.125, 0]} receiveShadow>
            <boxGeometry args={[14.0, 0.25, 14.0]} />
            <meshStandardMaterial color="#172554" roughness={0.7} metalness={0.2} />
          </mesh>

          {/* Blue Team Decal Ring */}
          <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 4.2, 32]} />
            <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} />
          </mesh>

          {/* Bunker Arch / Fortified Backdrop */}
          <CuboidCollider args={[6.5, 2.5, 0.8]} position={[0, 2.5, 6.5]} />
          <mesh position={[0, 2.5, 6.5]} castShadow receiveShadow>
            <boxGeometry args={[13.0, 5.0, 1.6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>

          {/* Team Crest Flagpole */}
          <CylinderCollider args={[3.2, 0.12]} position={[5.5, 3.2, 5.5]} />
          <mesh position={[5.5, 3.2, 5.5]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 6.4, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          <mesh position={[4.2, 5.4, 5.5]}>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial color="#3b82f6" side={THREE.DoubleSide} />
          </mesh>

          {/* Sandbag Wall Enclosure */}
          <CuboidCollider args={[2.5, 0.5, 0.5]} position={[-4.5, 0.5, -6.0]} />
          <mesh position={[-4.5, 0.5, -6.0]} castShadow receiveShadow>
            <boxGeometry args={[5.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
          <CuboidCollider args={[2.5, 0.5, 0.5]} position={[4.5, 0.5, -6.0]} />
          <mesh position={[4.5, 0.5, -6.0]} castShadow receiveShadow>
            <boxGeometry args={[5.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
        </RigidBody>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE C: TEAM GREEN BASE (North-West: [-50, 0, -50])                  */}
      {/* -------------------------------------------------------------------- */}
      <group position={[-50, 0, -50]}>
        <pointLight color="#10b981" intensity={2.8} distance={25} position={[0, 5, 0]} />

        <RigidBody type="fixed" colliders={false}>
          {/* Base Platform (+0.25m elevation) */}
          <CuboidCollider args={[7.0, 0.125, 7.0]} position={[0, 0.125, 0]} />
          <mesh position={[0, 0.125, 0]} receiveShadow>
            <boxGeometry args={[14.0, 0.25, 14.0]} />
            <meshStandardMaterial color="#064e3b" roughness={0.7} metalness={0.2} />
          </mesh>

          {/* Green Team Decal Ring */}
          <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 4.2, 32]} />
            <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
          </mesh>

          {/* Bunker Arch / Fortified Backdrop */}
          <CuboidCollider args={[6.5, 2.5, 0.8]} position={[0, 2.5, -6.5]} />
          <mesh position={[0, 2.5, -6.5]} castShadow receiveShadow>
            <boxGeometry args={[13.0, 5.0, 1.6]} />
            <meshStandardMaterial color="#022c22" roughness={0.8} />
          </mesh>

          {/* Team Crest Flagpole */}
          <CylinderCollider args={[3.2, 0.12]} position={[-5.5, 3.2, -5.5]} />
          <mesh position={[-5.5, 3.2, -5.5]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 6.4, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          <mesh position={[-4.2, 5.4, -5.5]}>
            <planeGeometry args={[2.4, 1.4]} />
            <meshStandardMaterial color="#10b981" side={THREE.DoubleSide} />
          </mesh>

          {/* Sandbag Wall Enclosure */}
          <CuboidCollider args={[2.5, 0.5, 0.5]} position={[-4.5, 0.5, 6.0]} />
          <mesh position={[-4.5, 0.5, 6.0]} castShadow receiveShadow>
            <boxGeometry args={[5.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
          <CuboidCollider args={[2.5, 0.5, 0.5]} position={[4.5, 0.5, 6.0]} />
          <mesh position={[4.5, 0.5, 6.0]} castShadow receiveShadow>
            <boxGeometry args={[5.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
        </RigidBody>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE D: CENTRAL ABANDONED INDUSTRIAL WAREHOUSE (Center: [0, 0, 0])    */}
      {/* Dimensions: 32m x 24m, Height: 7.5m with Catwalk at +3.5m            */}
      {/* -------------------------------------------------------------------- */}
      <group position={[0, 0, 0]}>
        {/* Interior Atmospheric Lighting */}
        <pointLight color="#fde047" intensity={1.8} distance={20} position={[0, 5.5, 0]} />
        <pointLight color="#38bdf8" intensity={1.4} distance={18} position={[-8, 4.5, 6]} />
        <pointLight color="#f97316" intensity={1.4} distance={18} position={[8, 4.5, -6]} />

        <RigidBody type="fixed" colliders={false}>
          {/* Concrete Warehouse Floor Slab */}
          <CuboidCollider args={[16.0, 0.15, 12.0]} position={[0, 0.15, 0]} />
          <mesh position={[0, 0.15, 0]} receiveShadow>
            <boxGeometry args={[32.0, 0.3, 24.0]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>

          {/* North Wall with Open Hangar Door (8m wide doorway in center) */}
          <CuboidCollider args={[6.0, 3.75, 0.6]} position={[-10.0, 3.75, -12.0]} />
          <mesh position={[-10.0, 3.75, -12.0]} castShadow receiveShadow>
            <boxGeometry args={[12.0, 7.5, 1.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          <CuboidCollider args={[6.0, 3.75, 0.6]} position={[10.0, 3.75, -12.0]} />
          <mesh position={[10.0, 3.75, -12.0]} castShadow receiveShadow>
            <boxGeometry args={[12.0, 7.5, 1.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* North Door Lintel */}
          <CuboidCollider args={[4.0, 1.25, 0.6]} position={[0, 6.25, -12.0]} />
          <mesh position={[0, 6.25, -12.0]} castShadow receiveShadow>
            <boxGeometry args={[8.0, 2.5, 1.2]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* South Wall with Open Hangar Door (8m wide doorway in center) */}
          <CuboidCollider args={[6.0, 3.75, 0.6]} position={[-10.0, 3.75, 12.0]} />
          <mesh position={[-10.0, 3.75, 12.0]} castShadow receiveShadow>
            <boxGeometry args={[12.0, 7.5, 1.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          <CuboidCollider args={[6.0, 3.75, 0.6]} position={[10.0, 3.75, 12.0]} />
          <mesh position={[10.0, 3.75, 12.0]} castShadow receiveShadow>
            <boxGeometry args={[12.0, 7.5, 1.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* South Door Lintel */}
          <CuboidCollider args={[4.0, 1.25, 0.6]} position={[0, 6.25, 12.0]} />
          <mesh position={[0, 6.25, 12.0]} castShadow receiveShadow>
            <boxGeometry args={[8.0, 2.5, 1.2]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* West Wall with Side Bay Opening (6m doorway in center) */}
          <CuboidCollider args={[0.6, 3.75, 4.5]} position={[-16.0, 3.75, -7.5]} />
          <mesh position={[-16.0, 3.75, -7.5]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7.5, 9.0]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          <CuboidCollider args={[0.6, 3.75, 4.5]} position={[-16.0, 3.75, 7.5]} />
          <mesh position={[-16.0, 3.75, 7.5]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7.5, 9.0]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* West Door Lintel */}
          <CuboidCollider args={[0.6, 1.25, 3.0]} position={[-16.0, 6.25, 0]} />
          <mesh position={[-16.0, 6.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 2.5, 6.0]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* East Wall with Side Bay Opening (6m doorway in center) */}
          <CuboidCollider args={[0.6, 3.75, 4.5]} position={[16.0, 3.75, -7.5]} />
          <mesh position={[16.0, 3.75, -7.5]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7.5, 9.0]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          <CuboidCollider args={[0.6, 3.75, 4.5]} position={[16.0, 3.75, 7.5]} />
          <mesh position={[16.0, 3.75, 7.5]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7.5, 9.0]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          {/* East Door Lintel */}
          <CuboidCollider args={[0.6, 1.25, 3.0]} position={[16.0, 6.25, 0]} />
          <mesh position={[16.0, 6.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 2.5, 6.0]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* ---------------------------------------------------------------- */}
          {/* ELEVATED INTERIOR CATWALK (+3.5m elevation, 2.6m wide walkway)   */}
          {/* ---------------------------------------------------------------- */}
          {/* West Catwalk Corridor */}
          <CuboidCollider args={[1.3, 0.1, 10.0]} position={[-13.5, 3.5, 0]} />
          <mesh position={[-13.5, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.2, 20.0]} />
            <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.5} />
          </mesh>
          {/* West Catwalk Safety Railing */}
          <CuboidCollider args={[0.05, 0.45, 10.0]} position={[-12.2, 4.05, 0]} />
          <mesh position={[-12.2, 4.05, 0]}>
            <boxGeometry args={[0.1, 0.9, 20.0]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.4} metalness={0.7} />
          </mesh>

          {/* East Catwalk Corridor */}
          <CuboidCollider args={[1.3, 0.1, 10.0]} position={[13.5, 3.5, 0]} />
          <mesh position={[13.5, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.2, 20.0]} />
            <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.5} />
          </mesh>
          {/* East Catwalk Safety Railing */}
          <CuboidCollider args={[0.05, 0.45, 10.0]} position={[12.2, 4.05, 0]} />
          <mesh position={[12.2, 4.05, 0]}>
            <boxGeometry args={[0.1, 0.9, 20.0]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.4} metalness={0.7} />
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
              <meshStandardMaterial color="#64748b" roughness={0.6} metalness={0.4} />
            </mesh>
          </group>

          {/* East Stair Ramp (North -> South Ascent) */}
          <group position={[13.5, 1.75, -4.0]} rotation={[Math.atan2(3.5, 8.0), 0, 0]}>
            <CuboidCollider args={[1.2, 0.1, 4.37]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.2, 8.74]} />
              <meshStandardMaterial color="#64748b" roughness={0.6} metalness={0.4} />
            </mesh>
          </group>

          {/* ---------------------------------------------------------------- */}
          {/* WAREHOUSE GROUND FLOOR CRATES & TACTICAL COVER                   */}
          {/* ---------------------------------------------------------------- */}
          {/* Center Cover Crate Cluster */}
          <CuboidCollider args={[1.2, 0.8, 1.2]} position={[-3.5, 0.8, -2.5]} />
          <mesh position={[-3.5, 0.8, -2.5]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 1.6, 2.4]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>

          <CuboidCollider args={[1.0, 0.6, 1.0]} position={[3.5, 0.6, 2.5]} />
          <mesh position={[3.5, 0.6, 2.5]} castShadow receiveShadow>
            <boxGeometry args={[2.0, 1.2, 2.0]} />
            <meshStandardMaterial color="#92400e" roughness={0.9} />
          </mesh>

          {/* Fuel / Oil Metal Barrels */}
          <CylinderCollider args={[0.5, 0.4]} position={[-5.5, 0.5, 3.5]} />
          <mesh position={[-5.5, 0.5, 3.5]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 1.0, 16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} metalness={0.4} />
          </mesh>
          <CylinderCollider args={[0.5, 0.4]} position={[-6.2, 0.5, 4.2]} />
          <mesh position={[-6.2, 0.5, 4.2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 1.0, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.4} />
          </mesh>
        </RigidBody>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE E: SHIPPING CONTAINER FLANKING MAZE (East Sector)               */}
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
              <meshStandardMaterial color={c.color} roughness={0.7} metalness={0.3} />
            </mesh>
          </RigidBody>
        ))}

        {/* Container Approach Ramp (Leading from ground to Upper Container Roof at +2.6m) */}
        <group position={[28, 1.3, -6.5]} rotation={[-Math.atan2(2.6, 7.0), 0, 0]}>
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.5, 0.1, 3.73]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.0, 0.2, 7.46]} />
              <meshStandardMaterial color="#64748b" roughness={0.7} metalness={0.4} />
            </mesh>
          </RigidBody>
        </group>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE F: ELEVATED SNIPER WATCHTOWERS (+5.2m Vantage Platform)         */}
      {/* -------------------------------------------------------------------- */}
      {/* Tower 1 (South-East: [42, 0, 42]) */}
      <group position={[42, 0, 42]}>
        <RigidBody type="fixed" colliders={false}>
          {/* 4 Steel Corner Truss Legs */}
          <CylinderCollider args={[2.6, 0.15]} position={[-2.2, 2.6, -2.2]} />
          <mesh position={[-2.2, 2.6, -2.2]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 5.2, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <CylinderCollider args={[2.6, 0.15]} position={[2.2, 2.6, -2.2]} />
          <mesh position={[2.2, 2.6, -2.2]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 5.2, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <CylinderCollider args={[2.6, 0.15]} position={[-2.2, 2.6, 2.2]} />
          <mesh position={[-2.2, 2.6, 2.2]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 5.2, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <CylinderCollider args={[2.6, 0.15]} position={[2.2, 2.6, 2.2]} />
          <mesh position={[2.2, 2.6, 2.2]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 5.2, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>

          {/* Elevated Sniper Platform (+5.2m elevation) */}
          <CuboidCollider args={[2.7, 0.125, 2.7]} position={[0, 5.2, 0]} />
          <mesh position={[0, 5.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.4, 0.25, 5.4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.5} />
          </mesh>

          {/* Chest-High Sniper Sandbag Parapet (Height: 0.9m) */}
          <CuboidCollider args={[2.6, 0.45, 0.2]} position={[0, 5.75, -2.5]} />
          <mesh position={[0, 5.75, -2.5]} castShadow receiveShadow>
            <boxGeometry args={[5.2, 0.9, 0.4]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
          <CuboidCollider args={[0.2, 0.45, 2.6]} position={[-2.5, 5.75, 0]} />
          <mesh position={[-2.5, 5.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.9, 5.2]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
          <CuboidCollider args={[0.2, 0.45, 2.6]} position={[2.5, 5.75, 0]} />
          <mesh position={[2.5, 5.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.9, 5.2]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>

          {/* Switchback Access Ramp (Leading from ground to +5.2m) */}
          <group position={[0, 2.6, -7.0]} rotation={[-Math.atan2(5.2, 9.0), 0, 0]}>
            <CuboidCollider args={[1.2, 0.1, 5.19]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.2, 10.38]} />
              <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.4} />
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
            <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.5} />
          </mesh>

          {/* Parapet */}
          <CuboidCollider args={[2.6, 0.45, 0.2]} position={[0, 5.75, 2.5]} />
          <mesh position={[0, 5.75, 2.5]} castShadow receiveShadow>
            <boxGeometry args={[5.2, 0.9, 0.4]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>
          <CuboidCollider args={[0.2, 0.45, 2.6]} position={[2.5, 5.75, 0]} />
          <mesh position={[2.5, 5.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.9, 5.2]} />
            <meshStandardMaterial color="#78502c" roughness={0.9} />
          </mesh>

          {/* Access Ramp */}
          <group position={[0, 2.6, 7.0]} rotation={[Math.atan2(5.2, 9.0), 0, 0]}>
            <CuboidCollider args={[1.2, 0.1, 5.19]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.4, 0.2, 10.38]} />
              <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.4} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* -------------------------------------------------------------------- */}
      {/* ZONE G: CONCRETE JERSEY BARRIERS NETWORK                             */}
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
            <meshStandardMaterial color="#94a3b8" roughness={0.85} />
          </mesh>
        </RigidBody>
      ))}

      {/* -------------------------------------------------------------------- */}
      {/* ZONE H: TACTICAL ARMORED VEHICLES (Heavy Cover)                      */}
      {/* -------------------------------------------------------------------- */}
      {vehicles.map((v, idx) => (
        <RigidBody key={`veh-${idx}`} type="fixed" colliders={false}>
          <CuboidCollider
            args={[3.0, 1.3, 1.4]}
            position={[v.pos[0], 1.3, v.pos[2]]}
            rotation={[0, v.rotY, 0]}
          />
          <mesh
            position={[v.pos[0], 1.3, v.pos[2]]}
            rotation={[0, v.rotY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[6.0, 2.6, 2.8]} />
            <meshStandardMaterial color={v.color} roughness={0.7} metalness={0.3} />
          </mesh>
          {/* Cab windshield glass accent */}
          <mesh
            position={[v.pos[0] + 1.8 * Math.cos(v.rotY), 1.9, v.pos[2] - 1.8 * Math.sin(v.rotY)]}
            rotation={[0, v.rotY, 0]}
          >
            <boxGeometry args={[1.6, 0.8, 2.6]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.9} />
          </mesh>
        </RigidBody>
      ))}

      {/* -------------------------------------------------------------------- */}
      {/* ZONE I: INDUSTRIAL STREET FLOODLIGHTS                                 */}
      {/* -------------------------------------------------------------------- */}
      {[
        [-20, 0, 20],
        [20, 0, -20],
        [-20, 0, -20],
        [20, 0, 20],
        [0, 0, 35],
        [0, 0, -35]
      ].map((pos, idx) => (
        <group key={`light-pole-${idx}`} position={pos as [number, number, number]}>
          <RigidBody type="fixed" colliders={false}>
            <CylinderCollider args={[3.0, 0.15]} position={[0, 3.0, 0]} />
            <mesh position={[0, 3.0, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 6.0, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            <mesh position={[0, 6.1, 0]}>
              <boxGeometry args={[0.8, 0.25, 0.8]} />
              <meshStandardMaterial color="#f8fafc" emissive="#fef08a" emissiveIntensity={0.8} />
            </mesh>
          </RigidBody>
          <pointLight color="#fef08a" intensity={1.2} distance={18} position={[0, 5.8, 0]} />
        </group>
      ))}
    </group>
  );
}

