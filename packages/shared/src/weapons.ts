export enum WeaponId {
  ASSAULT_RIFLE = "assault_rifle",
  SHOTGUN = "shotgun",
  SNIPER_RIFLE = "sniper_rifle",
  SMG = "smg",
  PISTOL = "pistol"
}

export enum HitRegion {
  HEAD = "head",
  UPPER_TORSO = "upper_torso",
  ABDOMEN = "abdomen",
  ARMS = "arms",
  LEGS = "legs"
}

export const HIT_REGION_MULTIPLIERS: Record<HitRegion, number> = {
  [HitRegion.HEAD]: 2.0,
  [HitRegion.UPPER_TORSO]: 1.0,
  [HitRegion.ABDOMEN]: 0.85,
  [HitRegion.ARMS]: 0.65,
  [HitRegion.LEGS]: 0.60
};

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  category: "rifle" | "shotgun" | "sniper" | "smg" | "pistol";
  description: string;
  baseDamage: number;
  fireRateHz: number; // Rounds per second
  fireIntervalMs: number;
  reloadDurationMs: number;
  magazineCapacity: number;
  maxReserveAmmo: number;
  effectiveRangeM: number;
  pelletCount: number; // For shotguns: 8, others: 1
  recoilIntensity: number; // Pitch offset factor
  spreadAngleRad: number; // Bullet cone deviation
  iconEmoji: string;
  soundType: "rifle" | "shotgun" | "sniper" | "smg" | "pistol";
}

export const WEAPONS_CATALOG: Record<WeaponId, WeaponConfig> = {
  [WeaponId.ASSAULT_RIFLE]: {
    id: WeaponId.ASSAULT_RIFLE,
    name: "M4-A1 Assault Rifle",
    category: "rifle",
    description: "Versatile medium-to-long range combat rifle with high accuracy and balanced recoil.",
    baseDamage: 32,
    fireRateHz: 10,
    fireIntervalMs: 100,
    reloadDurationMs: 2200,
    magazineCapacity: 30,
    maxReserveAmmo: 120,
    effectiveRangeM: 65,
    pelletCount: 1,
    recoilIntensity: 0.035,
    spreadAngleRad: 0.02,
    iconEmoji: "🔫",
    soundType: "rifle"
  },
  [WeaponId.SHOTGUN]: {
    id: WeaponId.SHOTGUN,
    name: "Tactical Pump Shotgun",
    category: "shotgun",
    description: "Devastating close-quarters kinetic spreader firing 8 high-velocity buckshot pellets.",
    baseDamage: 18, // 18 * 8 = 144 max close-range damage
    fireRateHz: 1.2,
    fireIntervalMs: 833,
    reloadDurationMs: 2800,
    magazineCapacity: 8,
    maxReserveAmmo: 32,
    effectiveRangeM: 25,
    pelletCount: 8,
    recoilIntensity: 0.09,
    spreadAngleRad: 0.075,
    iconEmoji: "💥",
    soundType: "shotgun"
  },
  [WeaponId.SNIPER_RIFLE]: {
    id: WeaponId.SNIPER_RIFLE,
    name: "AWM Heavy Sniper",
    category: "sniper",
    description: "High-caliber precision rifle delivering fatal headshots across the battlefield.",
    baseDamage: 85, // 85 * 2.0 = 170 instant elimination headshot
    fireRateHz: 0.8,
    fireIntervalMs: 1250,
    reloadDurationMs: 3200,
    magazineCapacity: 5,
    maxReserveAmmo: 25,
    effectiveRangeM: 140,
    pelletCount: 1,
    recoilIntensity: 0.12,
    spreadAngleRad: 0.005,
    iconEmoji: "🎯",
    soundType: "sniper"
  },
  [WeaponId.SMG]: {
    id: WeaponId.SMG,
    name: "Vector Rapid SMG",
    category: "smg",
    description: "Ultra-fast cycling submachine gun with high mobility and tight hipfire spread.",
    baseDamage: 22,
    fireRateHz: 14,
    fireIntervalMs: 71,
    reloadDurationMs: 1800,
    magazineCapacity: 35,
    maxReserveAmmo: 140,
    effectiveRangeM: 40,
    pelletCount: 1,
    recoilIntensity: 0.025,
    spreadAngleRad: 0.035,
    iconEmoji: "⚡",
    soundType: "smg"
  },
  [WeaponId.PISTOL]: {
    id: WeaponId.PISTOL,
    name: "Desert Eagle .50",
    category: "pistol",
    description: "Heavy semi-automatic sidearm with punchy stopping power and fast reload.",
    baseDamage: 28,
    fireRateHz: 4,
    fireIntervalMs: 250,
    reloadDurationMs: 1500,
    magazineCapacity: 12,
    maxReserveAmmo: 60,
    effectiveRangeM: 35,
    pelletCount: 1,
    recoilIntensity: 0.03,
    spreadAngleRad: 0.015,
    iconEmoji: "🦅",
    soundType: "pistol"
  }
};

