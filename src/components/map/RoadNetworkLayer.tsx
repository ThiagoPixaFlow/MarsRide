"use client";

import React, { useMemo } from "react";
import { ROAD_NODES_SEED, ROAD_EDGES_SEED } from "@/mocks/data/road-network";
import { distance } from "@/lib/geometry";

export function RoadNetworkLayer() {
  const nodeMap = useMemo(() => {
    const map = new Map<string, (typeof ROAD_NODES_SEED)[0]>();
    for (const n of ROAD_NODES_SEED) map.set(n.id, n);
    return map;
  }, []);

  // Segmentos retos entre nós
  const roadSegments = useMemo(() => {
    return ROAD_EDGES_SEED.map(([fromId, toId], idx) => {
      const from = nodeMap.get(fromId);
      const to = nodeMap.get(toId);
      if (!from || !to) return null;

      const midX = (from.position.x + to.position.x) / 2;
      const midZ = (from.position.z + to.position.z) / 2;
      const len = distance(from.position, to.position);
      const dx = to.position.x - from.position.x;
      const dz = to.position.z - from.position.z;
      // Ângulo horizontal puro em torno do eixo Y:
      const angleY = Math.atan2(dx, dz);

      return {
        key: `seg-${fromId}-${toId}-${idx}`,
        position: [midX, 0.10, midZ] as [number, number, number],
        rotationY: angleY,
        length: len,
      };
    }).filter(Boolean);
  }, [nodeMap]);

  return (
    <group>
      {/* 1. Rotatórias / Interseções nos nós da malha viária (garante emendas perfeitas) */}
      {ROAD_NODES_SEED.map((node) => (
        <group key={`node-${node.id}`} position={[node.position.x, 0.101, node.position.z]}>
          {/* Base asfáltica da rotatória */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.4, 24]} />
            <meshStandardMaterial color="#1a1412" roughness={0.85} />
          </mesh>
          {/* Anel balizador interno luminoso suave */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.002]}>
            <ringGeometry args={[1.5, 1.7, 24]} />
            <meshBasicMaterial color="#e2602c" opacity={0.4} transparent />
          </mesh>
        </group>
      ))}

      {/* 2. Pistas retilíneas conectando os nós */}
      {roadSegments.map((seg) => {
        if (!seg) return null;
        return (
          <group
            key={seg.key}
            position={seg.position}
            rotation={[0, seg.rotationY, 0]}
          >
            {/* Faixa principal de asfalto marciano (basalto fundido) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[3.2, seg.length]} />
              <meshStandardMaterial
                color="#161210"
                roughness={0.88}
                metalness={0.12}
                polygonOffset
                polygonOffsetFactor={-1}
              />
            </mesh>

            {/* Acostamento / Faixas laterais de sinalização refletiva */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, 0, 0.002]}>
              <planeGeometry args={[0.08, seg.length]} />
              <meshBasicMaterial color="#d8c49c" opacity={0.35} transparent />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0, 0.002]}>
              <planeGeometry args={[0.08, seg.length]} />
              <meshBasicMaterial color="#d8c49c" opacity={0.35} transparent />
            </mesh>

            {/* Linha guia central pontilhada/contínua em neon laranja */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.003]}>
              <planeGeometry args={[0.18, seg.length]} />
              <meshBasicMaterial color="#f28b44" opacity={0.75} transparent />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
