// arm3d.ts — Defines the Arm3D interface and helper to create 3D arms with defaults.
import type { RGBColor } from "./arm";

let arm3dIdCounter = 0;

export interface Arm3D {
  id: string;

  // Length of arm in px
  length: number;

  // Initial pointing direction (radians) on each axis at t=0
  initialAngleX: number;
  initialAngleY: number;
  initialAngleZ: number;

  // Angular velocity (radians per second) on each axis
  angularVelocityX: number;
  angularVelocityY: number;
  angularVelocityZ: number;

  // Whether to show the arm "bone" (the line segments between joints)
  displayArm: boolean;

  // Whether to draw the trajectory trail of the end effector
  draw: boolean;

  // Color of the trajectory trail
  lineColor: RGBColor;

  // Color of the arm bone
  armColor: RGBColor;
}

// Helper to create a new Arm3D with reasonable defaults.
export function createDefaultArm3D(partial?: Partial<Arm3D>): Arm3D {
  const base: Arm3D = {
    id: `arm3d-${arm3dIdCounter++}`,
    length: 120,
    initialAngleX: 0,
    initialAngleY: 0,
    initialAngleZ: 0,
    angularVelocityX: 0,
    angularVelocityY: Math.PI / 2,
    angularVelocityZ: 0,
    displayArm: true,
    draw: true,
    lineColor: { r: 0, g: 255, b: 255 },
    armColor: { r: 255, g: 255, b: 255 },
  };
  return { ...base, ...partial };
}
