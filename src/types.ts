export type Color = "red" | "black" | "green";

export type BetColor = "red" | "black";

export type Strategy = "same" | "opposite";

export type ProgressionMode = "martingale" | "cappedMartingale";

export type SessionStatus = "running" | "stopped" | "profit_target";

export type SeriesStatus =
  | "active"
  | "won"
  | "lost_streak_broken"
  | "lost_capped"
  | "blocked_bankroll"
  | "blocked_max_bet"
  | "stopped_session";

export type SpinResult = {
  id: number;
  color: Color;
  timestamp: number;
};

export type Signal = {
  streakColor: BetColor;
  streakLength: number;
  suggestedBetColor: BetColor;
  amount: number;
  createdAtSpinId: number;
};

export type Bet = {
  id: number;
  signal: Signal;
  betColor: BetColor;
  amount: number;
  placedAtSpinId: number;
  balanceBefore?: number;
  resolvedAtSpinId?: number;
  resultColor?: Color;
  outcome?: "win" | "loss";
  profit?: number;
  balanceAfter?: number;
  seriesId?: number;
  progressionStep?: number;
  blockedReason?: "bankroll" | "maxBetAmount" | "maxBetPercentOfBankroll";
};

export type Series = {
  id: number;
  startedAtSpinId: number;
  endedAtSpinId?: number;
  triggerColor: BetColor;
  triggerLength: number;
  betColor: BetColor;
  baseBet: number;
  progressionMode: ProgressionMode;
  maxSteps: number;
  currentStep: number;
  bets: number[];
  totalStaked: number;
  netProfit: number;
  status: SeriesStatus;
  balanceAfter?: number;
};

export type LockedStreak = {
  color: BetColor;
  startedAtSpinId: number;
  lockedAtSpinId: number;
  streakLength: number;
};

export type Settings = {
  botEnabled: boolean;
  betAmount: number;
  strategy: Strategy;
  streakThreshold: number;
  progressionMode: ProgressionMode;
  maxProgressionSteps: number;
  lockAfterCappedLoss: boolean;
  allowReentryOnSameStreak: boolean;
  profitTarget: number;
  stopOnProfitTarget: boolean;
  maxBetAmount: number;
  maxBetPercentOfBankroll: number;
  spinIntervalMs: number;
};

export type AppState = {
  history: SpinResult[];
  balance: number;
  betLog: Bet[];
  settings: Settings;
  activeSeries?: Series;
  seriesLog: Series[];
  lockedStreak?: LockedStreak;
  sessionStartBalance: number;
  sessionStatus: SessionStatus;
  sessionStopCounts: {
    profitTarget: number;
  };
};

export type BankrollStats = {
  totalProfit: number;
  totalStaked: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  roi: number;
  averageBet: number;
  maxBet: number;
  maxDrawdown: number;
  longestWinStreak: number;
  longestLossStreak: number;
  profitFactor: number;
  expectancy: number;
  greenLosses: number;
  martingaleEscalations: number;
  totalSeries: number;
  wonSeries: number;
  cappedLosses: number;
  blockedSeries: number;
  seriesWinRate: number;
  averageSeriesProfit: number;
  bestSeries: number;
  worstSeries: number;
  lockedStreakCount: number;
  sessionsStoppedByTarget: number;
};
