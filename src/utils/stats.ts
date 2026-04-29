import type { AppState, BankrollStats, Bet, Series } from "../types";
import { START_BALANCE } from "./storage";

export function calculateStats(
  betLog: Bet[],
  seriesLog: Series[],
  lockedStreakCount: number,
  sessionStopCounts: AppState["sessionStopCounts"]
): BankrollStats {
  const resolvedBets = betLog.filter((bet) => bet.outcome !== undefined);
  const totalProfit = resolvedBets.reduce((sum, bet) => sum + (bet.profit ?? 0), 0);
  const totalStaked = resolvedBets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalWon = resolvedBets
    .filter((bet) => (bet.profit ?? 0) > 0)
    .reduce((sum, bet) => sum + (bet.profit ?? 0), 0);
  const totalLost = Math.abs(
    resolvedBets.filter((bet) => (bet.profit ?? 0) < 0).reduce((sum, bet) => sum + (bet.profit ?? 0), 0)
  );
  const wonBets = resolvedBets.filter((bet) => bet.outcome === "win").length;
  const lostBets = resolvedBets.filter((bet) => bet.outcome === "loss").length;
  let peakBalance = START_BALANCE;
  let maxDrawdown = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;

  for (const bet of resolvedBets) {
    const balanceAfter = bet.balanceAfter ?? START_BALANCE;
    peakBalance = Math.max(peakBalance, balanceAfter);
    maxDrawdown = Math.max(maxDrawdown, peakBalance - balanceAfter);

    if (bet.outcome === "win") {
      currentWinStreak += 1;
      currentLossStreak = 0;
    } else {
      currentLossStreak += 1;
      currentWinStreak = 0;
    }

    longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
  }

  const maxBet = resolvedBets.reduce((maxAmount, bet) => Math.max(maxAmount, bet.amount), 0);
  const martingaleEscalations = resolvedBets.filter(
    (bet, index) => index > 0 && bet.amount > resolvedBets[index - 1].amount
  ).length;
  const closedSeries = seriesLog.filter((series) => series.status !== "active");
  const wonSeries = closedSeries.filter((series) => series.status === "won").length;
  const cappedLosses = closedSeries.filter((series) => series.status === "lost_capped").length;
  const blockedSeries = closedSeries.filter(
    (series) => series.status === "blocked_bankroll" || series.status === "blocked_max_bet"
  ).length;
  const seriesProfits = closedSeries.map((series) => series.netProfit);

  return {
    totalProfit,
    totalStaked,
    totalBets: resolvedBets.length,
    wonBets,
    lostBets,
    winRate: resolvedBets.length === 0 ? 0 : (wonBets / resolvedBets.length) * 100,
    roi: totalStaked === 0 ? 0 : (totalProfit / totalStaked) * 100,
    averageBet: resolvedBets.length === 0 ? 0 : totalStaked / resolvedBets.length,
    maxBet,
    maxDrawdown,
    longestWinStreak,
    longestLossStreak,
    profitFactor: totalLost === 0 ? totalWon : totalWon / totalLost,
    expectancy: resolvedBets.length === 0 ? 0 : totalProfit / resolvedBets.length,
    greenLosses: resolvedBets.filter((bet) => bet.resultColor === "green").length,
    martingaleEscalations,
    totalSeries: closedSeries.length,
    wonSeries,
    cappedLosses,
    blockedSeries,
    seriesWinRate: closedSeries.length === 0 ? 0 : (wonSeries / closedSeries.length) * 100,
    averageSeriesProfit:
      closedSeries.length === 0 ? 0 : seriesProfits.reduce((sum, profit) => sum + profit, 0) / closedSeries.length,
    bestSeries: seriesProfits.length === 0 ? 0 : Math.max(...seriesProfits),
    worstSeries: seriesProfits.length === 0 ? 0 : Math.min(...seriesProfits),
    lockedStreakCount,
    sessionsStoppedByTarget: sessionStopCounts.profitTarget
  };
}
