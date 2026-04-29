import { describe, expect, it } from "vitest";
import type { AppState, Color, Settings, SpinResult } from "../types";
import { defaultSettings, START_BALANCE } from "./storage";
import { processBotSpin } from "./botEngine";

const settings: Settings = {
  ...defaultSettings,
  botEnabled: true,
  betAmount: 10,
  strategy: "opposite",
  streakThreshold: 3,
  progressionMode: "martingale",
  maxBetAmount: 1000,
  maxBetPercentOfBankroll: 100
};

function historyFromColors(colors: Color[]): SpinResult[] {
  return colors.map((color, index) => ({
    id: index + 1,
    color,
    timestamp: index
  }));
}

function stateWith(colors: Color[], balance = START_BALANCE, override: Partial<Settings> = {}): AppState {
  return {
    history: historyFromColors(colors),
    balance,
    betLog: [],
    settings: {
      ...settings,
      ...override
    },
    seriesLog: [],
    sessionStartBalance: balance,
    sessionStatus: "running",
    sessionStopCounts: {
      profitTarget: 0
    }
  };
}

function processState(state: AppState): AppState {
  const update = processBotSpin({
    history: state.history,
    balance: state.balance,
    betLog: state.betLog,
    settings: state.settings,
    activeSeries: state.activeSeries,
    seriesLog: state.seriesLog,
    lockedStreak: state.lockedStreak,
    sessionStartBalance: state.sessionStartBalance,
    sessionStatus: state.sessionStatus
  });

  return {
    ...state,
    balance: update.balance,
    betLog: update.betLog,
    activeSeries: update.activeSeries,
    seriesLog: update.seriesLog,
    lockedStreak: update.lockedStreak,
    sessionStatus: update.sessionStatus ?? state.sessionStatus
  };
}

function appendSpin(state: AppState, color: Color): AppState {
  return {
    ...state,
    history: [
      ...state.history,
      {
        id: state.history.length + 1,
        color,
        timestamp: state.history.length
      }
    ]
  };
}

describe("botEngine", () => {
  it("places a bet after a signal", () => {
    const update = processState(stateWith(["red", "red", "red"]));

    expect(update.betLog).toHaveLength(1);
    expect(update.betLog[0]).toMatchObject({
      betColor: "black",
      amount: 10,
      placedAtSpinId: 3,
      balanceBefore: 1000
    });
  });

  it("resolves the bet on the next spin", () => {
    const firstUpdate = processState(stateWith(["red", "red", "red"]));
    const secondUpdate = processState(appendSpin(firstUpdate, "black"));

    expect(secondUpdate.betLog[0]).toMatchObject({
      resolvedAtSpinId: 4,
      resultColor: "black",
      outcome: "win",
      profit: 10,
      balanceAfter: 1010
    });
  });

  it("green makes the bet lose", () => {
    const firstUpdate = processState(stateWith(["red", "red", "red"]));
    const secondUpdate = processState(appendSpin(firstUpdate, "green"));

    expect(secondUpdate.betLog[0]).toMatchObject({
      resultColor: "green",
      outcome: "loss",
      profit: -10,
      balanceAfter: 990
    });
  });

  it("cappedMartingale with baseBet 10 and maxProgressionSteps 3 gives 10, 20, 40", () => {
    let state = processState(stateWith(["black", "black", "black"], 1000, {
      progressionMode: "cappedMartingale",
      maxProgressionSteps: 3
    }));
    state = processState(appendSpin(state, "black"));
    state = processState(appendSpin(state, "black"));

    expect(state.betLog.map((bet) => bet.amount)).toEqual([10, 20, 40]);
  });

  it("after three capped losses closes series as lost_capped with -70 and does not place 80", () => {
    let state = processState(stateWith(["black", "black", "black"], 1000, {
      progressionMode: "cappedMartingale",
      maxProgressionSteps: 3
    }));
    state = processState(appendSpin(state, "black"));
    state = processState(appendSpin(state, "black"));
    state = processState(appendSpin(state, "black"));

    expect(state.betLog.map((bet) => bet.amount)).toEqual([10, 20, 40]);
    expect(state.seriesLog[0]).toMatchObject({
      status: "lost_capped",
      totalStaked: 70,
      netProfit: -70
    });
    expect(state.activeSeries).toBeUndefined();
  });

  it("locked streak prevents new bets on the same streak", () => {
    let state = processState(stateWith(["red", "red", "red"], 1000, {
      progressionMode: "cappedMartingale",
      maxProgressionSteps: 2
    }));
    state = processState(appendSpin(state, "red"));
    state = processState(appendSpin(state, "red"));
    state = processState(appendSpin(state, "red"));

    expect(state.lockedStreak).toMatchObject({ color: "red" });
    expect(state.betLog.map((bet) => bet.amount)).toEqual([10, 20]);
  });

  it("locked streak releases when the streak breaks", () => {
    let state = processState(stateWith(["red", "red", "red"], 1000, {
      progressionMode: "cappedMartingale",
      maxProgressionSteps: 2
    }));
    state = processState(appendSpin(state, "red"));
    state = processState(appendSpin(state, "red"));
    state = processState(appendSpin(state, "black"));

    expect(state.lockedStreak).toBeUndefined();
  });

  it("profit target stops the session", () => {
    const firstUpdate = processState(stateWith(["red", "red", "red"], 1000, {
      profitTarget: 10
    }));
    const secondUpdate = processState(appendSpin(firstUpdate, "black"));

    expect(secondUpdate.sessionStatus).toBe("profit_target");
  });

  it("maxBetAmount blocks a too large bet", () => {
    const update = processBotSpin({
      ...stateWith(["red", "red", "red"], 1000, {
        maxBetAmount: 5
      })
    });

    expect(update.blockedBet?.reason).toBe("maxBetAmount");
    expect(update.seriesLog[0].status).toBe("blocked_max_bet");
  });

  it("maxBetPercentOfBankroll blocks a too large bet", () => {
    const update = processBotSpin({
      ...stateWith(["red", "red", "red"], 1000, {
        maxBetPercentOfBankroll: 0.5
      })
    });

    expect(update.blockedBet?.reason).toBe("maxBetPercentOfBankroll");
    expect(update.seriesLog[0].status).toBe("blocked_max_bet");
  });
});
