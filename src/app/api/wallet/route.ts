import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      if (supabase) {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!authError && user) {
          const { data: wallet } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .single();

          const { data: transactions } = await supabase
            .from("wallet_transactions")
            .select("*")
            .eq("wallet_id", wallet?.id ?? "")
            .order("created_at", { ascending: false });

          if (wallet) {
            return NextResponse.json({
              success: true,
              data: {
                wallet: {
                  id: wallet.id,
                  userId: wallet.user_id,
                  balance: Number(wallet.balance),
                  currency: wallet.currency,
                  updatedAt: wallet.updated_at,
                },
                transactions: (transactions ?? []).map((tx) => ({
                  id: tx.id,
                  walletId: tx.wallet_id,
                  rideId: tx.ride_id,
                  type: tx.type,
                  amount: Number(tx.amount),
                  balanceAfter: Number(tx.balance_after),
                  description: tx.description,
                  createdAt: tx.created_at,
                })),
              },
            });
          }
        }
      }
    }

    mockStorage.init();
    const currentId = mockStorage.getCurrentUserId() ?? "usr_alex_vance";
    const wallet = mockStorage.getWalletByUserId(currentId);
    const transactions = mockStorage.getTransactions(wallet.id);

    return NextResponse.json({
      success: true,
      data: {
        wallet,
        transactions,
      },
    });
  } catch (err) {
    console.error("Erro em /api/wallet GET:", err);
    return NextResponse.json({ success: false, error: "Erro ao consultar carteira." }, { status: 500 });
  }
}
