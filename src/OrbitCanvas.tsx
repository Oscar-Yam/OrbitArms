// OrbitCanvas.tsx
import React, { useEffect, useRef, useState } from "react";
import type { Arm } from "./arm";
import { getArmSegments } from "./armMath";

interface OrbitCanvasProps {
  arms: Arm[];
  backgroundColor?: string;
  lineWidth?: number;
  onExportImage?: (fn: () => void) => void;
}

type Point = { x: number; y: number };

// 1 trail for each arm 
type TrailMap = Record<string, Point[]>;

const MAX_POINTS_PER_ARM = 5000;

const OrbitCanvas: React.FC<OrbitCanvasProps> = ({
  arms,
  backgroundColor = "black",
  lineWidth = 1,
  onExportImage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const [clearRequested, setClearRequested] = useState(false);
  const [zoom, setZoom] = useState(1);

  // key = arm.id, value = the arm's trail point'
  const [trailMap, setTrailMap] = useState<TrailMap>({});

  /* ─── 1. Animation loop ───────────────────────────────────── */

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTime((prev) => (running ? prev + dt : prev));
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [running]);

  /* ─── 2. gather the trail point of its own arm ───────────────── */

  useEffect(() => {
    if (!running) return;
    if (arms.length === 0) return;

    // get all joint positions: points[0] = base, points[1] = arm0 end, ...
    const points = getArmSegments(arms, time);
    // points.length 應該 = arms.length + 1

    setTrailMap((prev) => {
      const next: TrailMap = { ...prev };

      arms.forEach((arm, index) => {
        if (!arm.draw) {
          // if not drawing, can choose to keep old trail or clear it
          // I choise to keep old trails when unchecking "draw" because it allows users to toggle visibility without losing the history, and they can clear trails separately with the "Clean Canvas" button if they want a fresh start. If you prefer to clear trails immediately when "draw" is unchecked, simply set next[arm.id] = [] in that case.
          return;
        }

        const endPoint = points[index + 1]; // 第 index 支 arm 嘅末端
        const list = next[arm.id] ? [...next[arm.id]] : [];
        list.push({ x: endPoint.x, y: endPoint.y });

        if (list.length > MAX_POINTS_PER_ARM) {
          list.shift();
        }

        next[arm.id] = list;
      });

      // if arm removed, also clean up trailMap keys that are no longer valid
      const validIds = new Set(arms.map((a) => a.id));
      Object.keys(next).forEach((id) => {
        if (!validIds.has(id)) {
          delete next[id];
        }
      });

      return next;
    });
  }, [time, arms, running]);

  /* ─── 3. Draw ─────────────────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (clearRequested) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      setTrailMap({});
      setTime(0);
      setClearRequested(false);
      return;
    }

    // Clearing the canvas each frame is necessary to redraw the arms and trails in their new positions.
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    //  calculate total length
    const totalLength = arms.reduce((sum, arm) => sum + arm.length, 0);

    // using 4+6 unit (200px) as baseline
    const BASE_TOTAL_LENGTH = 200; // 4 + 6 單位 = (4+6)*20 = 200px
    
    ctx.translate(width / 2, height / 2);

    if (totalLength > 0) {
      const marginRatio = 0.9; // reserve 10% space
      const halfSize = Math.min(width, height) / 2 * marginRatio;

      // scaling
      // - baseline total length = 200px apply max scale
      // - if total length > baseline, auto scale
      const maxScale = halfSize / BASE_TOTAL_LENGTH;
      const autoScale = halfSize / totalLength; // max reach = totalLength

      // never zoom in beyond baseline： maxScale
      const finalScale = Math.min(maxScale, autoScale) * zoom;
    
      ctx.scale(finalScale, finalScale);
    }

    // Draw all trails for each arm, using the points stored in trailMap.
    drawAllTrails(ctx, arms, trailMap, lineWidth);

    // Draw current arms based on the current time, on top of the trails.
    drawArms(ctx, arms, time, lineWidth);

    ctx.restore();
  }, [time, arms, backgroundColor, lineWidth, clearRequested, trailMap, zoom]);

  /* ─── 4. Resize ───────────────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // clem canvas when resize, time remain unchange
      setTrailMap({});
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [backgroundColor]);

  /* ─── 5. Handlers ─────────────────────────────────────────── */

  const handleTogglePlay = () => {
    setRunning((prev) => !prev);
  };

  const handleClearCanvas = () => {
    setClearRequested(true);
  };

  // Register the export function with the parent via the onExportImage prop
  useEffect(() => {
    if (!onExportImage) return;
    onExportImage(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const totalLength = arms.reduce((sum, arm) => sum + arm.length, 0);
      const BASE_TOTAL_LENGTH = 200;

      // ── Redraw trails only (no arms) ──
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      if (totalLength > 0) {
        const marginRatio = 0.9;
        const halfSize = Math.min(width, height) / 2 * marginRatio;
        const maxScale = halfSize / BASE_TOTAL_LENGTH;
        const autoScale = halfSize / totalLength;
        const finalScale = Math.min(maxScale, autoScale) * zoom;
        ctx.scale(finalScale, finalScale);
      }
      drawAllTrails(ctx, arms, trailMap, lineWidth);
      ctx.restore();

      // ── Capture PNG ──
      const link = document.createElement("a");
      link.download = "orbit-arms.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      // ── Restore normal view (trails + arms) ──
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      if (totalLength > 0) {
        const marginRatio = 0.9;
        const halfSize = Math.min(width, height) / 2 * marginRatio;
        const maxScale = halfSize / BASE_TOTAL_LENGTH;
        const autoScale = halfSize / totalLength;
        const finalScale = Math.min(maxScale, autoScale) * zoom;
        ctx.scale(finalScale, finalScale);
      }
      drawAllTrails(ctx, arms, trailMap, lineWidth);
      drawArms(ctx, arms, time, lineWidth);
      ctx.restore();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onExportImage, arms, backgroundColor, lineWidth, trailMap, zoom, time]);

  const ZOOM_STEP = 0.1;
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 10;

  const handleZoomIn = () =>
    setZoom((prev) => Math.min(ZOOM_MAX, parseFloat((prev + ZOOM_STEP).toFixed(2))));
  const handleZoomOut = () =>
    setZoom((prev) => Math.max(ZOOM_MIN, parseFloat((prev - ZOOM_STEP).toFixed(2))));
  const handleZoomReset = () => setZoom(1);

  const zoomLabel = `${Math.round(zoom * 100)}%`;

  /* shared style for the floating zoom buttons */
  const zoomBtnStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(40,40,40,0.85)",
    color: "#f0f0f0",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1,
    userSelect: "none",
    padding: 0,
  };

  return (
    <div style={{ width: "100%", }}>
      {/* Canvas wrapper — position:relative so we can overlay all controls */}
      <div style={{ position: "relative", width: "100%" }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            border: "1px solid #333",
          }}
        />

        {/* Unified floating control widget — bottom-right corner */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {/* Playback buttons */}
          <button
            style={zoomBtnStyle}
            onClick={handleTogglePlay}
            title={running ? "Pause" : "Play"}
          >
            {running ? "⏸" : "▶"}
          </button>
          <button style={zoomBtnStyle} onClick={handleClearCanvas} title="Clean Canvas">
            🗑
          </button>

          {/* Divider */}
          <div
            style={{
              width: "24px",
              height: "1px",
              background: "rgba(255,255,255,0.2)",
              margin: "2px 0",
            }}
          />

          {/* Zoom buttons */}
          <button style={zoomBtnStyle} onClick={handleZoomIn} title="Zoom in">
            +
          </button>
          <div
            style={{
              ...zoomBtnStyle,
              fontSize: "11px",
              cursor: "default",
              letterSpacing: "-0.5px",
            }}
          >
            {zoomLabel}
          </div>
          <button style={zoomBtnStyle} onClick={handleZoomOut} title="Zoom out">
            −
          </button>
          <button
            style={{ ...zoomBtnStyle, fontSize: "13px" }}
            onClick={handleZoomReset}
            title="Reset zoom"
          >
            ⟳
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrbitCanvas;

/* ───────────────────── helper functions ────────────────────── */

function drawArms(
  ctx: CanvasRenderingContext2D,
  arms: Arm[],
  time: number,
  lineWidth: number
) {
  if (arms.length === 0) return;

  const points = getArmSegments(arms, time);
  ctx.lineWidth = lineWidth;

  for (let i = 0; i < arms.length; i++) {
    const arm = arms[i];
    if (!arm.displayArm) continue;

    const from = points[i];
    const to = points[i + 1];

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);

    const c = arm.armColor;
    ctx.strokeStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
    ctx.stroke();
  }
}

// Draw trail for each arm, using the points stored in trailMap.
function drawAllTrails(
  ctx: CanvasRenderingContext2D,
  arms: Arm[],
  trailMap: TrailMap,
  lineWidth: number
) {
  arms.forEach((arm) => {
    if (!arm.draw) return;

    const points = trailMap[arm.id];
    if (!points || points.length < 2) return;

    const c = arm.lineColor;
    ctx.strokeStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
  });
}
