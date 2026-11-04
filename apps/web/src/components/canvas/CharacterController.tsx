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

  const [animationState, setAnimationState] = useState<"idle" | "walk" | "run">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canJump = useRef(true);

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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((state) => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;
    const translation = rb.translation();
    const currentVel = rb.linvel();

    // 1. Calculate camera-relative horizontal movement vector
    // Strip camera pitch (camForward.y = 0) so camera angle NEVER introduces vertical velocity
    const camForward = new THREE.Vector3();
    state.camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    const camRight = new THREE.Vector3();
    camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

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

    // Decoupled horizontal velocities (X and Z)
    const targetVelX = isMoving ? moveDir.x * currentSpeed : currentVel.x * 0.7;
    const targetVelZ = isMoving ? moveDir.z * currentSpeed : currentVel.z * 0.7;

    // 2. Vertical movement & ground detection (Y axis only)
    let isGrounded = false;
    try {
      const rayOrigin = { x: translation.x, y: translation.y + 0.25, z: translation.z };
      const rayDir = { x: 0, y: -1, z: 0 };
      const ray = new rapier.Ray(rayOrigin, rayDir);
      const playerCollider = rb.collider(0);
      const hit = world.castRay(ray, 0.45, true, undefined, undefined, playerCollider);
      if (hit !== null && hit.timeOfImpact <= 0.38) {
        isGrounded = Math.abs(currentVel.y) < 1.0;
      }
    } catch {
      isGrounded = translation.y <= 0.4 && Math.abs(currentVel.y) < 0.2;
    }

    let targetVelY = currentVel.y;
    if (isGrounded && keys.current.jump && canJump.current) {
      canJump.current = false;
      setTimeout(() => {
        canJump.current = true;
      }, 280);
      targetVelY = 7.2; // Upward vertical jump impulse
    }

    // 3. Apply cleanly decoupled horizontal and vertical velocities
    rb.setLinvel(
      {
        x: targetVelX,
        y: targetVelY,
        z: targetVelZ
      },
      true
    );

    // 4. Rotate avatar toward movement direction (shortest angle lerp)
    if (isMoving) {
      const targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      if (avatarGroupRef.current) {
        let diff = targetRotationY - avatarGroupRef.current.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        avatarGroupRef.current.rotation.y += diff * 0.25;
      }
    }

    const currentAnim = !isMoving ? "idle" : isSprinting ? "run" : "walk";
    if (currentAnim !== animationState) {
      setAnimationState(currentAnim);
    }

    // 5. Smooth Third-Person Camera Follow
    const cameraOffset = new THREE.Vector3(0, 5.2, 8.5);
    const targetCameraPos = new THREE.Vector3(
      translation.x + cameraOffset.x,
      translation.y + cameraOffset.y,
      translation.z + cameraOffset.z
    );

    state.camera.position.lerp(targetCameraPos, 0.09);
    state.camera.lookAt(translation.x, translation.y + 1.2, translation.z);

    // 6. Network Transform Dispatch (~20 Hz)
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

