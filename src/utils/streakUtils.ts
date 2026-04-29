import type { BetColor, SpinResult } from "../types";

export type Streak = {
  color?: BetColor;
  length: number;
};

export function getCurrentStreak(history: SpinResult[]): Streak {
  let color: BetColor | undefined;
  let length = 0;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const result = history[index];

    if (result.color === "green") {
      break;
    }

    if (!color) {
      color = result.color;
      length = 1;
      continue;
    }

    if (result.color !== color) {
      break;
    }

    length += 1;
  }

  return { color, length };
}
