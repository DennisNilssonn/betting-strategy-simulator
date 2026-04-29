import type { Color, ProgressionMode, SessionStatus, Strategy } from "../types";

const integerFormatter = new Intl.NumberFormat("sv-SE", {
  maximumFractionDigits: 0
});

const decimalFormatter = new Intl.NumberFormat("sv-SE", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1
});

export function formatCurrency(value: number): string {
  return `${integerFormatter.format(value)} kr`;
}

export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${decimalFormatter.format(value)}%`;
}

export function formatColor(color: Color | undefined): string {
  if (color === "red") {
    return "Röd";
  }

  if (color === "black") {
    return "Svart";
  }

  if (color === "green") {
    return "Grön";
  }

  return "Redo";
}

export function formatProgressionMode(mode: ProgressionMode): string {
  return mode === "cappedMartingale" ? "Capped Martingale" : "Martingale";
}

export function formatSessionStatus(status: SessionStatus): string {
  if (status === "profit_target") {
    return "Target nådd";
  }

  if (status === "stopped") {
    return "Stoppad";
  }

  return "Körbar";
}

export function formatStrategy(strategy: Strategy): string {
  return strategy === "opposite" ? "Mot streak" : "Följ streak";
}
