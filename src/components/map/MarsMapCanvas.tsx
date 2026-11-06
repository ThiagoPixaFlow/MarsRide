"use client";

import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { Location } from "@/modules/locations/location.types";
import { Ride } from "@/modules/rides/ride.types";
import { Vec2 } from "@/types/common";
import { Compass, Loader2, Focus, Eye, EyeOff, RotateCcw, Layers } from "lucide-react";

const MarsScene = dynamic(() => import("./MarsScene").then((m) => m.MarsScene), {
  ssr: false,
});

interface MarsMapCanvasProps {
  selectedOriginId?: string | null;
  selectedDestinationId?: string | null;
  activeRoutePoints?: Vec2[] | null;
  activeRouteColor?: string;
  activeRide?: Ride | null;
  showNearbyVehicles?: boolean;
  onSelectLocation?: (location: Location) => void;
  onRoverPositionUpdate?: (pos: Vec2) => void;
  className?: string;
}

export function MarsMapCanvas({
  selectedOriginId,
  selectedDestinationId,
  activeRoutePoints,
  activeRouteColor = "#f28b44",
  activeRide,
  showNearbyVehicles = false,
  onSelectLocation,
  onRoverPositionUpdate,
  className = "w-full h-full",
}: MarsMapCanvasProps) {
  const [followRover, setFollowRover] = useState(true);
  const [showPoiLabels, setShowPoiLabels] = useState(true);
  const [resetCameraTrigger, setResetCameraTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<"3d" | "2.5d">("3d");

  const hasActiveRide =
    activeRide &&
    ["approaching_pickup", "boarding", "in_progress"].includes(activeRide.status);

  return (
    <div className={`relative ${className} bg-[#0a0807] overflow-hidden select-none`}>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0807] text-[#8c7d75] gap-3">
            <Compass className="w-8 h-8 text-[#e2602c] animate-spin" />
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#f28b44]" />
              <span>Carregando telemetria e relevo de Nova Acidália...</span>
            </div>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 95, 145], fov: 46 }}
          shadows
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
          <MarsScene
            selectedOriginId={selectedOriginId}
            selectedDestinationId={selectedDestinationId}
            activeRoutePoints={activeRoutePoints}
            activeRouteColor={activeRouteColor}
            activeRide={activeRide}
            showNearbyVehicles={showNearbyVehicles}
            onSelectLocation={onSelectLocation}
            followRover={followRover}
            showPoiLabels={showPoiLabels}
            viewMode={viewMode}
            resetCameraTrigger={resetCameraTrigger}
            onRoverPositionUpdate={onRoverPositionUpdate}
          />
        </Canvas>
      </Suspense>

      {/* Barra de Controles Rápidos da Câmera / HUD 3D no Canto Inferior Direito */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 items-end">
        {/* Alternar Modo 3D / 2.5D (Visão de Cima) */}
        <button
          onClick={() => setViewMode((m) => (m === "3d" ? "2.5d" : "3d"))}
          title={viewMode === "3d" ? "Alternar para Visão Superior (2.5D)" : "Alternar para Modo 3D"}
          className={`px-3 py-2 rounded-xl mars-glass border transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5 text-xs font-bold ${
            viewMode === "2.5d"
              ? "bg-[#e2602c]/25 border-[#e2602c] text-[#f28b44] ring-1 ring-[#e2602c]"
              : "border-white/10 text-[#d4c6bd] hover:text-white hover:border-[#e2602c]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{viewMode === "3d" ? "Visão 3D" : "Visão 2.5D"}</span>
        </button>

        <div className="flex gap-2">
          {/* Reset Câmera */}
          <button
            onClick={() => setResetCameraTrigger((v) => v + 1)}
            title="Visão Geral da Colônia"
            className="p-2.5 rounded-xl mars-glass border border-white/10 text-[#d4c6bd] hover:text-white hover:border-[#e2602c] transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Foco no Rover Ativo */}
          {hasActiveRide && (
            <button
              onClick={() => setFollowRover((f) => !f)}
              title={followRover ? "Liberar Câmera" : "Acompanhar Rover"}
              className={`p-2.5 rounded-xl mars-glass border transition-all cursor-pointer shadow-lg active:scale-95 ${
                followRover
                  ? "bg-[#e2602c]/20 border-[#e2602c] text-[#f28b44] ring-1 ring-[#e2602c]"
                  : "border-white/10 text-[#d4c6bd] hover:text-white hover:border-[#e2602c]"
              }`}
            >
              <Focus className="w-4 h-4" />
            </button>
          )}

          {/* Alternar Marcadores de Locais */}
          <button
            onClick={() => setShowPoiLabels((s) => !s)}
            title={showPoiLabels ? "Ocultar Marcadores" : "Exibir Marcadores"}
            className="p-2.5 rounded-xl mars-glass border border-white/10 text-[#d4c6bd] hover:text-white hover:border-[#e2602c] transition-all cursor-pointer shadow-lg active:scale-95"
          >
            {showPoiLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Dica de navegação e coordenadas no canto inferior */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full mars-glass text-[11px] text-[#a89990] border border-white/5">
        <span className="w-2 h-2 rounded-full bg-[#e2602c] animate-pulse" />
        <span>Girar: Botão esquerdo · Mover: Botão direito · Zoom: Roda do mouse</span>
        <span className="text-white/20">|</span>
        <span className="font-mono text-[10px] text-[#f28b44]">PLANÍCIE ACIDÁLIA · 0.38G</span>
      </div>
    </div>
  );
}
