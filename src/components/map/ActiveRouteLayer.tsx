"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Vec2 } from "@/types/common";
import { distance } from "@/lib/geometry";
import { Ride } from "@/modules/rides/ride.types";

interface ActiveRouteLayerProps {
  routePoints?: Vec2[] | null;
  color?: string;
  activeRide?: Ride | null;
  roverPosRef?: React.RefObject<Vec2 | null>;
}

const MAX_SEGMENTS = 16;
const MAX_JOINTS = 16;

export function ActiveRouteLayer({
  routePoints,
  color = "#f28b44",
  activeRide,
  roverPosRef,
}: ActiveRouteLayerProps) {
  const segmentRefs = useRef<Array<THREE.Group | null>>([]);
  const jointRefs = useRef<Array<THREE.Group | null>>([]);
  const startMarkerRef = useRef<THREE.Group | null>(null);
  const endMarkerRef = useRef<THREE.Group | null>(null);

  // Guarda o índice do segmento mais avançado alcançado pelo rover para evitar saltos para trás
  const lastSegmentIdx = useRef<number>(0);
  const prevRouteKey = useRef<string>("");

  // Cria chave única para a rota atual para resetar o progresso quando ela mudar
  const routeKey = useMemo(() => {
    if (!routePoints || routePoints.length === 0) return "";
    const first = routePoints[0];
    const last = routePoints[routePoints.length - 1];
    return `${first.x.toFixed(1)},${first.z.toFixed(1)}->${last.x.toFixed(1)},${last.z.toFixed(1)}:${routePoints.length}`;
  }, [routePoints]);

  useEffect(() => {
    if (routeKey !== prevRouteKey.current) {
      lastSegmentIdx.current = 0;
      prevRouteKey.current = routeKey;
    }
  }, [routeKey]);

  useFrame(() => {
    const hideAll = () => {
      segmentRefs.current.forEach((g) => {
        if (g) g.visible = false;
      });
      jointRefs.current.forEach((j) => {
        if (j) j.visible = false;
      });
      if (startMarkerRef.current) startMarkerRef.current.visible = false;
      if (endMarkerRef.current) endMarkerRef.current.visible = false;
    };

    if (!routePoints || routePoints.length < 2) {
      hideAll();
      return;
    }

    const isDriving =
      activeRide &&
      ["approaching_pickup", "in_progress"].includes(activeRide.status);

    const roverPos = roverPosRef?.current;

    let remainingPoints: Vec2[] = [];

    // Se o rover NÃO estiver dirigindo ativamente ao longo dessa rota (ex: prévia de cotação ou aguardando embarque):
    // Exibe a rota completa
    if (!isDriving || !roverPos) {
      remainingPoints = routePoints;

      if (startMarkerRef.current) {
        startMarkerRef.current.position.set(routePoints[0].x, 0.19, routePoints[0].z);
        startMarkerRef.current.visible = true;
      }
    } else {
      // O rover está em movimento ativo:
      // Oculta o marcador de início, pois a rota nasce diretamente sob o rover
      if (startMarkerRef.current) {
        startMarkerRef.current.visible = false;
      }

      // Encontra a projeção do rover sobre os segmentos da rota, começando do último índice alcançado
      let bestIdx = lastSegmentIdx.current;
      let bestDist = Number.POSITIVE_INFINITY;
      let bestProj = routePoints[bestIdx];

      const startSearch = Math.min(lastSegmentIdx.current, routePoints.length - 2);

      for (let i = startSearch; i < routePoints.length - 1; i++) {
        const a = routePoints[i];
        const b = routePoints[i + 1];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const lenSq = dx * dx + dz * dz;

        if (lenSq === 0) continue;

        const t = Math.max(0, Math.min(1, ((roverPos.x - a.x) * dx + (roverPos.z - a.z) * dz) / lenSq));
        const proj = { x: a.x + t * dx, z: a.z + t * dz };
        const d = distance(roverPos, proj);

        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
          bestProj = proj;
        }
      }

      lastSegmentIdx.current = Math.max(lastSegmentIdx.current, bestIdx);

      // Constrói os pontos restantes: o primeiro ponto é a posição atual do rover,
      // seguido de todos os nós à frente dele até o destino
      remainingPoints = [bestProj];
      for (let k = bestIdx + 1; k < routePoints.length; k++) {
        if (distance(bestProj, routePoints[k]) > 0.4) {
          remainingPoints.push(routePoints[k]);
        }
      }

      // Se o rover praticamente chegou no destino final, apaga a linha por completo
      if (
        remainingPoints.length === 2 &&
        distance(remainingPoints[0], remainingPoints[1]) < 0.6
      ) {
        remainingPoints = [];
      }
    }

    const segCount = remainingPoints.length >= 2 ? remainingPoints.length - 1 : 0;

    // Atualiza os segmentos visíveis
    for (let i = 0; i < MAX_SEGMENTS; i++) {
      const group = segmentRefs.current[i];
      if (!group) continue;

      if (i < segCount) {
        const a = remainingPoints[i];
        const b = remainingPoints[i + 1];
        const len = distance(a, b);

        if (len < 0.1) {
          group.visible = false;
          continue;
        }

        const midX = (a.x + b.x) / 2;
        const midZ = (a.z + b.z) / 2;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const angleY = Math.atan2(dx, dz);

        group.position.set(midX, 0.18, midZ);
        group.rotation.set(0, angleY, 0);
        group.scale.set(1, 1, len);
        group.visible = true;
      } else {
        group.visible = false;
      }
    }

    // Atualiza as curvas / conexões intermediárias entre segmentos
    const jointCount = remainingPoints.length > 2 ? remainingPoints.length - 2 : 0;
    for (let j = 0; j < MAX_JOINTS; j++) {
      const joint = jointRefs.current[j];
      if (!joint) continue;

      if (j < jointCount) {
        const pt = remainingPoints[j + 1];
        joint.position.set(pt.x, 0.181, pt.z);
        joint.visible = true;
      } else {
        joint.visible = false;
      }
    }

    // Marcador circular no destino final
    if (endMarkerRef.current) {
      if (segCount > 0) {
        const endPt = routePoints[routePoints.length - 1];
        endMarkerRef.current.position.set(endPt.x, 0.19, endPt.z);
        endMarkerRef.current.visible = true;
      } else {
        endMarkerRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      {/* Pool de fitas holográficas iluminadas de navegação */}
      {Array.from({ length: MAX_SEGMENTS }).map((_, i) => (
        <group
          key={`route-pool-seg-${i}`}
          ref={(el) => {
            segmentRefs.current[i] = el;
          }}
          visible={false}
        >
          {/* Brilho externo da fita */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
            <planeGeometry args={[2.2, 1]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.42}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-4}
            />
          </mesh>
          {/* Núcleo luminoso intenso neon da rota */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.005]} renderOrder={11}>
            <planeGeometry args={[0.8, 1]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.92}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-6}
            />
          </mesh>
        </group>
      ))}

      {/* Pool de emendas suaves nas curvas da rota */}
      {Array.from({ length: MAX_JOINTS }).map((_, j) => (
        <group
          key={`route-pool-joint-${j}`}
          ref={(el) => {
            jointRefs.current[j] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <mesh renderOrder={10}>
            <circleGeometry args={[1.1, 20]} />
            <meshBasicMaterial color={color} transparent opacity={0.42} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, 0.005]} renderOrder={11}>
            <circleGeometry args={[0.4, 20]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.92} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* Marcador circular pulsante no ponto de partida (usado na prévia da rota) */}
      <group
        ref={startMarkerRef}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <circleGeometry args={[2.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
      </group>

      {/* Marcador circular no destino final */}
      <group
        ref={endMarkerRef}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[2.2, 3.2, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
      </group>
    </group>
  );
}
