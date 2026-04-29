import type { Color, SpinResult } from "../types";

export function generateColor(): Color {
  const roll = Math.floor(Math.random() * 37);

  if (roll === 0) {
    return "green";
  }

  return roll <= 18 ? "red" : "black";
}

export function createSpinResult(nextId: number, color: Color = generateColor()): SpinResult {
  return {
    id: nextId,
    color,
    timestamp: Date.now()
  };
}
