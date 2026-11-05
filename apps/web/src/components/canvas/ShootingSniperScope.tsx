"use client";

import React from "react";

interface ShootingSniperScopeProps {
  active: boolean;
}

export function ShootingSniperScope({ active }: ShootingSniperScopeProps) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 z-[500] pointer-events-none select-none flex items-center justify-center overflow-hidden animate-fadeIn">
      {/* Outer Black Mask Vignette with Centered Circular Optic Aperture */}
      <div
        className="absolute inset-0 bg-black/95"
        style={{
          maskImage: "radial-gradient(circle at center, transparent 38vmin, black 44vmin)",
          WebkitMaskImage: "radial-gradient(circle at center, transparent 38vmin, black 44vmin)"
        }}
      />

      {/* Scope Outer Circular Steel Rim */}
      <div
        className="relative flex items-center justify-center border-4 border-noir-700/80 rounded-full shadow-[0_0_80px_rgba(0,0,0,0.95)]"
        style={{ width: "76vmin", height: "76vmin" }}
      >
        {/* Subtle Optic Glass Tint */}
        <div className="absolute inset-0 rounded-full bg-cyan-900/10 backdrop-contrast-125" />

        {/* Outer Mil-Dot Ring */}
        <div className="absolute inset-6 rounded-full border border-noir-500/30" />
        <div className="absolute inset-16 rounded-full border border-noir-500/20" />

        {/* Main Reticle Crosshairs */}
        {/* Horizontal Full Line */}
        <div className="absolute w-full h-[1.5px] bg-noir-200/90" />
        {/* Vertical Full Line */}
        <div className="absolute h-full w-[1.5px] bg-noir-200/90" />

        {/* Center Illuminated Precision Dot */}
        <div className="absolute w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] z-10" />

        {/* Horizontal Mil-Dots & Hash Marks */}
        {[-24, -18, -12, -6, 6, 12, 18, 24].map((dist) => (
          <div
            key={`h-hash-${dist}`}
            className="absolute w-[1.5px] bg-noir-200"
            style={{
              height: Math.abs(dist) % 12 === 0 ? "14px" : "8px",
              left: `calc(50% + ${dist * 1.4}vmin - 0.75px)`
            }}
          />
        ))}

        {/* Vertical Mil-Dots & Bullet Drop Elevation Marks */}
        {[6, 12, 18, 24, 30].map((drop) => (
          <div
            key={`v-drop-${drop}`}
            className="absolute h-[1.5px] bg-noir-200 flex items-center justify-end"
            style={{
              width: drop % 12 === 0 ? "16px" : "10px",
              top: `calc(50% + ${drop * 1.1}vmin - 0.75px)`
            }}
          >
            {drop % 12 === 0 && (
              <span className="text-[9px] font-mono font-bold text-noir-400 mr-5 select-none">
                {drop * 10}
              </span>
            )}
          </div>
        ))}

        {/* Top Compass / Azimuth Tick */}
        <div className="absolute top-2 flex flex-col items-center">
          <div className="w-[2px] h-3 bg-rose-500" />
          <span className="text-[10px] font-mono text-rose-400 font-bold mt-0.5">8x OPTIC</span>
        </div>

        {/* Bottom Calibration Badge */}
        <div className="absolute bottom-4 flex items-center space-x-2 text-[10px] font-mono text-noir-400 tracking-wider">
          <span>CAL: .338 MAGNUM</span>
          <span>•</span>
          <span>RANGE: ZERO 100M</span>
        </div>
      </div>
    </div>
  );
}
