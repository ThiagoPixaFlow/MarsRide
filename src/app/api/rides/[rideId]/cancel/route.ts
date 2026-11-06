import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { RideDetails, RoutePath } from "@/modules/rides/ride.types";

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

        await supabase
          .from("rides")
          .update({
            status: "cancelled",
            cancelled_at: nowIso,
          })
          .eq("id", rideId);

        if (ride.vehicle_id) {
          await supabase
            .from("vehicles")
            .update({ fleet_status: "active" })
            .eq("id", ride.vehicle_id);
        }

        await supabase.from("ride_events").insert({
          ride_id: rideId,
          event_type: "cancelled",
          title: "Corrida cancelada",
          description: "Solicitação cancelada pelo passageiro.",
        });

        const origin = LOCATIONS_SEED.find((l) => l.id === ride.origin_id) ?? LOCATIONS_SEED[0];
        const destination = LOCATIONS_SEED.find((l) => l.id === ride.destination_id) ?? LOCATIONS_SEED[1];
        const vehicle = ride.vehicle_id ? VEHICLES_SEED.find((v) => v.id === ride.vehicle_id) ?? null : null;
        const driver = ride.driver_id ? DRIVERS_SEED.find((d) => d.id === ride.driver_id) ?? null : null;

        const details: RideDetails = {
          ride: {
            id: ride.id,
            userId: ride.user_id,
            originId: ride.origin_id,
            destinationId: ride.destination_id,
            category: ride.category,
            status: "cancelled",
            estimatedPrice: Number(ride.estimated_price),
            estimatedDistanceKm: Number(ride.distance_km),
            estimatedDurationMin: ride.estimated_duration_min,
            finalPrice: null,
            driverId: ride.driver_id,
            vehicleId: ride.vehicle_id,
            activeAttemptId: null,
            approachRoute: null,
            tripRoute: ride.trip_route as unknown as RoutePath,
            stops: [],
            requestedAt: ride.requested_at,
            searchStartedAt: ride.requested_at,
            approvedAt: ride.approved_at,
            approachStartsAt: null,
            pickupEta: null,
            startedAt: null,
            completedAt: null,
            cancelledAt: nowIso,
            cancellationReason: "Cancelado pelo passageiro",
            paymentTransactionId: null,
            scenarioSeed: ride.scenario_seed,
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

        return NextResponse.json({
          success: true,
          message: "Corrida cancelada com sucesso.",
          data: details,
        });
      }
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) {
      return NextResponse.json({ success: false, error: "Corrida não encontrada." }, { status: 404 });
    }

    ride.status = "cancelled";
    ride.cancelledAt = new Date().toISOString();
    mockStorage.saveRide(ride);

    if (ride.vehicleId) {
      const vehicles = mockStorage.getVehicles();
      const v = vehicles.find((veh) => veh.id === ride.vehicleId);
      if (v) {
        v.fleetStatus = "active";
        mockStorage.saveVehicles(vehicles);
      }
    }

    mockStorage.addEvent({
      id: "evt_cancelled",
      rideId,
      type: "ride_cancelled",
      title: "Corrida cancelada",
      description: "Solicitação cancelada pelo passageiro.",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Corrida cancelada com sucesso." });
  } catch (err) {
    console.error("Erro em /api/rides/[rideId]/cancel POST:", err);
    return NextResponse.json({ success: false, error: "Erro ao cancelar corrida." }, { status: 500 });
  }
}
