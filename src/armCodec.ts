// armCodec.ts
// Encodes and decodes arm parameters to/from a Base64 passcode string.

import type { Arm, RGBColor } from "./arm";
import { createDefaultArm } from "./arm";

const PREFIX = "OA1:";

// Fields we save (id is excluded — a new one is assigned on import)
interface SerializedArm {
  length: number;
  angularVelocity: number;
  initialAngle: number;
  displayArm: boolean;
  draw: boolean;
  lineColor: RGBColor;
  armColor: RGBColor;
}

export function encodeArms(arms: Arm[]): string {
  const data: SerializedArm[] = arms.map(({ length, angularVelocity, initialAngle, displayArm, draw, lineColor, armColor }) => ({
    length,
    angularVelocity,
    initialAngle,
    displayArm,
    draw,
    lineColor,
    armColor,
  }));
  const json = JSON.stringify(data);
  return PREFIX + btoa(json);
}

export function decodeArms(code: string): Arm[] {
  if (!code.startsWith(PREFIX)) {
    throw new Error("Invalid code format.");
  }

  let json: string;
  try {
    json = atob(code.slice(PREFIX.length));
  } catch {
    throw new Error("Invalid code — could not decode.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid code — could not parse.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid code — expected a list of arms.");
  }

  return parsed.map((item: unknown, index: number) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`Arm ${index + 1}: invalid data.`);
    }
    const obj = item as Record<string, unknown>;
    validateNumber(obj, "length", index);
    validateNumber(obj, "angularVelocity", index);
    validateNumber(obj, "initialAngle", index);
    validateBoolean(obj, "displayArm", index);
    validateBoolean(obj, "draw", index);
    validateColor(obj, "lineColor", index);
    validateColor(obj, "armColor", index);

    return createDefaultArm({
      length: obj.length as number,
      angularVelocity: obj.angularVelocity as number,
      initialAngle: obj.initialAngle as number,
      displayArm: obj.displayArm as boolean,
      draw: obj.draw as boolean,
      lineColor: obj.lineColor as RGBColor,
      armColor: obj.armColor as RGBColor,
    });
  });
}

function validateNumber(obj: Record<string, unknown>, key: string, index: number) {
  if (typeof obj[key] !== "number") {
    throw new Error(`Arm ${index + 1}: "${key}" must be a number.`);
  }
}

function validateBoolean(obj: Record<string, unknown>, key: string, index: number) {
  if (typeof obj[key] !== "boolean") {
    throw new Error(`Arm ${index + 1}: "${key}" must be a boolean.`);
  }
}

function validateColor(obj: Record<string, unknown>, key: string, index: number) {
  const c = obj[key];
  if (
    typeof c !== "object" || c === null ||
    typeof (c as Record<string, unknown>).r !== "number" ||
    typeof (c as Record<string, unknown>).g !== "number" ||
    typeof (c as Record<string, unknown>).b !== "number"
  ) {
    throw new Error(`Arm ${index + 1}: "${key}" must be a valid RGB color.`);
  }
}
