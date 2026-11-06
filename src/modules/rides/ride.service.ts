import { mockStorage } from "@/mocks/storage";
import {
  Ride,
  RideDetails,
  RideQuote,
  RideCandidateAttempt,
  RideEvent,
  RideSummary,
  RoutePath,
  RideStop,
} from "@/modules/rides/ride.types";
import { VehicleCategory, VEHICLE_CATEGORY_META } from "@/modules/vehicles/vehicle.types";
import { PRICING_CONFIG, SIMULATION_CONFIG } from "@/config/app.config";
import { roadGraph } from "@/lib/road-graph";
import { ROAD_NODES_SEED, RoadNode } from "@/mocks/data/road-network";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { DRIVERS_SEED } from "@/mocks/data/drivers";
import { ServiceError } from "@/lib/errors";
import { createId } from "@/lib/id";
import { pickRandom } from "@/lib/random";
import { walletService } from "@/modules/wallet/wallet.service";
import { Vec2 } from "@/types/common";

export class RideService {
  /**
   * Calcula cotação de corrida entre origem e destino.
   */
  async calculateQuote(originId: string, destinationId: string): Promise<RideQuote> {
    if (originId === destinationId) {
      throw new ServiceError("VALIDATION", "Origem e destino não podem ser iguais.");
    }

    const origin = LOCATIONS_SEED.find((l) => l.id === originId);
    const destination = LOCATIONS_SEED.find((l) => l.id === destinationId);
    if (!origin || !destination) {
      throw new ServiceError("NOT_FOUND", "Localidade não encontrada.");
    }

    const pathResult = roadGraph.findShortestPath(originId, destinationId);
    const lengthUnits = pathResult.length;
    // 1 unidade = 100m = 0.1 km
    const distanceKm = Number(((lengthUnits * SIMULATION_CONFIG.metersPerUnit) / 1000).toFixed(1));
    // Duração estimada baseada na velocidade do rover
    const durationHours = distanceKm / SIMULATION_CONFIG.tripSpeedKmh;
    const durationMin = Math.max(2, Math.round(durationHours * 60));

    // Base + perKm
    const rawFare = PRICING_CONFIG.baseFare + distanceKm * PRICING_CONFIG.perKm;

    const options = (["go", "prime"] as VehicleCategory[]).map((cat) => {
      const multiplier = VEHICLE_CATEGORY_META[cat].priceMultiplier;
      const price = Math.max(PRICING_CONFIG.minimumFare, Math.round(rawFare * multiplier));
      const availableVehicles = VEHICLES_SEED.filter((v) => v.category === cat && v.fleetStatus === "active").length;
      return { category: cat, price, availableVehicles };
    });

    return {
      originId,
      destinationId,
      distanceKm,
      durationMin,
      route: pathResult.points,
      options,
    };
  }

  /**
   * Cria uma solicitação de corrida.
   */
  async requestRide(params: {
    originId: string;
    destinationId: string;
    category: VehicleCategory;
    userId?: string;
  }): Promise<RideDetails> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/rides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originId: params.originId,
            destinationId: params.destinationId,
            category: params.category,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const userId = params.userId ?? mockStorage.getCurrentUserId();
    if (!userId) throw new ServiceError("UNAUTHENTICATED", "Usuário não autenticado.");

    // Verifica se já existe viagem ativa
    const existing = mockStorage
      .getRides()
      .find(
        (r) =>
          r.userId === userId &&
          !["completed", "cancelled", "no_driver_available"].includes(r.status)
      );
    if (existing) {
      throw new ServiceError("CONFLICT", "Você já possui uma solicitação ou viagem em andamento.");
    }

    const quote = await this.calculateQuote(params.originId, params.destinationId);
    const option = quote.options.find((o) => o.category === params.category);
    const price = option?.price ?? 25;

    // Valida saldo da carteira
    const wallet = mockStorage.getWalletByUserId(userId);
    if (wallet.balance < price) {
      throw new ServiceError(
        "INSUFFICIENT_FUNDS",
        `Saldo insuficiente (${wallet.balance} MCR). O valor estimado é de ${price} MCR.`
      );
    }

    const pathResult = roadGraph.findShortestPath(params.originId, params.destinationId);
    const tripRoute: RoutePath = {
      points: pathResult.points,
      nodeIds: pathResult.nodeIds,
      length: pathResult.length,
    };

    const rideId = createId("ride");
    const now = new Date().toISOString();
    const scenarioSeed = Math.floor(Math.random() * 100000);

    const ride: Ride = {
      id: rideId,
      userId,
      originId: params.originId,
      destinationId: params.destinationId,
      category: params.category,
      status: "searching_driver",
      estimatedPrice: price,
      estimatedDistanceKm: quote.distanceKm,
      estimatedDurationMin: quote.durationMin,
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
      scenarioSeed,
    };

    mockStorage.saveRide(ride);

    this.addEvent(rideId, "ride_requested", "Solicitação iniciada", "Procurando veículos autônomos nas proximidades.");

    // Retorna a corrida em estado searching_driver para simular a dinâmica de busca do Uber
    return this.getRideDetails(rideId);
  }

  /**
   * Aguarda um delay realista de busca e apresenta o próximo candidato elegível.
   */
  async searchAndPresentCandidate(rideId: string, delayMs = 3500): Promise<RideDetails> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}/search`, { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    const ride = mockStorage.getRideById(rideId);
    if (!ride || ride.status !== "searching_driver") {
      return this.getRideDetails(rideId);
    }
    return this.findAndPresentNextCandidate(rideId);
  }

  /**
   * Encontra e apresenta o próximo candidato elegível para a solicitação.
   */
  async findAndPresentNextCandidate(rideId: string): Promise<RideDetails> {
    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) throw new ServiceError("NOT_FOUND", "Viagem não encontrada.");

    const previousAttempts = mockStorage.getAttempts(rideId);
    const declinedDriverIds = new Set(previousAttempts.map((a) => a.driverId));
    const declinedVehicleIds = new Set(previousAttempts.map((a) => a.vehicleId));

    // Veículos elegíveis da categoria do pedido
    const vehicles = mockStorage.getVehicles().filter((v) => {
      if (v.category !== ride.category) return false;
      if (v.fleetStatus !== "active") return false;
      if (!v.driverId) return false;
      if (declinedVehicleIds.has(v.id)) return false;
      return true;
    });

    const eligible = vehicles.filter((v) => !declinedDriverIds.has(v.driverId!));

    if (eligible.length === 0) {
      // Nenhum candidato restante
      ride.status = "no_driver_available";
      mockStorage.saveRide(ride);
      this.addEvent(
        rideId,
        "no_driver_available",
        "Nenhum motorista disponível",
        "Todos os veículos da categoria estão ocupados no momento."
      );
      return this.getRideDetails(rideId);
    }

    // Seleciona um candidato aleatoriamente
    const chosenVehicle = pickRandom(eligible)!;
    const chosenDriver = DRIVERS_SEED.find((d) => d.id === chosenVehicle.driverId)!;

    const attemptId = createId("att");
    const now = new Date().toISOString();

    const attempt: RideCandidateAttempt = {
      id: attemptId,
      rideId,
      driverId: chosenDriver.id,
      vehicleId: chosenVehicle.id,
      status: "presented",
      presentedAt: now,
      respondedAt: null,
    };

    mockStorage.saveAttempt(attempt);

    ride.status = "awaiting_approval";
    ride.activeAttemptId = attemptId;
    ride.driverId = chosenDriver.id;
    ride.vehicleId = chosenVehicle.id;

    // Encontra um nó viário aberto (junção/entroncamento em pista aberta, NUNCA dentro de cúpula/destino)
    // que esteja distante da origem do passageiro (entre 75 e 220 unidades de distância)
    const originNode = ROAD_NODES_SEED.find((n: RoadNode) => n.id === ride.originId);
    const candidateNodes: RoadNode[] = ROAD_NODES_SEED.filter((n: RoadNode) => {
      // Exclui qualquer nó que seja um ponto de interesse/edifício com cúpula
      if (n.locationId !== null) return false;
      if (n.id === ride.originId || n.id === ride.destinationId) return false;
      if (!originNode) return true;
      const d = Math.hypot(n.position.x - originNode.position.x, n.position.z - originNode.position.z);
      return d >= 75 && d <= 220;
    });

    const patrolDistant = chosenVehicle.patrolLoop?.find((pId: string) =>
      candidateNodes.some((cn: RoadNode) => cn.id === pId)
    );
    const startNode =
      patrolDistant ||
      (candidateNodes.length > 0 ? pickRandom(candidateNodes)!.id : "jn-west-mid");

    const approachPath = roadGraph.findShortestPath(startNode, ride.originId);
    ride.approachRoute = {
      points: approachPath.points,
      nodeIds: approachPath.nodeIds,
      length: approachPath.length,
    };

    mockStorage.saveRide(ride);

    this.addEvent(
      rideId,
      "candidate_presented",
      `Motorista encontrado: ${chosenDriver.name}`,
      `${chosenDriver.personalitySummary} operando o rover ${chosenVehicle.name}.`
    );

    return this.getRideDetails(rideId);
  }

  /**
   * Responde ao candidato apresentado (Aprovar ou Recusar).
   */
  async respondToCandidate(
    rideId: string,
    attemptId: string,
    decision: "approve" | "decline",
    currentRoverPos?: Vec2
  ): Promise<RideDetails> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}/approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: decision,
            currentRoverPos,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
          if (json.success) {
            return await this.getRideDetails(rideId);
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) throw new ServiceError("NOT_FOUND", "Viagem não encontrada.");

    if (ride.status !== "awaiting_approval" || ride.activeAttemptId !== attemptId) {
      throw new ServiceError("INVALID_STATE", "Esta opção não está mais aguardando aprovação.");
    }

    const attempt = mockStorage.getAttempts(rideId).find((a) => a.id === attemptId);
    if (!attempt) throw new ServiceError("NOT_FOUND", "Tentativa não encontrada.");

    const now = new Date().toISOString();
    attempt.respondedAt = now;

    if (decision === "decline") {
      attempt.status = "declined";
      mockStorage.saveAttempt(attempt);

      ride.status = "searching_driver";
      ride.activeAttemptId = null;
      ride.driverId = null;
      ride.vehicleId = null;
      ride.approachRoute = null;
      mockStorage.saveRide(ride);

      this.addEvent(rideId, "candidate_declined", "Candidato recusado", "Buscando outra opção de motorista...");

      // Retorna em searching_driver para que a interface exiba o radar animado
      return this.getRideDetails(rideId);
    }

    // Decisão: approve
    attempt.status = "approved";
    mockStorage.saveAttempt(attempt);

    const nowTime = Date.now();
    const driver = DRIVERS_SEED.find((d) => d.id === attempt.driverId);

    // Se fornecida a posição exata em tempo real do rover na pista, traça a rota a partir dela
    if (currentRoverPos) {
      const liveApproach = roadGraph.findPathFromPosition(currentRoverPos, ride.originId);
      ride.approachRoute = {
        points: liveApproach.points,
        nodeIds: liveApproach.nodeIds,
        length: liveApproach.length,
      };
    }

    // Velocidade de cruzeiro unificada (3.2 unidades/s): a velocidade de aproximação é exatamente igual à da viagem
    const approachLength = ride.approachRoute?.length || 100;
    const approachDurationMs = Math.max(14000, Math.round((approachLength / 3.2) * 1000));
    const eta = new Date(nowTime + approachDurationMs).toISOString();

    ride.status = "approaching_pickup";
    ride.approvedAt = now;
    ride.approachStartsAt = now;
    ride.pickupEta = eta;
    mockStorage.saveRide(ride);

    this.addEvent(
      rideId,
      "driver_approved",
      "Motorista confirmado",
      `${driver?.name ?? "Motorista"} está a caminho do ponto de embarque.`
    );

    return this.getRideDetails(rideId);
  }

  /**
   * Avança os estados com base no tempo decorrido ou no fluxo.
   */
  async tickRideProgress(rideId: string): Promise<RideDetails> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}/tick`, { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) throw new ServiceError("NOT_FOUND", "Viagem não encontrada.");

    const now = Date.now();

    // 1. Approaching pickup -> Boarding (quando o rover chega)
    if (ride.status === "approaching_pickup" && ride.pickupEta) {
      const etaTime = new Date(ride.pickupEta).getTime();
      if (now >= etaTime) {
        ride.status = "boarding";
        mockStorage.saveRide(ride);
        this.addEvent(rideId, "driver_arrived", "Rover no ponto de embarque", "O veículo aguarda você para embarcar.");
      }
    }

    // 2. In progress -> Completed (na mesma velocidade de cruzeiro de 3.2 unidades/s)
    if (ride.status === "in_progress" && ride.startedAt) {
      const startTime = new Date(ride.startedAt).getTime();
      const tripLength = ride.tripRoute.length || 130;
      const totalTripDurationMs = Math.max(16000, Math.round((tripLength / 3.2) * 1000));
      if (now >= startTime + totalTripDurationMs) {
        return this.completeRide(rideId);
      }
    }

    return this.getRideDetails(rideId);
  }

  /**
   * Passageiro confirma o embarque e inicia a viagem.
   */
  async startTrip(rideId: string): Promise<RideDetails> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}/fast-forward`, { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) throw new ServiceError("NOT_FOUND", "Viagem não encontrada.");

    if (ride.status !== "boarding" && ride.status !== "approaching_pickup") {
      throw new ServiceError("INVALID_STATE", "A viagem não está pronta para iniciar.");
    }

    const now = new Date().toISOString();
    ride.status = "in_progress";
    ride.startedAt = now;
    mockStorage.saveRide(ride);

    this.addEvent(rideId, "trip_started", "Viagem iniciada", "Rover em deslocamento autônomo para o destino.");

    return this.getRideDetails(rideId);
  }

  /**
   * Conclui a viagem, efetiva o débito e finaliza.
   */
  async completeRide(rideId: string): Promise<RideDetails> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}/fast-forward`, { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) throw new ServiceError("NOT_FOUND", "Viagem não encontrada.");

    if (ride.status === "completed") {
      return this.getRideDetails(rideId);
    }

    const now = new Date().toISOString();
    ride.status = "completed";
    ride.completedAt = now;

    // Preço final (estimado + paradas extras)
    const extraStopsCost = ride.stops.reduce((sum, s) => sum + s.price, 0);
    const finalPrice = ride.estimatedPrice + extraStopsCost;
    ride.finalPrice = finalPrice;

    // Débito atômico na carteira
    const origin = LOCATIONS_SEED.find((l) => l.id === ride.originId)?.shortName ?? "Origem";
    const dest = LOCATIONS_SEED.find((l) => l.id === ride.destinationId)?.shortName ?? "Destino";
    const tx = await walletService.debitRidePayment(
      ride.userId,
      ride.id,
      finalPrice,
      `${origin} → ${dest}`
    );
    ride.paymentTransactionId = tx.id;

    mockStorage.saveRide(ride);

    this.addEvent(
      rideId,
      "ride_completed",
      "Viagem concluída",
      `Você chegou ao seu destino. Débito de ${finalPrice} MCR realizado.`
    );

    return this.getRideDetails(rideId);
  }

  /**
   * Cancela a corrida.
   */
  async cancelRide(rideId: string, reason = "Cancelado pelo passageiro"): Promise<RideDetails> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}/cancel`, { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (json.data) return json.data;
            try {
              return await this.getRideDetails(rideId);
            } catch {
              // Retorna objeto simulado de cancelamento
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) throw new ServiceError("NOT_FOUND", "Viagem não encontrada.");

    if (["completed", "cancelled"].includes(ride.status)) {
      throw new ServiceError("INVALID_STATE", "Esta viagem já foi encerrada.");
    }

    const now = new Date().toISOString();
    ride.status = "cancelled";
    ride.cancelledAt = now;
    ride.cancellationReason = reason;

    mockStorage.saveRide(ride);

    this.addEvent(rideId, "ride_cancelled", "Viagem cancelada", reason);

    return this.getRideDetails(rideId);
  }

  /**
   * Adiciona uma parada opcional proposta pelo motorista ou solicitada pelo passageiro.
   */
  async addStop(rideId: string, locationId: string): Promise<RideDetails> {
    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) throw new ServiceError("NOT_FOUND", "Viagem não encontrada.");

    if (ride.stops.length >= SIMULATION_CONFIG.maxStopsPerRide) {
      throw new ServiceError("VALIDATION", "Limite de paradas adicionais atingido nesta viagem.");
    }

    const stopLoc = LOCATIONS_SEED.find((l) => l.id === locationId);
    if (!stopLoc) throw new ServiceError("NOT_FOUND", "Localidade não encontrada.");

    const stopFee = PRICING_CONFIG.stopFee;
    const now = new Date().toISOString();

    const newStop: RideStop = {
      id: createId("stop"),
      locationId,
      atDistance: ride.tripRoute.length * 0.5,
      dwellMs: SIMULATION_CONFIG.stopDwellMs,
      price: stopFee,
      status: "planned",
      addedAt: now,
    };

    ride.stops.push(newStop);

    // Recalcula rota passando pela parada (Origem -> Parada -> Destino)
    const leg1 = roadGraph.findShortestPath(ride.originId, locationId);
    const leg2 = roadGraph.findShortestPath(locationId, ride.destinationId);
    const combinedPoints = [...leg1.points, ...leg2.points.slice(1)];
    const combinedNodeIds = [...leg1.nodeIds, ...leg2.nodeIds.slice(1)];

    ride.tripRoute = {
      points: combinedPoints,
      nodeIds: combinedNodeIds,
      length: leg1.length + leg2.length,
    };

    mockStorage.saveRide(ride);

    this.addEvent(
      rideId,
      "stop_added",
      `Parada adicionada: ${stopLoc.shortName}`,
      `A rota foi recalculada para incluir ${stopLoc.name}. Taxa de ${stopFee} MCR.`
    );

    return this.getRideDetails(rideId);
  }

  /**
   * Consulta os detalhes de uma viagem com suas entidades associadas.
   */
  async getRideDetails(rideId: string): Promise<RideDetails> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/rides/${rideId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const ride = mockStorage.getRideById(rideId);
    if (!ride) throw new ServiceError("NOT_FOUND", "Viagem não encontrada.");

    const origin = LOCATIONS_SEED.find((l) => l.id === ride.originId) ?? LOCATIONS_SEED[0];
    const destination = LOCATIONS_SEED.find((l) => l.id === ride.destinationId) ?? LOCATIONS_SEED[1];
    const stopLocations = ride.stops
      .map((s) => LOCATIONS_SEED.find((l) => l.id === s.locationId))
      .filter((l): l is typeof LOCATIONS_SEED[0] => Boolean(l));

    const driver = ride.driverId ? DRIVERS_SEED.find((d) => d.id === ride.driverId) ?? null : null;
    const vehicle = ride.vehicleId ? mockStorage.getVehicles().find((v) => v.id === ride.vehicleId) ?? null : null;

    const attempts = mockStorage.getAttempts(rideId);
    const activeAttempt = ride.activeAttemptId
      ? attempts.find((a) => a.id === ride.activeAttemptId) ?? null
      : null;

    const events = mockStorage.getEvents(rideId);

    return {
      ride,
      origin,
      destination,
      stopLocations,
      driver,
      vehicle,
      activeAttempt,
      attempts,
      events,
    };
  }

  /**
   * Retorna a viagem ativa do usuário atual, se houver.
   */
  async getActiveRide(userId?: string): Promise<RideDetails | null> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/rides");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const active = (json.data as Array<{ id: string; status: Ride["status"] }>).find(
              (r) => !["completed", "cancelled", "no_driver_available"].includes(r.status)
            );
            if (active) {
              return this.getRideDetails(active.id);
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const id = userId ?? mockStorage.getCurrentUserId();
    if (!id) return null;

    const rides = mockStorage.getRides();
    const active = rides.find(
      (r) =>
        r.userId === id &&
        !["completed", "cancelled", "no_driver_available"].includes(r.status)
    );

    if (!active) return null;
    return this.getRideDetails(active.id);
  }

  /**
   * Retorna o histórico de viagens do usuário.
   */
  async getRideHistory(userId?: string): Promise<RideSummary[]> {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/rides");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return (json.data as Array<Record<string, unknown>>).map((r) => {
              const originId = (r.origin_id ?? r.originId) as string;
              const destinationId = (r.destination_id ?? r.destinationId) as string;
              const driverId = (r.driver_id ?? r.driverId) as string | undefined;
              const vehicleId = (r.vehicle_id ?? r.vehicleId) as string | undefined;

              const origin = LOCATIONS_SEED.find((l) => l.id === originId) ?? LOCATIONS_SEED[0];
              const destination = LOCATIONS_SEED.find((l) => l.id === destinationId) ?? LOCATIONS_SEED[1];
              const driver = driverId ? DRIVERS_SEED.find((d) => d.id === driverId) ?? null : null;
              const vehicle = vehicleId ? VEHICLES_SEED.find((v) => v.id === vehicleId) ?? null : null;

              const finalPrice = r.final_price ?? r.finalPrice;
              const estPrice = r.estimated_price ?? r.estimatedPrice;
              const dist = r.distance_km ?? r.distanceKm ?? r.estimatedDistanceKm ?? 0;
              const stops = (r.stops as unknown[]) ?? [];

              return {
                id: r.id as string,
                status: r.status as Ride["status"],
                category: r.category as VehicleCategory,
                origin,
                destination,
                driver,
                vehicle,
                price: Number(finalPrice ?? estPrice ?? 0),
                distanceKm: Number(dist),
                stopsCount: stops.length,
                requestedAt: (r.requested_at ?? r.requestedAt) as string,
                completedAt: ((r.completed_at ?? r.completedAt) as string | null) ?? null,
              };
            });
          }
        }
      }
    } catch {
      // Fallback
    }

    mockStorage.init();
    const id = userId ?? mockStorage.getCurrentUserId();
    if (!id) return [];

    const rides = mockStorage.getRides().filter((r) => r.userId === id);
    return rides.map((r) => {
      const origin = LOCATIONS_SEED.find((l) => l.id === r.originId) ?? LOCATIONS_SEED[0];
      const destination = LOCATIONS_SEED.find((l) => l.id === r.destinationId) ?? LOCATIONS_SEED[1];
      const driver = r.driverId ? DRIVERS_SEED.find((d) => d.id === r.driverId) ?? null : null;
      const vehicle = r.vehicleId ? mockStorage.getVehicles().find((v) => v.id === r.vehicleId) ?? null : null;

      return {
        id: r.id,
        status: r.status,
        category: r.category,
        origin,
        destination,
        driver,
        vehicle,
        price: r.finalPrice ?? r.estimatedPrice,
        distanceKm: r.estimatedDistanceKm,
        stopsCount: r.stops.length,
        requestedAt: r.requestedAt,
        completedAt: r.completedAt,
      };
    });
  }

  private addEvent(rideId: string, type: RideEvent["type"], title: string, description: string | null) {
    mockStorage.addEvent({
      id: createId("evt"),
      rideId,
      type,
      title,
      description,
      createdAt: new Date().toISOString(),
    });
  }
}

export const rideService = new RideService();
