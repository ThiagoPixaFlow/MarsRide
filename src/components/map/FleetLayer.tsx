"use client";

import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoverModel } from "./RoverModel";
import { VEHICLES_SEED } from "@/mocks/data/vehicles";
import { ROAD_NODES_SEED } from "@/mocks/data/road-network";
import { Ride } from "@/modules/rides/ride.types";
import { cumulativeLengths, sampleAtDistance } from "@/lib/geometry";
import { Vec2 } from "@/types/common";

interface FleetLayerProps {
  activeRide?: Ride | null;
  showNearbyVehicles?: boolean;
  onAssignedRoverPosition?: (pos: Vec2) => void;
}

/** Interpolação angular que escolhe sempre o caminho mais curto na circunferência */
function lerpAngle(current: number, target: number, t: number): number {
  const da = (target - current) % (Math.PI * 2);
  const diff = ((2 * da) % (Math.PI * 2)) - da;
  return current + diff * t;
}

export function FleetLayer({
  activeRide,
  showNearbyVehicles = false,
  onAssignedRoverPosition,
}: FleetLayerProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, Vec2>();
    for (const n of ROAD_NODES_SEED) map.set(n.id, n.position);
    return map;
  }, []);

  // Prepara trajetos fechados de patrulha para cada rover
  const patrolData = useMemo(() => {
    return VEHICLES_SEED.map((v) => {
      if (!v.patrolLoop || v.patrolLoop.length < 2) {
        const p = v.parkedNodeId ? nodeMap.get(v.parkedNodeId) ?? { x: 0, z: 0 } : { x: 0, z: 0 };
        return { vehicle: v, isPatrolling: false, points: [p], lengths: [0], totalLength: 0 };
      }

      const validNodes = v.patrolLoop.filter((id) => nodeMap.has(id));
      if (validNodes.length < 2) {
        const p = v.parkedNodeId ? nodeMap.get(v.parkedNodeId) ?? { x: 0, z: 0 } : { x: 0, z: 0 };
        return { vehicle: v, isPatrolling: false, points: [p], lengths: [0], totalLength: 0 };
      }

      const points: Vec2[] = validNodes.map((id) => nodeMap.get(id)!);
      // Fecha o loop de volta ao ponto inicial apenas se já não terminar nele
      if (validNodes[0] !== validNodes[validNodes.length - 1]) {
        points.push(points[0]);
      }
      const lengths = cumulativeLengths(points);
      const totalLength = lengths[lengths.length - 1];

      return {
        vehicle: v,
        isPatrolling: true,
        points,
        lengths,
        totalLength,
      };
    });
  }, [nodeMap]);

  // Referências para os grupos dos rovers e histórico de ângulos
  const roverRefs = useRef<Array<THREE.Group | null>>([]);
  const patrolHeadings = useRef<number[]>(patrolData.map(() => 0));

  // Trajeto da viagem ativa
  const activeRidePath = useMemo(() => {
    if (!activeRide) return null;

    let points: Vec2[] = [];
    if (activeRide.status === "approaching_pickup" && activeRide.approachRoute) {
      points = activeRide.approachRoute.points;
    } else if (activeRide.status === "boarding" && activeRide.tripRoute.points.length > 0) {
      points = activeRide.tripRoute.points;
    } else if (activeRide.status === "in_progress") {
      points = activeRide.tripRoute.points;
    } else if (activeRide.status === "completed" && activeRide.tripRoute.points.length > 0) {
      points = activeRide.tripRoute.points;
    }

    if (points.length < 2) {
      const single = points[0] ?? { x: 0, z: 0 };
      return {
        points: [single, single],
        lengths: [0, 0],
        totalLength: 0,
      };
    }

    const lengths = cumulativeLengths(points);
    return {
      points,
      lengths,
      totalLength: lengths[lengths.length - 1],
    };
  }, [activeRide]);

  const assignedRoverRef = useRef<THREE.Group | null>(null);
  const assignedHeading = useRef<number>(0);
  const [wheelTurn, setWheelTurn] = useState<number>(0);

  // Status em que o trajeto foi confirmado e o rover está a caminho ou em viagem
  const isTripConfirmed =
    activeRide &&
    ["approaching_pickup", "boarding", "in_progress"].includes(activeRide.status);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    setWheelTurn(elapsed * 8);

    // 1. Animação da frota de patrulha
    patrolData.forEach((item, index) => {
      const group = roverRefs.current[index];
      if (!group) return;

      // Oculta o rover da patrulha se for o rover ativo selecionado (ele é renderizado por assignedRoverRef)
      if (
        activeRide?.vehicleId === item.vehicle.id &&
        (activeRide.status === "awaiting_approval" || isTripConfirmed)
      ) {
        group.visible = false;
        return;
      }

      // Oculta outros rovers durante a aproximação/viagem ativa do passageiro
      if (isTripConfirmed || (!showNearbyVehicles && activeRide?.status !== "awaiting_approval")) {
        group.visible = false;
        return;
      }
      group.visible = true;

      if (!item.isPatrolling || item.totalLength === 0) {
        const p = item.points[0];
        group.position.set(p.x, 0.12, p.z);
        return;
      }

      // Velocidade de cruzeiro na colônia (unidades/s)
      const speed = 3.2;
      const initialOffset = (item.vehicle.patrolOffset || 0) * item.totalLength;
      const currentDist = (initialOffset + elapsed * speed) % item.totalLength;

      const sample = sampleAtDistance(item.points, item.lengths, currentDist);
      group.position.set(sample.point.x, 0.12, sample.point.z);

      // Suavização da rotação nas curvas
      const currentH = patrolHeadings.current[index] ?? sample.heading;
      const smoothedH = lerpAngle(currentH, sample.heading, Math.min(1, delta * 7));
      patrolHeadings.current[index] = smoothedH;
      group.rotation.y = smoothedH;
    });

    // 2. Animação de alta precisão do Rover da corrida ativa
    if (assignedRoverRef.current && activeRide) {
      // Caso A: Motorista aguardando aprovação
      // O rover continua passeando naturalmente na sua rota de patrulha pelas estradas
      if (activeRide.status === "awaiting_approval") {
        const candidatePatrol = patrolData.find((p) => p.vehicle.id === activeRide.vehicleId);
        if (candidatePatrol && candidatePatrol.isPatrolling && candidatePatrol.totalLength > 0) {
          const speed = 3.2;
          const initialOffset =
            (candidatePatrol.vehicle.patrolOffset || 0) * candidatePatrol.totalLength;
          const currentDist =
            (initialOffset + elapsed * speed) % candidatePatrol.totalLength;
          const sample = sampleAtDistance(
            candidatePatrol.points,
            candidatePatrol.lengths,
            currentDist
          );

          assignedRoverRef.current.position.set(sample.point.x, 0.12, sample.point.z);

          const currentH = assignedHeading.current;
          const smoothedH = lerpAngle(currentH, sample.heading, Math.min(1, delta * 8));
          assignedHeading.current = smoothedH;
          assignedRoverRef.current.rotation.y = smoothedH;

          if (onAssignedRoverPosition) {
            onAssignedRoverPosition({ x: sample.point.x, z: sample.point.z });
          }
        }
        return;
      }

      // Caso B: Viagem ativa confirmada (A caminho, Embarque, Em Viagem, Concluída)
      if (activeRidePath) {
        const { points, lengths, totalLength } = activeRidePath;

        let progressRatio = 0;
        const now = Date.now();

        if (
          activeRide.status === "approaching_pickup" &&
          (activeRide.approachStartsAt || activeRide.approvedAt)
        ) {
          const start = new Date(activeRide.approachStartsAt || activeRide.approvedAt!).getTime();
          const totalDurationMs = activeRide.pickupEta
            ? Math.max(1000, new Date(activeRide.pickupEta).getTime() - start)
            : Math.max(14000, Math.round((totalLength / 3.2) * 1000));
          progressRatio = Math.min(1, Math.max(0, (now - start) / totalDurationMs));
        } else if (activeRide.status === "boarding") {
          progressRatio = 0;
        } else if (activeRide.status === "in_progress") {
          const start = new Date(activeRide.startedAt || activeRide.approvedAt || now).getTime();
          const tripDurationMs = Math.max(16000, Math.round((totalLength / 3.2) * 1000));
          progressRatio = Math.min(1, Math.max(0, (now - start) / tripDurationMs));
        } else if (activeRide.status === "completed") {
          progressRatio = 1;
        }

        const traveled = progressRatio * totalLength;
        const sample = sampleAtDistance(points, lengths, traveled);
        assignedRoverRef.current.position.set(sample.point.x, 0.12, sample.point.z);

        // Rotação suave do rover da viagem
        const currentH = assignedHeading.current;
        const targetH =
          activeRide.status === "boarding" && points.length >= 2
            ? Math.atan2(points[1].x - points[0].x, points[1].z - points[0].z)
            : sample.heading;

        const smoothedH = lerpAngle(currentH, targetH, Math.min(1, delta * 8));
        assignedHeading.current = smoothedH;
        assignedRoverRef.current.rotation.y = smoothedH;

        if (onAssignedRoverPosition) {
          onAssignedRoverPosition({ x: sample.point.x, z: sample.point.z });
        }
      }
    }
  });

  const assignedVehicle = useMemo(() => {
    if (!activeRide?.vehicleId) return null;
    return VEHICLES_SEED.find((v) => v.id === activeRide.vehicleId) ?? null;
  }, [activeRide]);

  return (
    <group>
      {/* Rovers da colônia (patrulha nas estradas) */}
      {patrolData.map((item, idx) => (
        <group
          key={item.vehicle.id}
          ref={(el) => {
            roverRefs.current[idx] = el;
          }}
        >
          <RoverModel
            color={item.vehicle.paintColor}
            accentColor={item.vehicle.accentColor}
            category={item.vehicle.category}
            isAssigned={false}
            wheelRotation={wheelTurn}
          />
        </group>
      ))}

      {/* Rover ativo na viagem do passageiro */}
      {assignedVehicle &&
        activeRide &&
        activeRide.status !== "searching_driver" &&
        activeRide.status !== "cancelled" && (
          <group ref={assignedRoverRef}>
            <RoverModel
              color={assignedVehicle.paintColor}
              accentColor={assignedVehicle.accentColor}
              category={assignedVehicle.category}
              isAssigned={true}
              wheelRotation={wheelTurn}
            />

            {/* Marcador Holográfico quando for Candidato em Avaliação */}
            {activeRide.status === "awaiting_approval" && (
              <group position={[0, 0, 0]}>
                {/* Anel no solo em pulso */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                  <ringGeometry args={[1.6, 1.95, 32]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                  <circleGeometry args={[1.6, 32]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} />
                </mesh>
                {/* Feixe cilíndrico de identificação */}
                <mesh position={[0, 4.5, 0]}>
                  <cylinderGeometry args={[0.06, 0.85, 9, 16]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
                </mesh>
              </group>
            )}
          </group>
        )}
    </group>
  );
}
