export interface ShootingControlSettings {
  mouseSensitivity: number; // 0.0005 to 0.008, default 0.0025
  aimSensitivityMultiplier: number; // 0.2 to 1.5, default 0.65
  scopedSensitivityMultiplier: number; // 0.1 to 1.2, default 0.40
  invertY: boolean; // default false
  isLeftHandedPreset: boolean; // default false
  keyBindings: {
    forward: string;
    backward: string;
    left: string;
    right: string;
    sprint: string;
    jump: string;
    crouch: string;
    reload: string;
  };
}

export const DEFAULT_SHOOTING_SETTINGS: ShootingControlSettings = {
  mouseSensitivity: 0.0025,
  aimSensitivityMultiplier: 0.65,
  scopedSensitivityMultiplier: 0.40,
  invertY: false,
  isLeftHandedPreset: false,
  keyBindings: {
    forward: "KeyW",
    backward: "KeyS",
    left: "KeyA",
    right: "KeyD",
    sprint: "ShiftLeft",
    jump: "Space",
    crouch: "ControlLeft",
    reload: "KeyR"
  }
};

export const LEFT_HANDED_SHOOTING_SETTINGS: ShootingControlSettings = {
  mouseSensitivity: 0.0025,
  aimSensitivityMultiplier: 0.65,
  scopedSensitivityMultiplier: 0.40,
  invertY: false,
  isLeftHandedPreset: true,
  keyBindings: {
    forward: "KeyI",
    backward: "KeyK",
    left: "KeyJ",
    right: "KeyL",
    sprint: "ShiftRight",
    jump: "Space",
    crouch: "ControlRight",
    reload: "KeyP"
  }
};

const STORAGE_KEY = "mafia_shooting_settings_v1";

export function loadShootingSettings(): ShootingControlSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SHOOTING_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SHOOTING_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SHOOTING_SETTINGS,
      ...parsed,
      keyBindings: {
        ...DEFAULT_SHOOTING_SETTINGS.keyBindings,
        ...(parsed.keyBindings || {})
      }
    };
  } catch {
    return { ...DEFAULT_SHOOTING_SETTINGS };
  }
}

export function saveShootingSettings(settings: ShootingControlSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save shooting settings:", err);
  }
}

