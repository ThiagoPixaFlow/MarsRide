"use client";

import React from "react";

export function ColonyStructures() {
  return (
    <group>
      {/* 1. Hub Central: Grande cúpula principal no centro da colônia */}
      <group position={[0, 0, 0]}>
        {/* Base anelar de suporte de regolito */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[14, 15, 0.8, 32]} />
          <meshStandardMaterial color="#3d2c25" roughness={0.8} />
        </mesh>
        {/* Cúpula de vidro pressurizado */}
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#5bb5bf"
            roughness={0.1}
            metalness={0.2}
            transparent
            opacity={0.55}
          />
        </mesh>
        {/* Núcleo interno iluminado */}
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[3.5, 4.5, 4.5, 16]} />
          <meshStandardMaterial color="#f28b44" emissive="#e2602c" emissiveIntensity={0.6} />
        </mesh>
        <pointLight position={[0, 7, 0]} color="#f28b44" intensity={3.5} distance={50} />
      </group>

      {/* 2. Mercado Ferrugem */}
      <group position={[-75, 0, 30]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[16, 2.4, 11]} />
          <meshStandardMaterial color="#4a362e" roughness={0.7} />
        </mesh>
        <mesh position={[0, 2.8, 0]}>
          <cylinderGeometry args={[6, 6, 0.8, 16]} />
          <meshStandardMaterial color="#e2602c" roughness={0.5} />
        </mesh>
        <pointLight position={[0, 4, 0]} color="#f28b44" intensity={2} distance={30} />
      </group>

      {/* 3. Jardins da Cúpula Verde: Cúpulas ecológicas */}
      <group position={[70, 0, -55]}>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#5cdb8e"
            roughness={0.15}
            transparent
            opacity={0.65}
          />
        </mesh>
        <mesh position={[7, 0.4, 4]}>
          <sphereGeometry args={[6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#5cdb8e"
            roughness={0.15}
            transparent
            opacity={0.6}
          />
        </mesh>
        <pointLight position={[0, 4, 0]} color="#5cdb8e" intensity={2.5} distance={35} />
      </group>

      {/* 4. Distrito Residencial Olympus: Habitats modulares */}
      <group position={[-65, 0, -90]}>
        {[-4, 0, 4].map((dx, i) => (
          <group key={i} position={[dx * 2, 0, (i - 1) * 5]}>
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[4, 4.5, 2.0, 16]} />
              <meshStandardMaterial color="#e9e1d4" roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.1, 0]}>
              <sphereGeometry args={[4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#2d2522" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* Túnel de ligação */}
        <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.2, 1.2, 18, 12]} />
          <meshStandardMaterial color="#8c7d75" roughness={0.6} />
        </mesh>
      </group>

      {/* 5. Instituto de Pesquisa Sagan: Antena e observatório */}
      <group position={[115, 0, 45]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[7, 8, 2.4, 24]} />
          <meshStandardMaterial color="#ded8cf" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Torre e Antena Parabólica */}
        <mesh position={[0, 4.5, 0]}>
          <cylinderGeometry args={[0.6, 0.8, 4.5, 8]} />
          <meshStandardMaterial color="#8c7d75" metalness={0.6} />
        </mesh>
        <mesh position={[0, 7.0, 0]} rotation={[0.4, 0.3, 0]}>
          <cylinderGeometry args={[4.5, 0.8, 1.4, 20]} />
          <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} />
        </mesh>
        <pointLight position={[0, 7.5, 0]} color="#38bdf8" intensity={2} distance={30} />
      </group>

      {/* 6. Espaçoporto Bradbury */}
      <group position={[-170, 0, 105]}>
        {/* Plataforma de pouso circular */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[18, 19, 0.3, 32]} />
          <meshStandardMaterial color="#2a201c" roughness={0.85} />
        </mesh>
        {/* Faixa de pouso hexagonal */}
        <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[11, 13, 6]} />
          <meshBasicMaterial color="#f28b44" />
        </mesh>
        {/* Hangar lateral */}
        <mesh position={[-14, 2.2, 0]}>
          <boxGeometry args={[8, 4.4, 16]} />
          <meshStandardMaterial color="#40332d" metalness={0.3} />
        </mesh>
        <pointLight position={[0, 4, 0]} color="#f28b44" intensity={3} distance={40} />
      </group>

      {/* 7. Fazenda Solar Helios: Matriz fotovoltaica */}
      <group position={[170, 0, -110]}>
        {[-8, 0, 8].map((dx, i) =>
          [-8, 0, 8].map((dz, j) => (
            <mesh
              key={`${i}-${j}`}
              position={[dx * 1.5, 1.2, dz * 1.5]}
              rotation={[-0.35, 0.2, 0]}
            >
              <boxGeometry args={[4.5, 0.1, 3.2]} />
              <meshStandardMaterial
                color="#1e293b"
                roughness={0.1}
                metalness={0.9}
                emissive="#0284c7"
                emissiveIntensity={0.25}
              />
            </mesh>
          ))
        )}
        <pointLight position={[0, 3, 0]} color="#0284c7" intensity={2} distance={35} />
      </group>

      {/* 8. Mina de Gelo Korolev: Complexo industrial */}
      <group position={[-180, 0, -160]}>
        {/* Torre de extração */}
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[2.5, 4.5, 12, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Tanques esféricos criogênicos de água/combustível */}
        <mesh position={[-8, 3.5, 3]}>
          <sphereGeometry args={[3.5, 16, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[8, 3, -4]}>
          <sphereGeometry args={[3, 16, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        <pointLight position={[0, 9, 0]} color="#38bdf8" intensity={2.5} distance={35} />
      </group>

      {/* 9. Mirante da Cratera Jezero */}
      <group position={[195, 0, 140]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[9, 10, 3, 24]} />
          <meshStandardMaterial color="#4a3028" roughness={0.9} />
        </mesh>
        {/* Passarela mirante suspensa */}
        <mesh position={[0, 3.1, 4]}>
          <boxGeometry args={[6, 0.3, 9]} />
          <meshStandardMaterial color="#8c7d75" metalness={0.4} />
        </mesh>
        <pointLight position={[0, 4, 0]} color="#e2602c" intensity={2} distance={30} />
      </group>

      {/* 10. Portal do Cânion Marineris */}
      <group position={[20, 0, -200]}>
        {/* Pilares gigantes do portal da fenda */}
        <mesh position={[-9, 7.5, 0]}>
          <boxGeometry args={[3.5, 15, 3.5]} />
          <meshStandardMaterial color="#2d1f1a" roughness={0.9} />
        </mesh>
        <mesh position={[9, 7.5, 0]}>
          <boxGeometry args={[3.5, 15, 3.5]} />
          <meshStandardMaterial color="#2d1f1a" roughness={0.9} />
        </mesh>
        {/* Viga transversal superior */}
        <mesh position={[0, 14.5, 0]}>
          <boxGeometry args={[21, 2.5, 3]} />
          <meshStandardMaterial color="#e2602c" roughness={0.6} />
        </mesh>
        <pointLight position={[0, 12, 0]} color="#f28b44" intensity={3} distance={40} />
      </group>
    </group>
  );
}
