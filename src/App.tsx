import { useEffect, useMemo, useState } from "react";
import { BankrollPanel } from "./components/BankrollPanel";
import { BetLogPanel } from "./components/BetLogPanel";
import { BotControlPanel } from "./components/BotControlPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { SignalPanel } from "./components/SignalPanel";
import { SimulatorPanel } from "./components/SimulatorPanel";
import { StatsPanel } from "./components/StatsPanel";
import { StrategySafetyPanel } from "./components/StrategySafetyPanel";
import type { AppState, Settings, Signal, SpinResult } from "./types";
import { processBotSpin, getPendingBet } from "./utils/botEngine";
import { formatCurrency, formatPercent, formatProgressionMode, formatSessionStatus } from "./utils/format";
import { createSpinResult } from "./utils/roulette";
import { normalizeSettings } from "./utils/settings";
import { calculateStats } from "./utils/stats";
import { clearState, defaultAppState, loadState, saveState, START_BALANCE } from "./utils/storage";

type StopNotice = {
  attemptedAmount: number;
  balanceBeforeAttempt: number;
  streakColor: string;
  streakLength: number;
  suggestedBetColor: string;
  spinId: number;
  reason?: string;
};

function nextSpinId(history: SpinResult[]): number {
  return history.reduce((maxId, spin) => Math.max(maxId, spin.id), 0) + 1;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [latestSignal, setLatestSignal] = useState<Signal | undefined>();
  const [stopNotice, setStopNotice] = useState<StopNotice | undefined>();

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!isAutoSpinning) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      handleSpin();
    }, Math.max(1, state.settings.spinIntervalMs));

    return () => window.clearInterval(interval);
  }, [
    isAutoSpinning,
    state.settings.spinIntervalMs,
    state.history,
    state.balance,
    state.betLog,
    state.settings,
    state.activeSeries,
    state.seriesLog,
    state.lockedStreak,
    state.sessionStartBalance,
    state.sessionStatus
  ]);

  const stats = useMemo(
    () =>
      calculateStats(
        state.betLog,
        state.seriesLog,
        state.lockedStreak ? 1 : 0,
        state.sessionStopCounts
      ),
    [state.betLog, state.seriesLog, state.lockedStreak, state.sessionStopCounts]
  );
  const pendingBet = useMemo(() => getPendingBet(state.betLog), [state.betLog]);
  const latestResult = state.history.at(-1);
  const sessionProfit = state.balance - state.sessionStartBalance;
  const activeSeriesLabel = state.activeSeries
    ? `Serie #${state.activeSeries.id}, steg ${state.activeSeries.currentStep}`
    : "Ingen aktiv serie";

  function handleSpin(): void {
    setState((currentState) => {
      const spin = createSpinResult(nextSpinId(currentState.history));
      const history = [...currentState.history, spin];
      const botUpdate = processBotSpin({
        history,
        balance: currentState.balance,
        betLog: currentState.betLog,
        settings: currentState.settings,
        activeSeries: currentState.activeSeries,
        seriesLog: currentState.seriesLog,
        lockedStreak: currentState.lockedStreak,
        sessionStartBalance: currentState.sessionStartBalance,
        sessionStatus: currentState.sessionStatus
      });

      setLatestSignal(botUpdate.latestSignal);
      if (botUpdate.blockedBet) {
        setStopNotice({
          attemptedAmount: botUpdate.blockedBet.attemptedAmount,
          balanceBeforeAttempt: botUpdate.blockedBet.balanceBeforeAttempt,
          streakColor: botUpdate.blockedBet.signal.streakColor,
          streakLength: botUpdate.blockedBet.signal.streakLength,
          suggestedBetColor: botUpdate.blockedBet.signal.suggestedBetColor,
          spinId: botUpdate.blockedBet.signal.createdAtSpinId,
          reason: botUpdate.blockedBet.message
        });
      } else {
        setStopNotice(undefined);
      }

      if (botUpdate.sessionStatus === "profit_target") {
        setIsAutoSpinning(false);
      }

      return {
        ...currentState,
        history,
        balance: botUpdate.balance,
        betLog: botUpdate.betLog,
        activeSeries: botUpdate.activeSeries,
        seriesLog: botUpdate.seriesLog,
        lockedStreak: botUpdate.lockedStreak,
        sessionStatus: botUpdate.sessionStatus ?? currentState.sessionStatus,
        sessionStopCounts:
          botUpdate.sessionStatus === "profit_target"
            ? { ...currentState.sessionStopCounts, profitTarget: currentState.sessionStopCounts.profitTarget + 1 }
            : currentState.sessionStopCounts
      };
    });
  }

  function updateSettings(settings: Settings): void {
    setState((currentState) => ({
      ...currentState,
      settings: normalizeSettings(settings)
    }));
  }

  function resetSimulation(): void {
    setIsAutoSpinning(false);
    setLatestSignal(undefined);
    setStopNotice(undefined);
    setState((currentState) => ({
      ...currentState,
      history: [],
      betLog: [],
      activeSeries: undefined,
      seriesLog: [],
      lockedStreak: undefined
    }));
  }

  function resetBankroll(): void {
    setState((currentState) => ({
      ...currentState,
      balance: START_BALANCE,
      betLog: [],
      activeSeries: undefined,
      seriesLog: [],
      lockedStreak: undefined,
      sessionStartBalance: START_BALANCE,
      sessionStatus: "running"
    }));
    setStopNotice(undefined);
  }

  function resetEverything(): void {
    setIsAutoSpinning(false);
    setLatestSignal(undefined);
    setStopNotice(undefined);
    clearState();
    setState(defaultAppState);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <p className="eyebrow">Virtuell strategi</p>
          <h1>Capped Martingale Lab</h1>
          <p className="header-copy">Långsiktiga roulette-simuleringar med kontrollerad progression.</p>
        </div>
        <div className="header-actions">
          <span className={`session-pill ${state.sessionStatus === "running" ? "is-running" : "is-paused"}`}>
            {formatSessionStatus(state.sessionStatus)}
          </span>
          <div className="reset-actions">
            <button type="button" onClick={resetSimulation}>
              Nollställ spins
            </button>
            <button type="button" onClick={resetBankroll}>
              Nollställ kapital
            </button>
            <button type="button" className="danger-button" onClick={resetEverything}>
              Rensa allt
            </button>
          </div>
        </div>
      </header>

      <section className="overview-strip" aria-label="Sessionöversikt">
        <div className="overview-card balance-card">
          <span>Saldo</span>
          <strong>{formatCurrency(state.balance)}</strong>
          <small>{formatCurrency(sessionProfit)} session</small>
        </div>
        <div className={stats.totalProfit >= 0 ? "overview-card positive" : "overview-card negative"}>
          <span>Total profit</span>
          <strong>{formatCurrency(stats.totalProfit)}</strong>
          <small>{formatPercent(stats.roi)} ROI</small>
        </div>
        <div className="overview-card">
          <span>Win rate</span>
          <strong>{formatPercent(stats.winRate)}</strong>
          <small>{stats.wonBets} / {stats.totalBets} bets</small>
        </div>
        <div className="overview-card">
          <span>Max drawdown</span>
          <strong>{formatCurrency(stats.maxDrawdown)}</strong>
          <small>Maxinsats {formatCurrency(stats.maxBet)}</small>
        </div>
        <div className="overview-card">
          <span>Aktiv serie</span>
          <strong>{activeSeriesLabel}</strong>
          <small>{formatProgressionMode(state.settings.progressionMode)}</small>
        </div>
      </section>

      <section className="safety-note">
        <span>Virtuella pengar</span>
        <span>Lokal data</span>
        <span>Ingen casino-koppling</span>
      </section>

      {stopNotice ? (
        <section className="stop-alert">
          <strong>Bet stoppades</strong>
          <span>
            Botten försökte lägga {formatCurrency(stopNotice.attemptedAmount)} på {stopNotice.suggestedBetColor} efter{" "}
            {stopNotice.streakLength} {stopNotice.streakColor} i rad vid spin #{stopNotice.spinId}, men saldot var bara{" "}
            {formatCurrency(stopNotice.balanceBeforeAttempt)}. Auto-spin fortsätter och botten väntar på nästa giltiga läge.
            {stopNotice.reason ? ` Anledning: ${stopNotice.reason}` : ""}
          </span>
        </section>
      ) : null}

      {state.sessionStatus === "profit_target" ? (
        <section className="stop-alert">
          <strong>Profit target reached</strong>
          <span>
            Session profit är {formatCurrency(sessionProfit)} från startsaldo {formatCurrency(state.sessionStartBalance)}.
          </span>
        </section>
      ) : null}

      <div className="dashboard-grid">
        <SimulatorPanel
          latestColor={latestResult?.color}
          isAutoSpinning={isAutoSpinning}
          intervalMs={state.settings.spinIntervalMs}
          onSpin={handleSpin}
          onStartAuto={() => {
            setStopNotice(undefined);
            setIsAutoSpinning(true);
          }}
          onStopAuto={() => setIsAutoSpinning(false)}
          onIntervalChange={(spinIntervalMs) => updateSettings({ ...state.settings, spinIntervalMs })}
        />
        <BotControlPanel settings={state.settings} pendingBet={pendingBet} onSettingsChange={updateSettings} />
        <StrategySafetyPanel
          settings={state.settings}
          balance={state.balance}
          activeSeries={state.activeSeries}
          lockedStreak={state.lockedStreak}
          sessionStartBalance={state.sessionStartBalance}
          sessionStatus={state.sessionStatus}
        />
        <HistoryPanel history={state.history} />
        <SignalPanel history={state.history} settings={state.settings} latestSignal={latestSignal} />
        <BankrollPanel balance={state.balance} stats={stats} />
        <StatsPanel history={state.history} stats={stats} />
        <BetLogPanel betLog={state.betLog} />
      </div>
    </main>
  );
}
