"use client";

import React, { useState } from "react";
import { Html } from "@react-three/drei";
import { LOCATIONS_SEED } from "@/mocks/data/locations";
import { Location } from "@/modules/locations/location.types";
import { cn } from "@/lib/utils";
import { MapPin, Navigation, Flag } from "lucide-react";

interface PoiMarkersProps {
  selectedOriginId?: string | null;
  selectedDestinationId?: string | null;
  onSelectLocation?: (location: Location) => void;
}

export function PoiMarkers({
  selectedOriginId,
  selectedDestinationId,
  onSelectLocation,
}: PoiMarkersProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <group>
      {LOCATIONS_SEED.map((loc) => {
        const isOrigin = selectedOriginId === loc.id;
        const isDest = selectedDestinationId === loc.id;
        const isSelected = isOrigin || isDest;
        const isHovered = hoveredId === loc.id;

        const pinColor = isOrigin ? "#38bdf8" : isDest ? "#e2602c" : "#f28b44";

        return (
          <group
            key={loc.id}
            position={[loc.position.x, 0, loc.position.z]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(loc.id);
            }}
            onPointerOut={() => setHoveredId(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLocation?.(loc);
            }}
          >
            {/* Base circular de projeção no chão */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 2.2, 24]} />
              <meshBasicMaterial
                color={pinColor}
                transparent
                opacity={isSelected ? 0.9 : 0.4}
              />
            </mesh>

            {/* Feixe vertical de luz holográfica */}
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
              <meshBasicMaterial
                color={pinColor}
                transparent
                opacity={isSelected ? 0.75 : 0.3}
              />
            </mesh>

            {/* Cristal / Marcador flutuante no topo */}
            <mesh position={[0, 6.2, 0]} rotation={[0, isHovered ? 1 : 0, 0]}>
              <octahedronGeometry args={[0.8, 0]} />
              <meshStandardMaterial
                color={pinColor}
                emissive={pinColor}
                emissiveIntensity={isSelected || isHovered ? 1 : 0.4}
                roughness={0.2}
              />
            </mesh>

            {/* Label HTML embutido e interativo */}
            <Html
              position={[0, 7.5, 0]}
              center
              distanceFactor={80}
              zIndexRange={[100, 0]}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLocation?.(loc);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-lg select-none border",
                  isOrigin && "bg-sky-500 text-white border-sky-300 ring-2 ring-sky-400/50 scale-110",
                  isDest && "bg-[#e2602c] text-white border-[#f28b44] ring-2 ring-[#e2602c]/50 scale-110",
                  !isSelected &&
                    (isHovered
                      ? "bg-[#251e1b] text-white border-[#e2602c] scale-105"
                      : "bg-[#181311]/90 text-[#d4c6bd] border-[#3d2e27] hover:border-[#e2602c]")
                )}
              >
                {isOrigin ? (
                  <Navigation className="w-3 h-3 text-white fill-current" />
                ) : isDest ? (
                  <Flag className="w-3 h-3 text-white fill-current" />
                ) : (
                  <MapPin className="w-3 h-3 text-[#e2602c]" />
                )}
                <span>{loc.shortName}</span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
