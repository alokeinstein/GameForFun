"use client";

import React, { useState } from "react";
import { X, Sliders, Keyboard, RotateCcw, Check, MousePointer } from "lucide-react";
import {
  ShootingControlSettings,
  DEFAULT_SHOOTING_SETTINGS,
  LEFT_HANDED_SHOOTING_SETTINGS,
  saveShootingSettings
} from "../../utils/shootingSettings";

interface ShootingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShootingControlSettings;
  onSave: (newSettings: ShootingControlSettings) => void;
}

export function ShootingSettingsModal({
  isOpen,
  onClose,
  settings: initialSettings,
  onSave
}: ShootingSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"mouse" | "keys">("mouse");
  const [current, setCurrent] = useState<ShootingControlSettings>({ ...initialSettings });
  const [listeningKey, setListeningKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSensitivityChange = (val: number) => {
    setCurrent((prev) => ({ ...prev, mouseSensitivity: val }));
  };

  const handleAimSensChange = (val: number) => {
    setCurrent((prev) => ({ ...prev, aimSensitivityMultiplier: val }));
  };

  const handleScopedSensChange = (val: number) => {
    setCurrent((prev) => ({ ...prev, scopedSensitivityMultiplier: val }));
  };

  const handleToggleInvertY = () => {
    setCurrent((prev) => ({ ...prev, invertY: !prev.invertY }));
  };

  const handleToggleLeftHanded = () => {
    if (!current.isLeftHandedPreset) {
      setCurrent({ ...LEFT_HANDED_SHOOTING_SETTINGS });
    } else {
      setCurrent({ ...DEFAULT_SHOOTING_SETTINGS });
    }
  };

  const handleReset = () => {
    setCurrent({ ...DEFAULT_SHOOTING_SETTINGS });
  };

  const handleSave = () => {
    saveShootingSettings(current);
    onSave(current);
    onClose();
  };

  const handleStartKeyRebind = (actionName: string) => {
    setListeningKey(actionName);
  };

  const handleKeyDownCapture = (e: React.KeyboardEvent) => {
    if (!listeningKey) return;
    e.preventDefault();
    e.stopPropagation();

    // Disallow ESC from binding
    if (e.code === "Escape") {
      setListeningKey(null);
      return;
    }

    setCurrent((prev) => ({
      ...prev,
      keyBindings: {
        ...prev.keyBindings,
        [listeningKey]: e.code
      }
    }));
    setListeningKey(null);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none pointer-events-auto"
      onKeyDown={handleKeyDownCapture}
      tabIndex={0}
    >
      <div className="w-full max-w-xl bg-noir-950 border border-noir-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-noir-800 bg-noir-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">Game Settings & Controls</h3>
              <p className="text-xs text-noir-400 font-mono">Custom mouse sensitivity, scopes & keybindings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-noir-800 hover:bg-noir-700 flex items-center justify-center text-noir-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-noir-800/80 bg-noir-900/30 space-x-4">
          <button
            onClick={() => setActiveTab("mouse")}
            className={`flex items-center space-x-2 pb-2.5 border-b-2 text-xs font-mono font-bold transition ${
              activeTab === "mouse"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-noir-400 hover:text-white"
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Mouse & Aiming</span>
          </button>
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center space-x-2 pb-2.5 border-b-2 text-xs font-mono font-bold transition ${
              activeTab === "keys"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-noir-400 hover:text-white"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Key Bindings</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {activeTab === "mouse" ? (
            <div className="space-y-5">
              {/* Mouse Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-noir-200 font-bold">Look Sensitivity</span>
                  <span className="text-blue-400 font-bold">{current.mouseSensitivity.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.0008"
                  max="0.0060"
                  step="0.0001"
                  value={current.mouseSensitivity}
                  onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-noir-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Aim Sensitivity Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-noir-200 font-bold">ADS / Aim Sensitivity Multiplier</span>
                  <span className="text-emerald-400 font-bold">{(current.aimSensitivityMultiplier * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={current.aimSensitivityMultiplier}
                  onChange={(e) => handleAimSensChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-noir-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Scoped Sensitivity Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-noir-200 font-bold">Sniper Scoped Sensitivity</span>
                  <span className="text-amber-400 font-bold">{(current.scopedSensitivityMultiplier * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={current.scopedSensitivityMultiplier}
                  onChange={(e) => handleScopedSensChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-noir-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Invert Vertical Look */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-noir-900 border border-noir-800">
                <div>
                  <div className="text-xs font-bold font-mono text-white">Invert Vertical Look (Y-Axis)</div>
                  <div className="text-[11px] text-noir-400 font-mono">Reverse pitch up/down mouse control</div>
                </div>
                <button
                  onClick={handleToggleInvertY}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                    current.invertY
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-noir-800 border-noir-700 text-noir-400"
                  }`}
                >
                  {current.invertY ? "INVERTED" : "STANDARD"}
                </button>
              </div>

              {/* Left-Handed Preset Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-noir-900 border border-noir-800">
                <div>
                  <div className="text-xs font-bold font-mono text-white">Left-Handed Controls Preset</div>
                  <div className="text-[11px] text-noir-400 font-mono">Maps movement to IJKL and right side keys</div>
                </div>
                <button
                  onClick={handleToggleLeftHanded}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                    current.isLeftHandedPreset
                      ? "bg-purple-600/20 border-purple-500 text-purple-400"
                      : "bg-noir-800 border-noir-700 text-noir-400"
                  }`}
                >
                  {current.isLeftHandedPreset ? "ENABLED" : "DISABLED"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs text-noir-400 font-mono mb-2">
                Click a button and press any key to rebind. Press ESC to cancel.
              </div>

              {Object.entries(current.keyBindings).map(([action, keyCode]) => (
                <div
                  key={action}
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-noir-900 border border-noir-800"
                >
                  <span className="text-xs font-mono font-bold text-noir-200 capitalize">
                    {action}
                  </span>
                  <button
                    onClick={() => handleStartKeyRebind(action)}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-bold border transition min-w-[70px] text-center ${
                      listeningKey === action
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse"
                        : "bg-noir-800 hover:bg-noir-750 border-noir-700 text-white"
                    }`}
                  >
                    {listeningKey === action ? "PRESS KEY..." : keyCode.replace(/^Key/, "")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-noir-800 bg-noir-900/60">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-noir-800 hover:bg-noir-750 text-noir-300 hover:text-white font-mono text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-noir-800 hover:bg-noir-750 text-noir-300 font-mono text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-lg shadow-blue-600/30 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
