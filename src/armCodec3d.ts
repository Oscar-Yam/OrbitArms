// armCodec3d.ts
// Encodes and decodes Arm3D parameters to/from a Base64 passcode string.

import type { RGBColor } from "./arm";
import type { Arm3D } from "./arm3d";
import { createDefaultArm3D } from "./arm3d";

const PREFIX = "OA3D1:";

interface SerializedArm3D {
  length: number;
  initialAngleX: number;
  initialAngleY: number;
  initialAngleZ: number;
  angularVelocityX: number;
  angularVelocityY: number;
  angularVelocityZ: number;
  displayArm: boolean;
  draw: boolean;
  lineColor: RGBColor;
  armColor: RGBColor;
}

export function encodeArms3D(arms: Arm3D[]): string {
  const data: SerializedArm3D[] = arms.map(({
    length,
    initialAngleX, initialAngleY, initialAngleZ,
    angularVelocityX, angularVelocityY, angularVelocityZ,
    displayArm, draw, lineColor, armColor,
  }) => ({
    length,
    initialAngleX, initialAngleY, initialAngleZ,
    angularVelocityX, angularVelocityY, angularVelocityZ,
    displayArm, draw, lineColor, armColor,
  }));
  return PREFIX + btoa(JSON.stringify(data));
}

export function decodeArms3D(code: string): Arm3D[] {
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
    validateNumber(obj, "initialAngleX", index);
    validateNumber(obj, "initialAngleY", index);
    validateNumber(obj, "initialAngleZ", index);
    validateNumber(obj, "angularVelocityX", index);
    validateNumber(obj, "angularVelocityY", index);
    validateNumber(obj, "angularVelocityZ", index);
    validateBoolean(obj, "displayArm", index);
    validateBoolean(obj, "draw", index);
    validateColor(obj, "lineColor", index);
    validateColor(obj, "armColor", index);

    return createDefaultArm3D({
      length: obj.length as number,
      initialAngleX: obj.initialAngleX as number,
      initialAngleY: obj.initialAngleY as number,
      initialAngleZ: obj.initialAngleZ as number,
      angularVelocityX: obj.angularVelocityX as number,
      angularVelocityY: obj.angularVelocityY as number,
      angularVelocityZ: obj.angularVelocityZ as number,
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
