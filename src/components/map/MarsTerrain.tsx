"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { ROAD_NODES_SEED } from "@/mocks/data/road-network";
import { distance } from "@/lib/geometry";

export function MarsTerrain() {
  const { geometry, rockGeometries } = useMemo(() => {
    // Terreno amplo expandido de 900x900
    const geo = new THREE.PlaneGeometry(900, 900, 110, 110);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      const distCenter = Math.hypot(x, z);

      let y = 0;
      // Área urbana/habitada e malha viária da colônia (raio até 310) é rigorosamente plana em Y=0
      // para eliminar qualquer colisão com as estradas e fitas de rota
      if (distCenter > 310) {
        const edgeFactor = Math.min(1, (distCenter - 310) / 90);
        y += Math.sin(x * 0.02) * Math.cos(z * 0.02) * 16 * edgeFactor;
        y += Math.sin(x * 0.045 + 1.2) * Math.sin(z * 0.04 - 0.5) * 9 * edgeFactor;
        y += Math.abs(Math.sin(x * 0.01 + z * 0.01)) * 24 * (edgeFactor * edgeFactor);
      } else {
        y = 0.0;
      }

      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    // Rochas marcianas dispersas apenas longe das pistas e habitats
    const rocks: Array<{
      position: [number, number, number];
      scale: [number, number, number];
      rotation: [number, number, number];
    }> = [];

    let count = 0;
    for (let i = 0; i < 160 && count < 70; i++) {
      const angle = (i / 160) * Math.PI * 2 + (i % 7);
      const r = 70 + ((i * 37) % 280);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      // Verifica distância segura de qualquer nó viário
      const tooCloseToRoad = ROAD_NODES_SEED.some((node) => distance({ x, z }, node.position) < 14);
      if (tooCloseToRoad) continue;

      const s = 1.3 + (i % 4) * 0.9;
      rocks.push({
        position: [x, s * 0.35, z],
        scale: [s, s * 0.75, s * 1.1],
        rotation: [(i * 0.4) % Math.PI, (i * 0.8) % Math.PI, 0],
      });
      count++;
    }

    return { geometry: geo, rockGeometries: rocks };
  }, []);

  return (
    <group>
      {/* Terreno de regolito marciano plano na colônia e montanhoso na borda */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color="#331c15"
          roughness={0.92}
          metalness={0.08}
        />
      </mesh>

      {/* Formações rochosas procedurais marcianas */}
      {rockGeometries.map((rock, i) => (
        <mesh
          key={i}
          position={rock.position}
          scale={rock.scale}
          rotation={rock.rotation}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#4a281e" : i % 3 === 1 ? "#3b1e17" : "#572d21"}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
