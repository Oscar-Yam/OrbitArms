export interface RGBColor {
  /** Red channel, 0–255. */
  r: number;
  /** Green channel, 0–255. */
  g: number;
  /** Blue channel, 0–255. */
  b: number;
}

export interface Arm
{
  // Lenght of arm in px
  length: number;

  // Angular velocity radians per second
  angularVelocity: number;

  // Initial angle in radians.
  initialAngle: number; 

  // Whether to show the arm “bone” (the line segments between joints).
  displayArm: boolean;

  // Whether to draw the trajectory line of the end effector.
  draw: boolean;

  // Color of this arm / trajectory in RGB.
  lineColor: RGBColor;
  
  // Color of this arm in RGB.
  armColor: RGBColor;
}

// Helper to create a new Arm with some reasonable defaults.
export function createDefaultArm(partial?: Partial<Arm>): Arm {
  const base: Arm = {
    length: 120,
    angularVelocity: Math.PI / 2,
    initialAngle: 0,
    displayArm: true,
    draw: true,
    lineColor: { r: 0, g: 255, b: 255 },
    armColor: { r: 255, g: 255, b: 255 },
  };
  return { ...base, ...partial };
}
