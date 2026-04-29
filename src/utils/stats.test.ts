import { describe, expect, it } from "vitest";
import type { Bet, Series } from "../types";
import { calculateStats } from "./stats";

const sessionStopCounts = {
  profitTarget: 0
};

describe("stats", () => {
  it("summarizes resolved bets and closed series", () => {
    const betLog: Bet[] = [
      {
        id: 1,
        signal: { streakColor: "red", streakLength: 3, suggestedBetColor: "black", amount: 10, createdAtSpinId: 3 },
        betColor: "black",
        amount: 10,
        placedAtSpinId: 3,
        outcome: "win",
        profit: 10,
        resultColor: "black",
        balanceAfter: 1010
      },
      {
        id: 2,
        signal: { streakColor: "red", streakLength: 3, suggestedBetColor: "black", amount: 20, createdAtSpinId: 4 },
        betColor: "black",
        amount: 20,
        placedAtSpinId: 4,
        outcome: "loss",
        profit: -20,
        resultColor: "green",
        balanceAfter: 990
      },
      {
        id: 3,
        signal: { streakColor: "black", streakLength: 3, suggestedBetColor: "red", amount: 10, createdAtSpinId: 5 },
        betColor: "red",
        amount: 10,
        placedAtSpinId: 5
      }
    ];
    const seriesLog: Series[] = [
      {
        id: 1,
        startedAtSpinId: 3,
        triggerColor: "red",
        triggerLength: 3,
        betColor: "black",
        baseBet: 10,
        progressionMode: "cappedMartingale",
        maxSteps: 3,
        currentStep: 2,
        bets: [10, 20],
        totalStaked: 30,
        netProfit: -10,
        status: "lost_capped"
      },
      {
        id: 2,
        startedAtSpinId: 5,
        triggerColor: "black",
        triggerLength: 3,
        betColor: "red",
        baseBet: 10,
        progressionMode: "martingale",
        maxSteps: 3,
        currentStep: 0,
        bets: [],
        totalStaked: 0,
        netProfit: 0,
        status: "blocked_bankroll"
      }
    ];

    const stats = calculateStats(betLog, seriesLog, 1, sessionStopCounts);

    expect(stats).toMatchObject({
      totalProfit: -10,
      totalStaked: 30,
      totalBets: 2,
      wonBets: 1,
      lostBets: 1,
      maxBet: 20,
      maxDrawdown: 20,
      greenLosses: 1,
      martingaleEscalations: 1,
      totalSeries: 2,
      cappedLosses: 1,
      blockedSeries: 1,
      lockedStreakCount: 1
    });
  });
});
