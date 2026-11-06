"use client";

import React, { useState, useEffect } from "react";
import { RideDetails } from "@/modules/rides/ride.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatCredits, formatTime } from "@/lib/format";
import {
  MapPin,
  Flag,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Clock,
  Gauge,
  Thermometer,
  Wind,
  Star,
  FastForward,
} from "lucide-react";

interface ActiveRidePanelProps {
  details: RideDetails;
  onStartTrip: () => void;
  onCompleteRide: () => void;
  onCancelRide: () => void;
  onOpenChat: () => void;
  isActionLoading?: boolean;
}

export function ActiveRidePanel({
  details,
  onStartTrip,
  onCompleteRide,
  onCancelRide,
  onOpenChat,
  isActionLoading = false,
}: ActiveRidePanelProps) {
  const { ride, origin, destination, stopLocations, driver, vehicle, events } = details;
  const [showTimeline, setShowTimeline] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  const isApproaching = ride.status === "approaching_pickup";
  const isBoarding = ride.status === "boarding";
  const isInProgress = ride.status === "in_progress";
  const isCompleted = ride.status === "completed";

  // Contador em tempo real para a chegada do rover (ETA)
  const [approachSeconds, setApproachSeconds] = useState<number>(24);

  const totalApproachDuration = Math.max(
    1,
    (ride.approachStartsAt || ride.approvedAt) && ride.pickupEta
      ? Math.round((new Date(ride.pickupEta).getTime() - new Date(ride.approachStartsAt || ride.approvedAt!).getTime()) / 1000)
      : 24
  );

  useEffect(() => {
    if (!isApproaching || !ride.pickupEta) return;

    const updateTimer = () => {
      const diff = Math.max(0, Math.round((new Date(ride.pickupEta!).getTime() - Date.now()) / 1000));
      setApproachSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isApproaching, ride.pickupEta]);

  const statusMeta = {
    approaching_pickup: {
      label: "Rover a Caminho do Embarque",
      desc: `Chegando em ${origin.shortName}`,
      badgeVariant: "primary" as const,
      badgeText: "A Caminho",
    },
    boarding: {
      label: "Rover no Ponto de Embarque",
      desc: "Veículo estacionado aguardando você",
      badgeVariant: "success" as const,
      badgeText: "Embarque",
    },
    in_progress: {
      label: "Em Deslocamento Autônomo",
      desc: `Navegando rumo a ${destination.shortName}`,
      badgeVariant: "primary" as const,
      badgeText: "Em Viagem",
    },
    completed: {
      label: "Viagem Concluída!",
      desc: "Você chegou com segurança ao seu destino",
      badgeVariant: "success" as const,
      badgeText: "Concluída",
    },
    cancelled: {
      label: "Viagem Cancelada",
      desc: "A solicitação foi encerrada",
      badgeVariant: "outline" as const,
      badgeText: "Cancelada",
    },
    searching_driver: { label: "Buscando", desc: "", badgeVariant: "primary" as const, badgeText: "Buscando" },
    awaiting_approval: { label: "Aguardando", desc: "", badgeVariant: "primary" as const, badgeText: "Aguardando" },
    driver_approved: { label: "Aprovado", desc: "", badgeVariant: "primary" as const, badgeText: "Aprovado" },
    no_driver_available: { label: "Indisponível", desc: "", badgeVariant: "outline" as const, badgeText: "Indisponível" },
    requested: { label: "Solicitada", desc: "", badgeVariant: "primary" as const, badgeText: "Solicitada" },
  }[ride.status];

  return (
    <Card
      variant="glow"
      className="w-full max-w-md mars-glass-card p-5 shadow-2xl flex flex-col gap-3.5 animate-in fade-in-0 duration-200"
    >
      {/* Status Header */}
      <div className="flex items-start justify-between pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e2602c] animate-ping" />
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#f28b44]">
              {statusMeta.label}
            </span>
          </div>
          <p className="text-xs text-[#d4c6bd] mt-0.5">{statusMeta.desc}</p>
        </div>

        <Badge variant={statusMeta.badgeVariant} className="text-[10px] uppercase font-mono tracking-wider">
          {statusMeta.badgeText}
        </Badge>
      </div>

      {/* Estimativa e Progresso de Aproximação (Estilo Uber) */}
      {isApproaching && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-[#e2602c]/20 via-[#1a1412] to-[#1a1412] border border-[#e2602c]/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#f28b44] animate-pulse" />
              <span className="text-xs font-bold text-white">
                Chegando em {approachSeconds > 0 ? `00:${approachSeconds.toString().padStart(2, "0")}` : "Instantes"}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#f28b44] font-bold">
              ~{Math.max(40, approachSeconds * 45)}m de distância
            </span>
          </div>

          {/* Barra de Progresso da Chegada */}
          <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#e2602c] to-[#f28b44] transition-all duration-1000 ease-linear rounded-full"
              style={{
                width: `${Math.min(100, Math.max(5, ((totalApproachDuration - approachSeconds) / totalApproachDuration) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Telemetria de Deslocamento Durante a Viagem */}
      {isInProgress && (
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-[#8c7d75]">
              <Gauge className="w-3 h-3 text-[#f28b44]" />
              <span>Velocidade</span>
            </div>
            <span className="text-xs font-mono font-bold text-white mt-0.5">48 km/h</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/5">
            <div className="flex items-center gap-1 text-[10px] text-[#8c7d75]">
              <Thermometer className="w-3 h-3 text-sky-400" />
              <span>Temp. Ext.</span>
            </div>
            <span className="text-xs font-mono font-bold text-white mt-0.5">-62°C</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-[#8c7d75]">
              <Wind className="w-3 h-3 text-[#e2602c]" />
              <span>Atmosfera</span>
            </div>
            <span className="text-xs font-mono font-bold text-white mt-0.5">610 Pa</span>
          </div>
        </div>
      )}

      {/* Origem e Destino com Paradas */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-black/30 border border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="flex-1 truncate">
            <span className="text-[10px] text-[#8c7d75] block">Origem</span>
            <span className="font-semibold text-white">{origin.name}</span>
          </div>
        </div>

        {stopLocations.map((stop, i) => (
          <div key={stop.id} className="flex items-center gap-2 pl-4 py-1 border-l-2 border-[#e2602c]/50 ml-2">
            <Sparkles className="w-3.5 h-3.5 text-[#f28b44]" />
            <div>
              <span className="text-[10px] text-[#8c7d75] block">Parada {i + 1}</span>
              <span className="font-semibold text-white">{stop.name}</span>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <Flag className="w-4 h-4 text-[#e2602c] shrink-0" />
          <div className="flex-1 truncate">
            <span className="text-[10px] text-[#8c7d75] block">Destino</span>
            <span className="font-semibold text-white">{destination.name}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#8c7d75] block">Valor</span>
            <span className="text-xs font-bold text-[#f28b44]">
              {formatCredits(ride.finalPrice ?? ride.estimatedPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Motorista & Rover */}
      {driver && vehicle && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1c1614] to-[#120e0d] border border-white/10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar
                  name={driver.name}
                  image={driver.avatarUrl}
                  color={driver.avatar.primary}
                  isBot
                  size="lg"
                  className="ring-2 ring-[#e2602c] shadow-lg shadow-[#e2602c]/25"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white tracking-wide">{driver.name}</span>
                  <span className="text-[10px] text-[#f28b44] font-semibold">· {driver.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-[#8c7d75]">
                    Rover {vehicle.name} <span className="font-mono text-[#d4c6bd]">({vehicle.plate})</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">★ {driver.rating.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={onOpenChat}
              leftIcon={<MessageSquare className="w-3.5 h-3.5 text-white" />}
              className="text-xs h-9 font-bold shadow-md shadow-[#e2602c]/20 hover:brightness-110 cursor-pointer"
            >
              Chat IA
            </Button>
          </div>
        </div>
      )}

      {/* Ações contextuais de Estado (Fluxo completo Uber) */}
      <div className="flex flex-col gap-2 pt-1">
        {isApproaching && (
          <Button
            variant="secondary"
            size="md"
            className="w-full text-xs"
            onClick={onStartTrip}
            leftIcon={<FastForward className="w-4 h-4 text-[#e2602c]" />}
          >
            Acelerar Chegada do Rover (Demo)
          </Button>
        )}

        {isBoarding && (
          <Button
            variant="primary"
            size="lg"
            className="w-full animate-pulse font-bold text-sm"
            onClick={onStartTrip}
            isLoading={isActionLoading}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Embarcar no Rover e Iniciar Viagem
          </Button>
        )}

        {isInProgress && (
          <Button
            variant="secondary"
            size="md"
            className="w-full text-xs font-bold hover:border-emerald-500/40"
            onClick={onCompleteRide}
            isLoading={isActionLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          >
            Finalizar Trajeto (Concluir Viagem)
          </Button>
        )}

        {isCompleted && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Você chegou ao destino em Marte!</span>
            </div>
            <p className="text-[11px] text-[#d4c6bd]">
              Valor de {formatCredits(ride.finalPrice ?? ride.estimatedPrice)} debitado com sucesso da sua carteira.
            </p>

            {/* Avaliação do Motorista */}
            <div className="pt-2 border-t border-emerald-500/20 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-[#8c7d75]">
                {ratingSubmitted ? "Avaliação registrada!" : "Avalie sua experiência com a IA:"}
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setUserRating(star);
                      setRatingSubmitted(true);
                    }}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= userRating ? "fill-amber-400 text-amber-400" : "text-white/20"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Linha do Tempo de Eventos */}
        <div className="border-t border-white/5 pt-2">
          <button
            onClick={() => setShowTimeline((s) => !s)}
            className="text-[11px] text-[#8c7d75] hover:text-white transition-colors cursor-pointer flex items-center justify-between w-full"
          >
            <span>Registro de Telemetria ({events.length} eventos)</span>
            <span>{showTimeline ? "Recolher" : "Expandir"}</span>
          </button>

          {showTimeline && (
            <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
              {events.map((evt) => (
                <div key={evt.id} className="text-[11px] p-2 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between text-white font-medium">
                    <span>{evt.title}</span>
                    <span className="text-[9px] text-[#8c7d75]">{formatTime(evt.createdAt)}</span>
                  </div>
                  {evt.description && (
                    <p className="text-[10px] text-[#8c7d75] mt-0.5">{evt.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isCompleted && ride.status !== "cancelled" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelRide}
            className="text-xs text-[#8c7d75] hover:text-red-400"
          >
            Cancelar solicitação
          </Button>
        )}
      </div>
    </Card>
  );
}
