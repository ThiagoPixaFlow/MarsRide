import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { Ride, RideDetails, RoutePath } from "@/modules/rides/ride.types";

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

        const nowIso = new Date().toISOString();

        if (ride.status === "approaching_pickup") {
          await supabase
            .from("rides")
            .update({ status: "boarding" })
            .eq("id", rideId);
        } else if (ride.status === "boarding") {
          await supabase
            .from("rides")
            .update({ status: "in_progress", started_at: nowIso })
            .eq("id", rideId);
        } else if (ride.status === "in_progress") {
          const finalPrice = Number(ride.estimated_price);

          await supabase
            .from("rides")
            .update({
              status: "completed",
              completed_at: nowIso,
              final_price: finalPrice,
            })
            .eq("id", rideId);

          if (ride.vehicle_id) {
            await supabase
              .from("vehicles")
              .update({ fleet_status: "active" })
              .eq("id", ride.vehicle_id);
          }

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
        }

        const { data: updatedRide } = await supabase
          .from("rides")
          .select("*")
          .eq("id", rideId)
          .single();

        const origin = LOCATIONS_SEED.find((l) => l.id === updatedRide!.origin_id)!;
        const destination = LOCATIONS_SEED.find((l) => l.id === updatedRide!.destination_id)!;
        const vehicle = updatedRide!.vehicle_id ? VEHICLES_SEED.find((v) => v.id === updatedRide!.vehicle_id) ?? null : null;
        const driver = updatedRide!.driver_id ? DRIVERS_SEED.find((d) => d.id === updatedRide!.driver_id) ?? null : null;

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
          events: [],
        };

        return NextResponse.json({ success: true, data: details });
      }
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) {
      return NextResponse.json({ success: false, error: "Corrida não encontrada." }, { status: 404 });
    }

    const now = new Date().toISOString();
    if (ride.status === "approaching_pickup") {
      ride.status = "boarding";
    } else if (ride.status === "boarding") {
      ride.status = "in_progress";
      ride.startedAt = now;
    } else if (ride.status === "in_progress") {
      ride.status = "completed";
      ride.completedAt = now;
      ride.finalPrice = ride.estimatedPrice;
    }
    mockStorage.saveRide(ride);

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
    console.error("Erro em /api/rides/[rideId]/fast-forward POST:", err);
    return NextResponse.json({ success: false, error: "Erro ao avançar corrida." }, { status: 500 });
  }
}
