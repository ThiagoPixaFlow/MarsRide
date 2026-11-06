"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { walletService } from "@/modules/wallet/wallet.service";
import { WalletSummary } from "@/modules/wallet/wallet.types";
import { formatCredits, formatDateTime } from "@/lib/format";
import { WALLET_CONFIG } from "@/config/app.config";
import { getErrorMessage } from "@/lib/errors";
import { Coins, PlusCircle, ArrowUpRight, ArrowDownLeft, AlertCircle, Sparkles } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdated?: (newBalance: number) => void;
}

export function WalletModal({ isOpen, onClose, onBalanceUpdated }: WalletModalProps) {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await walletService.getSummary();
      setSummary(data);
      onBalanceUpdated?.(data.wallet.balance);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [onBalanceUpdated]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchWallet();
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, fetchWallet]);

  const handleTopUp = async () => {
    try {
      setIsTopUpLoading(true);
      setError(null);
      const { wallet } = await walletService.topUp(WALLET_CONFIG.topUpAmount);
      await fetchWallet();
      onBalanceUpdated?.(wallet.balance);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsTopUpLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Carteira de Créditos Marcianos"
      description={`Moeda oficial da colônia (${WALLET_CONFIG.currency})`}
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Saldo Principal */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#241c19] to-[#161210] border border-[#e2602c]/25 relative overflow-hidden mb-6 shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Coins className="w-28 h-28 text-[#f28b44]" />
        </div>

        <span className="text-xs font-semibold text-[#c4b5ad] uppercase tracking-wider">
          Saldo Disponível
        </span>
        <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 flex items-baseline gap-2">
          <span>{summary ? formatCredits(summary.wallet.balance) : "..."}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#8c7d75] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f28b44]" />
            Crédito demonstrativo para testes
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={handleTopUp}
            isLoading={isTopUpLoading}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Recarregar +{WALLET_CONFIG.topUpAmount} MCR
          </Button>
        </div>
      </div>

      {/* Extrato de Transações */}
      <div>
        <h4 className="text-xs font-semibold text-[#8c7d75] uppercase tracking-wider mb-3">
          Últimas Movimentações
        </h4>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#8c7d75]">
            Consultando livro de registros de Nova Acidália...
          </div>
        ) : !summary || summary.transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8c7d75]">
            Nenhuma transação registrada.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {summary.transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-[#1a1412] border border-[#2e2320] flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-[#e2602c]/15 text-[#f28b44] border border-[#e2602c]/30"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white line-clamp-1">
                        {tx.description}
                      </p>
                      <span className="text-[11px] text-[#8c7d75]">
                        {formatDateTime(tx.createdAt)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold whitespace-nowrap ${
                      isCredit ? "text-emerald-400" : "text-[#f28b44]"
                    }`}
                  >
                    {formatCredits(tx.amount, { signed: true })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
