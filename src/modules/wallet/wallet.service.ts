import { mockStorage } from "@/mocks/storage";
import { Wallet, WalletTransaction, WalletSummary } from "@/modules/wallet/wallet.types";
import { WALLET_CONFIG } from "@/config/app.config";
import { ServiceError } from "@/lib/errors";
import { simulateLatency } from "@/lib/latency";
import { createId } from "@/lib/id";

export class WalletService {
  async getWallet(userId?: string): Promise<Wallet> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/wallet");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.wallet) {
            return json.data.wallet;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const id = userId ?? mockStorage.getCurrentUserId();
    if (!id) throw new ServiceError("UNAUTHENTICATED", "Usuário não autenticado.");
    return mockStorage.getWalletByUserId(id);
  }

  async getSummary(userId?: string): Promise<WalletSummary> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/wallet");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return {
              wallet: json.data.wallet,
              transactions: json.data.transactions ?? [],
            };
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const id = userId ?? mockStorage.getCurrentUserId();
    if (!id) throw new ServiceError("UNAUTHENTICATED", "Usuário não autenticado.");

    const wallet = mockStorage.getWalletByUserId(id);
    const transactions = mockStorage.getTransactions(wallet.id);

    return { wallet, transactions };
  }

  async topUp(
    amount = WALLET_CONFIG.topUpAmount,
    userId?: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/wallet/topup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const summary = await this.getSummary(userId);
            return {
              wallet: summary.wallet,
              transaction: summary.transactions[0] ?? {
                id: createId("tx"),
                walletId: summary.wallet.id,
                rideId: null,
                type: "top_up",
                amount,
                balanceAfter: summary.wallet.balance,
                description: `Recarga demonstrativa de ${amount} ${WALLET_CONFIG.currency}`,
                createdAt: new Date().toISOString(),
              },
            };
          }
        }
      }
    } catch {
      // Fallback
    }

    await simulateLatency(200, 400);
    mockStorage.init();
    const id = userId ?? mockStorage.getCurrentUserId();
    if (!id) throw new ServiceError("UNAUTHENTICATED", "Usuário não autenticado.");

    const wallet = mockStorage.getWalletByUserId(id);
    const newBalance = wallet.balance + amount;

    if (newBalance > WALLET_CONFIG.maxBalance) {
      throw new ServiceError(
        "VALIDATION",
        `O saldo máximo permitido é de ${WALLET_CONFIG.maxBalance} ${WALLET_CONFIG.currency}.`
      );
    }

    wallet.balance = newBalance;
    mockStorage.saveWallet(wallet);

    const transaction: WalletTransaction = {
      id: createId("tx"),
      walletId: wallet.id,
      rideId: null,
      type: "top_up",
      amount,
      balanceAfter: newBalance,
      description: `Recarga demonstrativa de ${amount} ${WALLET_CONFIG.currency}`,
      createdAt: new Date().toISOString(),
    };

    mockStorage.addTransaction(transaction);
    return { wallet, transaction };
  }

  async debitRidePayment(
    userId: string,
    rideId: string,
    amount: number,
    rideDescription: string
  ): Promise<WalletTransaction> {
    mockStorage.init();
    const wallet = mockStorage.getWalletByUserId(userId);

    const existing = mockStorage
      .getTransactions(wallet.id)
      .find((t) => t.rideId === rideId && t.type === "ride_payment");
    if (existing) {
      return existing;
    }

    const newBalance = wallet.balance - amount;
    wallet.balance = newBalance;
    mockStorage.saveWallet(wallet);

    const tx: WalletTransaction = {
      id: createId("tx"),
      walletId: wallet.id,
      rideId,
      type: "ride_payment",
      amount: -amount,
      balanceAfter: newBalance,
      description: `Pagamento de viagem: ${rideDescription}`,
      createdAt: new Date().toISOString(),
    };

    mockStorage.addTransaction(tx);
    return tx;
  }
}

export const walletService = new WalletService();
