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
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            return NextResponse.json({
              success: true,
              data: {
                id: profile.id,
                name: profile.name,
                username: profile.username ?? split_email(user.email),
                email: user.email ?? profile.email ?? "",
                avatarColor: profile.avatar_color ?? "#e2602c",
                occupation: profile.occupation ?? "Colono Pioneiro",
                homeLocationId: profile.home_location_id ?? "loc-residential",
                preferences: profile.preferences ?? {},
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              },
            });
          }
        }
      }
    }

    mockStorage.init();
    const currentId = mockStorage.getCurrentUserId();
    const account = currentId ? mockStorage.getUserById(currentId) : null;
    return NextResponse.json({
      success: true,
      data: account ? account.profile : mockStorage.getUserByEmail("alex@redride.mars")?.profile,
    });
  } catch (err) {
    console.error("Erro em /api/users/me GET:", err);
    return NextResponse.json({ success: false, error: "Erro interno ao consultar perfil." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      if (supabase) {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!authError && user) {
          const updatePayload: Record<string, unknown> = {};
          if (body.name) updatePayload.name = body.name;
          if (body.avatarColor) updatePayload.avatar_color = body.avatarColor;
          if (body.occupation) updatePayload.occupation = body.occupation;
          if (body.homeLocationId) updatePayload.home_location_id = body.homeLocationId;
          if (body.preferences) updatePayload.preferences = body.preferences;

          const { data, error } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", user.id)
            .select()
            .single();

          if (!error && data) {
            return NextResponse.json({ success: true, data });
          }
        }
      }
    }

    mockStorage.init();
    const currentId = mockStorage.getCurrentUserId();
    if (!currentId) {
      return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
    }
    const account = mockStorage.getUserById(currentId);
    if (!account) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado." }, { status: 404 });
    }

    const updatedProfile = {
      ...account.profile,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    account.profile = updatedProfile;
    if (body.name) account.name = body.name;
    if (body.username) account.username = body.username;
    mockStorage.saveUser(account);

    return NextResponse.json({ success: true, data: updatedProfile });
  } catch (err) {
    console.error("Erro em /api/users/me PATCH:", err);
    return NextResponse.json({ success: false, error: "Erro interno ao atualizar perfil." }, { status: 500 });
  }
}

function split_email(email?: string | null): string {
  if (!email) return "colono.mars";
  return email.split("@")[0] + ".mars";
}
