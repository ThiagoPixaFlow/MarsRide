import type { ISODateString } from "@/types/common";

export type WalletTransactionType = "initial_credit" | "ride_payment" | "top_up" | "refund";

export interface WalletTransaction {
  id: string;
  walletId: string;
  rideId: string | null;
  type: WalletTransactionType;
  /** Valor com sinal: positivo para créditos, negativo para débitos. */
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: ISODateString;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: ISODateString;
}

export interface WalletSummary {
  wallet: Wallet;
  transactions: WalletTransaction[];
}

export const TRANSACTION_TYPE_LABEL: Record<WalletTransactionType, string> = {
  initial_credit: "Créditos de boas-vindas",
  ride_payment: "Pagamento de viagem",
  top_up: "Recarga demonstrativa",
  refund: "Reembolso",
};

