import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DRIVERS_SEED } from "@/mocks/data/drivers";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("drivers")
          .select("*")
          .eq("is_active", true);

        if (!error && data && data.length > 0) {
          const drivers = data.map((drv) => {
            const seed = DRIVERS_SEED.find((d) => d.id === drv.id);
            return {
              id: drv.id,
              name: drv.name,
              title: drv.title,
              personalitySummary: drv.personality_summary,
              traits: drv.traits ?? [],
              bio: drv.bio,
              specialty: drv.specialty,
              rating: Number(drv.rating),
              completedTrips: drv.completed_trips,
              solsOnMars: drv.sols_on_mars,
              avatarUrl: drv.avatar_url,
              languages: seed?.languages ?? ["Português", "Inglês"],
              avatar: seed?.avatar ?? { primary: "#e2602c", secondary: "#7a2a10", glyph: "visor" },
              persona: seed?.persona ?? {
                tone: "Amigável",
                interests: ["Marte", "Tecnologia"],
                conversationStyle: "Direto e atencioso",
                catchphrase: "Bem-vindo a bordo!",
              },
              isActive: drv.is_active,
            };
          });
          return NextResponse.json({ success: true, data: drivers });
        }
      }
    }

    return NextResponse.json({ success: true, data: DRIVERS_SEED });
  } catch (err) {
    console.error("Erro ao buscar motoristas:", err);
    return NextResponse.json({ success: true, data: DRIVERS_SEED });
  }
}

