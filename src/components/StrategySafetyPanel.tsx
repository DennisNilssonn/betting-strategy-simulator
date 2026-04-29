import type { LockedStreak, Series, Settings, SessionStatus } from "../types";
import { formatCurrency, formatPercent, formatProgressionMode, formatSessionStatus } from "../utils/format";

type StrategySafetyPanelProps = {
  settings: Settings;
  balance: number;
  activeSeries?: Series;
  lockedStreak?: LockedStreak;
  sessionStartBalance: number;
  sessionStatus: SessionStatus;
};

function getNextBetAmount(settings: Settings, activeSeries?: Series): number {
  if (!activeSeries) {
    return settings.betAmount;
  }

  return activeSeries.baseBet * 2 ** activeSeries.currentStep;
}

function getMaxCappedLoss(settings: Settings): number {
  if (settings.progressionMode !== "cappedMartingale") {
    return 0;
  }

  return Array.from({ length: settings.maxProgressionSteps }).reduce<number>(
    (sum, _value, index) => sum + settings.betAmount * 2 ** index,
    0
  );
}

function getRiskLevel(nextBet: number, balance: number, settings: Settings): "Low" | "Medium" | "High" | "Critical" {
  if (balance <= 0 || nextBet > balance || nextBet > settings.maxBetAmount || nextBet > balance * (settings.maxBetPercentOfBankroll / 100)) {
    return "Critical";
  }

  const percent = nextBet / balance * 100;

  if (percent <= 1) {
    return "Low";
  }

  if (percent <= 3) {
    return "Medium";
  }

  if (percent <= 10) {
    return "High";
  }

  return "Critical";
}

function formatRiskLevel(riskLevel: ReturnType<typeof getRiskLevel>): string {
  if (riskLevel === "Low") {
    return "Låg";
  }

  if (riskLevel === "Medium") {
    return "Medel";
  }

  if (riskLevel === "High") {
    return "Hög";
  }

  return "Kritisk";
}

export function StrategySafetyPanel({
  settings,
  balance,
  activeSeries,
  lockedStreak,
  sessionStartBalance,
  sessionStatus
}: StrategySafetyPanelProps) {
  const nextBet = getNextBetAmount(settings, activeSeries);
  const sessionProfit = balance - sessionStartBalance;
  const riskLevel = getRiskLevel(nextBet, balance, settings);
  const cappedLoss = getMaxCappedLoss(settings);
  const nextBetPercent = balance <= 0 ? 0 : nextBet / balance * 100;

  return (
    <section className="panel safety-panel">
      <div className="panel-header">
        <div>
          <h2>Risk & strategi</h2>
          <p className="panel-kicker">Nästa bet, lås och sessionstak</p>
        </div>
        <span className={`pill risk-${riskLevel.toLowerCase()}`}>{formatRiskLevel(riskLevel)}</span>
      </div>

      <div className="stat-grid compact">
        <div>
          <span>Insatsmodell</span>
          <strong>{formatProgressionMode(settings.progressionMode)}</strong>
        </div>
        <div>
          <span>Aktiv serie</span>
          <strong>{activeSeries ? `Serie #${activeSeries.id}, steg ${activeSeries.currentStep}` : "Ingen aktiv serie"}</strong>
        </div>
        <div>
          <span>Nästa möjliga bet</span>
          <strong>{formatCurrency(nextBet)}</strong>
          <small>{formatPercent(nextBetPercent)} av saldo</small>
        </div>
        {settings.progressionMode === "cappedMartingale" ? (
          <div>
            <span>Max förlust per capped-serie</span>
            <strong>{formatCurrency(cappedLoss)}</strong>
          </div>
        ) : null}
        <div>
          <span>Streak-lås</span>
          <strong>{lockedStreak ? `Väntar tills ${lockedStreak.color}-streaken bryts` : "Inget lås"}</strong>
        </div>
        <div>
          <span>Session</span>
          <strong>{sessionStatus === "running" ? formatCurrency(sessionProfit) : formatSessionStatus(sessionStatus)}</strong>
        </div>
        <div>
          <span>Kvar till target</span>
          <strong>{formatCurrency(Math.max(0, settings.profitTarget - sessionProfit))}</strong>
        </div>
      </div>
    </section>
  );
}
