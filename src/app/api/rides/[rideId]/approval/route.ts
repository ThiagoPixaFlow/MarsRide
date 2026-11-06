import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockStorage } from "@/mocks/storage";
import { roadGraph } from "@/lib/road-graph";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { createId } from "@/lib/id";
import { RideCandidateAttempt, RideDetails, RoutePath } from "@/modules/rides/ride.types";

export async function POST(
  request: Request,
  props: { params: Promise<{ rideId: string }> }
) {
  try {
    const { rideId } = await props.params;
    const body = await request.json();
    const { action, currentRoverPos } = body;

    if (!["approve", "decline"].includes(action)) {
      return NextResponse.json({ success: false, error: "Ação inválida." }, { status: 400 });
    }

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

        const { data: attempts } = await supabase
          .from("ride_candidate_attempts")
          .select("*")
          .eq("ride_id", rideId)
          .eq("status", "presented")
          .order("presented_at", { ascending: false });

        let activeAttempt = attempts?.[0];
        // Se a tentativa não foi registrada no banco mas a corrida já tem driver e vehicle vinculados
        if (!activeAttempt && ride.driver_id && ride.vehicle_id) {
          const { data: createdAttempt } = await supabase
            .from("ride_candidate_attempts")
            .insert({
              ride_id: rideId,
              driver_id: ride.driver_id,
              vehicle_id: ride.vehicle_id,
              status: "presented",
            })
            .select()
            .single();
          if (createdAttempt) {
            activeAttempt = createdAttempt;
          }
        }

        if (!activeAttempt) {
          return NextResponse.json({ success: false, error: "Nenhuma proposta pendente." }, { status: 400 });
        }

        const now = new Date().toISOString();
        const origin = LOCATIONS_SEED.find((l) => l.id === ride.origin_id)!;
        const destination = LOCATIONS_SEED.find((l) => l.id === ride.destination_id)!;

        if (action === "decline") {
          // Atualiza tentativa para recusada
          await supabase
            .from("ride_candidate_attempts")
            .update({ status: "declined", responded_at: now })
            .eq("id", activeAttempt.id);

          await supabase
            .from("rides")
            .update({
              status: "searching_driver",
              driver_id: null,
              vehicle_id: null,
            })
            .eq("id", rideId);

          await supabase.from("ride_events").insert({
            ride_id: rideId,
            event_type: "candidate_declined",
            title: "Proposta recusada",
            description: "Passageiro solicitou outro veículo.",
          });

          const searchingDetails: RideDetails = {
            ride: {
              id: ride.id,
              userId: ride.user_id,
              originId: ride.origin_id,
              destinationId: ride.destination_id,
              category: ride.category,
              status: "searching_driver",
              estimatedPrice: Number(ride.estimated_price),
              estimatedDistanceKm: Number(ride.distance_km),
              estimatedDurationMin: ride.estimated_duration_min,
              finalPrice: null,
              driverId: null,
              vehicleId: null,
              activeAttemptId: null,
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
            vehicle: null,
            driver: null,
            activeAttempt: null,
            attempts: [],
            events: [],
          };

          return NextResponse.json({
            success: true,
            action: "declined",
            data: searchingDetails,
            message: "Candidato recusado. Buscando nova opção...",
          });
        }

        // APROVAÇÃO
        await supabase
          .from("ride_candidate_attempts")
          .update({ status: "approved", responded_at: now })
          .eq("id", activeAttempt.id);

        // Bloqueia veículo como ocupado na frota
        await supabase
          .from("vehicles")
          .update({ fleet_status: "busy" })
          .eq("id", activeAttempt.vehicle_id);

        // Calcula trajeto de aproximação estritamente pelas estradas
        let approachPath;
        if (currentRoverPos && typeof currentRoverPos.x === "number" && typeof currentRoverPos.z === "number") {
          approachPath = roadGraph.findPathFromPosition(currentRoverPos, ride.origin_id);
        } else {
          approachPath = roadGraph.findShortestPath("loc-hub-central", ride.origin_id);
        }

        const approachRoute: RoutePath = {
          points: approachPath.points,
          nodeIds: approachPath.nodeIds,
          length: approachPath.length,
        };

        const approachDurationSec = Math.max(
          14,
          Math.round(approachRoute.length / 3.2)
        );
        const pickupEta = new Date(Date.now() + approachDurationSec * 1000).toISOString();

        // Atualiza a corrida
        const { data: updatedRide } = await supabase
          .from("rides")
          .update({
            status: "approaching_pickup",
            driver_id: activeAttempt.driver_id,
            vehicle_id: activeAttempt.vehicle_id,
            approved_at: now,
            pickup_eta: pickupEta,
            approach_route: approachRoute as unknown as Record<string, unknown>,
          })
          .eq("id", rideId)
          .select()
          .single();

        await supabase.from("ride_events").insert({
          ride_id: rideId,
          event_type: "candidate_approved",
          title: "Corrida confirmada",
          description: `Rover a caminho do embarque. Chegada estimada em ${approachDurationSec}s.`,
        });

        // Envia mensagem inicial do piloto no chat
        const driver = DRIVERS_SEED.find((d) => d.id === activeAttempt.driver_id);
        const welcomeMsg = driver?.persona?.catchphrase ?? "Olá! Já estou a caminho do seu ponto de embarque.";
        await supabase.from("ride_messages").insert({
          ride_id: rideId,
          sender_type: "driver",
          content: welcomeMsg,
        });

        const vehicle = VEHICLES_SEED.find((v) => v.id === activeAttempt.vehicle_id) ?? null;

        const details: RideDetails = {
          ride: {
            id: (updatedRide ?? ride).id,
            userId: (updatedRide ?? ride).user_id,
            originId: (updatedRide ?? ride).origin_id,
            destinationId: (updatedRide ?? ride).destination_id,
            category: (updatedRide ?? ride).category,
            status: "approaching_pickup",
            estimatedPrice: Number((updatedRide ?? ride).estimated_price),
            estimatedDistanceKm: Number((updatedRide ?? ride).distance_km),
            estimatedDurationMin: (updatedRide ?? ride).estimated_duration_min,
            finalPrice: null,
            driverId: activeAttempt.driver_id,
            vehicleId: activeAttempt.vehicle_id,
            activeAttemptId: activeAttempt.id,
            approachRoute,
            tripRoute: (updatedRide ?? ride).trip_route as unknown as RoutePath,
            stops: [],
            requestedAt: (updatedRide ?? ride).requested_at,
            searchStartedAt: (updatedRide ?? ride).requested_at,
            approvedAt: (updatedRide ?? ride).approved_at ?? now,
            approachStartsAt: now,
            pickupEta: (updatedRide ?? ride).pickup_eta ?? pickupEta,
            startedAt: null,
            completedAt: null,
            cancelledAt: null,
            cancellationReason: null,
            paymentTransactionId: null,
            scenarioSeed: (updatedRide ?? ride).scenario_seed,
          },
          origin,
          destination,
          stopLocations: [],
          vehicle,
          driver: driver ?? null,
          activeAttempt: {
            id: activeAttempt.id,
            rideId: activeAttempt.ride_id,
            driverId: activeAttempt.driver_id,
            vehicleId: activeAttempt.vehicle_id,
            status: "approved",
            presentedAt: activeAttempt.presented_at,
            respondedAt: now,
          },
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

    const attempts = mockStorage.getAttempts(rideId);
    const activeAttempt = attempts.find((a: RideCandidateAttempt) => a.status === "presented");
    if (!activeAttempt) {
      return NextResponse.json({ success: false, error: "Nenhuma proposta pendente." }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === "decline") {
      activeAttempt.status = "declined";
      activeAttempt.respondedAt = now;
      mockStorage.saveAttempt(activeAttempt);

      mockStorage.addEvent({
        id: createId("evt"),
        rideId,
        type: "candidate_declined",
        title: "Proposta recusada",
        description: "Passageiro solicitou outro veículo.",
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        action: "declined",
        message: "Candidato recusado.",
      });
    }

    // APROVAÇÃO
    activeAttempt.status = "approved";
    activeAttempt.respondedAt = now;
    mockStorage.saveAttempt(activeAttempt);

    let approachPath;
    if (currentRoverPos && typeof currentRoverPos.x === "number" && typeof currentRoverPos.z === "number") {
      approachPath = roadGraph.findPathFromPosition(currentRoverPos, ride.originId);
    } else {
      approachPath = roadGraph.findShortestPath("loc-hub-central", ride.originId);
    }

    const approachRoute: RoutePath = {
      points: approachPath.points,
      nodeIds: approachPath.nodeIds,
      length: approachPath.length,
    };

    const approachDurationSec = Math.max(
      14,
      Math.round(approachRoute.length / 3.2)
    );
    const pickupEta = new Date(Date.now() + approachDurationSec * 1000).toISOString();

    ride.status = "approaching_pickup";
    ride.approvedAt = now;
    ride.approachStartsAt = now;
    ride.pickupEta = pickupEta;
    ride.approachRoute = approachRoute;
    mockStorage.saveRide(ride);

    mockStorage.addEvent({
      id: createId("evt"),
      rideId,
      type: "driver_approved",
      title: "Corrida confirmada",
      description: `Rover a caminho do embarque. Chegada estimada em ${approachDurationSec}s.`,
      createdAt: now,
    });

    const driver = DRIVERS_SEED.find((d) => d.id === activeAttempt.driverId);
    const welcomeMsg = driver?.persona?.catchphrase ?? "Olá! Já estou a caminho do seu ponto de embarque.";
    mockStorage.saveMessage({
      id: createId("msg"),
      rideId,
      sender: "driver",
      content: welcomeMsg,
      createdAt: now,
      status: "read",
      attachment: null,
    });

    const origin = LOCATIONS_SEED.find((l) => l.id === ride.originId)!;
    const destination = LOCATIONS_SEED.find((l) => l.id === ride.destinationId)!;
    const vehicle = VEHICLES_SEED.find((v) => v.id === activeAttempt.vehicleId) ?? null;

    const details: RideDetails = {
      ride,
      origin,
      destination,
      stopLocations: [],
      vehicle,
      driver: driver ?? null,
      activeAttempt,
      attempts: mockStorage.getAttempts(rideId),
      events: mockStorage.getEvents(rideId),
    };

    return NextResponse.json({ success: true, data: details });
  } catch (err) {
    console.error("Erro em /api/rides/[rideId]/approval POST:", err);
    return NextResponse.json({ success: false, error: "Erro ao processar aprovação." }, { status: 500 });
  }
}
