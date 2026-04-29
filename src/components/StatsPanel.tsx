import type { BankrollStats, SpinResult } from "../types";
import { formatCurrency, formatDecimal, formatPercent } from "../utils/format";

type StatsPanelProps = {
  history: SpinResult[];
  stats: BankrollStats;
};

export function StatsPanel({ history, stats }: StatsPanelProps) {
  const redOrBlackSpins = history.filter((spin) => spin.color !== "green").length;
  const greenRate = history.length === 0 ? 0 : (history.length - redOrBlackSpins) / history.length * 100;
  const betFrequency = history.length === 0 ? 0 : stats.totalBets / history.length * 100;

  return (
    <section className="panel stats-panel">
      <div className="panel-header">
        <div>
          <h2>Strategimätning</h2>
          <p className="panel-kicker">Långsiktig edge, volatilitet och serier</p>
        </div>
        <span className="pill">{stats.totalSeries} serier</span>
      </div>

      <div className="stat-grid">
        <div>
          <span>Röd/svart spins</span>
          <strong>{redOrBlackSpins}</strong>
        </div>
        <div>
          <span>Green rate</span>
          <strong>{formatPercent(greenRate)}</strong>
        </div>
        <div>
          <span>Omsättning</span>
          <strong>{formatCurrency(stats.totalStaked)}</strong>
        </div>
        <div>
          <span>Betfrekvens</span>
          <strong>{formatPercent(betFrequency)}</strong>
        </div>
        <div>
          <span>Snittinsats</span>
          <strong>{formatCurrency(stats.averageBet)}</strong>
        </div>
        <div>
          <span>Maxinsats</span>
          <strong>{formatCurrency(stats.maxBet)}</strong>
        </div>
        <div>
          <span>Max drawdown</span>
          <strong>{formatCurrency(stats.maxDrawdown)}</strong>
        </div>
        <div>
          <span>Expectancy</span>
          <strong>{formatDecimal(stats.expectancy)} kr/bet</strong>
        </div>
        <div>
          <span>Profit factor</span>
          <strong>{Number.isFinite(stats.profitFactor) ? formatDecimal(stats.profitFactor) : "∞"}</strong>
        </div>
        <div>
          <span>Längsta vinstsvit</span>
          <strong>{stats.longestWinStreak}</strong>
        </div>
        <div>
          <span>Längsta förlustsvit</span>
          <strong>{stats.longestLossStreak}</strong>
        </div>
        <div>
          <span>Green-förluster</span>
          <strong>{stats.greenLosses}</strong>
        </div>
        <div>
          <span>Martingale-steg</span>
          <strong>{stats.martingaleEscalations}</strong>
        </div>
        <div>
          <span>Antal serier</span>
          <strong>{stats.totalSeries}</strong>
        </div>
        <div>
          <span>Vunna serier</span>
          <strong>{stats.wonSeries}</strong>
        </div>
        <div>
          <span>Capped losses</span>
          <strong>{stats.cappedLosses}</strong>
        </div>
        <div>
          <span>Blockerade serier</span>
          <strong>{stats.blockedSeries}</strong>
        </div>
        <div>
          <span>Series win rate</span>
          <strong>{formatPercent(stats.seriesWinRate)}</strong>
        </div>
        <div>
          <span>Snitt serieprofit</span>
          <strong>{formatCurrency(stats.averageSeriesProfit)}</strong>
        </div>
        <div>
          <span>Bästa serie</span>
          <strong>{formatCurrency(stats.bestSeries)}</strong>
        </div>
        <div>
          <span>Sämsta serie</span>
          <strong>{formatCurrency(stats.worstSeries)}</strong>
        </div>
        <div>
          <span>Locked streak count</span>
          <strong>{stats.lockedStreakCount}</strong>
        </div>
        <div>
          <span>Target-stopp</span>
          <strong>{stats.sessionsStoppedByTarget}</strong>
        </div>
      </div>
    </section>
  );
}
