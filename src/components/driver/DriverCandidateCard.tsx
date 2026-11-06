"use client";

import React, { useState, useEffect } from "react";
import { Driver } from "@/modules/drivers/driver.types";
import { Vehicle, VEHICLE_CATEGORY_META } from "@/modules/vehicles/vehicle.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  Star,
  Compass,
  Car,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Clock,
  Radio,
  BatteryCharging,
  Shield,
  Users,
  Quote,
} from "lucide-react";

interface DriverCandidateCardProps {
  driver: Driver | null;
  vehicle: Vehicle | null;
  status: "searching" | "awaiting_approval" | "no_candidates";
  onApprove: () => void;
  onDecline: () => void;
  onCancel: () => void;
  isActionLoading?: boolean;
}

export function DriverCandidateCard({
  driver,
  vehicle,
  status,
  onApprove,
  onDecline,
  onCancel,
  isActionLoading = false,
}: DriverCandidateCardProps) {
  const [searchSeconds, setSearchSeconds] = useState(0);

  useEffect(() => {
    if (status !== "searching") return;
    const start = Date.now();
    const interval = setInterval(() => {
      setSearchSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => {
      clearInterval(interval);
      setSearchSeconds(0);
    };
  }, [status]);

  // Estado 1: Procurando candidato (Radar Sonar Dinâmico)
  if (status === "searching") {
    const statusMessages = [
      "Consultando frota de rovers em Acidalia Planitia...",
      "Identificando pilotos com telemetria ativa...",
      "Calculando tempo de chegada até sua origem...",
      "Negociando rota prioritária com o controle da colônia...",
    ];
    const currentMsg = statusMessages[searchSeconds % statusMessages.length];

    return (
      <Card variant="glow" className="w-full max-w-md mars-glass-card p-6 shadow-2xl text-center">
        <div className="flex flex-col items-center justify-center py-4 gap-4">
          <Badge variant="primary" className="text-[10px] tracking-widest uppercase flex items-center gap-1.5 px-3 py-1">
            <Radio className="w-3 h-3 animate-pulse text-[#f28b44]" />
            RedRide Satellite Dispatch
          </Badge>

          {/* Radar Sonar Animado */}
          <div className="relative w-28 h-28 flex items-center justify-center my-2">
            <div className="absolute inset-0 rounded-full border border-[#e2602c]/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-[#e2602c]/35 animate-pulse" />
            <div className="absolute inset-6 rounded-full border border-[#f28b44]/50" />
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#c84617] to-[#e2602c] shadow-lg shadow-[#e2602c]/40 flex items-center justify-center text-white z-10">
              <Compass className="w-6 h-6 animate-spin" />
            </div>
            {/* Linha de varredura rotativa do radar */}
            <div
              className="absolute inset-0 rounded-full border-t-2 border-[#f28b44] animate-spin pointer-events-none"
              style={{ animationDuration: "2s" }}
            />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide">
              Procurando Motoristas Próximos
            </h3>
            <p className="text-xs text-[#d4c6bd] mt-1.5 min-h-[32px] transition-all">
              {currentMsg}
            </p>
          </div>

          <div className="text-[11px] font-mono text-[#8c7d75] px-3 py-1 rounded-full bg-black/40 border border-white/5">
            Tempo decorrido: 00:0{searchSeconds}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mt-2 text-xs text-[#8c7d75] hover:text-white cursor-pointer"
          >
            Cancelar solicitação
          </Button>
        </div>
      </Card>
    );
  }

  // Estado 2: Nenhum candidato restante
  if (status === "no_candidates" || !driver || !vehicle) {
    return (
      <Card variant="glass" className="w-full max-w-md mars-glass-card p-6 shadow-2xl text-center">
        <div className="flex flex-col items-center justify-center py-4 gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Frota Temporariamente Ocupada</h3>
            <p className="text-xs text-[#8c7d75] mt-1 max-w-xs">
              Todos os motoristas elegíveis desta categoria estão em viagem ou foram recusados.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 w-full">
            <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>
              Voltar ao Início
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={onDecline}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Buscar Novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Citações características dos pilotos de IA marcianos
  const driverQuotes: Record<string, string> = {
    "drv-marc": "Trilhas de basalto e curvas de cratera são minha especialidade. Viagem estável garantida!",
    "drv-bolt": "Rota otimizada via satélite. Chegaremos no tempo mais rápido possível na colônia.",
    "drv-kira": "Modo panorâmico ativo. Se quiser conhecer a história de Acidalia, é só me perguntar!",
    "drv-lyra": "Cabine climatizada e suspensão ativa. Relaxe e aproveite o horizonte marciano.",
    "drv-orion": "Sistemas de navegação calibrados para conforto absoluto e segurança máxima.",
    "drv-solaris": "Energia solar fotovoltaica em 100%. Deslocamento ecológico e silencioso em Marte.",
  };
  const quote = driverQuotes[driver.id] || "Sistemas autônomos prontos. À sua disposição para o trajeto!";

  // Estado 3: Candidato Apresentado com Visual Premium Futurista
  return (
    <Card variant="glow" className="w-full max-w-md mars-glass-card p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 animate-in fade-in-0 zoom-in-95 border border-[#e2602c]/40">
      {/* Header com Status do Radar e Sinal do Rover */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
            Motorista Localizado na Pista
          </span>
        </div>
        <Badge variant="primary" className="text-[9px] uppercase tracking-wider px-2 py-0.5">
          99.6% Compatibilidade
        </Badge>
      </div>

      {/* Card do Piloto de IA */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1e1715] to-[#140f0e] border border-white/10 flex flex-col gap-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                name={driver.name}
                image={driver.avatarUrl}
                color={driver.avatar.primary}
                isBot
                size="xl"
                className="ring-2 ring-[#e2602c] shadow-xl shadow-[#e2602c]/25"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-black border border-[#e2602c] text-[#f28b44]">
                <Radio className="w-3 h-3 animate-pulse" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">{driver.name}</h3>
                <Badge variant="outline" className="text-[9px] py-0 border-white/20">
                  {driver.title}
                </Badge>
              </div>
              <p className="text-xs text-[#f28b44] font-medium mt-0.5">
                {driver.personalitySummary}
              </p>
              {/* Tags de Personalidade */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {driver.traits.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#e2602c]/15 text-[#f28b44] border border-[#e2602c]/25 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-amber-400 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{driver.rating.toFixed(2)}</span>
          </div>
        </div>

        {/* Citação Direta do Piloto de IA */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-[#d4c6bd] italic">
          <Quote className="w-3.5 h-3.5 text-[#f28b44] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="leading-snug">&ldquo;{quote}&rdquo;</p>
            <p className="text-[10px] text-[#8c7d75] not-italic mt-1">
              Especialidade: <span className="text-[#f28b44] font-medium">{driver.specialty}</span>
            </p>
          </div>
        </div>

        {/* Estatísticas do Piloto em Marte */}
        <div className="flex items-center justify-between text-[10px] text-[#8c7d75] pt-1 border-t border-white/5 px-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#e2602c]" />
            {driver.solsOnMars} Sols em Marte
          </span>
          <span>{driver.completedTrips} viagens concluídas</span>
        </div>
      </div>

      {/* Vitrine do Veículo Marciano */}
      <div className="p-3.5 rounded-2xl bg-[#171210] border border-[#2e2320] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#e2602c]/20 text-[#f28b44] flex items-center justify-center border border-[#e2602c]/30 shadow-inner">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">{vehicle.name}</span>
                <span className="text-[10px] text-[#8c7d75] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                  {vehicle.plate}
                </span>
              </div>
              <span className="text-[11px] text-[#8c7d75] block">
                {vehicle.model} · {VEHICLE_CATEGORY_META[vehicle.category].label}
              </span>
            </div>
          </div>

          <Badge variant="primary" className="text-[10px] font-bold">
            {vehicle.category === "prime" ? "VIP Executivo" : "Autônomo"}
          </Badge>
        </div>

        {/* Especificações do Rover */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col items-center text-center">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
            <span className="text-[9px] text-[#8c7d75]">Bateria</span>
            <span className="text-[10px] font-bold text-white font-mono">{vehicle.batteryLevel ?? 88}%</span>
          </div>

          <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col items-center text-center">
            <Shield className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
            <span className="text-[9px] text-[#8c7d75]">Proteção</span>
            <span className="text-[10px] font-bold text-white">Pressurizada</span>
          </div>

          <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col items-center text-center">
            <Users className="w-3.5 h-3.5 text-[#f28b44] mb-0.5" />
            <span className="text-[9px] text-[#8c7d75]">Capacidade</span>
            <span className="text-[10px] font-bold text-white">{vehicle.capacity} Lugares</span>
          </div>
        </div>
      </div>

      {/* Banner de Rota de Aproximação (Ciano Elétrico) */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-transparent border border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 block">
              Tempo até seu embarque
            </span>
            <span className="text-xs font-bold text-white">~2 a 3 minutos</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#8c7d75] block">Trajeto Ciano</span>
          <span className="text-xs font-mono font-bold text-cyan-300">~1.4 km na via</span>
        </div>
      </div>

      {/* Ações de Aprovar / Recusar */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onDecline}
            disabled={isActionLoading}
            leftIcon={<XCircle className="w-4 h-4 text-red-400" />}
            className="hover:border-red-500/40 text-xs font-semibold cursor-pointer"
          >
            Recusar (Outro)
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onApprove}
            isLoading={isActionLoading}
            leftIcon={<CheckCircle className="w-4 h-4" />}
            className="text-xs font-bold shadow-lg shadow-[#e2602c]/20 hover:brightness-110 cursor-pointer"
          >
            Aprovar Motorista
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isActionLoading}
          className="text-xs text-[#8c7d75] hover:text-white cursor-pointer"
        >
          Cancelar solicitação
        </Button>
      </div>
    </Card>
  );
}
