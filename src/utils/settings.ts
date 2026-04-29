import type { ProgressionMode, Settings, Strategy } from "../types";

export type StoredSettings = Partial<Omit<Settings, "progressionMode" | "strategy">> & {
  martingaleEnabled?: boolean;
  progressionMode?: unknown;
  stopOnBlockedBet?: boolean;
  strategy?: unknown;
};

export const defaultSettings: Settings = {
  botEnabled: false,
  betAmount: 10,
  strategy: "opposite",
  streakThreshold: 5,
  progressionMode: "martingale",
  maxProgressionSteps: 3,
  lockAfterCappedLoss: true,
  allowReentryOnSameStreak: false,
  profitTarget: 500,
  stopOnProfitTarget: true,
  maxBetAmount: 1000000,
  maxBetPercentOfBankroll: 100,
  spinIntervalMs: 1000
};

function isProgressionMode(value: unknown): value is ProgressionMode {
  return value === "martingale" || value === "cappedMartingale";
}

function isStrategy(value: unknown): value is Strategy {
  return value === "same" || value === "opposite";
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeSettings(storedSettings: StoredSettings | undefined): Settings {
  const { martingaleEnabled, progressionMode, stopOnBlockedBet: _stopOnBlockedBet, strategy, ...storedCurrentSettings } =
    storedSettings ?? {};
  const settings = {
    ...defaultSettings,
    ...storedCurrentSettings
  };

  return {
    ...settings,
    botEnabled: booleanValue(settings.botEnabled, defaultSettings.botEnabled),
    betAmount: Math.max(1, finiteNumber(settings.betAmount, defaultSettings.betAmount)),
    strategy: isStrategy(strategy) ? strategy : defaultSettings.strategy,
    streakThreshold: Math.max(2, Math.floor(finiteNumber(settings.streakThreshold, defaultSettings.streakThreshold))),
    progressionMode: isProgressionMode(progressionMode)
      ? progressionMode
      : !progressionMode && martingaleEnabled
        ? "martingale"
        : defaultSettings.progressionMode,
    maxProgressionSteps: Math.max(
      1,
      Math.floor(finiteNumber(settings.maxProgressionSteps, defaultSettings.maxProgressionSteps))
    ),
    lockAfterCappedLoss: booleanValue(settings.lockAfterCappedLoss, defaultSettings.lockAfterCappedLoss),
    allowReentryOnSameStreak: booleanValue(
      settings.allowReentryOnSameStreak,
      defaultSettings.allowReentryOnSameStreak
    ),
    profitTarget: Math.max(1, finiteNumber(settings.profitTarget, defaultSettings.profitTarget)),
    stopOnProfitTarget: booleanValue(settings.stopOnProfitTarget, defaultSettings.stopOnProfitTarget),
    maxBetAmount: Math.max(1, finiteNumber(settings.maxBetAmount, defaultSettings.maxBetAmount)),
    maxBetPercentOfBankroll: Math.max(
      0.1,
      finiteNumber(settings.maxBetPercentOfBankroll, defaultSettings.maxBetPercentOfBankroll)
    ),
    spinIntervalMs: Math.max(1, finiteNumber(settings.spinIntervalMs, defaultSettings.spinIntervalMs))
  };
}
