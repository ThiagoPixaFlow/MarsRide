"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { VehicleCategory } from "@/modules/vehicles/vehicle.types";

interface RoverModelProps {
  color?: string;
  accentColor?: string;
  category?: VehicleCategory;
  isAssigned?: boolean;
  scale?: number;
  wheelRotation?: number;
}

export function RoverModel({
  color = "#e9e1d4",
  accentColor = "#e2602c",
  category = "go",
  isAssigned = false,
  scale = 1,
  wheelRotation = 0,
}: RoverModelProps) {
  const isPrime = category === "prime";

  // Posicionamento relativo das 6 rodas articuladas
  const wheelPositions = useMemo(() => {
    const halfWidth = 0.95;
    return [
      [-halfWidth, 0.35, -1.05],
      [halfWidth, 0.35, -1.05],
      [-halfWidth, 0.35, 0],
      [halfWidth, 0.35, 0],
      [-halfWidth, 0.35, 1.05],
      [halfWidth, 0.35, 1.05],
    ] as Array<[number, number, number]>;
  }, []);

  // Target local para o feixe do farol
  const lightTargetRef = useRef<THREE.Object3D>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);

  React.useEffect(() => {
    if (spotLightRef.current && lightTargetRef.current) {
      spotLightRef.current.target = lightTargetRef.current;
    }
  }, []);

  return (
    <group scale={scale}>
      {/* 1. Alvo do farol na frente do veículo */}
      <object3D ref={lightTargetRef} position={[0, 0.5, 14]} />

      {/* 2. Marcador holográfico pulsante para o Rover da viagem ativa */}
      {isAssigned && (
        <group position={[0, 2.7, 0]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.35, 0.7, 4]} />
            <meshStandardMaterial
              color="#e2602c"
              emissive="#f28b44"
              emissiveIntensity={1.4}
            />
          </mesh>
          <pointLight color="#f28b44" intensity={2.5} distance={10} />
        </group>
      )}

      {/* 3. Chassi principal reforçado */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.45, 2.7]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
      </mesh>

      {/* 4. Cabine pressurizada com iluminação interna */}
      <mesh position={[0, 1.02, 0.1]} castShadow>
        {isPrime ? (
          <sphereGeometry args={[0.78, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        ) : (
          <boxGeometry args={[1.25, 0.52, 1.65]} />
        )}
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.4}
          transparent
          opacity={0.72}
        />
      </mesh>
      {/* Luz ambiente interna da cabine */}
      <pointLight position={[0, 0.95, 0.1]} color="#7dd3fc" intensity={0.5} distance={3} />

      {/* 5. Rack de teto e antena de telemetria */}
      <mesh position={[0, 1.32, -0.4]}>
        <boxGeometry args={[0.85, 0.08, 0.8]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
      <mesh position={[0.3, 1.5, -0.6]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 6. As 6 Rodas Articuladas que giram */}
      {wheelPositions.map((pos, idx) => (
        <group key={idx} position={pos} rotation={[wheelRotation, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.32, 20]} />
            <meshStandardMaterial color="#1a1513" roughness={0.85} />
          </mesh>
          {/* Calota e aro */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[pos[0] > 0 ? 0.165 : -0.165, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.04, 12]} />
            <meshStandardMaterial color={accentColor} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 7. Faróis dianteiros LED */}
      <mesh position={[-0.48, 0.65, 1.36]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.48, 0.65, 1.36]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Feixe direcional dos faróis conectado ao target local */}
      <spotLight
        ref={spotLightRef}
        position={[0, 0.7, 1.35]}
        color="#fff5e6"
        intensity={3}
        angle={0.45}
        penumbra={0.5}
        distance={22}
        castShadow
      />

      {/* 8. Lanternas traseiras vermelhas */}
      <mesh position={[-0.55, 0.68, -1.36]}>
        <boxGeometry args={[0.2, 0.08, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.55, 0.68, -1.36]}>
        <boxGeometry args={[0.2, 0.08, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}
