import type { Bet, Settings } from "../types";
import { formatColor, formatCurrency } from "../utils/format";

type BotControlPanelProps = {
  settings: Settings;
  pendingBet?: Bet;
  onSettingsChange: (settings: Settings) => void;
};

type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? "segment-button active" : "segment-button"}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BotControlPanel({ settings, pendingBet, onSettingsChange }: BotControlPanelProps) {
  const updateSettings = (nextSettings: Partial<Settings>) => onSettingsChange({ ...settings, ...nextSettings });

  return (
    <section className="panel control-panel">
      <div className="panel-header">
        <div>
          <h2>Strategikontroll</h2>
          <p className="panel-kicker">Trigger, progression och säkerhetsgränser</p>
        </div>
        <span className={settings.botEnabled ? "pill enabled" : "pill"}>{settings.botEnabled ? "Aktiv" : "Av"}</span>
      </div>

      <label className="switch-row">
        <input
          type="checkbox"
          checked={settings.botEnabled}
          onChange={(event) => updateSettings({ botEnabled: event.target.checked })}
        />
        <span>Automatisk betplacering</span>
      </label>

      <div className="control-section">
        <div className="control-subgrid">
          <label className="field">
            <span>Basinsats</span>
            <input
              type="number"
              min={1}
              value={settings.betAmount}
              onChange={(event) => updateSettings({ betAmount: Math.max(1, Number(event.target.value)) })}
            />
          </label>

          <label className="field">
            <span>Triggerstreak</span>
            <input
              type="number"
              min={2}
              max={20}
              value={settings.streakThreshold}
              onChange={(event) => updateSettings({ streakThreshold: Math.max(2, Number(event.target.value)) })}
            />
          </label>
        </div>

        <SegmentedControl
          label="Strategi"
          value={settings.strategy}
          options={[
            { label: "Mot streak", value: "opposite" },
            { label: "Följ streak", value: "same" }
          ]}
          onChange={(strategy) => updateSettings({ strategy })}
        />

        <SegmentedControl
          label="Insatsmodell"
          value={settings.progressionMode}
          options={[
            { label: "Martingale", value: "martingale" },
            { label: "Capped", value: "cappedMartingale" }
          ]}
          onChange={(progressionMode) => updateSettings({ progressionMode })}
        />
      </div>

      <div className="control-section">
        <div className="control-subgrid">
          <label className="field">
            <span>Profit target</span>
            <input
              type="number"
              min={1}
              value={settings.profitTarget}
              onChange={(event) => updateSettings({ profitTarget: Math.max(1, Number(event.target.value)) })}
            />
          </label>

          <label className="field">
            <span>Max bet</span>
            <input
              type="number"
              min={1}
              value={settings.maxBetAmount}
              onChange={(event) => updateSettings({ maxBetAmount: Math.max(1, Number(event.target.value)) })}
            />
          </label>

          <label className="field">
            <span>Max % av saldo</span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={settings.maxBetPercentOfBankroll}
              onChange={(event) =>
                updateSettings({ maxBetPercentOfBankroll: Math.max(0.1, Number(event.target.value)) })
              }
            />
          </label>

          {settings.progressionMode === "cappedMartingale" ? (
            <label className="field">
              <span>Capped steg</span>
              <input
                type="number"
                min={1}
                max={12}
                value={settings.maxProgressionSteps}
                onChange={(event) => updateSettings({ maxProgressionSteps: Math.max(1, Number(event.target.value)) })}
              />
            </label>
          ) : null}
        </div>

        <label className="switch-row compact-switch">
          <input
            type="checkbox"
            checked={settings.stopOnProfitTarget}
            onChange={(event) => updateSettings({ stopOnProfitTarget: event.target.checked })}
          />
          <span>Stoppa vid target</span>
        </label>

        {settings.progressionMode === "cappedMartingale" ? (
          <>
            <label className="switch-row compact-switch">
              <input
                type="checkbox"
                checked={settings.lockAfterCappedLoss}
                onChange={(event) => updateSettings({ lockAfterCappedLoss: event.target.checked })}
              />
              <span>Lås efter capped loss</span>
            </label>
            <label className="switch-row compact-switch">
              <input
                type="checkbox"
                checked={settings.allowReentryOnSameStreak}
                onChange={(event) => updateSettings({ allowReentryOnSameStreak: event.target.checked })}
              />
              <span>Tillåt re-entry</span>
            </label>
          </>
        ) : null}
      </div>

      <div className="pending-box">
        <span>Aktivt bet</span>
        <strong>
          {pendingBet ? `${formatCurrency(pendingBet.amount)} på ${formatColor(pendingBet.betColor).toLowerCase()}` : "Inget väntande bet"}
        </strong>
      </div>
    </section>
  );
}
