import { Schema, type } from "@colyseus/schema";

export class ShootingConfigState extends Schema {
  @type("number") matchDurationSec: number = 300; // 5 minutes
  @type("number") scoreLimit: number = 30; // 30 kills to win
  @type("string") selectedMap: string = "URBAN_DISTRICT";
  @type("number") respawnDelaySec: number = 3;
  @type("number") maxTeamSize: number = 8;
  @type("boolean") friendlyFire: boolean = false;
}

