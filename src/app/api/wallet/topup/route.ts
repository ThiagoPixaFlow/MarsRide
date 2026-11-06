import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount ?? 500);

    if (amount <= 0 || isNaN(amount)) {
      return NextResponse.json({ success: false, error: "Valor de recarga inválido." }, { status: 400 });
    }

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

          if (wallet) {
            const newBalance = Number(wallet.balance) + amount;

            await supabase
              .from("wallets")
              .update({ balance: newBalance })
              .eq("id", wallet.id);

            await supabase.from("wallet_transactions").insert({
              wallet_id: wallet.id,
              type: "topup",
              amount,
              balance_after: newBalance,
              description: `Recarga demonstrativa de ${amount} MCR`,
            });

            return NextResponse.json({
              success: true,
              data: {
                balance: newBalance,
              },
            });
          }
        }
      }
    }

    mockStorage.init();
    const currentId = mockStorage.getCurrentUserId() ?? "usr_alex_vance";
    const wallet = mockStorage.getWalletByUserId(currentId);
    const newBalance = wallet.balance + amount;
    wallet.balance = newBalance;
    mockStorage.saveWallet(wallet);

    mockStorage.addTransaction({
      id: `tx_${Date.now()}`,
      walletId: wallet.id,
      rideId: null,
      type: "top_up" as const,
      amount,
      balanceAfter: newBalance,
      description: `Recarga demonstrativa de ${amount} MCR`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: newBalance,
      },
    });
  } catch (err) {
    console.error("Erro em /api/wallet/topup POST:", err);
    return NextResponse.json({ success: false, error: "Erro ao processar recarga." }, { status: 500 });
  }
}
