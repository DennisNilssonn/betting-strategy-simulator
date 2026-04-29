import type { Settings, Signal, SpinResult } from "../types";
import { formatColor, formatCurrency, formatProgressionMode, formatStrategy } from "../utils/format";
import { analyzeHistory } from "../utils/strategyEngine";
import { getCurrentStreak } from "../utils/streakUtils";

type SignalPanelProps = {
  history: SpinResult[];
  settings: Settings;
  latestSignal?: Signal;
};

export function SignalPanel({ history, settings, latestSignal }: SignalPanelProps) {
  const streak = getCurrentStreak(history);
  const latestSpin = history.at(-1);
  const freshBotSignal = latestSignal?.createdAtSpinId === latestSpin?.id ? latestSignal : undefined;
  const currentSignal = freshBotSignal ?? analyzeHistory(history, settings) ?? latestSignal;

  return (
    <section className="panel signal-panel">
      <div className="panel-header">
        <div>
          <h2>Signal</h2>
          <p className="panel-kicker">Nuvarande streak och nästa trigger</p>
        </div>
        <span className="pill">{formatStrategy(settings.strategy)}</span>
      </div>

      <p className="streak-line">
        Nuvarande streak: <strong>{streak.color ? `${formatColor(streak.color)} x ${streak.length}` : "ingen"}</strong>
      </p>
      <p className="streak-line">
        Tröskel: <strong>{settings.streakThreshold} i rad</strong>
        {" · "}
        {formatProgressionMode(settings.progressionMode)}
      </p>

      <div className={currentSignal ? "signal-box hot" : "signal-box"}>
        {currentSignal
          ? `Signal: ${currentSignal.streakLength} ${formatColor(currentSignal.streakColor).toLowerCase()} i rad. Bot föreslår ${formatCurrency(currentSignal.amount)} på ${formatColor(currentSignal.suggestedBetColor).toLowerCase()}.`
          : "Ingen aktiv signal just nu."}
      </div>
    </section>
  );
}
