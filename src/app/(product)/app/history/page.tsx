"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { rideService } from "@/modules/rides/ride.service";
import { RideSummary } from "@/modules/rides/ride.types";
import { formatCredits, formatDateTime, formatDistanceKm } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import {
  History,
  MapPin,
  Flag,
  Calendar,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function HistoryPage() {
  const [rides, setRides] = useState<RideSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const data = await rideService.getRideHistory();
        setRides(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-[#e2602c]" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              Histórico de Viagens
            </h1>
          </div>
          <p className="text-sm text-[#8c7d75]">
            Registros de deslocamentos autônomos pela colônia de Nova Acidália.
          </p>
        </div>

        <Link href={ROUTES.app}>
          <Button variant="primary" size="md" leftIcon={<Compass className="w-4 h-4" />}>
            Solicitar Nova Viagem
          </Button>
        </Link>
      </div>

      {/* Lista de Viagens */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#8c7d75]">
          Carregando histórico de navegação...
        </div>
      ) : rides.length === 0 ? (
        <Card variant="glass" className="p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#e2602c]/10 border border-[#e2602c]/20 flex items-center justify-center text-[#f28b44]">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhuma viagem realizada ainda</h3>
            <p className="text-xs text-[#8c7d75] mt-1 max-w-sm">
              Explore o mapa 3D de Marte e solicite seu primeiro rover autônomo com motorista de IA.
            </p>
          </div>
          <Link href={ROUTES.app}>
            <Button variant="primary" size="md" className="mt-2">
              Abrir Mapa de Marte
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => {
            const isCompleted = ride.status === "completed";
            const isCancelled = ride.status === "cancelled";

            return (
              <Card
                key={ride.id}
                variant="glass"
                className="p-5 hover:border-[#e2602c]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Origem e Destino */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isCompleted ? "success" : isCancelled ? "outline" : "primary"}
                      className="text-[10px]"
                    >
                      {isCompleted ? "Concluída" : isCancelled ? "Cancelada" : "Em Viagem"}
                    </Badge>
                    <span className="text-xs text-[#8c7d75] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#e2602c]" />
                      {formatDateTime(ride.requestedAt)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{ride.origin.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8c7d75] hidden sm:block shrink-0" />
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-[#e2602c] shrink-0" />
                      <span>{ride.destination.name}</span>
                    </div>
                  </div>

                  {ride.stopsCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#f28b44]">
                      <Sparkles className="w-3 h-3" />
                      {ride.stopsCount} parada(s) adicional(is) incluída(s)
                    </span>
                  )}
                </div>

                {/* Motorista & Veículo */}
                {ride.driver && ride.vehicle && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 border border-white/5 md:w-64">
                    <Avatar
                      name={ride.driver.name}
                      image={ride.driver.avatarUrl}
                      color={ride.driver.avatar.primary}
                      isBot
                      size="sm"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">
                        {ride.driver.name}
                      </span>
                      <span className="text-[10px] text-[#8c7d75] block truncate">
                        Rover {ride.vehicle.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Preço e Distância */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5 shrink-0">
                  <span className="text-base font-black text-[#f28b44]">
                    {formatCredits(ride.price)}
                  </span>
                  <span className="text-xs text-[#8c7d75]">
                    {formatDistanceKm(ride.distanceKm)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
