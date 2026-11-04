import { Schema, type } from "@colyseus/schema";

export class ShootingTeamState extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") color: string = "#ef4444";
  @type("number") score: number = 0;
  @type("number") playerCount: number = 0;
}

