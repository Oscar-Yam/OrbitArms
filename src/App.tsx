// App.tsx
import React, { useState } from "react";
import OrbitCanvas from "./OrbitCanvas";
import { Arm, createDefaultArm } from "./arm";

const LENGTH_UNIT_PX = 20; // 1 單位 = 20px

const App: React.FC = () => {
  const [arms, setArms] = useState<Arm[]>(() => [
    createDefaultArm({
      length: 120,
      angularVelocity: Math.PI / 2,
      initialAngle: 0,
      displayArm: true,
      draw: true,
      lineColor: { r: 0, g: 255, b: 255 },
      armColor: { r: 255, g: 255, b: 255 },
    }),
    createDefaultArm({
      length: 80,
      angularVelocity: -Math.PI,
      initialAngle: Math.PI / 4,
      displayArm: true,
      draw: true,
      lineColor: { r: 255, g: 128, b: 0 },
      armColor: { r: 255, g: 255, b: 0 },
    }),
  ]);

  // global settings
  const [lineWidth, setLineWidth] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState<"black" | "white">(
    "black"
  );

  const handleAddArm = () => {
    setArms((prev) => [
      ...prev,
      createDefaultArm({
        length: 80,
        angularVelocity: Math.PI / 3,
        initialAngle: 0,
        displayArm: true,
        draw: true,
        lineColor: randomColor(),
        armColor: { r: 255, g: 255, b: 255 },
      }),
    ]);
  };

  const handleRemoveLastArm = () => {
    setArms((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  // update single field of an arm by index
  const updateArm = <K extends keyof Arm>(
    index: number,
    key: K,
    value: Arm[K]
  ) => {
    setArms((prev) =>
      prev.map((arm, i) => (i === index ? { ...arm, [key]: value } : arm))
    );
  };

  // helper: angle degree <-> radian conversion
  const degToRad = (deg: number) => (deg / 180) * Math.PI;
  const radToDeg = (rad: number) => (rad * 180) / Math.PI;

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "16px",
        
        color: backgroundColor === "black" ? "#eee" : "#111",
        backgroundColor: backgroundColor === "black" ? "#111" : "#eee",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Orbit Arms Demo</h1>

      {/* Global controls */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={handleAddArm}>Add Arm</button>
          <button onClick={handleRemoveLastArm} disabled={arms.length <= 1}>
            Remove Last Arm
          </button>
          <span style={{ fontSize: "12px", opacity: 0.8 }}>
            Arms: {arms.length}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* line width */}
          <label style={{ fontSize: "12px" }}>
            Line Width{" "}
            <input
              type="number"
              value={lineWidth}
              min={0.5}
              max={5}
              step={0.5}
              onChange={(e) => setLineWidth(Number(e.target.value) || 1)}
              style={{ width: "60px", marginLeft: "4px" }}
            />
          </label>

          {/* background */}
          <label style={{ fontSize: "12px", display: "flex", gap: "4px" }}>
            Background:
            <select
              value={backgroundColor}
              onChange={(e) =>
                setBackgroundColor(e.target.value as "black" | "white")
              }
            >
              <option value="black">Black</option>
              <option value="white">White</option>
            </select>
          </label>
        </div>
      </section>

      {/* Arms control panel */}
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "4px",
          padding: "8px",
          marginBottom: "16px",
          background:
            backgroundColor === "black"
              ? "rgba(0,0,0,0.5)"
              : "rgba(255,255,255,0.6)",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            margin: "0 0 8px 0",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            paddingBottom: "4px",
          }}
        >
          Arms Settings
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {arms.map((arm, index) => (
            <div
              key={arm.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                padding: "6px 4px",
                borderRadius: "4px",
                background:
                  backgroundColor === "black"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  minWidth: "40px",
                  fontWeight: 600,
                  fontSize: "12px",
                  marginRight: "4px",
                }}
              >
                #{index + 1}
              </div>

              {/* Length：UI 用單位，內部用 px */}
              <label style={{ fontSize: "12px" }}>
                Length
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={arm.length / LENGTH_UNIT_PX}
                  onChange={(e) => {
                    const unit = Number(e.target.value) || 0;
                    const clampedUnit = Math.max(1, Math.min(50, unit));
                    updateArm(
                      index,
                      "length",
                      clampedUnit * LENGTH_UNIT_PX
                    );
                  }}
                  style={{ width: "70px", marginLeft: "4px" }}
                />
              </label>

              {/* Angular Velocity (deg/sec) */}
              <label style={{ fontSize: "12px" }}>
                ω (deg/s)
                <input
                  type="number"
                  value={((arm.angularVelocity * 180) / Math.PI).toFixed(1)}
                  step={5}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    updateArm(index, "angularVelocity", degToRad(v));
                  }}
                  style={{ width: "70px", marginLeft: "4px" }}
                />
              </label>

              {/* Initial Angle (deg) */}
              <label style={{ fontSize: "12px" }}>
                θ₀ (deg)
                <input
                  type="number"
                  value={radToDeg(arm.initialAngle).toFixed(1)}
                  step={5}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    updateArm(index, "initialAngle", degToRad(v));
                  }}
                  style={{ width: "70px", marginLeft: "4px" }}
                />
              </label>

              {/* displayArm toggle */}
              <label
                style={{
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <input
                  type="checkbox"
                  checked={arm.displayArm}
                  onChange={(e) =>
                    updateArm(index, "displayArm", e.target.checked)
                  }
                />
                show arm
              </label>

              {/* draw toggle */}
              <label
                style={{
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <input
                  type="checkbox"
                  checked={arm.draw}
                  onChange={(e) =>
                    updateArm(index, "draw", e.target.checked)
                  }
                />
                draw trail
              </label>

              {/* line color */}
              <label
                style={{
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Color
                <input
                  type="color"
                  value={rgbToHex(arm.lineColor)}
                  onChange={(e) => {
                    const rgb = hexToRgb(e.target.value);
                    if (!rgb) return;
                    updateArm(index, "lineColor", rgb);
                  }}
                  style={{ width: "32px", height: "18px", padding: 0 }}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Canvas with animation */}
      <OrbitCanvas
        arms={arms}
        backgroundColor={backgroundColor}
        lineWidth={lineWidth}
      />
    </div>
  );
};

export default App;

/**
 * Generate a random bright-ish RGB color.
 */
function randomColor(): { r: number; g: number; b: number } {
  const r = 128 + Math.floor(Math.random() * 128);
  const g = 128 + Math.floor(Math.random() * 128);
  const b = 128 + Math.floor(Math.random() * 128);
  return { r, g, b };
}

function rgbToHex(c: { r: number; g: number; b: number }): string {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}
