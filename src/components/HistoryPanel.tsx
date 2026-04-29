import type { Color, SpinResult } from "../types";
import { formatColor } from "../utils/format";

type HistoryPanelProps = {
  history: SpinResult[];
};

function countColor(history: SpinResult[], color: Color): number {
  return history.filter((spin) => spin.color === color).length;
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  const recent = history.slice(-30).reverse();

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Historik</h2>
          <p className="panel-kicker">Senaste 30 spins</p>
        </div>
        <span className="pill">{history.length} spins</span>
      </div>

      <div className="history-dots">
        {recent.length === 0 ? <span className="empty-text">Inga spins ännu</span> : null}
        {recent.map((spin) => (
          <span key={spin.id} className={`history-dot ${spin.color}`} title={`#${spin.id}: ${formatColor(spin.color)}`} />
        ))}
      </div>

      <div className="mini-stats">
        <span>Röd: {countColor(history, "red")}</span>
        <span>Svart: {countColor(history, "black")}</span>
        <span>Grön: {countColor(history, "green")}</span>
      </div>
    </section>
  );
}
