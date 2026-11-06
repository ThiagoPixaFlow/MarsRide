import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("fleet_status", "active");

        if (!error && data && data.length > 0) {
          const vehicles = data.map((v) => {
            const seed = VEHICLES_SEED.find((s) => s.id === v.id);
            return {
              id: v.id,
              name: v.name,
              plate: v.plate,
              model: v.model,
              category: v.category,
              capacity: v.capacity,
              paintColor: v.paint_color,
              accentColor: v.accent_color,
              driverId: seed?.driverId ?? "drv-marc",
              fleetStatus: v.fleet_status,
              patrolLoop: seed?.patrolLoop ?? ["loc-hub-central", "loc-market"],
              patrolOffset: seed?.patrolOffset ?? 0,
              parkedNodeId: null,
              batteryLevel: v.battery_level,
              features: v.features ?? [],
            };
          });
          return NextResponse.json({ success: true, data: vehicles });
        }
      }
    }

    return NextResponse.json({ success: true, data: VEHICLES_SEED });
  } catch (err) {
    console.error("Erro ao buscar veículos:", err);
    return NextResponse.json({ success: true, data: VEHICLES_SEED });
  }
}

