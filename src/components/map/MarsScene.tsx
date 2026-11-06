"use client";

import React, { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { MarsTerrain } from "./MarsTerrain";
import { ColonyStructures } from "./ColonyStructures";
import { RoadNetworkLayer } from "./RoadNetworkLayer";
import { PoiMarkers } from "./PoiMarkers";
import { FleetLayer } from "./FleetLayer";
import { ActiveRouteLayer } from "./ActiveRouteLayer";
import { Location } from "@/modules/locations/location.types";
import { Ride } from "@/modules/rides/ride.types";
import { Vec2 } from "@/types/common";

interface MarsSceneProps {
  selectedOriginId?: string | null;
  selectedDestinationId?: string | null;
  activeRoutePoints?: Vec2[] | null;
  activeRouteColor?: string;
  activeRide?: Ride | null;
  showNearbyVehicles?: boolean;
  onSelectLocation?: (location: Location) => void;
  followRover?: boolean;
  showPoiLabels?: boolean;
  viewMode?: "3d" | "2.5d";
  resetCameraTrigger?: number;
  onRoverPositionUpdate?: (pos: Vec2) => void;
}

export function MarsScene({
  selectedOriginId,
  selectedDestinationId,
  activeRoutePoints,
  activeRouteColor = "#f28b44",
  activeRide,
  showNearbyVehicles = false,
  onSelectLocation,
  followRover = false,
  showPoiLabels = true,
  viewMode = "3d",
  resetCameraTrigger = 0,
  onRoverPositionUpdate,
}: MarsSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const roverWorldPos = useRef<Vec2 | null>(null);

  // Reset de câmera suave
  useEffect(() => {
    if (resetCameraTrigger > 0 && controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      if (viewMode === "2.5d") {
        camera.position.set(0, 200, 0.05);
      } else {
        camera.position.set(0, 95, 145);
      }
      controlsRef.current.update();
    }
  }, [resetCameraTrigger, camera, viewMode]);

  // Transições cinematográficas de câmera
  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    const is2D = viewMode === "2.5d";

    // Caso 1: Candidato encontrado aguardando aprovação -> Câmera foca no rover candidato distante
    if (activeRide?.status === "awaiting_approval") {
      const candPos = roverWorldPos.current ?? activeRide.approachRoute?.points[0];
      if (candPos) {
        controlsRef.current.target.lerp(new THREE.Vector3(candPos.x, 0.4, candPos.z), Math.min(1, delta * 3.5));
        const desiredPos = is2D
          ? new THREE.Vector3(candPos.x, 110, candPos.z + 0.05)
          : new THREE.Vector3(candPos.x + 14, 16, candPos.z + 18);
        camera.position.lerp(desiredPos, Math.min(1, delta * 2.5));
        controlsRef.current.update();
      }
      return;
    }

    // Caso 2: Em busca ou recusado -> Câmera retorna para visão panorâmica ampla da colônia
    if (activeRide?.status === "searching_driver") {
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), Math.min(1, delta * 2.5));
      const desiredPos = is2D
        ? new THREE.Vector3(0, 220, 0.05)
        : new THREE.Vector3(0, 95, 145);
      camera.position.lerp(desiredPos, Math.min(1, delta * 2));
      controlsRef.current.update();
      return;
    }

    // Caso 3: Acompanhamento contínuo do Rover durante aproximação ou viagem
    if (followRover && roverWorldPos.current) {
      const isTripActive = ["approaching_pickup", "boarding", "in_progress"].includes(activeRide?.status ?? "");
      if (isTripActive) {
        const p = roverWorldPos.current;
        controlsRef.current.target.lerp(new THREE.Vector3(p.x, 0.4, p.z), Math.min(1, delta * 4));
        if (is2D) {
          camera.position.lerp(new THREE.Vector3(p.x, 120, p.z + 0.05), Math.min(1, delta * 3));
        }
        controlsRef.current.update();
        return;
      }
    }

    // Caso 4: Transição suave entre modo 2.5D e 3D no mapa livre
    if (is2D && camera.position.y < 160) {
      const target = controlsRef.current.target;
      camera.position.lerp(new THREE.Vector3(target.x, 190, target.z + 0.05), Math.min(1, delta * 3));
      controlsRef.current.update();
    }
  });

  return (
    <>
      {/* Controles de Câmera com suporte dinâmico a 3D e 2.5D Top-Down */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        minDistance={15}
        maxDistance={450}
        maxPolarAngle={viewMode === "2.5d" ? 0.38 : Math.PI / 2 - 0.04}
        minPolarAngle={viewMode === "2.5d" ? 0.02 : 0.05}
        target={[0, 0, 0]}
      />

      {/* Atmosfera e Neblina Marciana Expandida */}
      <color attach="background" args={["#0c0908"]} />
      <fog attach="fog" args={["#241510", 160, 560]} />

      {/* Iluminação Quente de Marte */}
      <ambientLight color="#f5af89" intensity={0.75} />

      {/* Sol distante de Marte */}
      <directionalLight
        position={[140, 160, 110]}
        intensity={2.1}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={520}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
      />
      {/* Luz difusa de preenchimento avermelhada da poeira */}
      <directionalLight position={[-120, -30, -100]} intensity={0.45} color="#d95e2a" />

      {/* Elementos Tridimensionais */}
      <MarsTerrain />
      <ColonyStructures />
      <RoadNetworkLayer />

      {showPoiLabels && (
        <PoiMarkers
          selectedOriginId={selectedOriginId}
          selectedDestinationId={selectedDestinationId}
          onSelectLocation={onSelectLocation}
        />
      )}

      <FleetLayer
        activeRide={activeRide}
        showNearbyVehicles={showNearbyVehicles}
        onAssignedRoverPosition={(pos) => {
          roverWorldPos.current = pos;
          onRoverPositionUpdate?.(pos);
        }}
      />
      <ActiveRouteLayer
        routePoints={activeRoutePoints}
        color={activeRouteColor}
        activeRide={activeRide}
        roverPosRef={roverWorldPos}
      />
    </>
  );
}
