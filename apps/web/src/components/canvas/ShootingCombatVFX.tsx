"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Room } from "colyseus.js";
import {
  ServerMessageType,
  ShootingRoomState,
  ShootingMuzzleFlashPayload,
  ShootingHitEventPayload
} from "@mafia/shared";
import { combatAudio } from "../../utils/combatAudio";

interface Tracer {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  createdAt: number;
  durationMs: number;
}

interface MuzzleFlash {
  id: string;
  position: THREE.Vector3;
  createdAt: number;
}

interface FloatingDamage {
  id: string;
  position: THREE.Vector3;
  damage: number;
  isHeadshot: boolean;
  createdAt: number;
}

interface ImpactSpark {
  id: string;
  position: THREE.Vector3;
  createdAt: number;
}

interface ShootingCombatVFXProps {
  room: Room<ShootingRoomState>;
  localSessionId: string;
}

export function ShootingCombatVFX({ room, localSessionId }: ShootingCombatVFXProps) {
  const [tracers, setTracers] = useState<Tracer[]>([]);
  const [flashes, setFlashes] = useState<MuzzleFlash[]>([]);
  const [damages, setDamages] = useState<FloatingDamage[]>([]);
  const [sparks, setSparks] = useState<ImpactSpark[]>([]);

  useEffect(() => {
    // 1. Muzzle Flash & Tracer Event Handler
    const handleMuzzleFlash = (payload: ShootingMuzzleFlashPayload) => {
      const now = Date.now();
      const origin = new THREE.Vector3(payload.origin.x, payload.origin.y, payload.origin.z);
      const dir = new THREE.Vector3(payload.direction.x, payload.direction.y, payload.direction.z).normalize();
      const end = origin.clone().add(dir.clone().multiplyScalar(45));

      // Add Muzzle Flash light
      const flashId = `flash-${now}-${Math.random()}`;
      setFlashes((prev) => [...prev.slice(-10), { id: flashId, position: origin, createdAt: now }]);

      // Add Tracer line
      const tracerId = `tracer-${now}-${Math.random()}`;
      setTracers((prev) => [
        ...prev.slice(-15),
        { id: tracerId, start: origin, end, createdAt: now, durationMs: 140 }
      ]);
    };

    // 2. Hit Event & Floating Damage Indicator
    const handleHitEvent = (payload: ShootingHitEventPayload) => {
      const now = Date.now();
      const victim = room.state.players.get(payload.victimId);

      if (victim) {
        const victimPos = new THREE.Vector3(victim.x, victim.y + 1.8, victim.z);
        const damageId = `dmg-${now}-${Math.random()}`;

        setDamages((prev) => [
          ...prev.slice(-12),
          {
            id: damageId,
            position: victimPos,
            damage: payload.damage,
            isHeadshot: payload.isHeadshot,
            createdAt: now
          }
        ]);

        // Spark impact effect
        const sparkId = `spark-${now}-${Math.random()}`;
        setSparks((prev) => [...prev.slice(-10), { id: sparkId, position: victimPos, createdAt: now }]);
        combatAudio.playImpact();
      }
    };

    room.onMessage(ServerMessageType.SHOOTING_MUZZLE_FLASH, handleMuzzleFlash);
    room.onMessage(ServerMessageType.SHOOTING_HIT_EVENT, handleHitEvent);

    return () => {
      // Clean up handlers if room is active
    };
  }, [room]);

  // Frame tick to cull expired visual effects
  useFrame(() => {
    const now = Date.now();

    // Cull flashes after 70ms
    setFlashes((prev) => {
      const active = prev.filter((f) => now - f.createdAt < 70);
      return active.length !== prev.length ? active : prev;
    });

    // Cull tracers after their duration
    setTracers((prev) => {
      const active = prev.filter((t) => now - t.createdAt < t.durationMs);
      return active.length !== prev.length ? active : prev;
    });

    // Cull damages after 900ms
    setDamages((prev) => {
      const active = prev.filter((d) => now - d.createdAt < 900);
      return active.length !== prev.length ? active : prev;
    });

    // Cull sparks after 150ms
    setSparks((prev) => {
      const active = prev.filter((s) => now - s.createdAt < 150);
      return active.length !== prev.length ? active : prev;
    });
  });

  return (
    <group>
      {/* 1. Dynamic Muzzle Flash Point Lights */}
      {flashes.map((flash) => (
        <group key={flash.id} position={flash.position}>
          <pointLight color="#fbbf24" intensity={8.0} distance={8} decay={2} />
          <mesh>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* 2. High-Velocity Luminous Bullet Tracers */}
      {tracers.map((tracer) => {
        const midPoint = tracer.start.clone().add(tracer.end).multiplyScalar(0.5);
        const dist = tracer.start.distanceTo(tracer.end);
        const dir = tracer.end.clone().sub(tracer.start).normalize();
        const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        return (
          <mesh key={tracer.id} position={midPoint} quaternion={orientation}>
            <cylinderGeometry args={[0.025, 0.025, dist, 4]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.85} />
          </mesh>
        );
      })}

      {/* 3. Surface / Character Bullet Impact Sparks */}
      {sparks.map((spark) => (
        <group key={spark.id} position={spark.position}>
          <pointLight color="#ef4444" intensity={4.0} distance={5} />
          <mesh>
            <sphereGeometry args={[0.22, 6, 6]} />
            <meshBasicMaterial color="#fca5a5" />
          </mesh>
        </group>
      ))}

      {/* 4. Floating 3D Damage Indicator Numbers */}
      {damages.map((dmg) => {
        const elapsed = (Date.now() - dmg.createdAt) / 1000;
        const yOffset = elapsed * 1.4;
        const opacity = Math.max(0, 1 - elapsed / 0.9);

        return (
          <Html
            key={dmg.id}
            position={[dmg.position.x, dmg.position.y + yOffset, dmg.position.z]}
            center
            zIndexRange={[100, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              className={`font-black text-sm tracking-wider select-none px-1.5 py-0.5 rounded shadow-lg transition-opacity duration-75 ${
                dmg.isHeadshot
                  ? "bg-red-600/90 text-yellow-300 ring-2 ring-yellow-400 scale-110"
                  : "bg-slate-900/80 text-white"
              }`}
              style={{ opacity }}
            >
              {dmg.isHeadshot ? `💥 -${dmg.damage} HEAD` : `-${dmg.damage}`}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

