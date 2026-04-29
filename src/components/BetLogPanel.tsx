import { useEffect, useMemo, useState } from "react";
import type { Bet } from "../types";
import { formatColor, formatCurrency } from "../utils/format";

type BetLogPanelProps = {
  betLog: Bet[];
};

const pageSizeOptions = [10, 25, 50, 100];

export function BetLogPanel({ betLog }: BetLogPanelProps) {
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const sortedBets = useMemo(() => betLog.slice().reverse(), [betLog]);
  const totalPages = Math.max(1, Math.ceil(sortedBets.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visibleBets = sortedBets.slice(startIndex, startIndex + pageSize);
  const firstVisible = sortedBets.length === 0 ? 0 : startIndex + 1;
  const lastVisible = Math.min(startIndex + pageSize, sortedBets.length);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <h2>Betlogg</h2>
          <p className="panel-kicker">Alla placerade och avgjorda bets</p>
        </div>
        <span className="pill">{betLog.length} bets</span>
      </div>

      <div className="pagination-bar">
        <div className="pagination-summary">
          Visar {firstVisible}-{lastVisible} av {sortedBets.length}
        </div>
        <label className="page-size-control">
          <span>Rader</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="page-buttons">
          <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}>
            Första
          </button>
          <button type="button" onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))} disabled={safePage === 1}>
            Föregående
          </button>
          <span className="page-indicator">
            Sida {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
            disabled={safePage === totalPages}
          >
            Nästa
          </button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
            Sista
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Spin</th>
              <th>Signal</th>
              <th>Bet färg</th>
              <th>Belopp</th>
              <th>Saldo före</th>
              <th>Series</th>
              <th>Nästa spin</th>
              <th>Vinst/förlust</th>
              <th>Saldo efter</th>
            </tr>
          </thead>
          <tbody>
            {sortedBets.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">
                  Inga bets ännu
                </td>
              </tr>
            ) : null}
            {visibleBets.map((bet) => (
              <tr key={bet.id}>
                <td>#{bet.placedAtSpinId}</td>
                <td>
                  {bet.signal.streakLength} {formatColor(bet.signal.streakColor).toLowerCase()}
                </td>
                <td>
                  <span className={`bet-color ${bet.betColor}`}>{formatColor(bet.betColor)}</span>
                </td>
                <td>{formatCurrency(bet.amount)}</td>
                <td>{bet.balanceBefore === undefined ? "-" : formatCurrency(bet.balanceBefore)}</td>
                <td>{bet.seriesId ? `#${bet.seriesId}.${bet.progressionStep}` : "-"}</td>
                <td>{bet.resultColor ? `${formatColor(bet.resultColor)} (#${bet.resolvedAtSpinId})` : "Väntar"}</td>
                <td className={bet.profit && bet.profit > 0 ? "profit-text" : bet.profit ? "loss-text" : ""}>
                  {bet.profit === undefined ? "Öppen" : formatCurrency(bet.profit)}
                </td>
                <td>{bet.balanceAfter === undefined ? "-" : formatCurrency(bet.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
