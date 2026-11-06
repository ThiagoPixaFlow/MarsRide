"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MarsMapCanvas } from "@/components/map/MarsMapCanvas";
import { ActiveRidePanel } from "@/components/ride/ActiveRidePanel";
import { RideChatDrawer } from "@/components/chat/RideChatDrawer";
import { rideService } from "@/modules/rides/ride.service";
import { walletService } from "@/modules/wallet/wallet.service";
import { RideDetails } from "@/modules/rides/ride.types";
import { ROUTES } from "@/config/routes";
import { POLLING_CONFIG } from "@/config/app.config";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";

function RideDetailContent() {
  const params = useParams();
  const router = useRouter();
  const rideId = typeof params?.rideId === "string" ? params.rideId : "";

  const [details, setDetails] = useState<RideDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!rideId) return;
    try {
      const d = await rideService.getRideDetails(rideId);
      setDetails(d);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDetails();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDetails]);

  // Sincronização periódica do progresso da corrida
  useEffect(() => {
    if (!details) return;
    if (["completed", "cancelled"].includes(details.ride.status)) return;

    const interval = setInterval(async () => {
      try {
        const updated = await rideService.tickRideProgress(rideId);
        setDetails(updated);
        if (updated.ride.status === "completed") {
          await walletService.getWallet();
        }
      } catch (err) {
        console.error(err);
      }
    }, POLLING_CONFIG.rideIntervalMs);

    return () => clearInterval(interval);
  }, [details, rideId]);

  const handleStartTrip = async () => {
    if (!details) return;
    try {
      setIsActionLoading(true);
      const updated = await rideService.startTrip(details.ride.id);
      setDetails(updated);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!details) return;
    try {
      setIsActionLoading(true);
      const updated = await rideService.completeRide(details.ride.id);
      setDetails(updated);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (!details) return;
    try {
      await rideService.cancelRide(details.ride.id);
      router.push(ROUTES.app);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-xs text-[#8c7d75] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#e2602c]" />
        <span>Localizando telemetria do rover...</span>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <h2 className="text-lg font-bold text-white">Viagem não encontrada</h2>
        <p className="text-xs text-[#8c7d75]">
          O identificador da corrida não foi localizado na colônia.
        </p>
        <Link href={ROUTES.app}>
          <Button variant="primary" size="md">
            Voltar ao Mapa Principal
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0807]">
      {/* Botão flutuante de voltar */}
      <div className="absolute top-4 left-4 z-30">
        <Link href={ROUTES.app}>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl mars-glass border border-white/10 text-xs font-semibold text-white hover:border-[#e2602c] transition-colors cursor-pointer shadow-lg">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Mapa</span>
          </button>
        </Link>
      </div>

      {/* Mapa 3D */}
      <div className="absolute inset-0 z-0">
        <MarsMapCanvas
          selectedOriginId={details.origin.id}
          selectedDestinationId={details.destination.id}
          activeRoutePoints={
            details.ride.status === "approaching_pickup" && details.ride.approachRoute
              ? details.ride.approachRoute.points
              : details.ride.tripRoute.points
          }
          activeRouteColor={
            details.ride.status === "approaching_pickup" ? "#00e5ff" : "#f28b44"
          }
          activeRide={details.ride}
        />
      </div>

      {/* Painel da Viagem */}
      <div className="absolute top-16 left-4 z-20 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto">
        <ActiveRidePanel
          details={details}
          onStartTrip={handleStartTrip}
          onCompleteRide={handleCompleteRide}
          onCancelRide={handleCancelRide}
          onOpenChat={() => setIsChatOpen(true)}
          isActionLoading={isActionLoading}
        />
      </div>

      {/* Chat do Motorista */}
      {details.driver && (
        <RideChatDrawer
          rideId={details.ride.id}
          driver={details.driver}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onStopUpdated={fetchDetails}
        />
      )}
    </div>
  );
}

export default function RideDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-xs text-[#8c7d75] gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#e2602c]" />
          <span>Carregando interface de viagem...</span>
        </div>
      }
    >
      <RideDetailContent />
    </Suspense>
  );
}
