import { Role, WinningTeam } from "@mafia/game-rules";

/**
 * Message types dispatched from Client -> Server
 */
export enum ClientMessageType {
  READY_TOGGLE = "READY_TOGGLE",
  UPDATE_CONFIG = "UPDATE_CONFIG",
  START_GAME = "START_GAME",
  PLAYER_INPUT = "PLAYER_INPUT",
  CAST_VOTE = "CAST_VOTE",
  MAFIA_TARGET_VOTE = "MAFIA_TARGET_VOTE",
  SEND_CHAT = "SEND_CHAT",
  RECONNECT_SESSION = "RECONNECT_SESSION"
}

/**
 * Message types dispatched from Server -> Client (Private or Broadcast)
 */
export enum ServerMessageType {
  ROLE_ASSIGNMENT = "ROLE_ASSIGNMENT",       // STRICTLY PRIVATE
  MAFIA_TARGET_UPDATE = "MAFIA_TARGET_UPDATE", // LIVING MAFIA ONLY
  VOTE_CAST_CONFIRMED = "VOTE_CAST_CONFIRMED",
  RECONNECTION_TOKEN = "RECONNECTION_TOKEN",   // PRIVATE
  CHAT_MESSAGE = "CHAT_MESSAGE",
  SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",
  ERROR_NOTIFICATION = "ERROR_NOTIFICATION"
}

export interface PlayerTransformPayload {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  animationState: "idle" | "walk" | "run" | "jump" | "dead";
}

export interface RoleAssignmentPayload {
  role: Role;
  teammates?: Array<{ id: string; displayName: string }>;
}

export interface ChatMessagePayload {
  senderId: string;
  senderName: string;
  channel: "PUBLIC" | "MAFIA" | "DEAD";
  message: string;
  timestamp: number;
}
