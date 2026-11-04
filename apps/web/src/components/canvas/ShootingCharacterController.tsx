"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { Room } from "colyseus.js";
import {
  ClientMessageType,
  ServerMessageType,
  ShootingRoomState,
  ShootingPlayerState,
  WeaponId,
  WEAPONS_CATALOG,
  WeaponConfig,
  HitRegion
} from "@mafia/shared";
import { ShootingCharacterAvatar } from "./ShootingCharacterAvatar";
import { combatAudio } from "../../utils/combatAudio";

interface ShootingCharacterControllerProps {
  room: Room<ShootingRoomState>;
  player: ShootingPlayerState;
  isHost?: boolean;
}

export function ShootingCharacterController({
  room,
  player,
  isHost = false
}: ShootingCharacterControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const avatarGroupRef = useRef<THREE.Group>(null);
  const { rapier, world } = useRapier();

  // Team spawn coordinates
  const teamSpawns: Record<string, [number, number, number]> = {
    "team-red": [50, 0.4, -50],
    "team-blue": [-50, 0.4, 50],
    "team-green": [-50, 0.4, -50]
  };

  const initialSpawn = teamSpawns[player.teamId] || [0, 0.4, 0];

  // Cache initial position ONCE on mount to prevent Rapier from snapping on state updates
  const initialPos = useRef<[number, number, number]>([
    player.x && Math.abs(player.x) > 0.1 ? player.x : initialSpawn[0],
    initialSpawn[1],
    player.z && Math.abs(player.z) > 0.1 ? player.z : initialSpawn[2]
  ]).current;

  const [animationState, setAnimationState] = useState<"idle" | "walk" | "run" | "jump">("idle");

  // GTA-Style Third-Person Spherical Orbit Camera State
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0.22);
  const cameraDistance = useRef(6.5);
  const isPointerLocked = useRef(false);

  // Combat State
  const isFiring = useRef(false);
  const isAiming = useRef(false);
  const lastLocalFireTime = useRef(0);

  // Jump and Grounding State
  const isJumping = useRef(false);
  const canJump = useRef(true);

  // Camera Focus Target
  const focusTarget = useRef<THREE.Vector3 | null>(null);

  // Keyboard state
  const keys = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    sprint: boolean;
    jump: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
  });

  // Network sync throttler (20 Hz = 50ms interval)
  const lastSyncTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing in chat/input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = true;
          break;
        case "Space":
          e.preventDefault();
          if (canJump.current && !isJumping.current) {
            keys.current.jump = true;
            combatAudio.playJump();
          }
          break;
        case "KeyR":
          if (player.isAlive && !player.isReloading && player.ammo < player.maxAmmo && player.reserveAmmo > 0) {
            room.send(ClientMessageType.SHOOTING_RELOAD, {});
            combatAudio.playReload();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = false;
          break;
        case "Space":
          keys.current.jump = false;
          break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      const sensitivity = isAiming.current
        ? (player.weaponId === WeaponId.SNIPER_RIFLE ? 0.0008 : 0.0012)
        : 0.0022;
      cameraYaw.current -= e.movementX * sensitivity;
      cameraPitch.current = Math.max(-0.2, Math.min(1.2, cameraPitch.current + e.movementY * sensitivity));
    };

    const handleWheel = (e: WheelEvent) => {
      cameraDistance.current = Math.max(3.0, Math.min(12.0, cameraDistance.current + e.deltaY * 0.005));
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.closest("button") || target.tagName === "INPUT") {
        return;
      }

      if (!isPointerLocked.current) {
        if (document.body.requestPointerLock) {
          document.body.requestPointerLock();
        }
        return;
      }

      if (e.button === 0) {
        if (player.ammo <= 0 && player.isAlive && !player.isReloading) {
          combatAudio.playDryFire();
        }
        isFiring.current = true;
      } else if (e.button === 2) {
        isAiming.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isFiring.current = false;
      } else if (e.button === 2) {
        isAiming.current = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === document.body;
      if (!isPointerLocked.current) {
        isFiring.current = false;
        isAiming.current = false;
      }
    };

    // Respawn position listener
    room.onMessage(
      ServerMessageType.SHOOTING_PLAYER_RESPAWNED,
      (payload: { playerId: string; x: number; y: number; z: number }) => {
        if (payload.playerId === player.id) {
          const rb = rigidBodyRef.current;
          if (rb) {
            rb.setTranslation({ x: payload.x, y: payload.y, z: payload.z }, true);
            rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
          }
          if (focusTarget.current) {
            focusTarget.current.set(payload.x, payload.y + 0.95, payload.z);
          }
        }
      }
    );

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, [player.id, player.isAlive, player.isReloading, player.ammo, player.maxAmmo, player.reserveAmmo, player.weaponId, room]);

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const currentPos = rb.translation();
    const currentVel = rb.linvel();

    // -------------------------------------------------------------------------
    // 1. HIGH-FIDELITY GROUND DETECTION & CLEARANCE EVALUATION
    // -------------------------------------------------------------------------
    const rayOrigin = new rapier.Vector3(currentPos.x, currentPos.y + 0.40, currentPos.z);
    const rayDir = new rapier.Vector3(0, -1, 0);
    const maxRayDist = 1.35;
    const ray = new rapier.Ray(rayOrigin, rayDir);

    const hit = world.castRay(
      ray,
      maxRayDist,
      true,
      undefined,
      undefined,
      undefined,
      rb
    );

    const isHit = hit !== null && hit.timeOfImpact !== undefined;
    const hitDistance = isHit ? hit.timeOfImpact : Infinity;
    const clearance = hitDistance - 0.40;
    const isGrounded = isHit && clearance <= 0.14;

    // -------------------------------------------------------------------------
    // 2. FORWARD STEP-CLIMBING ASSISTANCE FOR RAMPS & CURBS
    // -------------------------------------------------------------------------
    const moveZ = (keys.current.forward ? 1 : 0) - (keys.current.backward ? 1 : 0);
    const moveX = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
    const isMoving = moveX !== 0 || moveZ !== 0;

    let stepClimbingAssist = false;

    if (isMoving && !isJumping.current) {
      const heading = cameraYaw.current;
      const forwardX = -Math.sin(heading);
      const forwardZ = -Math.cos(heading);
      const rightX = Math.cos(heading);
      const rightZ = -Math.sin(heading);

      let dirX = forwardX * moveZ + rightX * moveX;
      let dirZ = forwardZ * moveZ + rightZ * moveX;
      const len = Math.hypot(dirX, dirZ);
      if (len > 0.001) {
        dirX /= len;
        dirZ /= len;

        // Foot probe ray (y + 0.08m)
        const footRayOrigin = new rapier.Vector3(currentPos.x, currentPos.y + 0.08, currentPos.z);
        const probeDir = new rapier.Vector3(dirX, 0, dirZ);
        const footRay = new rapier.Ray(footRayOrigin, probeDir);
        const footHit = world.castRay(footRay, 0.72, true, undefined, undefined, undefined, rb);

        if (footHit && footHit.timeOfImpact < 0.65) {
          // Waist clearance probe ray (y + 0.42m)
          const waistRayOrigin = new rapier.Vector3(currentPos.x, currentPos.y + 0.42, currentPos.z);
          const waistRay = new rapier.Ray(waistRayOrigin, probeDir);
          const waistHit = world.castRay(waistRay, 0.72, true, undefined, undefined, undefined, rb);

          // Clear space above low curb/step -> apply smooth upward lift
          if (!waistHit || waistHit.timeOfImpact > footHit.timeOfImpact + 0.18) {
            stepClimbingAssist = true;
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3. HORIZONTAL MOVEMENT (Decoupled from Pitch)
    // -------------------------------------------------------------------------
    const moveSpeed = keys.current.sprint ? 8.8 : 5.0;
    let targetVelX = 0;
    let targetVelZ = 0;

    if (isMoving) {
      const heading = cameraYaw.current;
      const forwardX = -Math.sin(heading);
      const forwardZ = -Math.cos(heading);
      const rightX = Math.cos(heading);
      const rightZ = -Math.sin(heading);

      let vx = forwardX * moveZ + rightX * moveX;
      let vz = forwardZ * moveZ + rightZ * moveX;
      const len = Math.hypot(vx, vz);
      if (len > 0.001) {
        vx /= len;
        vz /= len;
      }

      targetVelX = vx * moveSpeed;
      targetVelZ = vz * moveSpeed;

      // Face character mesh in movement direction
      const targetRotationY = Math.atan2(vx, vz);
      if (avatarGroupRef.current) {
        const curRot = avatarGroupRef.current.rotation.y;
        let diff = targetRotationY - curRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        avatarGroupRef.current.rotation.y += diff * Math.min(1, delta * 16);
      }
    }

    // -------------------------------------------------------------------------
    // 4. VERTICAL VELOCITY & JUMP LOGIC
    // -------------------------------------------------------------------------
    let nextVelY = currentVel.y;

    if (keys.current.jump && isGrounded && canJump.current) {
      nextVelY = 7.4; // Crisp vertical launch
      isJumping.current = true;
      canJump.current = false;
      keys.current.jump = false;
      setTimeout(() => {
        canJump.current = true;
      }, 350);
    } else if (stepClimbingAssist) {
      nextVelY = 2.8; // Forward step climb assist
    } else if (isGrounded && !isJumping.current) {
      nextVelY = -0.6; // Clamp to ground, suppressing sprint hops
    } else if (!isGrounded && !isJumping.current && clearance > 0.14 && clearance <= 0.45) {
      nextVelY = -3.2; // Snap down onto descending stairs/slopes
    }

    if (isJumping.current && isGrounded && nextVelY <= 0) {
      isJumping.current = false;
    }

    rb.setLinvel({ x: targetVelX, y: nextVelY, z: targetVelZ }, true);

    // -------------------------------------------------------------------------
    // 5. ANIMATION STATE MACHINE
    // -------------------------------------------------------------------------
    let newAnim: "idle" | "walk" | "run" | "jump" = "idle";
    if (isJumping.current || (!isGrounded && clearance > 0.35)) {
      newAnim = "jump";
    } else if (isMoving) {
      newAnim = keys.current.sprint ? "run" : "walk";
    }
    if (newAnim !== animationState) {
      setAnimationState(newAnim);
    }

    // -------------------------------------------------------------------------
    // 6. THIRD-PERSON SPHERICAL ORBIT CAMERA & ADS ZOOM
    // -------------------------------------------------------------------------
    const targetDistance = isAiming.current
      ? (player.weaponId === WeaponId.SNIPER_RIFLE ? 2.2 : 3.6)
      : 6.2;
    cameraDistance.current = THREE.MathUtils.lerp(cameraDistance.current, targetDistance, delta * 12);

    if (!focusTarget.current) {
      focusTarget.current = new THREE.Vector3(currentPos.x, currentPos.y + 0.95, currentPos.z);
    } else {
      focusTarget.current.x = THREE.MathUtils.lerp(focusTarget.current.x, currentPos.x, delta * 14);
      focusTarget.current.y = THREE.MathUtils.lerp(focusTarget.current.y, currentPos.y + 0.95, delta * 10);
      focusTarget.current.z = THREE.MathUtils.lerp(focusTarget.current.z, currentPos.z, delta * 14);
    }

    const yaw = cameraYaw.current;
    const pitch = cameraPitch.current;
    const dist = cameraDistance.current;

    const camX = focusTarget.current.x + dist * Math.sin(yaw) * Math.cos(pitch);
    const camY = focusTarget.current.y + dist * Math.sin(pitch);
    const camZ = focusTarget.current.z + dist * Math.cos(yaw) * Math.cos(pitch);

    state.camera.position.set(camX, Math.max(focusTarget.current.y + 0.4, camY), camZ);
    state.camera.lookAt(focusTarget.current);

    // -------------------------------------------------------------------------
    // 7. WEAPON FIRING LOOP (Automatic & Semi-Automatic)
    // -------------------------------------------------------------------------
    const currentWeapon = WEAPONS_CATALOG[player.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
    if (isFiring.current && player.isAlive && !player.isReloading && player.ammo > 0 && room.state.status === "ACTIVE") {
      const nowMs = Date.now();
      if (nowMs - lastLocalFireTime.current >= currentWeapon.fireIntervalMs * 0.95) {
        lastLocalFireTime.current = nowMs;
        fireWeapon(state.camera, currentPos, currentWeapon);
      }
    }

    // -------------------------------------------------------------------------
    // 8. NETWORK INPUT DISPATCH (20 Hz)
    // -------------------------------------------------------------------------
    const now = Date.now();
    if (now - lastSyncTime.current >= 50) {
      lastSyncTime.current = now;
      const rotY = avatarGroupRef.current ? avatarGroupRef.current.rotation.y : 0;
      room.send(ClientMessageType.PLAYER_INPUT, {
        x: currentPos.x,
        y: currentPos.y,
        z: currentPos.z,
        rotationY: rotY,
        animationState: newAnim
      });
    }
  });

  const fireWeapon = (
    camera: THREE.Camera,
    currentPos: { x: number; y: number; z: number },
    currentWeapon: WeaponConfig
  ) => {
    // 1. Procedural gunshot audio
    combatAudio.playGunshot(currentWeapon.soundType);

    // 2. Camera recoil & spread kick
    cameraPitch.current = Math.min(1.2, cameraPitch.current + currentWeapon.recoilIntensity * 0.22);
    cameraYaw.current += (Math.random() - 0.5) * currentWeapon.spreadAngleRad * 0.4;

    // 3. Camera forward ray
    const camPos = camera.position;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    // 4. Test line-of-sight obstacle distance using Rapier world
    const rb = rigidBodyRef.current;
    const rapierOrigin = new rapier.Vector3(camPos.x, camPos.y, camPos.z);
    const rapierDir = new rapier.Vector3(camDir.x, camDir.y, camDir.z);
    const maxRange = currentWeapon.effectiveRangeM * 1.25;
    const rapierRay = new rapier.Ray(rapierOrigin, rapierDir);
    const worldHit = world.castRay(rapierRay, maxRange, true, undefined, undefined, undefined, rb || undefined);
    const obstacleDist = worldHit && worldHit.timeOfImpact ? worldHit.timeOfImpact : Infinity;

    // 5. Test player intersection
    let bestTargetId: string | undefined = undefined;
    let bestRegion: HitRegion = HitRegion.UPPER_TORSO;
    let bestHitPoint: { x: number; y: number; z: number } | undefined = undefined;
    let minT = Infinity;

    room.state.players.forEach((otherPlayer, otherSessionId) => {
      if (otherSessionId === player.id || !otherPlayer.isAlive) return;
      if (!room.state.config.friendlyFire && otherPlayer.teamId === player.teamId) return;

      const px = otherPlayer.x;
      const py = otherPlayer.y;
      const pz = otherPlayer.z;

      const vx = px - camPos.x;
      const vy = py + 0.9 - camPos.y;
      const vz = pz - camPos.z;

      const t = vx * camDir.x + vy * camDir.y + vz * camDir.z;
      if (t < 0.5 || t > maxRange || t >= obstacleDist) return;

      // Point on ray at distance t
      const qx = camPos.x + t * camDir.x;
      const qy = camPos.y + t * camDir.y;
      const qz = camPos.z + t * camDir.z;

      // Distance to player vertical axis
      const dx = qx - px;
      const dz = qz - pz;
      const distH = Math.hypot(dx, dz);
      const h = qy - py;

      if (distH <= 0.48 && h >= 0 && h <= 1.85) {
        if (t < minT) {
          minT = t;
          bestTargetId = otherPlayer.id;
          bestHitPoint = { x: qx, y: qy, z: qz };
          if (h >= 1.40) {
            bestRegion = HitRegion.HEAD;
          } else if (h >= 0.95) {
            bestRegion = HitRegion.UPPER_TORSO;
          } else if (h >= 0.70) {
            bestRegion = HitRegion.ABDOMEN;
          } else {
            bestRegion = HitRegion.LEGS;
          }
        }
      }
    });

    // 6. Send SHOOTING_FIRE
    room.send(ClientMessageType.SHOOTING_FIRE, {
      origin: { x: currentPos.x, y: currentPos.y + 1.2, z: currentPos.z },
      direction: { x: camDir.x, y: camDir.y, z: camDir.z },
      targetPlayerId: bestTargetId,
      hitRegion: bestTargetId ? bestRegion : undefined,
      hitPoint: bestHitPoint,
      clientTimestamp: Date.now()
    });
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      type="dynamic"
      position={initialPos}
      enabledRotations={[false, false, false]}
      friction={0}
      restitution={0}
      linearDamping={0.4}
      ccd={true}
    >
      {/* Dynamic Player Capsule Collider */}
      <CapsuleCollider args={[0.55, 0.35]} position={[0, 0.9, 0]} />

      <group ref={avatarGroupRef}>
        <ShootingCharacterAvatar
          displayName={player.displayName}
          teamId={player.teamId}
          weaponId={player.weaponId}
          isLocal={true}
          isAlive={player.isAlive}
          health={player.health}
          maxHealth={player.maxHealth}
          animationState={animationState}
        />
      </group>
    </RigidBody>
  );
}

