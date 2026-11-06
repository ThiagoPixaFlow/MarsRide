import { WALLET_CONFIG } from "@/config/app.config";

const integerFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function formatCredits(amount: number, options: { signed?: boolean; withCurrency?: boolean } = {}): string {
  const { signed = false, withCurrency = true } = options;
  const rounded = Math.round(amount);
  const value = integerFormatter.format(Math.abs(rounded));
  let sign = rounded < 0 ? "−" : "";
  if (signed && rounded > 0) sign = "+";
  return withCurrency ? `${sign}${value} ${WALLET_CONFIG.currency}` : `${sign}${value}`;
}

export function formatDistanceKm(km: number): string {
  const formatted = km.toLocaleString("pt-BR", {
    minimumFractionDigits: km < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  });
  return `${formatted} km`;
}

export function formatDurationMin(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

