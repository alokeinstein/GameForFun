"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { Room } from "colyseus.js";
import { ClientMessageType, MafiaRoomState, PlayerState } from "@mafia/shared";
import { CharacterAvatar } from "./CharacterAvatar";
import { voiceChatService } from "../../services/webrtc";

interface CharacterControllerProps {
  room: Room<MafiaRoomState>;
  player: PlayerState;
  isHost?: boolean;
}

export function CharacterController({ room, player, isHost = false }: CharacterControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const avatarGroupRef = useRef<THREE.Group>(null);
  const { rapier, world } = useRapier();

  // Cache initial position ONLY once on mount to prevent Rapier from teleporting on state updates
  // Spawn in central plaza (z=5.5) so player is never inside central monument
  const initialPos = useRef<[number, number, number]>([
    player.x && Math.abs(player.x) > 0.1 ? player.x : 0,
    0.35,
    player.z && Math.abs(player.z) > 0.1 ? player.z : 5.5
  ]).current;

  const [animationState, setAnimationState] = useState<"idle" | "walk" | "run" | "jump">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // GTA-Style Third-Person Spherical Orbit Camera State
  const cameraYaw = useRef(0); // 0 = looking North along -Z
  const cameraPitch = useRef(0.24); // ~14 degrees elevation looking down at character focus
  const cameraDistance = useRef(7.0); // 7m orbit radius
  const isPointerLocked = useRef(false);

  // Jump and Grounding State
  const isJumping = useRef(false);
  const canJump = useRef(true);

  // Camera Focus Target (Smoothly tracks character, completely filtering vertical bobbing)
  const focusTarget = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    const unsub = voiceChatService.subscribe(() => {
      setIsSpeaking(voiceChatService.getIsSpeaking() && !voiceChatService.getIsMuted());
    });
    return unsub;
  }, []);

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

  // Network sync throttle (20 Hz = ~50ms)
  const lastSyncTime = useRef(0);
  const lastSentPos = useRef({ x: 0, y: 0, z: 0, rotY: 0, anim: "idle" });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing in inputs or textarea
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
          keys.current.jump = true;
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

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement !== null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;

      const sensitivity = 0.0025;
      // Moving mouse left/right rotates yaw (horizontal orbit)
      cameraYaw.current -= e.movementX * sensitivity;

      // Wrap yaw in [0, 2*PI)
      if (cameraYaw.current >= Math.PI * 2) cameraYaw.current -= Math.PI * 2;
      if (cameraYaw.current < 0) cameraYaw.current += Math.PI * 2;

      // Moving mouse up/down rotates pitch (vertical elevation)
      // Moving mouse DOWN (movementY > 0) increases pitch (raises camera higher, looking down)
      // Moving mouse UP (movementY < 0) decreases pitch (lowers camera, looking up)
      cameraPitch.current = THREE.MathUtils.clamp(
        cameraPitch.current + e.movementY * sensitivity,
        -0.2, // Min pitch (~-11 deg, looking slightly upward from low angle)
        1.2   // Max pitch (~68 deg, looking down from high angle)
      );
    };

    const handleWheel = (e: WheelEvent) => {
      // Zoom camera in/out with scroll wheel
      cameraDistance.current = THREE.MathUtils.clamp(
        cameraDistance.current + e.deltaY * 0.005,
        3.2,
        13.0
      );
    };

    const handleCanvasClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't request pointer lock if clicking on interactive UI elements or chat
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("[data-no-pointer-lock]")
      ) {
        return;
      }

      const canvas = document.querySelector("canvas");
      if (canvas && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("click", handleCanvasClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("click", handleCanvasClick);
    };
  }, []);

  useFrame((state) => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;
    const translation = rb.translation();
    const currentVel = rb.linvel();

    // 1. Calculate camera-relative movement vectors based on current cameraYaw
    const yaw = cameraYaw.current;
    // Forward direction from camera to character on the horizontal XZ plane
    const camForward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    // Right direction perpendicular on XZ plane
    const camRight = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

    // Input vector in camera space
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (keys.current.forward) moveDir.add(camForward);
    if (keys.current.backward) moveDir.sub(camForward);
    if (keys.current.right) moveDir.add(camRight);
    if (keys.current.left) moveDir.sub(camRight);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) {
      moveDir.normalize();
    }

    const isSprinting = keys.current.sprint && isMoving;
    const currentSpeed = isSprinting ? 8.5 : 5.0;

    // Decoupled horizontal velocities (X and Z only)
    const targetVelX = isMoving ? moveDir.x * currentSpeed : currentVel.x * 0.7;
    const targetVelZ = isMoving ? moveDir.z * currentSpeed : currentVel.z * 0.7;

    // 2. Downward Raycast Ground Detection
    let isGrounded = false;
    try {
      const rayOrigin = { x: translation.x, y: translation.y + 0.3, z: translation.z };
      const rayDir = { x: 0, y: -1, z: 0 };
      const ray = new rapier.Ray(rayOrigin, rayDir);
      const playerCollider = rb.collider(0);
      const hit = world.castRay(ray, 0.48, true, undefined, undefined, playerCollider);
      if (hit !== null && hit.timeOfImpact <= 0.42) {
        isGrounded = Math.abs(currentVel.y) < 1.8;
      }
    } catch {
      isGrounded = translation.y <= 0.45 && Math.abs(currentVel.y) < 0.5;
    }

    // 3. Vertical Velocity & Jumping: SPRINT MUST NEVER CAUSE JUMPING
    let targetVelY = currentVel.y;

    if (keys.current.jump && isGrounded && canJump.current && !isJumping.current) {
      // Intentional Spacebar Jump
      canJump.current = false;
      isJumping.current = true;
      targetVelY = 7.2; // Upward vertical jump impulse
      setTimeout(() => {
        canJump.current = true;
      }, 300);
    } else if (isJumping.current) {
      // Currently in mid-air from a jump: preserve natural Rapier gravity
      targetVelY = currentVel.y;
      if (isGrounded && currentVel.y <= 0.05) {
        // Landed cleanly
        isJumping.current = false;
        targetVelY = -0.6; // Snap to ground
      }
    } else if (isGrounded) {
      // Grounded during walking or sprinting:
      // Clamp vertical velocity to a constant small downward velocity (-0.6 m/s)
      // This FIRMLY sticks the capsule to the ground, completely eliminating solver micro-bounces
      // and preventing the character from ever jumping automatically when sprinting!
      targetVelY = -0.6;
    } else {
      // Falling naturally off a ledge
      targetVelY = currentVel.y;
    }

    // 4. Apply decoupled velocities
    rb.setLinvel(
      {
        x: targetVelX,
        y: targetVelY,
        z: targetVelZ
      },
      true
    );

    // 5. Character Avatar Rotation:
    // When moving: avatar rotates smoothly to face movement direction
    // When NOT moving: avatar remains stationary while camera is free to orbit around it!
    if (isMoving) {
      const targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      if (avatarGroupRef.current) {
        let diff = targetRotationY - avatarGroupRef.current.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        avatarGroupRef.current.rotation.y += diff * 0.25;
      }
    }

    const currentAnim: "idle" | "walk" | "run" | "jump" = isJumping.current
      ? "jump"
      : !isMoving
      ? "idle"
      : isSprinting
      ? "run"
      : "walk";

    if (currentAnim !== animationState) {
      setAnimationState(currentAnim);
    }

    // 6. Stable Third-Person Orbit Camera (GTA Style, Zero Bobbing)
    if (!focusTarget.current) {
      focusTarget.current = new THREE.Vector3(translation.x, translation.y + 1.2, translation.z);
    }

    // Horizontal tracking: immediate smooth follow
    focusTarget.current.x = THREE.MathUtils.lerp(focusTarget.current.x, translation.x, 0.25);
    focusTarget.current.z = THREE.MathUtils.lerp(focusTarget.current.z, translation.z, 0.25);

    // Vertical tracking: heavy smoothing when grounded to eliminate all camera bobbing
    if (isGrounded && !isJumping.current) {
      focusTarget.current.y = THREE.MathUtils.lerp(focusTarget.current.y, translation.y + 1.15, 0.08);
    } else {
      focusTarget.current.y = THREE.MathUtils.lerp(focusTarget.current.y, translation.y + 1.15, 0.15);
    }

    // Calculate spherical camera position
    const pitch = cameraPitch.current;
    const dist = cameraDistance.current;
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    const camX = focusTarget.current.x + dist * cosPitch * Math.sin(yaw);
    const camY = focusTarget.current.y + dist * sinPitch;
    const camZ = focusTarget.current.z + dist * cosPitch * Math.cos(yaw);

    // Clamp camera above ground surface
    const safeCamY = Math.max(0.45, camY);

    state.camera.position.set(camX, safeCamY, camZ);
    state.camera.lookAt(focusTarget.current.x, focusTarget.current.y, focusTarget.current.z);

    // 7. Network Transform Dispatch (~20 Hz)
    const now = Date.now();
    if (now - lastSyncTime.current > 50) {
      lastSyncTime.current = now;

      const currentRotY = avatarGroupRef.current ? avatarGroupRef.current.rotation.y : 0;
      const moved =
        Math.abs(translation.x - lastSentPos.current.x) > 0.02 ||
        Math.abs(translation.y - lastSentPos.current.y) > 0.05 ||
        Math.abs(translation.z - lastSentPos.current.z) > 0.02 ||
        Math.abs(currentRotY - lastSentPos.current.rotY) > 0.04 ||
        currentAnim !== lastSentPos.current.anim;

      if (moved && room) {
        lastSentPos.current = {
          x: translation.x,
          y: translation.y,
          z: translation.z,
          rotY: currentRotY,
          anim: currentAnim
        };

        room.send(ClientMessageType.PLAYER_INPUT, {
          x: translation.x,
          y: translation.y,
          z: translation.z,
          rotationY: currentRotY,
          animationState: currentAnim
        });
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      position={initialPos}
      enabledRotations={[false, false, false]}
      linearDamping={0.15}
      gravityScale={1.2}
      mass={1.0}
    >
      <CapsuleCollider args={[0.55, 0.35]} position={[0, 0.9, 0]} friction={0.0} restitution={0.0} />
      <group ref={avatarGroupRef}>
        <CharacterAvatar
          displayName={player.displayName}
          isLocal={true}
          isAlive={player.isAlive}
          isHost={isHost}
          isSpeaking={isSpeaking}
          animationState={animationState}
        />
      </group>
    </RigidBody>
  );
}
