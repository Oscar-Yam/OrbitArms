// Page2D.tsx
import React, { useState, useRef, useEffect } from "react";
import OrbitCanvas from "../OrbitCanvas";
import { type Arm, createDefaultArm } from "../arm";
import { encodeArms, decodeArms } from "../armCodec";

const LENGTH_UNIT_PX = 20; // 1 unit = 20px

const Page2D: React.FC = () => {
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
  const [backgroundColor, setBackgroundColor] = useState<"black" | "white">("black");

  // left Arms Settings Panel collapsed state
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Export image
  const exportImageFnRef = useRef<(() => void) | null>(null);
  const handleRegisterExport = (fn: () => void) => { exportImageFnRef.current = fn; };
  const handleExportImage = () => { exportImageFnRef.current?.(); };

  // Arms Code modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFocusImport, setModalFocusImport] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);
  const importInputRef = useRef<HTMLTextAreaElement>(null);

  const currentCode = encodeArms(arms);

  const handleOpenExport = () => {
    setImportInput(""); setImportError(""); setCopied(false);
    setModalFocusImport(false); setModalOpen(true);
  };
  const handleOpenImport = () => {
    setImportInput(""); setImportError(""); setCopied(false);
    setModalFocusImport(true); setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false); setImportInput(""); setImportError("");
  };
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleLoadCode = () => {
    try {
      const loaded = decodeArms(importInput.trim());
      setArms(loaded);
      handleCloseModal();
    } catch (e) {
      setImportError((e as Error).message);
    }
  };

  useEffect(() => {
    if (modalOpen && modalFocusImport && importInputRef.current) {
      importInputRef.current.focus();
    }
  }, [modalOpen, modalFocusImport]);

  const handleAddArm = () => {
    setArms((prev) => [
      ...prev,
      createDefaultArm({
        length: 80, angularVelocity: Math.PI / 3, initialAngle: 0,
        displayArm: true, draw: true,
        lineColor: randomColor(), armColor: { r: 255, g: 255, b: 255 },
      }),
    ]);
  };
  const handleRemoveLastArm = () => {
    setArms((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };
  const updateArm = <K extends keyof Arm>(index: number, key: K, value: Arm[K]) => {
    setArms((prev) => prev.map((arm, i) => (i === index ? { ...arm, [key]: value } : arm)));
  };

  const degToRad = (deg: number) => (deg / 180) * Math.PI;
  const radToDeg = (rad: number) => (rad * 180) / Math.PI;

  return (
    <div
      style={{
        margin: "0 auto",
        backgroundColor: backgroundColor === "black" ? "#111" : "#eee",
        color: backgroundColor === "black" ? "#eee" : "#111",
        borderRadius: "4px",
        padding: "16px",
        boxSizing: "border-box",
        overflowX: "auto",
        height: "calc(100vh - 75px)",
        border: "2px solid orange", /* 🟠 Page2D root */
      }}
    >
      {/* Header + Global controls */}
      <section
        style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "16px", alignItems: "center", border: "2px solid yellow" /* 🟡 Header controls */ }}
      >
        <label style={{ fontSize: "12px", display: "flex", gap: "4px", alignItems: "center" }}>
          Background:
          <select value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value as "black" | "white")}>
            <option value="black">Black</option>
            <option value="white">White</option>
          </select>
        </label>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.2)" }} />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button style={{ fontSize: "12px" }} title="Export arm parameters as passcode" onClick={handleOpenExport}>⬆ Export Arms</button>
          <button style={{ fontSize: "12px" }} title="Import arm parameters from passcode" onClick={handleOpenImport}>⬇ Import Arms</button>
          <button style={{ fontSize: "12px" }} title="Export canvas as PNG image" onClick={handleExportImage}>🖼 Export Image</button>
        </div>
      </section>

      {/* ── Arms Code Modal ─────────────────────────────────────── */}
      {modalOpen && (
        <div onClick={handleCloseModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "24px", width: "min(480px, 90vw)", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "16px" }}>🎮 Orbit Arms Code</h2>
              <button onClick={handleCloseModal} style={{ background: "transparent", border: "none", color: "#f0f0f0", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>Share or save your current arm setup:</p>
              <textarea readOnly value={currentCode} rows={3} style={{ width: "100%", boxSizing: "border-box", background: "#111", color: "#0ff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", padding: "8px", fontSize: "11px", fontFamily: "monospace", resize: "none", wordBreak: "break-all" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button style={{ fontSize: "12px" }} onClick={handleCopyCode}>📋 Copy</button>
                {copied && <span style={{ fontSize: "12px", color: "#4f4" }}>✔ Copied!</span>}
              </div>
            </div>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.15)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>Paste a code to load:</p>
              <textarea ref={importInputRef} value={importInput} onChange={(e) => { setImportInput(e.target.value); setImportError(""); }} placeholder="Paste your Orbit Arms code here..." rows={3} style={{ width: "100%", boxSizing: "border-box", background: "#111", color: "#f0f0f0", border: `1px solid ${importError ? "#f66" : "rgba(255,255,255,0.15)"}`, borderRadius: "4px", padding: "8px", fontSize: "11px", fontFamily: "monospace", resize: "none", wordBreak: "break-all" }} />
              {importError && <p style={{ margin: 0, fontSize: "12px", color: "#f66" }}>⚠ {importError}</p>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button style={{ fontSize: "12px" }} onClick={handleLoadCode} disabled={!importInput.trim()}>⬇ Load</button>
              <button style={{ fontSize: "12px" }} onClick={handleCloseModal}>✕ Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout: left panel + canvas ───────────────────── */}
      <div style={{ maxHeight:"850px", display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "16px", alignItems: "stretch", minWidth: panelCollapsed ? 640 : 800, border: "2px solid cyan" /* 🔵 Main layout row */ }}>

        {/* Panel: collapsible */}
        <section
          style={{ flex: "0 0 auto", width: panelCollapsed ? 165 : 400, border: "3px solid lime", borderRadius: "4px", background: backgroundColor === "black" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)", padding: "8px", boxSizing: "border-box" /* 🟢 Arms panel */ }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ fontSize: "14px", margin: 0, paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>Arms Settings</h2>
            <button onClick={() => setPanelCollapsed((v) => !v)} style={{ fontSize: "11px", padding: "2px 6px", marginLeft: "8px", whiteSpace: "nowrap" }}>
              {panelCollapsed ? "▶" : "◀"}
            </button>
          </div>

          {panelCollapsed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", maxHeight:"850px"}}>
              <button onClick={handleAddArm} style={{ fontSize: "11px", padding: "2px 6px" }}>+ Arm</button>
              <button onClick={handleRemoveLastArm} disabled={arms.length <= 1} style={{ fontSize: "11px", padding: "2px 6px", opacity: arms.length <= 1 ? 0.5 : 1 }}>- Last</button>
            </div>
          ) : (
            <div style={{overflowY:"auto", display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px", maxHeight:"850px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={handleAddArm} style={{ fontSize: "11px" }}>Add Arm</button>
                <button onClick={handleRemoveLastArm} style={{ fontSize: "11px" }} disabled={arms.length <= 1}>Remove Last Arm</button>
                <label style={{ fontSize: "12px" }}>Arm Width{" "}
                  <input type="number" value={lineWidth} min={0.5} max={5} step={0.5} onChange={(e) => setLineWidth(Number(e.target.value) || 1)} style={{ width: "30px" }} />
                </label>
              </div>
              {arms.map((arm, index) => (
                <div key={arm.id} style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "6px 4px", borderRadius: "4px", background: backgroundColor === "black" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)" }}>
                  <div style={{ minWidth: "26px", fontWeight: 600, fontSize: "12px", marginRight: "4px" }}>#{index + 1}</div>
                  <label style={{ fontSize: "12px" }}>
                    Length
                    <input type="number" min={1} max={50} step={1} value={arm.length / LENGTH_UNIT_PX}
                      onChange={(e) => { const unit = Number(e.target.value) || 0; const clamped = Math.max(1, Math.min(50, unit)); updateArm(index, "length", clamped * LENGTH_UNIT_PX); }}
                      style={{ width: "31px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px" }}>
                    ω (deg/s)
                    <input type="number" value={((arm.angularVelocity * 180) / Math.PI).toFixed(1)} step={5}
                      onChange={(e) => { const v = Number(e.target.value) || 0; updateArm(index, "angularVelocity", degToRad(v)); }}
                      style={{ width: "51px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px" }}>
                    θ₀ (deg)
                    <input type="number" value={radToDeg(arm.initialAngle).toFixed(1)} step={5}
                      onChange={(e) => { const v = Number(e.target.value) || 0; updateArm(index, "initialAngle", degToRad(v)); }}
                      style={{ width: "50px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px", display: "flex", alignItems: "center" }}>
                    <input type="checkbox" checked={arm.displayArm} onChange={(e) => updateArm(index, "displayArm", e.target.checked)} />
                    show arm
                  </label>
                  <label style={{ fontSize: "12px", display: "flex", alignItems: "center" }}>
                    <input type="checkbox" checked={arm.draw} onChange={(e) => updateArm(index, "draw", e.target.checked)} />
                    draw trail
                  </label>
                  <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                    Color
                    <input type="color" value={rgbToHex(arm.lineColor)}
                      onChange={(e) => { const rgb = hexToRgb(e.target.value); if (!rgb) return; updateArm(index, "lineColor", rgb); }}
                      style={{ width: "32px", height: "18px", padding: 0 }} />
                  </label>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Canvas (auto max width) */}
        <section style={{ flex: "1 1 auto", minWidth: 360, border: "2px solid magenta" /* 🟣 Canvas section */ }}>
          <OrbitCanvas arms={arms} backgroundColor={backgroundColor} lineWidth={lineWidth} onExportImage={handleRegisterExport} />
        </section>
      </div>
    </div>
  );
};

export default Page2D;

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
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
