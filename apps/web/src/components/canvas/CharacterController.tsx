"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, CapsuleCollider } from "@react-three/rapier";
import { Room } from "colyseus.js";
import { ClientMessageType, MafiaRoomState, PlayerState } from "@mafia/shared";
import { CharacterAvatar } from "./CharacterAvatar";

interface CharacterControllerProps {
  room: Room<MafiaRoomState>;
  player: PlayerState;
  isHost?: boolean;
}

export function CharacterController({ room, player, isHost = false }: CharacterControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const avatarGroupRef = useRef<THREE.Group>(null);

  const [animationState, setAnimationState] = useState<"idle" | "walk" | "run">("idle");

  // Keyboard state
  const keys = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    sprint: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;
    const translation = rb.translation();

    // 1. Movement Input Vector Calculation
    const moveZ = (keys.current.forward ? -1 : 0) + (keys.current.backward ? 1 : 0);
    const moveX = (keys.current.left ? -1 : 0) + (keys.current.right ? 1 : 0);

    const isMoving = moveX !== 0 || moveZ !== 0;
    const isSprinting = keys.current.sprint && isMoving;
    const currentSpeed = isSprinting ? 8.5 : 5.0;

    const moveDir = new THREE.Vector3(moveX, 0, moveZ);
    if (isMoving) {
      moveDir.normalize();

      // Apply linear velocity on X and Z, preserving Y gravity
      const currentVel = rb.linvel();
      rb.setLinvel(
        {
          x: moveDir.x * currentSpeed,
          y: currentVel.y,
          z: moveDir.z * currentSpeed
        },
        true
      );

      // Rotate avatar toward movement direction
      const targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          avatarGroupRef.current.rotation.y,
          targetRotationY,
          0.2
        );
      }
    } else {
      // Decelerate quickly on release
      const currentVel = rb.linvel();
      rb.setLinvel(
        {
          x: currentVel.x * 0.7,
          y: currentVel.y,
          z: currentVel.z * 0.7
        },
        true
      );
    }

    const currentAnim = !isMoving ? "idle" : isSprinting ? "run" : "walk";
    if (currentAnim !== animationState) {
      setAnimationState(currentAnim);
    }

    // 2. Smooth Third-Person Camera Follow
    const cameraOffset = new THREE.Vector3(0, 5.5, 9.0);
    const targetCameraPos = new THREE.Vector3(
      translation.x + cameraOffset.x,
      translation.y + cameraOffset.y,
      translation.z + cameraOffset.z
    );

    state.camera.position.lerp(targetCameraPos, 0.08);
    state.camera.lookAt(translation.x, translation.y + 1.2, translation.z);

    // 3. Network Transform Dispatch (~20 Hz)
    const now = Date.now();
    if (now - lastSyncTime.current > 50) {
      lastSyncTime.current = now;

      const currentRotY = avatarGroupRef.current ? avatarGroupRef.current.rotation.y : 0;
      const moved =
        Math.abs(translation.x - lastSentPos.current.x) > 0.02 ||
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
      position={[player.x || 0, (player.y || 0) + 1, player.z || 0]}
      enabledRotations={[false, false, false]}
      linearDamping={2.5}
      mass={1.0}
    >
      <CapsuleCollider args={[0.55, 0.35]} position={[0, 0.9, 0]} />
      <group ref={avatarGroupRef}>
        <CharacterAvatar
          displayName={player.displayName}
          isLocal={true}
          isAlive={player.isAlive}
          isHost={isHost}
          animationState={animationState}
        />
      </group>
    </RigidBody>
  );
}
