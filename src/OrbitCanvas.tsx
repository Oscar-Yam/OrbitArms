// OrbitCanvas.tsx
import React, { useEffect, useRef, useState } from "react";
import type { Arm } from "./arm";
import { getEndpoint, getArmSegments } from "./armMath";

interface OrbitCanvasProps {
  /** List of arms, from base to tip. */
  arms: Arm[];

  /** Background color for the canvas. */
  backgroundColor?: string;

  /** Global line width for both arms and trajectory. */
  lineWidth?: number;
}

const OrbitCanvas: React.FC<OrbitCanvasProps> = ({
  arms,
  backgroundColor = "black",
  lineWidth = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // We track time in seconds.
  const [time, setTime] = useState(0);

  // Whether the animation is running (play / pause).
  const [running, setRunning] = useState(true);

  // This flag is used to trigger a full clear of the canvas.
  const [clearRequested, setClearRequested] = useState(false);

  // Store the last end-point to draw the trajectory line.
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Handle the animation loop and time update.
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000; // convert ms to seconds
      lastTime = now;

      setTime((prev) => (running ? prev + dt : prev));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [running]);

  // Handle drawing on the canvas whenever time, arms, or clearRequested change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // If clearRequested is true, we reset the whole drawing state.
    if (clearRequested) {
      // Clear the canvas.
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Reset trajectory state.
      lastPointRef.current = null;

      // Reset the animation time to 0 seconds.
      setTime(0);

      // Reset the flag.
      setClearRequested(false);
      return;
    }

    // Clear the canvas for the current frame.
    //ctx.fillStyle = backgroundColor;
    //ctx.fillRect(0, 0, width, height);

    // Move the origin to the center of the canvas.
    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Draw the arm bones if displayArm is true for any arm.
    drawArms(ctx, arms, time, lineWidth);

    // Draw the trajectory of the end effector.
    drawTrajectory(ctx, arms, time, lineWidth, lastPointRef);

    ctx.restore();
  }, [time, arms, backgroundColor, lineWidth, clearRequested]);

  // Keep canvas width in sync with its parent width (simple responsive behavior).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      // You can adjust the height logic as needed.
      canvas.width = rect.width;
      canvas.height = 400;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Every time we resize, we also clear the canvas and reset trajectory.
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      lastPointRef.current = null;
      setTime(0);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [backgroundColor]);

  /** Toggle between play and pause states. */
  const handleTogglePlay = () => {
    setRunning((prev) => !prev);
  };

  /** Clear the canvas, trajectory, and reset time. */
  const handleClearCanvas = () => {
    setClearRequested(true);
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "8px",
          justifyContent: "flex-start",
        }}
      >
        <button onClick={handleTogglePlay}>
          {running ? "Pause" : "Play"}
        </button>

        <button onClick={handleClearCanvas}>Clean Canvas</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "400px",
          display: "block",
          border: "1px solid #333",
        }}
      />
    </div>
  );
};

export default OrbitCanvas;

/**
 * Draw the arm bones (segments) based on displayArm flag.
 */
function drawArms(
  ctx: CanvasRenderingContext2D,
  arms: Arm[],
  time: number,
  lineWidth: number
) {
  if (arms.length === 0) return;

  const points = getArmSegments(arms, time);

  ctx.lineWidth = lineWidth;

  // We draw each segment individually so we can use each arm's own color.
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

/**
 * Draw the trajectory of the end effector using the last arm's lineColor.
 * This accumulates over time because we no longer clear the whole canvas every frame.
 */
function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  arms: Arm[],
  time: number,
  lineWidth: number,
  lastPointRef: React.MutableRefObject<{ x: number; y: number } | null>
) {
  if (arms.length === 0) return;

  const lastArm = arms[arms.length - 1];
  const { x, y } = getEndpoint(arms, time);

  const lastPoint = lastPointRef.current;

  // If draw is false, we do not draw the trajectory, but we still update lastPointRef.
  if (lastArm.draw && lastPoint) {
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);

    const c = lastArm.lineColor;
    ctx.strokeStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  // Update the last point for the next frame.
  lastPointRef.current = { x, y };
}
