import { describe, expect, it } from "vitest";
import type { Color, Settings, SpinResult } from "../types";
import { defaultSettings } from "./storage";
import { analyzeHistory } from "./strategyEngine";

const baseSettings: Settings = {
  ...defaultSettings,
  botEnabled: true,
  betAmount: 10,
  strategy: "opposite",
  streakThreshold: 5,
  spinIntervalMs: 1000
};

function historyFromColors(colors: Color[]): SpinResult[] {
  return colors.map((color, index) => ({
    id: index + 1,
    color,
    timestamp: index
  }));
}

describe("strategyEngine", () => {
  it("creates a signal after 5 red in a row", () => {
    const signal = analyzeHistory(historyFromColors(["red", "red", "red", "red", "red"]), baseSettings);

    expect(signal).toMatchObject({
      streakColor: "red",
      streakLength: 5,
      suggestedBetColor: "black"
    });
  });

  it("creates a signal after 5 black in a row", () => {
    const signal = analyzeHistory(historyFromColors(["black", "black", "black", "black", "black"]), baseSettings);

    expect(signal).toMatchObject({
      streakColor: "black",
      streakLength: 5,
      suggestedBetColor: "red"
    });
  });

  it("does not create a signal for mixed colors", () => {
    const signal = analyzeHistory(historyFromColors(["red", "red", "black", "red", "red"]), baseSettings);

    expect(signal).toBeUndefined();
  });

  it("green breaks the streak", () => {
    const signal = analyzeHistory(historyFromColors(["red", "red", "green", "red", "red", "red"]), baseSettings);

    expect(signal).toBeUndefined();
  });

  it("opposite suggests the opposite color", () => {
    const signal = analyzeHistory(historyFromColors(["red", "red", "red", "red", "red"]), {
      ...baseSettings,
      strategy: "opposite"
    });

    expect(signal?.suggestedBetColor).toBe("black");
  });

  it("same suggests the streak color", () => {
    const signal = analyzeHistory(historyFromColors(["red", "red", "red", "red", "red"]), {
      ...baseSettings,
      strategy: "same"
    });

    expect(signal?.suggestedBetColor).toBe("red");
  });

  it("can signal after a custom threshold of 4", () => {
    const signal = analyzeHistory(historyFromColors(["black", "black", "black", "black"]), {
      ...baseSettings,
      streakThreshold: 4
    });

    expect(signal).toMatchObject({
      streakColor: "black",
      streakLength: 4,
      suggestedBetColor: "red"
    });
  });

  it("waits for a custom threshold of 7", () => {
    const signal = analyzeHistory(historyFromColors(["red", "red", "red", "red", "red"]), {
      ...baseSettings,
      streakThreshold: 7
    });

    expect(signal).toBeUndefined();
  });
});
