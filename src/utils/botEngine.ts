import type {
  Bet,
  BetColor,
  LockedStreak,
  Series,
  SeriesStatus,
  SessionStatus,
  Settings,
  Signal,
  SpinResult
} from "../types";
import { analyzeHistory } from "./strategyEngine";
import { getCurrentStreak } from "./streakUtils";

export type BlockedReason = "bankroll" | "maxBetAmount" | "maxBetPercentOfBankroll";

export type BotUpdate = {
  balance: number;
  betLog: Bet[];
  activeSeries?: Series;
  seriesLog: Series[];
  lockedStreak?: LockedStreak;
  latestSignal?: Signal;
  sessionStatus?: SessionStatus;
  blockedBet?: {
    signal: Signal;
    attemptedAmount: number;
    balanceBeforeAttempt: number;
    reason: BlockedReason;
    message: string;
  };
};

export type BotInput = {
  history: SpinResult[];
  balance: number;
  betLog: Bet[];
  settings: Settings;
  activeSeries?: Series;
  seriesLog: Series[];
  lockedStreak?: LockedStreak;
  sessionStartBalance: number;
  sessionStatus: SessionStatus;
};

export function getPendingBet(betLog: Bet[]): Bet | undefined {
  return betLog.find((bet) => bet.outcome === undefined);
}

export function getNextSeriesId(activeSeries: Series | undefined, seriesLog: Series[]): number {
  return Math.max(activeSeries?.id ?? 0, ...seriesLog.map((series) => series.id), 0) + 1;
}

export function getProgressionAmount(baseBet: number, step: number): number {
  return baseBet * 2 ** Math.max(0, step - 1);
}

export function resolveBet(bet: Bet, spin: SpinResult, balance: number): Bet {
  const outcome = spin.color === bet.betColor ? "win" : "loss";
  const profit = outcome === "win" ? bet.amount : -bet.amount;

  return {
    ...bet,
    balanceBefore: bet.balanceBefore ?? balance,
    resolvedAtSpinId: spin.id,
    resultColor: spin.color,
    outcome,
    profit,
    balanceAfter: balance + profit
  };
}

export function placeBet(
  signal: Signal,
  placedAtSpinId: number,
  nextBetId: number,
  balanceBefore: number,
  seriesId: number,
  progressionStep: number
): Bet {
  return {
    id: nextBetId,
    signal,
    betColor: signal.suggestedBetColor,
    amount: signal.amount,
    placedAtSpinId,
    balanceBefore,
    seriesId,
    progressionStep
  };
}

function closeSeries(series: Series, status: SeriesStatus, endedAtSpinId: number, balanceAfter: number): Series {
  return {
    ...series,
    status,
    endedAtSpinId,
    balanceAfter
  };
}

function addSeriesBet(series: Series, amount: number, step: number): Series {
  return {
    ...series,
    currentStep: step,
    bets: [...series.bets, amount],
    totalStaked: series.totalStaked + amount
  };
}

function addSeriesProfit(series: Series, profit: number, balanceAfter: number): Series {
  return {
    ...series,
    netProfit: series.netProfit + profit,
    balanceAfter
  };
}

function blockedStatus(reason: BlockedReason): SeriesStatus {
  return reason === "bankroll" ? "blocked_bankroll" : "blocked_max_bet";
}

function blockedMessage(reason: BlockedReason): string {
  if (reason === "bankroll") {
    return "Saldot räcker inte för nästa bet.";
  }

  if (reason === "maxBetAmount") {
    return "Nästa bet är större än maxBetAmount.";
  }

  return "Nästa bet är större än maxBetPercentOfBankroll.";
}

export function getBlockedReason(amount: number, balance: number, settings: Settings): BlockedReason | undefined {
  if (amount > balance) {
    return "bankroll";
  }

  if (amount > settings.maxBetAmount) {
    return "maxBetAmount";
  }

  if (balance > 0 && amount > balance * (settings.maxBetPercentOfBankroll / 100)) {
    return "maxBetPercentOfBankroll";
  }

  return undefined;
}

function shouldReleaseLock(lockedStreak: LockedStreak | undefined, history: SpinResult[]): boolean {
  if (!lockedStreak) {
    return false;
  }

  const currentStreak = getCurrentStreak(history);
  return currentStreak.color !== lockedStreak.color;
}

function shouldContinueSeries(series: Series, history: SpinResult[]): boolean {
  const currentStreak = getCurrentStreak(history);
  return currentStreak.color === series.triggerColor && currentStreak.length > series.triggerLength;
}

function createSeries(signal: Signal, settings: Settings, seriesId: number): Series {
  return {
    id: seriesId,
    startedAtSpinId: signal.createdAtSpinId,
    triggerColor: signal.streakColor,
    triggerLength: signal.streakLength,
    betColor: signal.suggestedBetColor,
    baseBet: settings.betAmount,
    progressionMode: settings.progressionMode,
    maxSteps: settings.maxProgressionSteps,
    currentStep: 0,
    bets: [],
    totalStaked: 0,
    netProfit: 0,
    status: "active"
  };
}

function signalFromSeries(series: Series, amount: number, createdAtSpinId: number): Signal {
  return {
    streakColor: series.triggerColor,
    streakLength: series.triggerLength,
    suggestedBetColor: series.betColor,
    amount,
    createdAtSpinId
  };
}

function checkSessionStop(balance: number, sessionStartBalance: number, settings: Settings): "profit_target" | undefined {
  const sessionProfit = balance - sessionStartBalance;

  if (settings.stopOnProfitTarget && sessionProfit >= settings.profitTarget) {
    return "profit_target";
  }

  return undefined;
}

function placeSeriesBet(
  series: Series,
  signal: Signal,
  spinId: number,
  balance: number,
  betLog: Bet[],
  settings: Settings
): { betLog: Bet[]; series: Series; blocked?: BotUpdate["blockedBet"] } {
  const blockedReason = getBlockedReason(signal.amount, balance, settings);

  if (blockedReason) {
    return {
      betLog,
      series,
      blocked: {
        signal,
        attemptedAmount: signal.amount,
        balanceBeforeAttempt: balance,
        reason: blockedReason,
        message: blockedMessage(blockedReason)
      }
    };
  }

  const nextBetId = betLog.reduce((maxId, bet) => Math.max(maxId, bet.id), 0) + 1;
  const nextStep = series.currentStep + 1;
  const bet = placeBet(signal, spinId, nextBetId, balance, series.id, nextStep);

  return {
    betLog: [...betLog, bet],
    series: addSeriesBet(series, signal.amount, nextStep)
  };
}

export function processBotSpin(input: BotInput): BotUpdate {
  const latestSpin = input.history.at(-1);

  if (!latestSpin) {
    return {
      balance: input.balance,
      betLog: input.betLog,
      activeSeries: input.activeSeries,
      seriesLog: input.seriesLog,
      lockedStreak: input.lockedStreak,
      sessionStatus: input.sessionStatus === "running" ? "running" : undefined
    };
  }

  let nextBalance = input.balance;
  let nextBetLog = input.betLog;
  let nextActiveSeries = input.activeSeries;
  let nextSeriesLog = input.seriesLog;
  let nextLockedStreak = shouldReleaseLock(input.lockedStreak, input.history) ? undefined : input.lockedStreak;
  let latestSignal: Signal | undefined;

  const pendingBet = getPendingBet(nextBetLog);
  if (pendingBet && pendingBet.placedAtSpinId < latestSpin.id) {
    const resolvedBet = resolveBet(pendingBet, latestSpin, nextBalance);
    nextBalance = resolvedBet.balanceAfter ?? nextBalance;
    nextBetLog = nextBetLog.map((bet) => (bet.id === resolvedBet.id ? resolvedBet : bet));

    if (nextActiveSeries && pendingBet.seriesId === nextActiveSeries.id) {
      nextActiveSeries = addSeriesProfit(nextActiveSeries, resolvedBet.profit ?? 0, nextBalance);

      if (resolvedBet.outcome === "win") {
        nextSeriesLog = [...nextSeriesLog, closeSeries(nextActiveSeries, "won", latestSpin.id, nextBalance)];
        nextActiveSeries = undefined;
      } else if (
        nextActiveSeries.progressionMode === "cappedMartingale" &&
        nextActiveSeries.currentStep >= nextActiveSeries.maxSteps
      ) {
        const closedSeries = closeSeries(nextActiveSeries, "lost_capped", latestSpin.id, nextBalance);
        nextSeriesLog = [...nextSeriesLog, closedSeries];

        if (input.settings.lockAfterCappedLoss && !input.settings.allowReentryOnSameStreak) {
          nextLockedStreak = {
            color: closedSeries.triggerColor,
            startedAtSpinId: closedSeries.startedAtSpinId,
            lockedAtSpinId: latestSpin.id,
            streakLength: getCurrentStreak(input.history).length
          };
        }

        nextActiveSeries = undefined;
      }
    }
  }

  const sessionStop = checkSessionStop(nextBalance, input.sessionStartBalance, input.settings);
  if (sessionStop) {
    if (nextActiveSeries) {
      nextSeriesLog = [...nextSeriesLog, closeSeries(nextActiveSeries, "stopped_session", latestSpin.id, nextBalance)];
      nextActiveSeries = undefined;
    }

    return {
      balance: nextBalance,
      betLog: nextBetLog,
      activeSeries: nextActiveSeries,
      seriesLog: nextSeriesLog,
      lockedStreak: nextLockedStreak,
      sessionStatus: sessionStop
    };
  }

  if (input.sessionStatus !== "running" || !input.settings.botEnabled || getPendingBet(nextBetLog)) {
    return {
      balance: nextBalance,
      betLog: nextBetLog,
      activeSeries: nextActiveSeries,
      seriesLog: nextSeriesLog,
      lockedStreak: nextLockedStreak,
      sessionStatus: input.sessionStatus === "running" ? "running" : undefined
    };
  }

  if (nextActiveSeries) {
    if (!shouldContinueSeries(nextActiveSeries, input.history)) {
      nextSeriesLog = [
        ...nextSeriesLog,
        closeSeries(nextActiveSeries, "lost_streak_broken", latestSpin.id, nextBalance)
      ];

      return {
        balance: nextBalance,
        betLog: nextBetLog,
        activeSeries: undefined,
        seriesLog: nextSeriesLog,
        lockedStreak: nextLockedStreak,
        sessionStatus: "running"
      };
    }

    const nextAmount = getProgressionAmount(nextActiveSeries.baseBet, nextActiveSeries.currentStep + 1);
    latestSignal = signalFromSeries(nextActiveSeries, nextAmount, latestSpin.id);
    const placed = placeSeriesBet(nextActiveSeries, latestSignal, latestSpin.id, nextBalance, nextBetLog, input.settings);

    if (placed.blocked) {
      nextSeriesLog = [
        ...nextSeriesLog,
        closeSeries(nextActiveSeries, blockedStatus(placed.blocked.reason), latestSpin.id, nextBalance)
      ];

      return {
        balance: nextBalance,
        betLog: nextBetLog,
        activeSeries: undefined,
        seriesLog: nextSeriesLog,
        lockedStreak: nextLockedStreak,
        latestSignal,
        blockedBet: placed.blocked,
        sessionStatus: "running"
      };
    }

    return {
      balance: nextBalance,
      betLog: placed.betLog,
      activeSeries: placed.series,
      seriesLog: nextSeriesLog,
      lockedStreak: nextLockedStreak,
      latestSignal,
      sessionStatus: "running"
    };
  }

  if (nextLockedStreak && !input.settings.allowReentryOnSameStreak) {
    return {
      balance: nextBalance,
      betLog: nextBetLog,
      activeSeries: undefined,
      seriesLog: nextSeriesLog,
      lockedStreak: nextLockedStreak,
      sessionStatus: "running"
    };
  }

  latestSignal = analyzeHistory(input.history, input.settings);

  if (!latestSignal) {
    return {
      balance: nextBalance,
      betLog: nextBetLog,
      activeSeries: undefined,
      seriesLog: nextSeriesLog,
      lockedStreak: nextLockedStreak,
      sessionStatus: "running"
    };
  }

  const nextSeries = createSeries(latestSignal, input.settings, getNextSeriesId(nextActiveSeries, nextSeriesLog));
  const placed = placeSeriesBet(nextSeries, latestSignal, latestSpin.id, nextBalance, nextBetLog, input.settings);

  if (placed.blocked) {
    nextSeriesLog = [
      ...nextSeriesLog,
      closeSeries(nextSeries, blockedStatus(placed.blocked.reason), latestSpin.id, nextBalance)
    ];

    return {
      balance: nextBalance,
      betLog: nextBetLog,
      activeSeries: undefined,
      seriesLog: nextSeriesLog,
      lockedStreak: nextLockedStreak,
      latestSignal,
      blockedBet: placed.blocked,
      sessionStatus: "running"
    };
  }

  return {
    balance: nextBalance,
    betLog: placed.betLog,
    activeSeries: placed.series,
    seriesLog: nextSeriesLog,
    lockedStreak: nextLockedStreak,
    latestSignal,
    sessionStatus: "running"
  };
}
