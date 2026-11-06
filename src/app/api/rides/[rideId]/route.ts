import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { Ride, RideCandidateAttempt, RideDetails, RideEventType, RoutePath } from "@/modules/rides/ride.types";

export async function GET(
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

        if (!error && ride) {
          const origin = LOCATIONS_SEED.find((l) => l.id === ride.origin_id) ?? LOCATIONS_SEED[0];
          const destination = LOCATIONS_SEED.find((l) => l.id === ride.destination_id) ?? LOCATIONS_SEED[1];
          const vehicle = ride.vehicle_id ? VEHICLES_SEED.find((v) => v.id === ride.vehicle_id) ?? null : null;
          const driver = ride.driver_id ? DRIVERS_SEED.find((d) => d.id === ride.driver_id) ?? null : null;

          const { data: attempts } = await supabase
            .from("ride_candidate_attempts")
            .select("*")
            .eq("ride_id", ride.id)
            .order("presented_at", { ascending: false });

          const activeAttempt = attempts?.[0]
            ? {
                id: attempts[0].id,
                rideId: attempts[0].ride_id,
                driverId: attempts[0].driver_id,
                vehicleId: attempts[0].vehicle_id,
                status: attempts[0].status,
                presentedAt: attempts[0].presented_at,
                respondedAt: attempts[0].responded_at,
              }
            : null;

          const { data: events } = await supabase
            .from("ride_events")
            .select("*")
            .eq("ride_id", ride.id)
            .order("created_at", { ascending: true });

          const details: RideDetails = {
            ride: {
              id: ride.id,
              userId: ride.user_id,
              originId: ride.origin_id,
              destinationId: ride.destination_id,
              category: ride.category,
              status: ride.status as Ride["status"],
              estimatedPrice: Number(ride.estimated_price),
              estimatedDistanceKm: Number(ride.distance_km),
              estimatedDurationMin: ride.estimated_duration_min,
              finalPrice: ride.final_price ? Number(ride.final_price) : null,
              driverId: ride.driver_id,
              vehicleId: ride.vehicle_id,
              activeAttemptId: activeAttempt?.id ?? null,
              approachRoute: ride.approach_route as unknown as RoutePath | null,
              tripRoute: ride.trip_route as unknown as RoutePath,
              stops: [],
              requestedAt: ride.requested_at,
              searchStartedAt: ride.requested_at,
              approvedAt: ride.approved_at,
              approachStartsAt: ride.approved_at,
              pickupEta: ride.pickup_eta,
              startedAt: ride.started_at,
              completedAt: ride.completed_at,
              cancelledAt: ride.cancelled_at,
              cancellationReason: null,
              paymentTransactionId: null,
              scenarioSeed: ride.scenario_seed,
            },
            origin,
            destination,
            stopLocations: [],
            vehicle,
            driver,
            activeAttempt: (activeAttempt as unknown as RideCandidateAttempt) ?? null,
            attempts: (attempts as unknown as RideCandidateAttempt[]) ?? [],
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
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) {
      return NextResponse.json({ success: false, error: "Corrida não encontrada." }, { status: 404 });
    }

    const origin = LOCATIONS_SEED.find((l) => l.id === ride.originId) ?? LOCATIONS_SEED[0];
    const destination = LOCATIONS_SEED.find((l) => l.id === ride.destinationId) ?? LOCATIONS_SEED[1];
    const vehicle = ride.vehicleId ? VEHICLES_SEED.find((v) => v.id === ride.vehicleId) ?? null : null;
    const driver = ride.driverId ? DRIVERS_SEED.find((d) => d.id === ride.driverId) ?? null : null;
    const attempts = mockStorage.getAttempts(ride.id);
    const activeAttempt = attempts.find((a) => a.status === "presented") ?? attempts[attempts.length - 1] ?? null;

    const details: RideDetails = {
      ride,
      origin,
      destination,
      stopLocations: [],
      vehicle,
      driver,
      activeAttempt,
      attempts,
      events: mockStorage.getEvents(ride.id),
    };

    return NextResponse.json({ success: true, data: details });
  } catch (err) {
    console.error("Erro em /api/rides/[rideId] GET:", err);
    return NextResponse.json({ success: false, error: "Erro ao consultar corrida." }, { status: 500 });
  }
}
