"use client";

import React, { useState, useEffect } from "react";
import { Location } from "@/modules/locations/location.types";
import { VehicleCategory, VEHICLE_CATEGORY_META } from "@/modules/vehicles/vehicle.types";
import { RideQuote } from "@/modules/rides/ride.types";
import { rideService } from "@/modules/rides/ride.service";
import { formatCredits, formatDistanceKm, formatDurationMin } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Vec2 } from "@/types/common";
import {
  MapPin,
  Flag,
  ArrowUpDown,
  Car,
  Sparkles,
  Clock,
  Compass,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface RideRequestPanelProps {
  locations: Location[];
  selectedOrigin: Location | null;
  selectedDestination: Location | null;
  onSelectOrigin: (loc: Location) => void;
  onSelectDestination: (loc: Location) => void;
  onRequestRide: (category: VehicleCategory) => Promise<void>;
  onRouteCalculated?: (points: Vec2[] | null) => void;
  userBalance: number;
  isLoading?: boolean;
}

export function RideRequestPanel({
  locations,
  selectedOrigin,
  selectedDestination,
  onSelectOrigin,
  onSelectDestination,
  onRequestRide,
  onRouteCalculated,
  userBalance,
  isLoading = false,
}: RideRequestPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>("go");
  const [quote, setQuote] = useState<RideQuote | null>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!selectedOrigin || !selectedDestination) {
        setQuote(null);
        onRouteCalculated?.(null);
        return;
      }
      if (selectedOrigin.id === selectedDestination.id) {
        setQuote(null);
        onRouteCalculated?.(null);
        setQuoteError("Selecione um destino diferente da origem.");
        return;
      }

      try {
        setIsCalculatingQuote(true);
        setQuoteError(null);
        const q = await rideService.calculateQuote(selectedOrigin.id, selectedDestination.id);
        setQuote(q);
        onRouteCalculated?.(q.route);
      } catch (err: unknown) {
        setQuote(null);
        onRouteCalculated?.(null);
        setQuoteError((err as Error).message || "Erro ao calcular estimativa.");
      } finally {
        setIsCalculatingQuote(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedOrigin, selectedDestination, onRouteCalculated]);

  const handleSwap = () => {
    if (selectedOrigin && selectedDestination) {
      const temp = selectedOrigin;
      onSelectOrigin(selectedDestination);
      onSelectDestination(temp);
    }
  };

  const currentOption = quote?.options.find((o) => o.category === selectedCategory);
  const estimatedPrice = currentOption?.price ?? 0;
  const hasEnoughFunds = userBalance >= estimatedPrice;

  return (
    <Card variant="glass" className="w-full max-w-md mars-glass-card p-5 shadow-2xl flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#e2602c]/20 flex items-center justify-center text-[#f28b44]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">Solicitar Rover</h2>
            <p className="text-[11px] text-[#8c7d75] leading-tight">Deslocamento autônomo na colônia</p>
          </div>
        </div>
        <Badge variant="primary" className="text-[10px] tracking-wide uppercase">
          Frota Autônoma
        </Badge>
      </div>

      {/* Seleção de Origem e Destino */}
      <div className="flex flex-col gap-2 relative">
        {/* Origem */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1a1412] border border-[#2e2320] focus-within:border-[#38bdf8] transition-colors">
          <div className="w-6 h-6 rounded-md bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-semibold text-[#8c7d75] block">Origem</span>
            <select
              value={selectedOrigin?.id ?? ""}
              onChange={(e) => {
                const loc = locations.find((l) => l.id === e.target.value);
                if (loc) onSelectOrigin(loc);
              }}
              className="w-full bg-transparent text-xs font-medium text-white outline-none cursor-pointer truncate"
            >
              <option value="" disabled className="bg-[#181311] text-[#8c7d75]">
                Selecione a origem...
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-[#181311] text-white">
                  {loc.name} ({loc.district})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botão de Inverter */}
        <button
          type="button"
          onClick={handleSwap}
          title="Inverter origem e destino"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full mars-glass border border-[#e2602c]/30 flex items-center justify-center text-[#c4b5ad] hover:text-white hover:border-[#e2602c] transition-all cursor-pointer shadow-md active:scale-95"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>

        {/* Destino */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1a1412] border border-[#2e2320] focus-within:border-[#e2602c] transition-colors">
          <div className="w-6 h-6 rounded-md bg-[#e2602c]/15 text-[#f28b44] flex items-center justify-center shrink-0">
            <Flag className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-semibold text-[#8c7d75] block">Destino</span>
            <select
              value={selectedDestination?.id ?? ""}
              onChange={(e) => {
                const loc = locations.find((l) => l.id === e.target.value);
                if (loc) onSelectDestination(loc);
              }}
              className="w-full bg-transparent text-xs font-medium text-white outline-none cursor-pointer truncate"
            >
              <option value="" disabled className="bg-[#181311] text-[#8c7d75]">
                Selecione o destino...
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-[#181311] text-white">
                  {loc.name} ({loc.district})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {quoteError && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{quoteError}</span>
        </div>
      )}

      {/* Cotação de Trajeto */}
      {isCalculatingQuote ? (
        <div className="py-4 text-center text-xs text-[#8c7d75] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#f28b44]" />
          <span>Calculando rota na malha de Nova Acidália...</span>
        </div>
      ) : quote ? (
        <div className="flex flex-col gap-3">
          {/* Métricas do Trajeto */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/25 border border-white/5 text-center">
            <div className="flex items-center justify-center gap-2">
              <Compass className="w-4 h-4 text-[#e2602c]" />
              <div className="text-left">
                <span className="text-[10px] text-[#8c7d75] block">Distância</span>
                <span className="text-xs font-bold text-white">
                  {formatDistanceKm(quote.distanceKm)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-[#f28b44]" />
              <div className="text-left">
                <span className="text-[10px] text-[#8c7d75] block">Duração Estimada</span>
                <span className="text-xs font-bold text-white">
                  {formatDurationMin(quote.durationMin)}
                </span>
              </div>
            </div>
          </div>

          {/* Seleção de Categoria de Rover */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-semibold text-[#8c7d75]">
              Escolha a Categoria
            </span>
            <div className="grid grid-cols-2 gap-2">
              {quote.options.map((opt) => {
                const meta = VEHICLE_CATEGORY_META[opt.category];
                const isSelected = selectedCategory === opt.category;
                const isPrime = opt.category === "prime";

                return (
                  <button
                    key={opt.category}
                    type="button"
                    onClick={() => setSelectedCategory(opt.category)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#e2602c]/15 border-[#e2602c] shadow-lg shadow-[#e2602c]/10 ring-1 ring-[#e2602c]"
                        : "bg-[#181311] border-[#2e2320] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-[#e2602c] text-white" : "bg-white/5 text-[#8c7d75]"
                        }`}
                      >
                        {isPrime ? <Sparkles className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-extrabold text-white">
                        {formatCredits(opt.price)}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span className="text-xs font-bold text-white block">{meta.label}</span>
                      <span className="text-[10px] text-[#8c7d75] line-clamp-1">
                        {meta.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aviso de Saldo */}
          {!hasEnoughFunds && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Saldo insuficiente ({formatCredits(userBalance)}). Recarregue sua carteira para
                solicitar.
              </span>
            </div>
          )}

          {/* Botão de Solicitação */}
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-1"
            disabled={!hasEnoughFunds || isLoading}
            isLoading={isLoading}
            onClick={() => onRequestRide(selectedCategory)}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Solicitar {VEHICLE_CATEGORY_META[selectedCategory].label} ({formatCredits(estimatedPrice)})
          </Button>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-[#8c7d75] flex flex-col items-center gap-2">
          <MapPin className="w-5 h-5 text-[#e2602c]/50" />
          <span>Selecione origem e destino no painel acima ou clique nos pontos do mapa 3D.</span>
        </div>
      )}
    </Card>
  );
}
