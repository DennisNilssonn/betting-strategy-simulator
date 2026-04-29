import type { AppState } from "../types";
import { defaultSettings, normalizeSettings, type StoredSettings } from "./settings";

const STORAGE_KEY = "betting-strategy-simulator-v1";

export const START_BALANCE = 1000;

export { defaultSettings } from "./settings";

export const defaultAppState: AppState = {
  history: [],
  balance: START_BALANCE,
  betLog: [],
  settings: defaultSettings,
  activeSeries: undefined,
  seriesLog: [],
  lockedStreak: undefined,
  sessionStartBalance: START_BALANCE,
  sessionStatus: "running",
  sessionStopCounts: {
    profitTarget: 0
  }
};

export function loadState(): AppState {
  try {
    const rawState = localStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return defaultAppState;
    }

    const parsed = JSON.parse(rawState) as Partial<AppState>;
    const settings = normalizeSettings(parsed.settings as StoredSettings | undefined);

    return {
      history: parsed.history ?? [],
      balance: typeof parsed.balance === "number" ? parsed.balance : START_BALANCE,
      betLog: parsed.betLog ?? [],
      settings,
      activeSeries: parsed.activeSeries,
      seriesLog: parsed.seriesLog ?? [],
      lockedStreak: parsed.lockedStreak,
      sessionStartBalance:
        typeof parsed.sessionStartBalance === "number" ? parsed.sessionStartBalance : START_BALANCE,
      sessionStatus: parsed.sessionStatus ?? "running",
      sessionStopCounts: {
        profitTarget: parsed.sessionStopCounts?.profitTarget ?? 0
      }
    };
  } catch {
    return defaultAppState;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
