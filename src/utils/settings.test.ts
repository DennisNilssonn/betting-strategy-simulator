import { describe, expect, it } from "vitest";
import { normalizeSettings } from "./settings";

describe("settings", () => {
  it("normalizes user editable numeric settings", () => {
    const settings = normalizeSettings({
      betAmount: -10,
      streakThreshold: 1.8,
      maxProgressionSteps: 0,
      profitTarget: 0,
      maxBetAmount: 0,
      maxBetPercentOfBankroll: 0,
      spinIntervalMs: 0,
      progressionMode: "cappedMartingale",
      strategy: "same"
    });

    expect(settings).toMatchObject({
      betAmount: 1,
      streakThreshold: 2,
      maxProgressionSteps: 1,
      profitTarget: 1,
      maxBetAmount: 1,
      maxBetPercentOfBankroll: 0.1,
      spinIntervalMs: 1,
      progressionMode: "cappedMartingale",
      strategy: "same"
    });
  });

  it("migrates legacy progression settings safely", () => {
    expect(normalizeSettings({ progressionMode: "flat" }).progressionMode).toBe("martingale");
    expect(normalizeSettings({ martingaleEnabled: true }).progressionMode).toBe("martingale");
  });

  it("falls back from invalid option values", () => {
    const settings = normalizeSettings({
      progressionMode: "unknown",
      strategy: "chase"
    });

    expect(settings.progressionMode).toBe("martingale");
    expect(settings.strategy).toBe("opposite");
  });
});
