// Page3D.tsx
import React, { useState, useEffect, useRef } from "react";
import { createDefaultArm3D } from "../arm3d";
import type { Arm3D } from "../arm3d";
import { getArmSegments3D, projectPerspective, depthOpacity } from "../armMath3d";
import type { Point3D } from "../armMath3d";
import { encodeArms3D, decodeArms3D } from "../armCodec3d";

const FOCAL_LENGTH = 600;

const LENGTH_UNIT_PX = 20;
let _time = 0;

function rotateY(p: Point3D, angle: number): Point3D {
  return { x: p.x * Math.cos(angle) + p.z * Math.sin(angle), y: p.y, z: -p.x * Math.sin(angle) + p.z * Math.cos(angle) };
}
function rotateX(p: Point3D, angle: number): Point3D {
  return { x: p.x, y: p.y * Math.cos(angle) - p.z * Math.sin(angle), z: p.y * Math.sin(angle) + p.z * Math.cos(angle) };
}
function applyCamera(p: Point3D, yaw: number, pitch: number): Point3D {
  return rotateX(rotateY(p, yaw), pitch);
}
type TrailMap = Record<string, Point3D[]>;

const Page3D: React.FC = () => {
  const [arms, setArms] = useState<Arm3D[]>(() => [
    createDefaultArm3D({
      length: 2 * LENGTH_UNIT_PX,
      initialAngleX: 0, initialAngleY: 0, initialAngleZ: 0,
      angularVelocityX: Math.PI / 5, angularVelocityY: Math.PI / 2, angularVelocityZ: Math.PI / 3,
      lineColor: { r: 0, g: 220, b: 255 }, armColor: { r: 255, g: 255, b: 255 },
    }),
    createDefaultArm3D({
      length: 4 * LENGTH_UNIT_PX,
      initialAngleX: 0, initialAngleY: Math.PI / 4, initialAngleZ: Math.PI / 6,
      angularVelocityX: Math.PI / 3, angularVelocityY: -Math.PI, angularVelocityZ: Math.PI * 0.7,
      lineColor: { r: 255, g: 160, b: 0 }, armColor: { r: 255, g: 255, b: 100 },
    }),
  ]);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [lineWidth, setLineWidth] = useState(1);
  const [trailLength, setTrailLength] = useState(3000);
  const trailLengthRef = useRef(3000);
  useEffect(() => {
    trailLengthRef.current = trailLength;
    Object.values(trailRef.current).forEach((list) => {
      if (list.length > trailLength) list.splice(0, list.length - trailLength);
    });
  }, [trailLength]);
  const [running, setRunning] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState<"black" | "white">("black");
  const backgroundColorRef = useRef<"black" | "white">("black");
  useEffect(() => { backgroundColorRef.current = backgroundColor; }, [backgroundColor]);
  const [showAxes, setShowAxes] = useState(true);
  const showAxesRef = useRef(true);
  useEffect(() => { showAxesRef.current = showAxes; }, [showAxes]);

  // Arms Code modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFocusImport, setModalFocusImport] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);
  const importInputRef = useRef<HTMLTextAreaElement>(null);

  const currentCode = encodeArms3D(arms);

  const handleOpenExport = () => {
    setImportInput(""); setImportError(""); setCopied(false);
    setModalFocusImport(false); setModalOpen(true);
  };
  const handleOpenImport = () => {
    setImportInput(""); setImportError(""); setCopied(false);
    setModalFocusImport(true); setModalOpen(true);
  };
  const handleCloseModal = () => { setModalOpen(false); setImportInput(""); setImportError(""); };
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleLoadCode = () => {
    try {
      const loaded = decodeArms3D(importInput.trim());
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

  const armsRef = useRef<Arm3D[]>(arms);
  useEffect(() => { armsRef.current = arms; }, [arms]);
  const lineWidthRef = useRef(lineWidth);
  useEffect(() => { lineWidthRef.current = lineWidth; }, [lineWidth]);
  const runningRef = useRef(running);
  useEffect(() => { runningRef.current = running; }, [running]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailRef  = useRef<TrailMap>({});
  const rafRef    = useRef<number>(0);
  const yawRef    = useRef(0.4);
  const pitchRef  = useRef(-0.3);
  const dragRef   = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    const onMouseDown = (e: MouseEvent) => { dragRef.current = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current = { x: e.clientX, y: e.clientY };
      yawRef.current   += dx * 0.005;
      pitchRef.current += dy * 0.005;
      pitchRef.current  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitchRef.current));
    };
    const onMouseUp = () => { dragRef.current = null; };
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (runningRef.current) _time += dt;
      const t = _time;
      const currentArms = armsRef.current;
      const lw = lineWidthRef.current;
      const yaw = yawRef.current;
      const pitch = pitchRef.current;
      const maxReach = currentArms.reduce((s, a) => s + a.length, 0) || 1;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const W = canvas.width; const H = canvas.height;
      const cx = W / 2; const cy = H / 2;
      // Auto-scale: same logic as 2D OrbitCanvas — fit total arm reach into 90% of canvas
      const BASE_TOTAL_LENGTH = 200;
      const halfSize = Math.min(W, H) / 2 * 0.9;
      const autoScale  = halfSize / maxReach;
      const maxScale   = halfSize / BASE_TOTAL_LENGTH;
      const finalScale = Math.min(maxScale, autoScale);
      ctx.fillStyle = backgroundColorRef.current === "black" ? "#111" : "#eee"; ctx.fillRect(0, 0, W, H);
      const joints = getArmSegments3D(currentArms, t);
      if (runningRef.current) {
        currentArms.forEach((arm, i) => {
          if (!arm.draw) return;
          const pt = joints[i + 1];
          if (!trailRef.current[arm.id]) trailRef.current[arm.id] = [];
          const list = trailRef.current[arm.id];
          list.push({ ...pt });
          if (list.length > trailLengthRef.current) list.shift();
        });
      }
      currentArms.forEach((arm) => {
        const trail = trailRef.current[arm.id];
        if (!trail || trail.length < 2) return;
        const c = arm.lineColor;
        for (let i = 1; i < trail.length; i++) {
          const r0 = applyCamera(trail[i - 1], yaw, pitch);
          const r1 = applyCamera(trail[i], yaw, pitch);
          const p0 = projectPerspective(r0, FOCAL_LENGTH);
          const p1 = projectPerspective(r1, FOCAL_LENGTH);
          const opacity = depthOpacity(r1.z, maxReach);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${opacity.toFixed(3)})`;
          ctx.lineWidth = lw;
          ctx.moveTo(cx + p0.sx * finalScale, cy + p0.sy * finalScale);
          ctx.lineTo(cx + p1.sx * finalScale, cy + p1.sy * finalScale);
          ctx.stroke();
        }
      });
      currentArms.forEach((arm, i) => {
        if (!arm.displayArm) return;
        const r0 = applyCamera(joints[i], yaw, pitch);
        const r1 = applyCamera(joints[i + 1], yaw, pitch);
        const p0 = projectPerspective(r0, FOCAL_LENGTH);
        const p1 = projectPerspective(r1, FOCAL_LENGTH);
        const opacity = depthOpacity(r1.z, maxReach);
        const c = arm.armColor;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${opacity.toFixed(3)})`;
        ctx.lineWidth = lw * 2;
        ctx.moveTo(cx + p0.sx * finalScale, cy + p0.sy * finalScale);
        ctx.lineTo(cx + p1.sx * finalScale, cy + p1.sy * finalScale);
        ctx.stroke();
      });
      joints.forEach((pt) => {
        const r = applyCamera(pt, yaw, pitch);
        const { sx, sy } = projectPerspective(r, FOCAL_LENGTH);
        const opacity = depthOpacity(r.z, maxReach);
        ctx.beginPath();
        ctx.arc(cx + sx * finalScale, cy + sy * finalScale, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(3)})`;
        ctx.fill();
      });

      // ── 3-axis indicator (origin = start of arm chain) ──────────
      if (showAxesRef.current) {
        const axisLen = 360 * 0.25;
        const axes: { dir: Point3D; color: string; label: string }[] = [
          { dir: { x: axisLen, y: 0, z: 0 }, color: "#ff5555", label: "X" },
          { dir: { x: 0, y: axisLen, z: 0 }, color: "#55ff55", label: "Y" },
          { dir: { x: 0, y: 0, z: axisLen }, color: "#5599ff", label: "Z" },
        ];
        ctx.save();
        ctx.lineWidth = 1.5;
        axes.forEach(({ dir, color, label }) => {
          const rTip = applyCamera(dir, yaw, pitch);
          const tip  = projectPerspective(rTip, FOCAL_LENGTH);
          const tx = cx + tip.sx * finalScale;
          const ty = cy + tip.sy * finalScale;
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.moveTo(cx, cy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(label, tx + 4, ty + 4);
        });
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateArm = <K extends keyof Arm3D>(index: number, key: K, value: Arm3D[K]) => {
    setArms((prev) => prev.map((arm, i) => (i === index ? { ...arm, [key]: value } : arm)));
  };
  const handleAddArm = () => {
    setArms((prev) => [...prev, createDefaultArm3D({
      length: 80, angularVelocityX: 0, angularVelocityY: Math.PI / 3, angularVelocityZ: Math.PI / 4,
      lineColor: randomColor(), armColor: { r: 255, g: 255, b: 255 },
    })]);
  };
  const handleRemoveLastArm = () => { setArms((prev) => prev.length > 0 ? prev.slice(0, -1) : prev); };

  const handleTogglePlay = () => setRunning((v) => !v);
  const handleClearTrails = () => { trailRef.current = {}; };
  const handleResetCamera = () => { yawRef.current = 0.4; pitchRef.current = -0.3; };

  const overlayBtnStyle: React.CSSProperties = {
    width: "32px", height: "32px",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(40,40,40,0.85)",
    color: "#f0f0f0",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1,
    userSelect: "none" as const,
    padding: 0,
  };

  const degToRad = (deg: number) => (deg / 180) * Math.PI;
  const radToDeg = (rad: number) => (rad * 180) / Math.PI;

  return (
    <div style={{ margin: "0 auto",
        backgroundColor: backgroundColor === "black" ? "#111" : "#eee",
        color: backgroundColor === "black" ? "#eee" : "#111",
        borderRadius: "4px", padding: "16px", boxSizing: "border-box", overflowX: "auto", height: "calc(100vh - 71px)" }}>

      {/* Header — global controls */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "16px", alignItems: "center" }}>
        <label style={{ fontSize: "12px", display: "flex", gap: "4px", alignItems: "center" }}>
          Background:
          <select value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value as "black" | "white")}>
            <option value="black">Black</option>
            <option value="white">White</option>
          </select>
        </label>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.2)" }} />
        <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
          <input type="checkbox" checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)} />
          Show Axes
        </label>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.2)" }} />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button style={{ fontSize: "12px" }} title="Export arm parameters as passcode" onClick={handleOpenExport}>⬆ Export Arms</button>
          <button style={{ fontSize: "12px" }} title="Import arm parameters from passcode" onClick={handleOpenImport}>⬇ Import Arms</button>
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
              <textarea ref={importInputRef} value={importInput} onChange={(e) => { setImportInput(e.target.value); setImportError(""); }} placeholder="Paste your Orbit Arms 3D code here..." rows={3} style={{ width: "100%", boxSizing: "border-box", background: "#111", color: "#f0f0f0", border: `1px solid ${importError ? "#f66" : "rgba(255,255,255,0.15)"}`, borderRadius: "4px", padding: "8px", fontSize: "11px", fontFamily: "monospace", resize: "none", wordBreak: "break-all" }} />
              {importError && <p style={{ margin: 0, fontSize: "12px", color: "#f66" }}>⚠ {importError}</p>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button style={{ fontSize: "12px" }} onClick={handleLoadCode} disabled={!importInput.trim()}>⬇ Load</button>
              <button style={{ fontSize: "12px" }} onClick={handleCloseModal}>✕ Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", height: "calc(100% - 54px)" }}>
        <section style={{ flex: "0 0 auto", width: panelCollapsed ? 165 : 400,
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px",
            background: backgroundColor === "black" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)", padding: "8px", boxSizing: "border-box" as const }}>

          {/* Panel header: title + collapse toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ fontSize: "14px", margin: 0, paddingBottom: 4,
                borderBottom: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
              Arms Settings
            </h2>
            <button onClick={() => setPanelCollapsed((v) => !v)}
              style={{ fontSize: "11px", padding: "2px 6px", marginLeft: "8px", whiteSpace: "nowrap" }}>
              {panelCollapsed ? "▶" : "◀"}
            </button>
          </div>

          {panelCollapsed ? (
            /* Collapsed mini-strip */
            <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <button onClick={handleAddArm} style={{ fontSize: "11px", padding: "2px 6px" }}>+ Arm</button>
              <button onClick={handleRemoveLastArm} disabled={arms.length === 0} style={{ fontSize: "11px", padding: "2px 6px", opacity: arms.length === 0 ? 0.5 : 1 }}>&#8722; Last</button>
            </div>
          ) : (
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px",
                maxHeight: "calc(100vh - 200px)" }}>
              {/* Add/Remove + Trail Width inside expanded panel */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={handleAddArm} style={{ fontSize: "11px" }}>Add Arm</button>
                <button onClick={handleRemoveLastArm} disabled={arms.length === 0} style={{ fontSize: "11px" }}>Remove Last</button>
                <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                  Trail width
                  <input type="number" value={lineWidth} min={0.5} max={5} step={0.5}
                    onChange={(e) => setLineWidth(Number(e.target.value) || 1)}
                    style={{ width: "36px" }} />
                </label>
                <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                  Trail length
                  <input type="number" value={trailLength} min={100} max={10000} step={100}
                    onChange={(e) => setTrailLength(Math.max(100, Math.min(10000, Number(e.target.value) || 3000)))}
                    style={{ width: "52px" }} />
                  dots
                </label>
              </div>
              {arms.map((arm, index) => (
                <div key={arm.id} style={{ display: "flex", flexWrap: "wrap", gap: "8px",
                    padding: "6px 4px", borderRadius: "4px", background: backgroundColor === "black" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)" }}>
                  <div style={{ minWidth: "26px", fontWeight: 600, fontSize: "12px", marginRight: "4px" }}>#{index + 1}</div>
                  <label style={{ fontSize: "12px" }}>Length
                    <input type="number" min={1} max={50} step={1} value={arm.length / LENGTH_UNIT_PX}
                      onChange={(e) => { const u=Number(e.target.value)||0; updateArm(index,"length",Math.max(1,Math.min(50,u))*LENGTH_UNIT_PX); }}
                      style={{ width: "31px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px" }}>ωX°/s
                    <input type="number" step={5} value={radToDeg(arm.angularVelocityX).toFixed(1)}
                      onChange={(e) => updateArm(index,"angularVelocityX",degToRad(Number(e.target.value)||0))}
                      style={{ width: "51px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px" }}>ωY°/s
                    <input type="number" step={5} value={radToDeg(arm.angularVelocityY).toFixed(1)}
                      onChange={(e) => updateArm(index,"angularVelocityY",degToRad(Number(e.target.value)||0))}
                      style={{ width: "51px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px" }}>ωZ°/s
                    <input type="number" step={5} value={radToDeg(arm.angularVelocityZ).toFixed(1)}
                      onChange={(e) => updateArm(index,"angularVelocityZ",degToRad(Number(e.target.value)||0))}
                      style={{ width: "51px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px" }}>θ₀X°
                    <input type="number" step={5} value={radToDeg(arm.initialAngleX).toFixed(1)}
                      onChange={(e) => updateArm(index,"initialAngleX",degToRad(Number(e.target.value)||0))}
                      style={{ width: "50px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px" }}>θ₀Y°
                    <input type="number" step={5} value={radToDeg(arm.initialAngleY).toFixed(1)}
                      onChange={(e) => updateArm(index,"initialAngleY",degToRad(Number(e.target.value)||0))}
                      style={{ width: "50px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px" }}>θ₀Z°
                    <input type="number" step={5} value={radToDeg(arm.initialAngleZ).toFixed(1)}
                      onChange={(e) => updateArm(index,"initialAngleZ",degToRad(Number(e.target.value)||0))}
                      style={{ width: "50px", marginLeft: "4px" }} />
                  </label>
                  <label style={{ fontSize: "12px", display: "flex", alignItems: "center" }}>
                    <input type="checkbox" checked={arm.displayArm}
                      onChange={(e) => updateArm(index,"displayArm",e.target.checked)} /> show arm
                  </label>
                  <label style={{ fontSize: "12px", display: "flex", alignItems: "center" }}>
                    <input type="checkbox" checked={arm.draw}
                      onChange={(e) => updateArm(index,"draw",e.target.checked)} /> draw trail
                  </label>
                  <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>Color
                    <input type="color" value={rgbToHex(arm.lineColor)}
                      onChange={(e) => { const rgb=hexToRgb(e.target.value); if(!rgb)return; updateArm(index,"lineColor",rgb); }}
                      style={{ width: "32px", height: "18px", padding: 0 }} />
                  </label>
                </div>
              ))}
            </div>
          )}
        </section>
        <section style={{ flex: "1 1 auto", minWidth: 360, position: "relative" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }} />

          {/* "drag to rotate" hint */}
          <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.25)", fontSize: "12px", pointerEvents: "none", whiteSpace: "nowrap" }}>
            drag to rotate
          </div>

          {/* Overlay control widget — bottom-right */}
          <div style={{ position: "absolute", bottom: "16px", right: "16px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <button style={overlayBtnStyle} onClick={handleTogglePlay} title={running ? "Pause" : "Play"}>
              {running ? "⏸" : "▶"}
            </button>
            <button style={overlayBtnStyle} onClick={handleClearTrails} title="Clear trails">
              🗑
            </button>
            <div style={{ width: "24px", height: "1px", background: "rgba(255,255,255,0.2)", margin: "2px 0" }} />
            <button style={{ ...overlayBtnStyle, fontSize: "18px" }} onClick={handleResetCamera} title="Reset camera">
              ⟳
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Page3D;

function randomColor(): { r: number; g: number; b: number } {
  return { r: 128+Math.floor(Math.random()*128), g: 128+Math.floor(Math.random()*128), b: 128+Math.floor(Math.random()*128) };
}
function rgbToHex(c: { r: number; g: number; b: number }): string {
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
