// App.tsx
import React, { useState } from "react";
import OrbitCanvas from "./OrbitCanvas";
import { Arm, createDefaultArm } from "./arm";

const LENGTH_UNIT_PX = 20; // 1 unit = 20px

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

  // left Arms Settings Panel collapsed state
  const [panelCollapsed, setPanelCollapsed] = useState(false);

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
        // viewport background
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "16px",
        backgroundColor: "#222",
        color: "#f0f0f0",
      }}
    >
      <div
        style={{
          // center app card
          margin: "0 auto",
          backgroundColor: backgroundColor === "black" ? "#111" : "#eee",
          color: backgroundColor === "black" ? "#eee" : "#111",
          borderRadius: "4px",
          padding: "16px",
          boxSizing: "border-box",
          overflowX: "auto", // Scrollbar for narrow screens
        }}
      >
        {/* Header + Global controls */}
        <h1 style={{ marginBottom: "8px" }}>Orbit Arms</h1>

        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
            alignItems: "center",
          }}
        >

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            

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

        {/* main layout：left side Arms Panel，right side Canvas
            no stack*/}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap", // no warp, force horizontal scroll if too narrow
            gap: "16px",
            alignItems: "stretch",
            minWidth: panelCollapsed ? 640 : 800, // scrollbar when narrow screen
          }}
        >
          {/* Panel：collapsible*/}
          <section
            style={{
              flex: "0 0 auto",
              width: panelCollapsed ? 165 : 400,
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "4px",
              background:
                backgroundColor === "black"
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(255,255,255,0.6)",
              padding: "8px",
              boxSizing: "border-box",
            }}
          >
            {/* Panel header + collapse button */}
            <div
              style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
              }}
            >
              <h2
              style={{
                fontSize: "14px",
                margin: 0,
                paddingBottom: 4,
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                whiteSpace: "nowrap",
              }}
              >
              Arms Settings
              </h2>
              <button
              onClick={() => setPanelCollapsed((v) => !v)}
              style={{
                fontSize: "11px",
                padding: "2px 6px",
                marginLeft: "8px",
                whiteSpace: "nowrap",
              }}
              >
              {panelCollapsed ? "Expand" : "Collapse"}
              </button>
            </div>

            {/* small button after collapsed only and show all details when expanded*/}
            {panelCollapsed?
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
              >
                <button
                onClick={handleAddArm}
                style={{
                  fontSize: "11px",
                  padding: "2px 6px",
                }}
                >
                  + Arm
                </button>
                <button
                onClick={handleRemoveLastArm}
                disabled={arms.length <= 1}
                style={{
                  fontSize: "11px",
                  padding: "2px 6px",
                  opacity: arms.length <= 1 ? 0.5 : 1,
                }}
                >
                  - Last
                </button>
            </div> : 
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={handleAddArm} style={{fontSize: "11px"}}>Add Arm</button>
                <button onClick={handleRemoveLastArm} style={{fontSize: "11px"}} disabled={arms.length <= 1}>Remove Last Arm</button>
                <span style={{ fontSize: "12px", opacity: 0.8 }}>Arms: {arms.length}</span>
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
                <label style={{ fontSize: "12px" }}>Arm Width{" "}
                  <input
                  type="number"
                  value={lineWidth}
                  min={0.5}
                  max={5}
                  step={0.5}
                  onChange={(e) => setLineWidth(Number(e.target.value) || 1)}
                  style={{ width: "30px"}}
                  />
                </label>
              </div>
              {arms.map((arm, index) => (
                <div
                  key={arm.id}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    padding: "6px 4px",
                    borderRadius: "4px",
                    background: backgroundColor === "black" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                  style={{
                    minWidth: "26px",
                    fontWeight: 600,
                    fontSize: "12px",
                    marginRight: "4px",
                  }}
                  >
                    #{index + 1}
                  </div>
                  
                  {/* Length：Unit for UI，code behide is px */}
                  <label style={{ fontSize: "12px" }}>
                    Length
                    <input
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    value={arm.length / LENGTH_UNIT_PX}
                    onChange={(e) =>
                      {
                        const unit = Number(e.target.value) || 0;
                        const clampedUnit = Math.max(1, Math.min(50, unit));
                        updateArm( index, "length", clampedUnit * LENGTH_UNIT_PX);
                      }}
                    style={{ width: "31px", marginLeft: "4px" }}
                    />
                  </label>
                  
                  {/* Angular Velocity (deg/sec) */}
                  <label style={{ fontSize: "12px" }}>
                    ω (deg/s)
                    <input
                    type="number"
                    value={((arm.angularVelocity * 180) / Math.PI).toFixed(1)}
                    step={5}
                    onChange={(e) =>
                      {
                        const v = Number(e.target.value) || 0;
                        updateArm(index, "angularVelocity", degToRad(v));
                      }}
                    style={{ width: "51px", marginLeft: "4px" }}
                    />
                  </label>
                  
                  {/* Initial Angle (deg) */}
                  <label style={{ fontSize: "12px" }}>
                    θ₀ (deg)
                    <input
                    type="number"
                    value={radToDeg(arm.initialAngle).toFixed(1)}
                    step={5}
                    onChange={(e) =>
                      {
                        const v = Number(e.target.value) || 0;
                        updateArm(index, "initialAngle", degToRad(v));
                      }}
                    style={{ width: "50px", marginLeft: "4px" }}
                    />
                  </label>
                  
                  {/* displayArm toggle */}
                  <label
                    style={{
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                    type="checkbox"
                    checked={arm.displayArm}
                    onChange={(e) => updateArm(index, "displayArm", e.target.checked)}
                    />
                    show arm
                  </label>
                  
                  {/* draw toggle */}
                  <label
                    style={{
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={arm.draw}
                      onChange={(e) => updateArm(index, "draw", e.target.checked) }
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
                      onChange={(e) => 
                        {
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
          }
          </section>

          {/* Right：Canvas （auto max width） */}
          <section
            style={{
              flex: "1 1 auto",
              minWidth: 360,
            }}
          >
            <OrbitCanvas
              arms={arms}
              backgroundColor={backgroundColor}
              lineWidth={lineWidth}
            />
          </section>
        </div>
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