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
  RECONNECT_SESSION = "RECONNECT_SESSION",
  RESET_TO_LOBBY = "RESET_TO_LOBBY",
  VOICE_SIGNAL = "VOICE_SIGNAL",
  VOICE_STATE = "VOICE_STATE",
  // Multi-Game & Shooting messages
  SELECT_GAME_MODE = "SELECT_GAME_MODE",
  SHOOTING_JOIN_TEAM = "SHOOTING_JOIN_TEAM",
  SHOOTING_ASSIGN_TEAM = "SHOOTING_ASSIGN_TEAM",
  SHOOTING_AUTO_BALANCE = "SHOOTING_AUTO_BALANCE",
  SHOOTING_SELECT_LOADOUT = "SHOOTING_SELECT_LOADOUT",
  SHOOTING_RENAME_TEAM = "SHOOTING_RENAME_TEAM",
  SHOOTING_UPDATE_CONFIG = "SHOOTING_UPDATE_CONFIG",
  SHOOTING_START_MATCH = "SHOOTING_START_MATCH",
  SHOOTING_FIRE = "SHOOTING_FIRE",
  SHOOTING_RELOAD = "SHOOTING_RELOAD"
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
  ERROR_NOTIFICATION = "ERROR_NOTIFICATION",
  VOICE_SIGNAL = "VOICE_SIGNAL",
  VOICE_STATE = "VOICE_STATE",
  // Multi-Game & Shooting messages
  GAME_MODE_SELECTED = "GAME_MODE_SELECTED",
  SHOOTING_KILL_FEED = "SHOOTING_KILL_FEED",
  SHOOTING_HIT_EVENT = "SHOOTING_HIT_EVENT",
  SHOOTING_MUZZLE_FLASH = "SHOOTING_MUZZLE_FLASH",
  SHOOTING_PLAYER_RESPAWNED = "SHOOTING_PLAYER_RESPAWNED"
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

export interface VoiceSignalPayload {
  targetSessionId: string;
  signal: any;
}

export interface VoiceSignalRelayPayload {
  fromSessionId: string;
  signal: any;
}

export interface VoiceStatePayload {
  sessionId: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export interface ShootingFirePayload {
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  targetPlayerId?: string;
  hitPoint?: { x: number; y: number; z: number };
  hitRegion?: string; // "head" | "upper_torso" | "abdomen" | "arms" | "legs"
  clientTimestamp: number;
}

export interface ShootingReloadPayload {
  clientTimestamp: number;
}

export interface ShootingMuzzleFlashPayload {
  shooterId: string;
  weaponId: string;
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
}

export interface ShootingHitEventPayload {
  attackerId: string;
  victimId: string;
  damage: number;
  hitRegion: string;
  isHeadshot: boolean;
  remainingHealth: number;
  remainingShield: number;
}

export interface ShootingKillFeedPayload {
  killerId: string;
  killerName: string;
  killerTeamId: string;
  victimId: string;
  victimName: string;
  victimTeamId: string;
  weaponId: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface ShootingPlayerRespawnedPayload {
  playerId: string;
  teamId: string;
  x: number;
  y: number;
  z: number;
  health: number;
  shield: number;
}

