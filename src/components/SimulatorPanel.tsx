import type { Color } from "../types";
import { formatColor } from "../utils/format";

type SimulatorPanelProps = {
  latestColor?: Color;
  isAutoSpinning: boolean;
  intervalMs: number;
  onSpin: () => void;
  onStartAuto: () => void;
  onStopAuto: () => void;
  onIntervalChange: (value: number) => void;
};

export function SimulatorPanel({
  latestColor,
  isAutoSpinning,
  intervalMs,
  onSpin,
  onStartAuto,
  onStopAuto,
  onIntervalChange
}: SimulatorPanelProps) {
  return (
    <section className="panel simulator-panel">
      <div className="panel-header">
        <div>
          <h2>Simulering</h2>
          <p className="panel-kicker">{isAutoSpinning ? "Auto-spin aktiv" : "Manuell kontroll"}</p>
        </div>
        <span className={isAutoSpinning ? "status-dot active" : "status-dot"} aria-label="Körstatus" />
      </div>

      <div className={`latest-result ${latestColor ?? "empty"}`}>
        <span>Senaste spin</span>
        <strong>{formatColor(latestColor)}</strong>
      </div>

      <div className="button-row">
        <button type="button" className="primary-button" onClick={onSpin}>
          Spin
        </button>
        <button type="button" onClick={onStartAuto} disabled={isAutoSpinning}>
          Starta auto
        </button>
        <button type="button" onClick={onStopAuto} disabled={!isAutoSpinning}>
          Stoppa
        </button>
      </div>

      <label className="field">
        <span>Auto-intervall</span>
        <input
          type="number"
          min={1}
          step={1}
          value={intervalMs}
          onChange={(event) => onIntervalChange(Number(event.target.value))}
        />
        <small>Millisekunder mellan spins.</small>
      </label>
    </section>
  );
}
