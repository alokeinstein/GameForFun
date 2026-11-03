import { Client, Room } from "colyseus.js";
import { MafiaRoomState } from "@mafia/shared";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL || "ws://localhost:2567";

export const colyseusClient = new Client(SERVER_URL);

const RECONNECT_TOKEN_KEY = "mafia_reconnect_token";
const PLAYER_NAME_KEY = "mafia_player_name";

export function savePlayerName(name: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }
}

export function getSavedPlayerName(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(PLAYER_NAME_KEY) || "";
  }
  return "";
}

export function saveReconnectionToken(roomCode: string, token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(`${RECONNECT_TOKEN_KEY}_${roomCode}`, token);
  }
}

export function getSavedReconnectionToken(roomCode: string): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(`${RECONNECT_TOKEN_KEY}_${roomCode}`);
  }
  return null;
}

export function clearReconnectionToken(roomCode: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(`${RECONNECT_TOKEN_KEY}_${roomCode}`);
  }
}

export async function joinOrCreateMafiaRoom(
  roomCode: string,
  displayName: string
): Promise<Room<MafiaRoomState>> {
  const code = roomCode.toUpperCase().trim();
  const name = displayName.trim() || "Anonymous";

  const room = await colyseusClient.joinOrCreate<MafiaRoomState>(
    "mafia_room",
    {
      roomCode: code,
      displayName: name
    },
    MafiaRoomState
  );

  return room;
}
