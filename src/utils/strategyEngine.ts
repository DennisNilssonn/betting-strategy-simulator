import type { BetColor, Settings, Signal, SpinResult, Strategy } from "../types";
import { getCurrentStreak } from "./streakUtils";

export type StrategyInput = Pick<Settings, "betAmount" | "strategy" | "streakThreshold">;

function oppositeColor(color: BetColor): BetColor {
  return color === "red" ? "black" : "red";
}

export function suggestBetColor(streakColor: BetColor, strategy: Strategy): BetColor {
  return strategy === "opposite" ? oppositeColor(streakColor) : streakColor;
}

export function analyzeHistory(history: SpinResult[], settings: StrategyInput): Signal | undefined {
  const currentStreak = getCurrentStreak(history);
  const latestSpin = history.at(-1);

  if (!currentStreak.color || !latestSpin) {
    return undefined;
  }

  const threshold = Math.max(2, Math.floor(settings.streakThreshold));
  if (currentStreak.length !== threshold) {
    return undefined;
  }

  return {
    streakColor: currentStreak.color,
    streakLength: currentStreak.length,
    suggestedBetColor: suggestBetColor(currentStreak.color, settings.strategy),
    amount: settings.betAmount,
    createdAtSpinId: latestSpin.id
  };
}
