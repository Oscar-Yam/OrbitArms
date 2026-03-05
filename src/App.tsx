// App.tsx
import React, { useState } from "react";
import OrbitCanvas from "./OrbitCanvas";
import { Arm, createDefaultArm } from "./arm";

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

  const handleAddArm = () => {
    setArms((prev) => [
      ...prev,
      createDefaultArm({
        // You can tweak these defaults for newly added arms.
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

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "16px",
        color: "#eee",
        backgroundColor: "#111",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Orbit Arms Demo</h1>

      {/* Global controls for arms */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={handleAddArm}>Add Arm</button>
        <button onClick={handleRemoveLastArm} disabled={arms.length === 0}>
          Remove Last Arm
        </button>
      </div>

      {/* Canvas with animation */}
      <OrbitCanvas arms={arms} />

      {/* Simple debug info */}
      <div style={{ marginTop: "12px", fontSize: "12px", opacity: 0.7 }}>
        <div>Number of arms: {arms.length}</div>
      </div>
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
