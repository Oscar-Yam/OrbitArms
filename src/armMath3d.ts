// armMath3d.ts
import type { Arm3D } from "./arm3d";

export type Point3D = { x: number; y: number; z: number };

/**
 * Compute all joint positions of the 3D arm chain at a given time.
 * Full 3-axis rotation using Euler angles, applied in X -> Y -> Z order.
 * Each arm direction vector starts as (1,0,0) then is rotated and scaled by length.
 */
export function getArmSegments3D(arms: Arm3D[], time: number): Point3D[] {
  const points: Point3D[] = [{ x: 0, y: 0, z: 0 }];
  let x = 0, y = 0, z = 0;
  for (const arm of arms) {
    const tX = arm.initialAngleX + arm.angularVelocityX * time;
    const tY = arm.initialAngleY + arm.angularVelocityY * time;
    const tZ = arm.initialAngleZ + arm.angularVelocityZ * time;
    const L = arm.length;
    // Rotation matrix Rz * Ry * Rx applied to unit vector (1,0,0)
    x += L * (Math.cos(tY) * Math.cos(tZ));
    y += L * (Math.sin(tX) * Math.sin(tY) * Math.cos(tZ) + Math.cos(tX) * Math.sin(tZ));
    z += L * (-Math.cos(tX) * Math.sin(tY) * Math.cos(tZ) + Math.sin(tX) * Math.sin(tZ));
    points.push({ x, y, z });
  }
  return points;
}

/** Project a 3D point to 2D screen using perspective projection. */
export function projectPerspective(
  point: Point3D,
  focalLength: number
): { sx: number; sy: number } {
  const denom = focalLength + point.z;
  return {
    sx: (focalLength * point.x) / denom,
    sy: (focalLength * point.y) / denom,
  };
}

/** Depth-based opacity: closer (negative z) = opaque, further (positive z) = faint. */
export function depthOpacity(z: number, maxReach: number): number {
  const normalized = (z + maxReach) / (2 * maxReach);
  return Math.max(0.05, Math.min(1.0, 1.0 - 0.85 * normalized));
}
