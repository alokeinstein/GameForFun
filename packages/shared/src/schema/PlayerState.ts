import { Schema, type } from "@colyseus/schema";

/**
 * Publicly synchronized player representation.
 * NOTE: Role information is STRICTLY OMITTED to prevent network packet sniffing.
 */
export class PlayerState extends Schema {
  @type("string") id: string = "";
  @type("string") displayName: string = "";
  @type("boolean") isHost: boolean = false;
  @type("boolean") isReady: boolean = false;
  @type("boolean") isAlive: boolean = true;
  @type("boolean") isConnected: boolean = true;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") rotationY: number = 0;
  @type("string") animationState: string = "idle";
}

