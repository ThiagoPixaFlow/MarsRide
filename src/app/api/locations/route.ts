import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LOCATIONS_SEED } from "@/mocks/data/locations";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .eq("is_active", true);

        if (!error && data && data.length > 0) {
          const locations = data.map((loc) => ({
            id: loc.id,
            name: loc.name,
            shortName: loc.short_name,
            type: loc.type,
            district: loc.district,
            description: loc.description,
            position: { x: Number(loc.map_x), z: Number(loc.map_z) },
            highlights: loc.highlights ?? [],
            facts: loc.facts ?? [],
            openHours: loc.open_hours ?? "24 sols por sol",
          }));
          return NextResponse.json({ success: true, data: locations });
        }
      }
    }

    return NextResponse.json({ success: true, data: LOCATIONS_SEED });
  } catch (err) {
    console.error("Erro ao buscar localidades:", err);
    return NextResponse.json({ success: true, data: LOCATIONS_SEED });
  }
}

