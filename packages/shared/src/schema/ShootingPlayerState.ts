import { Schema, type } from "@colyseus/schema";

export class ShootingPlayerState extends Schema {
  @type("string") id: string = "";
  @type("string") sessionId: string = "";
  @type("string") displayName: string = "";
  @type("string") teamId: string = "team-red"; // "team-red" | "team-blue" | "team-green"
  @type("boolean") isHost: boolean = false;
  @type("boolean") isReady: boolean = false;
  @type("boolean") isConnected: boolean = true;
  @type("boolean") isAlive: boolean = true;
  @type("number") health: number = 100;
  @type("number") maxHealth: number = 100;
  @type("number") shield: number = 50;
  @type("number") maxShield: number = 50;
  @type("number") kills: number = 0;
  @type("number") deaths: number = 0;
  @type("number") score: number = 0;
  @type("number") ping: number = 0;

  // 3D Spatial transforms & Animation
  @type("number") x: number = 0;
  @type("number") y: number = 0.35;
  @type("number") z: number = 0;
  @type("number") rotationY: number = 0;
  @type("string") animationState: string = "idle";

  // Combat & Loadout
  @type("string") weaponId: string = "assault_rifle";
  @type("number") ammo: number = 30;
  @type("number") maxAmmo: number = 30;
  @type("number") reserveAmmo: number = 120;
  @type("boolean") isReloading: boolean = false;
}

