import type { BankrollStats } from "../types";
import { formatCurrency, formatPercent } from "../utils/format";
import { START_BALANCE } from "../utils/storage";

type BankrollPanelProps = {
  balance: number;
  stats: BankrollStats;
};

export function BankrollPanel({ balance, stats }: BankrollPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Kapital</h2>
          <p className="panel-kicker">Resultat och träffsäkerhet</p>
        </div>
        <span className={stats.totalProfit >= 0 ? "pill profit" : "pill loss"}>{formatCurrency(stats.totalProfit)}</span>
      </div>

      <div className="stat-grid">
        <div>
          <span>Startsaldo</span>
          <strong>{formatCurrency(START_BALANCE)}</strong>
        </div>
        <div>
          <span>Saldo</span>
          <strong>{formatCurrency(balance)}</strong>
        </div>
        <div>
          <span>Bets</span>
          <strong>{stats.totalBets}</strong>
        </div>
        <div>
          <span>Vunna</span>
          <strong>{stats.wonBets}</strong>
        </div>
        <div>
          <span>Förlorade</span>
          <strong>{stats.lostBets}</strong>
        </div>
        <div>
          <span>Win rate</span>
          <strong>{formatPercent(stats.winRate)}</strong>
        </div>
        <div>
          <span>ROI</span>
          <strong>{formatPercent(stats.roi)}</strong>
        </div>
      </div>
    </section>
  );
}
