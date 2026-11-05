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
import { loadShootingSettings, ShootingControlSettings } from "../../utils/shootingSettings";

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

  const spawnX = player.x && Math.abs(player.x) > 0.1 ? player.x : initialSpawn[0];
  const spawnZ = player.z && Math.abs(player.z) > 0.1 ? player.z : initialSpawn[2];

  // Cache initial position ONCE on mount
  const initialPos = useRef<[number, number, number]>([spawnX, initialSpawn[1], spawnZ]).current;

  const [animationState, setAnimationState] = useState<"idle" | "walk" | "run" | "jump" | "crouch" | "aim">("idle");

  // Dynamic player & room refs to decouple event listeners from state changes
  const playerRef = useRef(player);
  playerRef.current = player;
  const roomRef = useRef(room);
  roomRef.current = room;

  // Settings
  const settingsRef = useRef<ShootingControlSettings>(loadShootingSettings());

  // GTA-Style Third-Person Spherical Orbit Camera State
  // Initialize camera yaw to point towards arena center [0, 0, 0]
  const cameraYaw = useRef(Math.atan2(spawnX, spawnZ));
  const cameraPitch = useRef(0.20);
  const cameraDistance = useRef(6.2);
  const isPointerLocked = useRef(false);

  // Recoil recovery offset
  const recoilPitchOffset = useRef(0);

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
    crouch: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    crouch: false
  });

  // Network sync throttler (20 Hz = 50ms interval)
  const lastSyncTime = useRef(0);

  useEffect(() => {
    const handleAdsEvent = (e: any) => {
      if (typeof e.detail?.isAiming === "boolean") {
        isAiming.current = e.detail.isAiming;
      }
    };
    window.addEventListener("shooting:ads", handleAdsEvent);

    const handleSettingsUpdated = () => {
      settingsRef.current = loadShootingSettings();
    };
    window.addEventListener("shooting:settings_updated", handleSettingsUpdated);

    const resetAllInputs = () => {
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.sprint = false;
      keys.current.jump = false;
      keys.current.crouch = false;
      isFiring.current = false;
      if (isAiming.current) {
        isAiming.current = false;
        window.dispatchEvent(new CustomEvent("shooting:ads", { detail: { isAiming: false } }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing in chat/input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const bindings = settingsRef.current.keyBindings;

      // Weapon Loadout Quick-Select: 1, 2, 3, 4, 5
      const weaponSlots: Record<string, WeaponId> = {
        Digit1: WeaponId.ASSAULT_RIFLE,
        Digit2: WeaponId.SHOTGUN,
        Digit3: WeaponId.SNIPER_RIFLE,
        Digit4: WeaponId.SMG,
        Digit5: WeaponId.PISTOL
      };

      if (weaponSlots[e.code]) {
        const targetWeapon = weaponSlots[e.code];
        // Allow switching weapon loadout if dead or in lobby
        const p = playerRef.current;
        if (!p.isAlive || roomRef.current.state.status === "LOBBY") {
          combatAudio.playWeaponSwitch();
          roomRef.current.send(ClientMessageType.SHOOTING_SELECT_LOADOUT, { weaponId: targetWeapon });
        }
        return;
      }

      // Movement & Actions
      if (e.code === bindings.forward || e.code === "KeyW" || e.code === "ArrowUp") {
        keys.current.forward = true;
      } else if (e.code === bindings.backward || e.code === "KeyS" || e.code === "ArrowDown") {
        keys.current.backward = true;
      } else if (e.code === bindings.left || e.code === "KeyA" || e.code === "ArrowLeft") {
        keys.current.left = true;
      } else if (e.code === bindings.right || e.code === "KeyD" || e.code === "ArrowRight") {
        keys.current.right = true;
      } else if (e.code === bindings.sprint || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        keys.current.sprint = true;
      } else if (e.code === bindings.crouch || e.code === "ControlLeft" || e.code === "ControlRight" || e.code === "KeyC") {
        keys.current.crouch = true;
      } else if (e.code === bindings.jump || e.code === "Space") {
        if (canJump.current && !isJumping.current) {
          isJumping.current = true;
          canJump.current = false;
          combatAudio.playJump();
          setTimeout(() => {
            isJumping.current = false;
          }, 350);
          setTimeout(() => {
            canJump.current = true;
          }, 600);
        }
      } else if (e.code === bindings.reload || e.code === "KeyR") {
        const p = playerRef.current;
        const curW = WEAPONS_CATALOG[p.weaponId as WeaponId] || WEAPONS_CATALOG[WeaponId.ASSAULT_RIFLE];
        if (p.isAlive && !p.isReloading && p.ammo < curW.magazineCapacity && p.reserveAmmo > 0) {
          combatAudio.playReload();
          roomRef.current.send(ClientMessageType.SHOOTING_RELOAD);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const bindings = settingsRef.current.keyBindings;

      if (e.code === bindings.forward || e.code === "KeyW" || e.code === "ArrowUp") {
        keys.current.forward = false;
      } else if (e.code === bindings.backward || e.code === "KeyS" || e.code === "ArrowDown") {
        keys.current.backward = false;
      } else if (e.code === bindings.left || e.code === "KeyA" || e.code === "ArrowLeft") {
        keys.current.left = false;
      } else if (e.code === bindings.right || e.code === "KeyD" || e.code === "ArrowRight") {
        keys.current.right = false;
      } else if (e.code === bindings.sprint || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        keys.current.sprint = false;
      } else if (e.code === bindings.crouch || e.code === "ControlLeft" || e.code === "ControlRight" || e.code === "KeyC") {
        keys.current.crouch = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;

      const s = settingsRef.current;
      let sens = s.mouseSensitivity;
      if (isAiming.current) {
        sens *= playerRef.current.weaponId === WeaponId.SNIPER_RIFLE
          ? s.scopedSensitivityMultiplier
          : s.aimSensitivityMultiplier;
      }

      cameraYaw.current -= e.movementX * sens;
      const pitchDelta = (s.invertY ? -1 : 1) * e.movementY * sens;
      cameraPitch.current = Math.max(-0.35, Math.min(1.15, cameraPitch.current + pitchDelta));
    };

    const handleWheel = (e: WheelEvent) => {
      cameraDistance.current = Math.max(3.0, Math.min(12.0, cameraDistance.current + e.deltaY * 0.005));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (document.querySelector("[data-no-pointer-lock]")) {
        return;
      }

      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.closest("button") || target.tagName === "INPUT" || target.closest("[data-no-pointer-lock]")) {
        return;
      }

      if (!isPointerLocked.current) {
        if (document.body.requestPointerLock) {
          document.body.requestPointerLock();
        }
        return;
      }

      const isLeftHanded = settingsRef.current.isLeftHandedPreset;
      const fireButton = isLeftHanded ? 2 : 0;
      const aimButton = isLeftHanded ? 0 : 2;

      if (e.button === fireButton) {
        const p = playerRef.current;
        if (p.ammo <= 0 && p.isAlive && !p.isReloading) {
          combatAudio.playDryFire();
        }
        isFiring.current = true;
      } else if (e.button === aimButton) {
        isAiming.current = true;
        window.dispatchEvent(new CustomEvent("shooting:ads", { detail: { isAiming: true } }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const isLeftHanded = settingsRef.current.isLeftHandedPreset;
      const fireButton = isLeftHanded ? 2 : 0;
      const aimButton = isLeftHanded ? 0 : 2;

      if (e.button === fireButton) {
        isFiring.current = false;
      } else if (e.button === aimButton) {
        isAiming.current = false;
        window.dispatchEvent(new CustomEvent("shooting:ads", { detail: { isAiming: false } }));
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement !== null;
      if (!isPointerLocked.current) {
        resetAllInputs();
      }
    };

    const handleBlur = () => {
      resetAllInputs();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        resetAllInputs();
      }
    };

    // Respawn position listener
    room.onMessage(
      ServerMessageType.SHOOTING_PLAYER_RESPAWNED,
      (payload: { playerId: string; x: number; y: number; z: number }) => {
        if (payload.playerId === playerRef.current.id) {
          combatAudio.playRespawn();
          const rb = rigidBodyRef.current;
          if (rb) {
            rb.setTranslation({ x: payload.x, y: payload.y, z: payload.z }, true);
            rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
          }
          if (focusTarget.current) {
            focusTarget.current.set(payload.x, payload.y + 0.95, payload.z);
          }
          // Face toward map center
          cameraYaw.current = Math.atan2(payload.x, payload.z);
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
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", resetAllInputs);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      window.removeEventListener("shooting:ads", handleAdsEvent);
      window.removeEventListener("shooting:settings_updated", handleSettingsUpdated);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", resetAllInputs);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, [room]);

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
    let speed = 5.0;
    if (keys.current.crouch) {
      speed = 2.8;
    } else if (keys.current.sprint) {
      speed = 8.5;
    } else if (isAiming.current) {
      speed = 3.6;
    }

    let targetVelX = 0;
    let targetVelZ = 0;
    const heading = cameraYaw.current;

    // Movement is disabled when dead
    if (isMoving && player.isAlive) {
      const forwardX = -Math.sin(heading);
      const forwardZ = -Math.cos(heading);
      const rightX = Math.cos(heading);
      const rightZ = -Math.sin(heading);

      let dirX = forwardX * moveZ + rightX * moveX;
      let dirZ = forwardZ * moveZ + rightZ * moveX;
      const length = Math.hypot(dirX, dirZ);
      if (length > 0.0001) {
        dirX /= length;
        dirZ /= length;
      }
      targetVelX = dirX * speed;
      targetVelZ = dirZ * speed;
    }

    // Clear ADS if eliminated
    if (!player.isAlive && isAiming.current) {
      isAiming.current = false;
      window.dispatchEvent(new CustomEvent("shooting:ads", { detail: { isAiming: false } }));
    }

    // -------------------------------------------------------------------------
    // 4. VERTICAL VELOCITY & GROUND SNAPPING
    // -------------------------------------------------------------------------
    let targetVelY = currentVel.y;

    if (isJumping.current && isGrounded && player.isAlive) {
      targetVelY = 7.0;
    } else if (stepClimbingAssist && player.isAlive) {
      targetVelY = 2.8;
    } else if (isGrounded && !isJumping.current) {
      if (clearance > 0.02 && clearance <= 0.14) {
        targetVelY = -clearance * 18;
      } else {
        targetVelY = 0;
      }
    } else {
      targetVelY = Math.max(-28, currentVel.y - 18 * delta);
    }

    rb.setLinvel({ x: targetVelX, y: targetVelY, z: targetVelZ }, true);

    // Dynamic Character Avatar Facing Rotation & Scoped Visibility
    if (avatarGroupRef.current) {
      const isSniperAiming = isAiming.current && player.weaponId === WeaponId.SNIPER_RIFLE;
      avatarGroupRef.current.visible = !isSniperAiming;

      if (player.isAlive) {
        if (isAiming.current) {
          // Face camera aim forward direction
          avatarGroupRef.current.rotation.y = heading + Math.PI;
        } else if (isMoving) {
          const moveAngle = Math.atan2(targetVelX, targetVelZ);
          avatarGroupRef.current.rotation.y = moveAngle;
        }
      }
    }

    // -------------------------------------------------------------------------
    // 5. ANIMATION STATE MACHINE
    // -------------------------------------------------------------------------
    let newAnim: "idle" | "walk" | "run" | "jump" | "crouch" | "aim" = "idle";
    if (!player.isAlive) {
      newAnim = "idle";
    } else if (isJumping.current || (!isGrounded && clearance > 0.35)) {
      newAnim = "jump";
    } else if (keys.current.crouch) {
      newAnim = "crouch";
    } else if (isAiming.current) {
      newAnim = "aim";
    } else if (isMoving) {
      newAnim = keys.current.sprint ? "run" : "walk";
    }
    if (newAnim !== animationState) {
      setAnimationState(newAnim);
    }

    // -------------------------------------------------------------------------
    // 6. THIRD-PERSON SPHERICAL ORBIT CAMERA & ADS ZOOM
    // -------------------------------------------------------------------------
    const isSniperAiming = isAiming.current && player.weaponId === WeaponId.SNIPER_RIFLE;
    const targetDistance = isAiming.current
      ? (isSniperAiming ? 0.05 : 3.4)
      : (!player.isAlive ? 5.0 : 6.2);
    cameraDistance.current = THREE.MathUtils.lerp(cameraDistance.current, targetDistance, delta * 14);

    // Recoil recovery decay
    recoilPitchOffset.current = THREE.MathUtils.lerp(recoilPitchOffset.current, 0, delta * 14);

    const targetHeight = !player.isAlive
      ? 0.35
      : (keys.current.crouch ? 0.55 : (isSniperAiming ? 1.55 : 0.95));
    if (!focusTarget.current) {
      focusTarget.current = new THREE.Vector3(currentPos.x, currentPos.y + targetHeight, currentPos.z);
    } else {
      focusTarget.current.x = THREE.MathUtils.lerp(focusTarget.current.x, currentPos.x, delta * 14);
      focusTarget.current.y = THREE.MathUtils.lerp(focusTarget.current.y, currentPos.y + targetHeight, delta * 12);
      focusTarget.current.z = THREE.MathUtils.lerp(focusTarget.current.z, currentPos.z, delta * 14);
    }

    const yaw = cameraYaw.current;
    const pitch = cameraPitch.current + recoilPitchOffset.current;
    const dist = cameraDistance.current;

    // Lateral shoulder offset when ADS for tactical over-the-shoulder perspective (0 for sniper optic)
    const shoulderOffset = isAiming.current ? (isSniperAiming ? 0.0 : 0.45) : 0.0;
    const rightX = Math.cos(yaw) * shoulderOffset;
    const rightZ = -Math.sin(yaw) * shoulderOffset;

    const camX = focusTarget.current.x + dist * Math.sin(yaw) * Math.cos(pitch) + rightX;
    const camY = focusTarget.current.y + dist * Math.sin(pitch);
    const camZ = focusTarget.current.z + dist * Math.cos(yaw) * Math.cos(pitch) + rightZ;

    state.camera.position.set(camX, Math.max(focusTarget.current.y + 0.3, camY), camZ);
    state.camera.lookAt(focusTarget.current.x + rightX * 0.5, focusTarget.current.y, focusTarget.current.z + rightZ * 0.5);

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

    // 2. Realistic Camera Recoil Kick & Spread
    const recoilKick = currentWeapon.recoilIntensity * 0.18;
    recoilPitchOffset.current = Math.min(0.25, recoilPitchOffset.current + recoilKick);
    cameraYaw.current += (Math.random() - 0.5) * currentWeapon.spreadAngleRad * 0.25;

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

          // Multi-region hierarchical hitbox
          if (h >= 1.45) {
            bestRegion = HitRegion.HEAD;
          } else if (h >= 1.05) {
            bestRegion = HitRegion.UPPER_TORSO;
          } else if (h >= 0.75) {
            bestRegion = HitRegion.ABDOMEN;
          } else if (distH > 0.28 && h >= 0.75) {
            bestRegion = HitRegion.ARMS;
          } else {
            bestRegion = HitRegion.LEGS;
          }
        }
      }
    });

    // 6. Send authoritative fire message to Colyseus server
    room.send(ClientMessageType.SHOOTING_FIRE, {
      weaponId: currentWeapon.id,
      timestamp: Date.now(),
      targetPlayerId: bestTargetId,
      hitRegion: bestTargetId ? bestRegion : undefined,
      hitPoint: bestHitPoint,
      camX: camPos.x,
      camY: camPos.y,
      camZ: camPos.z,
      dirX: camDir.x,
      dirY: camDir.y,
      dirZ: camDir.z
    });
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      position={initialPos}
      enabledRotations={[false, false, false]}
      linearDamping={4.0}
      mass={75}
      type="dynamic"
    >
      {/* Physics Capsule matching human dimensions: R=0.35m, H=1.1m (total 1.8m) */}
      <CapsuleCollider args={[0.55, 0.35]} position={[0, 0.9, 0]} />

      {/* Visual Avatar Mesh Group */}
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
          isReloading={player.isReloading}
        />
      </group>
    </RigidBody>
  );
}
