"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MarsMapCanvas } from "@/components/map/MarsMapCanvas";
import { RideRequestPanel } from "@/components/ride/RideRequestPanel";
import { DriverCandidateCard } from "@/components/driver/DriverCandidateCard";
import { ActiveRidePanel } from "@/components/ride/ActiveRidePanel";
import { RideChatDrawer } from "@/components/chat/RideChatDrawer";
import { locationService } from "@/modules/locations/location.service";
import { rideService } from "@/modules/rides/ride.service";
import { walletService } from "@/modules/wallet/wallet.service";
import { chatService } from "@/modules/chat/chat.service";
import { Location } from "@/modules/locations/location.types";
import { RideDetails } from "@/modules/rides/ride.types";
import { VehicleCategory } from "@/modules/vehicles/vehicle.types";
import { Vec2 } from "@/types/common";
import { POLLING_CONFIG } from "@/config/app.config";

export default function AppPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<Location | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Location | null>(null);
  const [activeRoutePoints, setActiveRoutePoints] = useState<Vec2[] | null>(null);

  const [activeRideDetails, setActiveRideDetails] = useState<RideDetails | null>(null);
  const [userBalance, setUserBalance] = useState<number>(1000);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const liveRoverPosRef = useRef<Vec2 | null>(null);

  // Carrega locais iniciais e saldo
  useEffect(() => {
    const initData = async () => {
      try {
        const locs = await locationService.getLocations();
        setLocations(locs);
        // Origem padrão: Hub Central (simulando a localização atual do usuário)
        const hub = locs.find((l) => l.id === "loc-hub-central") ?? locs[0];
        setSelectedOrigin(hub);

        const wallet = await walletService.getWallet();
        setUserBalance(wallet.balance);

        const currentActive = await rideService.getActiveRide();
        if (currentActive) {
          setActiveRideDetails(currentActive);
          if (currentActive.ride.status === "approaching_pickup" && currentActive.ride.approachRoute) {
            setActiveRoutePoints(currentActive.ride.approachRoute.points);
          } else {
            setActiveRoutePoints(currentActive.ride.tripRoute.points);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    initData();
  }, []);

  // Tick periódico para simulação de viagem em tempo real
  useEffect(() => {
    if (!activeRideDetails) return;
    const { status, id } = activeRideDetails.ride;
    if (["completed", "cancelled", "no_driver_available"].includes(status)) return;

    const interval = setInterval(async () => {
      try {
        const updated = await rideService.tickRideProgress(id);
        setActiveRideDetails(updated);

        // Se o rover acabou de chegar no ponto de embarque, atualiza a rota para o trajeto da viagem
        if (updated.ride.status === "boarding") {
          setActiveRoutePoints(updated.ride.tripRoute.points);
        }

        if (updated.ride.status === "completed") {
          // Atualiza saldo após conclusão
          const w = await walletService.getWallet();
          setUserBalance(w.balance);
        }
      } catch (err) {
        console.error("Erro no tick de simulação:", err);
      }
    }, POLLING_CONFIG.rideIntervalMs);

    return () => clearInterval(interval);
  }, [activeRideDetails]);

  // Ao clicar num POI no mapa 3D
  const handleSelectLocationFromMap = useCallback(
    (loc: Location) => {
      if (!selectedOrigin) {
        setSelectedOrigin(loc);
      } else if (selectedOrigin.id === loc.id) {
        // Se clicou na mesma origem, desseleciona
        setSelectedOrigin(null);
      } else {
        setSelectedDestination(loc);
      }
    },
    [selectedOrigin]
  );

  // Solicitar Corrida (Inicia busca com animação de radar estilo Uber)
  const handleRequestRide = async (category: VehicleCategory) => {
    if (!selectedOrigin || !selectedDestination) return;

    try {
      setIsRequestLoading(true);
      // 1. Cria a solicitação no estado searching_driver
      const details = await rideService.requestRide({
        originId: selectedOrigin.id,
        destinationId: selectedDestination.id,
        category,
      });

      setActiveRideDetails(details);
      setActiveRoutePoints(details.ride.tripRoute.points);
      setIsRequestLoading(false);

      // 2. Simula tempo realista de varredura do radar (3.5 segundos) antes de apresentar o motorista
      const matched = await rideService.searchAndPresentCandidate(details.ride.id, 3500);
      setActiveRideDetails(matched);
      // Não acende a rota de aproximação enquanto o passageiro não aprovar o motorista.
      // O motorista continua passeando na pista até o usuário confirmar.
      setActiveRoutePoints(null);
    } catch (err) {
      setIsRequestLoading(false);
      alert((err as Error).message || "Falha ao solicitar corrida.");
    }
  };

  // Aprovar Motorista (Inicia aproximação do rover a partir de onde ele está na pista)
  const handleApproveCandidate = async () => {
    if (!activeRideDetails) return;
    try {
      setIsActionLoading(true);
      const currentPos = liveRoverPosRef.current ?? undefined;
      const attemptId = activeRideDetails.activeAttempt?.id ?? "";
      const details = await rideService.respondToCandidate(
        activeRideDetails.ride.id,
        attemptId,
        "approve",
        currentPos
      );
      setActiveRideDetails(details);
      if (details.ride.approachRoute) {
        setActiveRoutePoints(details.ride.approachRoute.points);
      }

      // Dispara boas-vindas do motorista no chat
      await chatService.triggerWelcomeMessage(details.ride.id);

      // Abre automaticamente o balão flutuante de chat na direita para conversar com o motorista
      setIsChatOpen(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Recusar Motorista e buscar outro (Reativa o radar de busca e exibe novo candidato após delay)
  const handleDeclineCandidate = async () => {
    if (!activeRideDetails) return;
    try {
      setIsActionLoading(true);
      const attemptId = activeRideDetails.activeAttempt?.id ?? "";
      // 1. Marca como recusado e coloca a viagem de volta no estado searching_driver
      const searching = await rideService.respondToCandidate(
        activeRideDetails.ride.id,
        attemptId,
        "decline"
      );
      setActiveRideDetails(searching);
      setActiveRoutePoints(null);
      setIsActionLoading(false);

      // 2. Aguarda delay do radar de busca e apresenta o próximo candidato
      const nextCandidate = await rideService.searchAndPresentCandidate(searching.ride.id, 3500);
      setActiveRideDetails(nextCandidate);
      setActiveRoutePoints(null);
    } catch (err) {
      setIsActionLoading(false);
      alert((err as Error).message);
    }
  };

  // Embarcar e Iniciar Viagem
  const handleStartTrip = async () => {
    if (!activeRideDetails) return;
    try {
      setIsActionLoading(true);
      const details = await rideService.startTrip(activeRideDetails.ride.id);
      setActiveRideDetails(details);
      setActiveRoutePoints(details.ride.tripRoute.points);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Concluir Viagem Manualmente na Simulação
  const handleCompleteRide = async () => {
    if (!activeRideDetails) return;
    try {
      setIsActionLoading(true);
      const details = await rideService.completeRide(activeRideDetails.ride.id);
      setActiveRideDetails(details);
      const w = await walletService.getWallet();
      setUserBalance(w.balance);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cancelar Viagem
  const handleCancelRide = async () => {
    if (!activeRideDetails) return;
    try {
      setIsActionLoading(true);
      await rideService.cancelRide(activeRideDetails.ride.id);
    } catch (err) {
      console.warn("Aviso ao cancelar corrida:", err);
    } finally {
      setIsActionLoading(false);
      setActiveRideDetails(null);
      setActiveRoutePoints(null);
    }
  };

  // Nova viagem após conclusão (Reseta o mapa para o estado inicial sem carros)
  const handleResetForNewRide = () => {
    setActiveRideDetails(null);
    setSelectedDestination(null);
    setActiveRoutePoints(null);
  };

  // Atualização da rota em pré-visualização no mapa
  const handleRouteCalculated = useCallback(
    (points: Vec2[] | null) => {
      if (!activeRideDetails) {
        setActiveRoutePoints(points);
      }
    },
    [activeRideDetails]
  );

  // Controla se os carros próximos devem ser exibidos no mapa:
  // APENAS durante a busca ativa de motorista (status === "searching_driver")
  const showNearbyVehicles = activeRideDetails?.ride.status === "searching_driver";

  // Cor da rota holográfica no mapa:
  // - Ciano elétrico neon (#00e5ff) quando o motorista estiver a caminho do passageiro
  // - Laranja marciano (#f28b44) na cotação e durante a viagem para o destino final
  const isApproachPhase =
    activeRideDetails?.ride.status === "awaiting_approval" ||
    activeRideDetails?.ride.status === "approaching_pickup";

  const activeRouteColor = isApproachPhase ? "#00e5ff" : "#f28b44";

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0807]">
      {/* 1. Mapa 3D de Marte (Elemento central dominante) */}
      <div className="absolute inset-0 z-0">
        <MarsMapCanvas
          selectedOriginId={selectedOrigin?.id}
          selectedDestinationId={selectedDestination?.id}
          activeRoutePoints={activeRoutePoints}
          activeRouteColor={activeRouteColor}
          activeRide={activeRideDetails?.ride}
          showNearbyVehicles={showNearbyVehicles}
          onSelectLocation={handleSelectLocationFromMap}
          onRoverPositionUpdate={(pos) => {
            liveRoverPosRef.current = pos;
          }}
        />
      </div>

      {/* 2. Painel Flutuante Lateral com Glassmorphism */}
      <div className="absolute top-4 left-4 z-20 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto pointer-events-auto">
        {!activeRideDetails ? (
          // Painel de Solicitação
          <RideRequestPanel
            locations={locations}
            selectedOrigin={selectedOrigin}
            selectedDestination={selectedDestination}
            onSelectOrigin={setSelectedOrigin}
            onSelectDestination={setSelectedDestination}
            onRequestRide={handleRequestRide}
            onRouteCalculated={handleRouteCalculated}
            userBalance={userBalance}
            isLoading={isRequestLoading}
          />
        ) : activeRideDetails.ride.status === "searching_driver" ||
          activeRideDetails.ride.status === "awaiting_approval" ||
          activeRideDetails.ride.status === "no_driver_available" ? (
          // Apresentação e Aprovação do Candidato (com radar de busca animado)
          <DriverCandidateCard
            driver={activeRideDetails.driver}
            vehicle={activeRideDetails.vehicle}
            status={
              activeRideDetails.ride.status === "searching_driver"
                ? "searching"
                : activeRideDetails.ride.status === "no_driver_available"
                ? "no_candidates"
                : "awaiting_approval"
            }
            onApprove={handleApproveCandidate}
            onDecline={handleDeclineCandidate}
            onCancel={handleCancelRide}
            isActionLoading={isActionLoading}
          />
        ) : (
          // Acompanhamento da Viagem
          <div className="flex flex-col gap-2">
            <ActiveRidePanel
              details={activeRideDetails}
              onStartTrip={handleStartTrip}
              onCompleteRide={handleCompleteRide}
              onCancelRide={handleCancelRide}
              onOpenChat={() => setIsChatOpen(true)}
              isActionLoading={isActionLoading}
            />

            {activeRideDetails.ride.status === "completed" && (
              <button
                onClick={handleResetForNewRide}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#e2602c] to-[#f28b44] text-white font-bold text-xs shadow-lg hover:brightness-110 cursor-pointer transition-all active:scale-98"
              >
                Solicitar Nova Viagem
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Gaveta Lateral de Chat com o Motorista de IA */}
      {activeRideDetails?.driver && (
        <RideChatDrawer
          rideId={activeRideDetails.ride.id}
          driver={activeRideDetails.driver}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onStopUpdated={async () => {
            const updated = await rideService.getRideDetails(activeRideDetails.ride.id);
            setActiveRideDetails(updated);
            setActiveRoutePoints(updated.ride.tripRoute.points);
          }}
        />
      )}
    </div>
  );
}
