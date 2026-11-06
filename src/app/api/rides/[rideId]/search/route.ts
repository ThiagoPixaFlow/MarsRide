import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { pickRandom } from "@/lib/random";
import { createId } from "@/lib/id";
import { RideCandidateAttempt, RideDetails, RoutePath } from "@/modules/rides/ride.types";

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

        // Busca tentativas anteriores para não repetir candidatos recusados
        const { data: pastAttempts } = await supabase
          .from("ride_candidate_attempts")
          .select("driver_id, vehicle_id")
          .eq("ride_id", rideId);

        const declinedDriverIds = new Set((pastAttempts ?? []).map((a) => a.driver_id));

        // Busca veículos disponíveis da categoria correspondente
        const { data: availableVehicles } = await supabase
          .from("vehicles")
          .select("*")
          .eq("category", ride.category)
          .eq("fleet_status", "active");

        const pool = (availableVehicles ?? []).filter((v) => {
          const seed = VEHICLES_SEED.find((s) => s.id === v.id);
          const driverId = seed?.driverId;
          return driverId && !declinedDriverIds.has(driverId);
        });

        if (pool.length === 0) {
          await supabase
            .from("rides")
            .update({ status: "no_driver_available" })
            .eq("id", rideId);

          return NextResponse.json({
            success: false,
            error: "Nenhum rover ou motorista disponível no momento.",
          });
        }

        const chosenVehicle = pickRandom(pool)!;
        const seed = VEHICLES_SEED.find((s) => s.id === chosenVehicle.id)!;
        const chosenDriver = DRIVERS_SEED.find((d) => d.id === seed.driverId) ?? DRIVERS_SEED[0];

        // Cria tentativa
        const { data: attempt } = await supabase
          .from("ride_candidate_attempts")
          .insert({
            ride_id: rideId,
            driver_id: chosenDriver.id,
            vehicle_id: chosenVehicle.id,
            status: "presented",
          })
          .select()
          .single();

        // Atualiza status da corrida
        await supabase
          .from("rides")
          .update({
            status: "awaiting_approval",
            driver_id: chosenDriver.id,
            vehicle_id: chosenVehicle.id,
          })
          .eq("id", rideId);

        // Registra evento
        await supabase.from("ride_events").insert({
          ride_id: rideId,
          event_type: "candidate_found",
          title: "Piloto localizado",
          description: `${chosenDriver.name} com ${chosenVehicle.name} (${chosenVehicle.plate}) disponível.`,
        });

        // Retorna RideDetails
        const origin = LOCATIONS_SEED.find((l) => l.id === ride.origin_id)!;
        const destination = LOCATIONS_SEED.find((l) => l.id === ride.destination_id)!;

        const details: RideDetails = {
          ride: {
            id: ride.id,
            userId: ride.user_id,
            originId: ride.origin_id,
            destinationId: ride.destination_id,
            category: ride.category,
            status: "awaiting_approval",
            estimatedPrice: Number(ride.estimated_price),
            estimatedDistanceKm: Number(ride.distance_km),
            estimatedDurationMin: ride.estimated_duration_min,
            finalPrice: null,
            driverId: chosenDriver.id,
            vehicleId: chosenVehicle.id,
            activeAttemptId: attempt?.id ?? null,
            approachRoute: null,
            tripRoute: ride.trip_route as unknown as RoutePath,
            stops: [],
            requestedAt: ride.requested_at,
            searchStartedAt: ride.requested_at,
            approvedAt: null,
            approachStartsAt: null,
            pickupEta: null,
            startedAt: null,
            completedAt: null,
            cancelledAt: null,
            cancellationReason: null,
            paymentTransactionId: null,
            scenarioSeed: ride.scenario_seed,
          },
          origin,
          destination,
          stopLocations: [],
          vehicle: seed,
          driver: chosenDriver,
          activeAttempt: attempt
            ? {
                id: attempt.id,
                rideId: attempt.ride_id,
                driverId: attempt.driver_id,
                vehicleId: attempt.vehicle_id,
                status: attempt.status,
                presentedAt: attempt.presented_at,
                respondedAt: attempt.responded_at,
              }
            : null,
          attempts: [],
          events: [],
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

    const pastAttempts = mockStorage.getAttempts(rideId);
    const declinedIds = new Set(
      pastAttempts
        .filter((a: RideCandidateAttempt) => a.status === "declined")
        .map((a: RideCandidateAttempt) => a.driverId)
    );

    const availableVehicles = VEHICLES_SEED.filter(
      (v) =>
        v.category === ride.category &&
        v.fleetStatus === "active" &&
        Boolean(v.driverId) &&
        !declinedIds.has(v.driverId!)
    );

    if (availableVehicles.length === 0) {
      ride.status = "no_driver_available";
      mockStorage.saveRide(ride);
      return NextResponse.json({
        success: false,
        error: "Nenhum piloto disponível no momento.",
      });
    }

    const chosenVehicle = pickRandom(availableVehicles)!;
    const chosenDriver = DRIVERS_SEED.find((d) => d.id === chosenVehicle.driverId) ?? DRIVERS_SEED[0];

    const attempt = {
      id: createId("att"),
      rideId,
      driverId: chosenDriver.id,
      vehicleId: chosenVehicle.id,
      status: "presented" as const,
      presentedAt: new Date().toISOString(),
      respondedAt: null,
    };

    mockStorage.saveAttempt(attempt);

    ride.status = "awaiting_approval";
    ride.activeAttemptId = attempt.id;
    ride.driverId = chosenDriver.id;
    ride.vehicleId = chosenVehicle.id;
    mockStorage.saveRide(ride);

    mockStorage.addEvent({
      id: createId("evt"),
      rideId,
      type: "candidate_presented",
      title: "Piloto localizado",
      description: `${chosenDriver.name} com ${chosenVehicle.name} (${chosenVehicle.plate}) disponível.`,
      createdAt: new Date().toISOString(),
    });

    const origin = LOCATIONS_SEED.find((l) => l.id === ride.originId)!;
    const destination = LOCATIONS_SEED.find((l) => l.id === ride.destinationId)!;

    const details: RideDetails = {
      ride,
      origin,
      destination,
      stopLocations: [],
      vehicle: chosenVehicle,
      driver: chosenDriver,
      activeAttempt: attempt,
      attempts: mockStorage.getAttempts(rideId),
      events: mockStorage.getEvents(rideId),
    };

    return NextResponse.json({ success: true, data: details });
  } catch (err) {
    console.error("Erro em /api/rides/[rideId]/search POST:", err);
    return NextResponse.json({ success: false, error: "Erro ao buscar candidato." }, { status: 500 });
  }
}
