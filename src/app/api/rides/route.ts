import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { roadGraph } from "@/lib/road-graph";
import { PRICING_CONFIG, SIMULATION_CONFIG } from "@/config/app.config";
import { VEHICLE_CATEGORY_META, VehicleCategory } from "@/modules/vehicles/vehicle.types";
import { mockStorage } from "@/mocks/storage";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { createId } from "@/lib/id";
import { Ride, RideDetails, RoutePath } from "@/modules/rides/ride.types";

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
          const { data: rides, error } = await supabase
            .from("rides")
            .select("*")
            .eq("user_id", user.id)
            .order("requested_at", { ascending: false });

          if (!error && rides) {
            return NextResponse.json({ success: true, data: rides });
          }
        }
      }
    }

    mockStorage.init();
    const currentId = mockStorage.getCurrentUserId() ?? "usr_alex_vance";
    const userRides = mockStorage.getRides().filter((r) => r.userId === currentId);
    return NextResponse.json({ success: true, data: userRides });
  } catch (err) {
    console.error("Erro em /api/rides GET:", err);
    return NextResponse.json({ success: false, error: "Erro ao listar viagens." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originId, destinationId, category } = body;

    if (!originId || !destinationId || !category) {
      return NextResponse.json(
        { success: false, error: "Origem, destino e categoria são obrigatórios." },
        { status: 400 }
      );
    }

    if (originId === destinationId) {
      return NextResponse.json(
        { success: false, error: "Origem e destino não podem ser iguais." },
        { status: 400 }
      );
    }

    // Calcula rota pelo grafo de estradas
    const pathResult = roadGraph.findShortestPath(originId, destinationId);
    const lengthUnits = pathResult.length;
    const distanceKm = Number(((lengthUnits * SIMULATION_CONFIG.metersPerUnit) / 1000).toFixed(1));
    const durationHours = distanceKm / SIMULATION_CONFIG.tripSpeedKmh;
    const durationMin = Math.max(2, Math.round(durationHours * 60));

    const rawFare = PRICING_CONFIG.baseFare + distanceKm * PRICING_CONFIG.perKm;
    const multiplier = VEHICLE_CATEGORY_META[category as VehicleCategory]?.priceMultiplier ?? 1;
    const price = Math.max(PRICING_CONFIG.minimumFare, Math.round(rawFare * multiplier));

    const tripRoute: RoutePath = {
      points: pathResult.points,
      nodeIds: pathResult.nodeIds,
      length: pathResult.length,
    };

    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      if (supabase) {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!authError && user) {
          // Verifica se já tem corrida ativa
          const { data: activeRides } = await supabase
            .from("rides")
            .select("id, status")
            .eq("user_id", user.id)
            .not("status", "in", '("completed","cancelled","no_driver_available")');

          if (activeRides && activeRides.length > 0) {
            return NextResponse.json(
              { success: false, error: "Você já possui uma solicitação ou viagem ativa." },
              { status: 409 }
            );
          }

          // Valida saldo da carteira
          const { data: wallet } = await supabase
            .from("wallets")
            .select("balance")
            .eq("user_id", user.id)
            .single();

          if (!wallet || Number(wallet.balance) < price) {
            return NextResponse.json(
              {
                success: false,
                error: `Saldo insuficiente (${wallet?.balance ?? 0} MCR). Valor estimado: ${price} MCR.`,
              },
              { status: 402 }
            );
          }

          // Cria a corrida usando admin client para garantir inserção em rides e ride_events
          const admin = createAdminClient() ?? supabase;
          const { data: newRide, error: insertError } = await admin
            .from("rides")
            .insert({
              user_id: user.id,
              origin_id: originId,
              destination_id: destinationId,
              category: category as "go" | "prime",
              status: "searching_driver",
              estimated_price: price,
              estimated_duration_min: durationMin,
              distance_km: distanceKm,
              trip_route: tripRoute as unknown as Record<string, unknown>,
              scenario_seed: Math.floor(Math.random() * 100000),
            })
            .select()
            .single();

          if (insertError || !newRide) {
            throw insertError;
          }

          // Registra evento de solicitação
          await admin.from("ride_events").insert({
            ride_id: newRide.id,
            event_type: "requested",
            title: "Solicitação iniciada",
            description: `Varredura de frota iniciada para ${destinationId}.`,
          });

          const origin = LOCATIONS_SEED.find((l) => l.id === originId)!;
          const destination = LOCATIONS_SEED.find((l) => l.id === destinationId)!;

          const details: RideDetails = {
            ride: {
              id: newRide.id,
              userId: newRide.user_id,
              originId: newRide.origin_id,
              destinationId: newRide.destination_id,
              category: newRide.category,
              status: newRide.status as Ride["status"],
              estimatedPrice: Number(newRide.estimated_price),
              estimatedDistanceKm: Number(newRide.distance_km),
              estimatedDurationMin: newRide.estimated_duration_min,
              finalPrice: newRide.final_price ? Number(newRide.final_price) : null,
              driverId: newRide.driver_id,
              vehicleId: newRide.vehicle_id,
              activeAttemptId: null,
              approachRoute: null,
              tripRoute,
              stops: [],
              requestedAt: newRide.requested_at,
              searchStartedAt: newRide.requested_at,
              approvedAt: newRide.approved_at,
              approachStartsAt: null,
              pickupEta: newRide.pickup_eta,
              startedAt: newRide.started_at,
              completedAt: newRide.completed_at,
              cancelledAt: newRide.cancelled_at,
              cancellationReason: null,
              paymentTransactionId: null,
              scenarioSeed: newRide.scenario_seed,
            },
            origin,
            destination,
            stopLocations: [],
            vehicle: null,
            driver: null,
            activeAttempt: null,
            attempts: [],
            events: [
              {
                id: createId("evt"),
                rideId: newRide.id,
                type: "ride_requested",
                title: "Solicitação iniciada",
                description: `Varredura de frota iniciada para ${destinationId}.`,
                createdAt: newRide.requested_at,
              },
            ],
          };

          return NextResponse.json({ success: true, data: details });
        }
      }
    }

    // Modo local / mock storage
    mockStorage.init();
    const currentId = mockStorage.getCurrentUserId() ?? "usr_alex_vance";
    const existing = mockStorage
      .getRides()
      .find(
        (r) =>
          r.userId === currentId &&
          !["completed", "cancelled", "no_driver_available"].includes(r.status)
      );

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Você já possui uma solicitação ou viagem ativa." },
        { status: 409 }
      );
    }

    const wallet = mockStorage.getWalletByUserId(currentId);
    if (wallet.balance < price) {
      return NextResponse.json(
        {
          success: false,
          error: `Saldo insuficiente (${wallet.balance} MCR). O valor estimado é de ${price} MCR.`,
        },
        { status: 402 }
      );
    }

    const rideId = createId("ride");
    const now = new Date().toISOString();

    const ride: Ride = {
      id: rideId,
      userId: currentId,
      originId,
      destinationId,
      category,
      status: "searching_driver",
      estimatedPrice: price,
      estimatedDistanceKm: distanceKm,
      estimatedDurationMin: durationMin,
      finalPrice: null,
      driverId: null,
      vehicleId: null,
      activeAttemptId: null,
      approachRoute: null,
      tripRoute,
      stops: [],
      requestedAt: now,
      searchStartedAt: now,
      approvedAt: null,
      approachStartsAt: null,
      pickupEta: null,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      paymentTransactionId: null,
      scenarioSeed: Math.floor(Math.random() * 100000),
    };

    mockStorage.saveRide(ride);
    mockStorage.addEvent({
      id: createId("evt"),
      rideId,
      type: "ride_requested",
      title: "Solicitação iniciada",
      description: `Varredura de frota iniciada para ${destinationId}.`,
      createdAt: now,
    });

    const origin = LOCATIONS_SEED.find((l) => l.id === originId)!;
    const destination = LOCATIONS_SEED.find((l) => l.id === destinationId)!;

    const details: RideDetails = {
      ride,
      origin,
      destination,
      stopLocations: [],
      vehicle: null,
      driver: null,
      activeAttempt: null,
      attempts: [],
      events: mockStorage.getEvents(rideId),
    };

    return NextResponse.json({ success: true, data: details });
  } catch (err) {
    console.error("Erro em /api/rides POST:", err);
    return NextResponse.json({ success: false, error: "Erro ao criar solicitação." }, { status: 500 });
  }
}
