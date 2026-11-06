import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { createId } from "@/lib/id";
import { Ride, RideDetails, RideEventType, RoutePath } from "@/modules/rides/ride.types";

export async function POST(
  _request: Request,
  props: { params: Promise<{ rideId: string }> }
) {
  try {
    const { rideId } = await props.params;

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data: ride, error } = await supabase
          .from("rides")
          .select("*")
          .eq("id", rideId)
          .single();

        if (error || !ride) {
          return NextResponse.json({ success: false, error: "Corrida não encontrada." }, { status: 404 });
        }

        const now = Date.now();
        const nowIso = new Date(now).toISOString();

        // 1. APROXIMAÇÃO -> EMBARQUE (quando o rover chega ao ponto de embarque)
        if (ride.status === "approaching_pickup" && ride.pickup_eta) {
          const etaTime = new Date(ride.pickup_eta).getTime();
          if (now >= etaTime) {
            await supabase
              .from("rides")
              .update({ status: "boarding" })
              .eq("id", rideId);

            await supabase.from("ride_events").insert({
              ride_id: rideId,
              event_type: "rover_arrived",
              title: "Rover no local de embarque",
              description: "Aguardando acomodação do passageiro na cabine pressurizada.",
            });
          }
        }

        // 2. EMBARQUE: O rover aguarda no ponto de embarque até o passageiro clicar em
        // "Embarcar no Rover e Iniciar Viagem" (acionado via /api/rides/[rideId]/fast-forward).
        // Não auto-iniciamos aqui para dar controle ao usuário.

        // 3. DESLOCAMENTO -> CONCLUÍDA
        else if (ride.status === "in_progress" && ride.started_at) {
          const startTime = new Date(ride.started_at).getTime();
          const tripRoute = ride.trip_route as unknown as RoutePath;
          const tripDurationSec = Math.max(
            20,
            Math.round((tripRoute?.length ?? 10) / 3.2)
          );

          if (now >= startTime + tripDurationSec * 1000) {
            const finalPrice = Number(ride.estimated_price);

            // Finaliza a corrida
            await supabase
              .from("rides")
              .update({
                status: "completed",
                completed_at: nowIso,
                final_price: finalPrice,
              })
              .eq("id", rideId);

            // Libera o veículo
            if (ride.vehicle_id) {
              await supabase
                .from("vehicles")
                .update({ fleet_status: "active" })
                .eq("id", ride.vehicle_id);
            }

            // Débito transacional na carteira
            const { data: wallet } = await supabase
              .from("wallets")
              .select("*")
              .eq("user_id", ride.user_id)
              .single();

            if (wallet) {
              const newBalance = Math.max(0, Number(wallet.balance) - finalPrice);
              await supabase
                .from("wallets")
                .update({ balance: newBalance })
                .eq("id", wallet.id);

              await supabase.from("wallet_transactions").insert({
                wallet_id: wallet.id,
                ride_id: rideId,
                type: "ride_debit",
                amount: finalPrice,
                balance_after: newBalance,
                description: `Pagamento da corrida para ${ride.destination_id}`,
              });
            }

            await supabase.from("ride_events").insert({
              ride_id: rideId,
              event_type: "trip_completed",
              title: "Viagem concluída",
              description: `Chegada confirmada. Débito de ${finalPrice} MCR realizado com sucesso.`,
            });
          }
        }

        // Retorna estado atualizado
        const { data: updatedRide } = await supabase
          .from("rides")
          .select("*")
          .eq("id", rideId)
          .single();

        const origin = LOCATIONS_SEED.find((l) => l.id === updatedRide!.origin_id)!;
        const destination = LOCATIONS_SEED.find((l) => l.id === updatedRide!.destination_id)!;
        const vehicle = updatedRide!.vehicle_id ? VEHICLES_SEED.find((v) => v.id === updatedRide!.vehicle_id) ?? null : null;
        const driver = updatedRide!.driver_id ? DRIVERS_SEED.find((d) => d.id === updatedRide!.driver_id) ?? null : null;

        const { data: events } = await supabase
          .from("ride_events")
          .select("*")
          .eq("ride_id", rideId)
          .order("created_at", { ascending: true });

        const details: RideDetails = {
          ride: {
            id: updatedRide!.id,
            userId: updatedRide!.user_id,
            originId: updatedRide!.origin_id,
            destinationId: updatedRide!.destination_id,
            category: updatedRide!.category,
            status: updatedRide!.status as Ride["status"],
            estimatedPrice: Number(updatedRide!.estimated_price),
            estimatedDistanceKm: Number(updatedRide!.distance_km),
            estimatedDurationMin: updatedRide!.estimated_duration_min,
            finalPrice: updatedRide!.final_price ? Number(updatedRide!.final_price) : null,
            driverId: updatedRide!.driver_id,
            vehicleId: updatedRide!.vehicle_id,
            activeAttemptId: null,
            approachRoute: updatedRide!.approach_route as unknown as RoutePath | null,
            tripRoute: updatedRide!.trip_route as unknown as RoutePath,
            stops: [],
            requestedAt: updatedRide!.requested_at,
            searchStartedAt: updatedRide!.requested_at,
            approvedAt: updatedRide!.approved_at,
            approachStartsAt: updatedRide!.approved_at,
            pickupEta: updatedRide!.pickup_eta,
            startedAt: updatedRide!.started_at,
            completedAt: updatedRide!.completed_at,
            cancelledAt: updatedRide!.cancelled_at,
            cancellationReason: null,
            paymentTransactionId: null,
            scenarioSeed: updatedRide!.scenario_seed,
          },
          origin,
          destination,
          stopLocations: [],
          vehicle,
          driver,
          activeAttempt: null,
          attempts: [],
          events: (events ?? []).map((e) => ({
            id: e.id,
            rideId: e.ride_id,
            type: e.event_type as RideEventType,
            title: e.title,
            description: e.description,
            createdAt: e.created_at,
          })),
        };

        return NextResponse.json({ success: true, data: details });
      }
    }

    // Modo local / mock storage
    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) {
      return NextResponse.json({ success: false, error: "Corrida não encontrada." }, { status: 404 });
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    if (ride.status === "approaching_pickup" && ride.pickupEta) {
      if (now >= new Date(ride.pickupEta).getTime()) {
        ride.status = "boarding";
        mockStorage.saveRide(ride);
        mockStorage.addEvent({
          id: createId("evt"),
          rideId,
          type: "driver_arrived",
          title: "Rover no local de embarque",
          description: "Aguardando acomodação do passageiro na cabine.",
          createdAt: nowIso,
        });
      }
    } else if (ride.status === "in_progress" && ride.startedAt) {
      const tripDurationSec = Math.max(20, Math.round((ride.tripRoute?.length ?? 10) / 3.2));
      if (now >= new Date(ride.startedAt).getTime() + tripDurationSec * 1000) {
        ride.status = "completed";
        ride.completedAt = nowIso;
        ride.finalPrice = ride.estimatedPrice;
        mockStorage.saveRide(ride);

        const wallet = mockStorage.getWalletByUserId(ride.userId);
        const newBalance = Math.max(0, wallet.balance - ride.estimatedPrice);
        wallet.balance = newBalance;
        mockStorage.saveWallet(wallet);
        mockStorage.addTransaction({
          id: createId("tx"),
          walletId: wallet.id,
          rideId,
          type: "ride_payment",
          amount: -ride.estimatedPrice,
          balanceAfter: newBalance,
          description: `Pagamento da corrida para ${ride.destinationId}`,
          createdAt: nowIso,
        });

        mockStorage.addEvent({
          id: createId("evt"),
          rideId,
          type: "ride_completed",
          title: "Viagem concluída",
          description: `Chegada confirmada. Débito de ${ride.estimatedPrice} MCR realizado.`,
          createdAt: nowIso,
        });
      }
    }

    const origin = LOCATIONS_SEED.find((l) => l.id === ride.originId)!;
    const destination = LOCATIONS_SEED.find((l) => l.id === ride.destinationId)!;
    const vehicle = ride.vehicleId ? VEHICLES_SEED.find((v) => v.id === ride.vehicleId) ?? null : null;
    const driver = ride.driverId ? DRIVERS_SEED.find((d) => d.id === ride.driverId) ?? null : null;

    const details: RideDetails = {
      ride,
      origin,
      destination,
      stopLocations: [],
      vehicle,
      driver,
      activeAttempt: null,
      attempts: mockStorage.getAttempts(rideId),
      events: mockStorage.getEvents(rideId),
    };

    return NextResponse.json({ success: true, data: details });
  } catch (err) {
    console.error("Erro em /api/rides/[rideId]/tick POST:", err);
    return NextResponse.json({ success: false, error: "Erro no tick da corrida." }, { status: 500 });
  }
}
