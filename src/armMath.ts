import type { Arm } from "./arm";

/**
 * Compute the final end-point of the arm chain at a given time.
 * @param arms List of arms in order from base (index 0) to tip (last index).
 * @param time Time in seconds.
 */
export function getEndpoint(
  arms: Arm[],
  time: number
): { x: number; y: number } {
  let x = 0;
  let y = 0;

  for (const arm of arms) {
    const theta = arm.initialAngle + arm.angularVelocity * time;
    x += arm.length * Math.cos(theta);
    y += arm.length * Math.sin(theta);
  }

  return { x, y };
}

/**
 * Compute all joint positions of the arm chain at a given time.
 * Returns an array of points including the base (0,0) and each joint.
 * points[0] is the base, points[points.length - 1] is the end effector.
 */
export function getArmSegments(
  arms: Arm[],
  time: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];

  let x = 0;
  let y = 0;

  for (const arm of arms) {
    const theta = arm.initialAngle + arm.angularVelocity * time;
    x += arm.length * Math.cos(theta);
    y += arm.length * Math.sin(theta);
    points.push({ x, y });
  }

  return points;
}
