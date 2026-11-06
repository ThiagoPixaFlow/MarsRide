import type { Vec2 } from "@/types/common";

export interface RoadNode {
  id: string;
  position: Vec2;
  /** Quando o nó representa um ponto de interesse. */
  locationId: string | null;
}

export type RoadEdge = readonly [string, string];

/**
 * Malha viária expandida da colônia Nova Acidália.
 * Contém vias radiais, anéis internos e rodovias perimetrais interligando os distritos.
 */
export const ROAD_NODES_SEED: RoadNode[] = [
  // 10 Locais Principais
  { id: "loc-hub-central", position: { x: 0, z: 0 }, locationId: "loc-hub-central" },
  { id: "loc-market", position: { x: -75, z: 30 }, locationId: "loc-market" },
  { id: "loc-gardens", position: { x: 70, z: -55 }, locationId: "loc-gardens" },
  { id: "loc-residential", position: { x: -65, z: -90 }, locationId: "loc-residential" },
  { id: "loc-research", position: { x: 115, z: 45 }, locationId: "loc-research" },
  { id: "loc-spaceport", position: { x: -170, z: 105 }, locationId: "loc-spaceport" },
  { id: "loc-solar-farm", position: { x: 170, z: -110 }, locationId: "loc-solar-farm" },
  { id: "loc-ice-mine", position: { x: -180, z: -160 }, locationId: "loc-ice-mine" },
  { id: "loc-crater-overlook", position: { x: 195, z: 140 }, locationId: "loc-crater-overlook" },
  { id: "loc-canyon-gate", position: { x: 20, z: -200 }, locationId: "loc-canyon-gate" },

  // Anel Interno (Avenida Central Phobos)
  { id: "jn-west-inner", position: { x: -40, z: 15 }, locationId: null },
  { id: "jn-north-inner", position: { x: 5, z: -45 }, locationId: null },
  { id: "jn-east-inner", position: { x: 55, z: -10 }, locationId: null },
  { id: "jn-south-inner", position: { x: 0, z: 50 }, locationId: null },
  { id: "jn-northwest-inner", position: { x: -35, z: -45 }, locationId: null },
  { id: "jn-southeast-inner", position: { x: 60, z: 40 }, locationId: null },

  // Junções Intermediárias e Rodovias Distritais
  { id: "jn-west-mid", position: { x: -115, z: 65 }, locationId: null },
  { id: "jn-spaceport-gate", position: { x: -145, z: 95 }, locationId: null },
  { id: "jn-north-mid", position: { x: 10, z: -115 }, locationId: null },
  { id: "jn-canyon-approach", position: { x: 18, z: -165 }, locationId: null },
  { id: "jn-northwest-mid", position: { x: -115, z: -115 }, locationId: null },
  { id: "jn-northwest-outer", position: { x: -165, z: -95 }, locationId: null },
  { id: "jn-east-mid", position: { x: 135, z: -30 }, locationId: null },
  { id: "jn-east-outer", position: { x: 175, z: -55 }, locationId: null },
  { id: "jn-south-mid", position: { x: -65, z: 95 }, locationId: null },
  { id: "jn-southeast-mid", position: { x: 155, z: 95 }, locationId: null },
  { id: "jn-southeast-outer", position: { x: 195, z: 60 }, locationId: null },
  { id: "jn-west-outer", position: { x: -170, z: 40 }, locationId: null },
];

export const ROAD_EDGES_SEED: RoadEdge[] = [
  // 1. Conexões Radiais do Hub Central
  ["loc-hub-central", "jn-west-inner"],
  ["loc-hub-central", "jn-north-inner"],
  ["loc-hub-central", "jn-east-inner"],
  ["loc-hub-central", "jn-south-inner"],

  // 2. Anel Viário Interno
  ["jn-west-inner", "jn-northwest-inner"],
  ["jn-northwest-inner", "jn-north-inner"],
  ["jn-north-inner", "jn-east-inner"],
  ["jn-east-inner", "jn-southeast-inner"],
  ["jn-southeast-inner", "jn-south-inner"],
  ["jn-south-inner", "jn-west-inner"],

  // 3. Setor Oeste (Mercado e Espaçoporto)
  ["jn-west-inner", "loc-market"],
  ["loc-market", "jn-west-mid"],
  ["jn-west-mid", "jn-spaceport-gate"],
  ["jn-spaceport-gate", "loc-spaceport"],
  ["jn-south-inner", "jn-south-mid"],
  ["jn-south-mid", "jn-spaceport-gate"],
  ["jn-west-mid", "jn-west-outer"],
  ["jn-west-outer", "jn-northwest-outer"],

  // 4. Setor Noroeste (Residencial e Mina de Gelo)
  ["jn-northwest-inner", "loc-residential"],
  ["loc-market", "loc-residential"],
  ["loc-residential", "jn-northwest-mid"],
  ["jn-northwest-mid", "jn-northwest-outer"],
  ["jn-northwest-outer", "loc-ice-mine"],

  // 5. Setor Norte (Jardins e Cânion Marineris)
  ["jn-north-inner", "loc-gardens"],
  ["loc-gardens", "jn-north-mid"],
  ["jn-north-mid", "jn-canyon-approach"],
  ["jn-canyon-approach", "loc-canyon-gate"],
  ["jn-north-mid", "jn-northwest-mid"],

  // 6. Setor Leste (Instituto Sagan e Fazenda Solar)
  ["jn-east-inner", "loc-research"],
  ["loc-research", "jn-east-mid"],
  ["jn-east-mid", "jn-east-outer"],
  ["jn-east-outer", "loc-solar-farm"],
  ["loc-gardens", "jn-east-mid"],
  ["jn-north-mid", "loc-solar-farm"],

  // 7. Setor Sudeste (Mirante Jezero e Bypasses)
  ["loc-research", "jn-southeast-mid"],
  ["jn-southeast-mid", "loc-crater-overlook"],
  ["loc-crater-overlook", "jn-southeast-outer"],
  ["jn-southeast-mid", "jn-southeast-outer"],
  ["jn-southeast-outer", "loc-solar-farm"],
  ["jn-south-mid", "jn-southeast-inner"],
];
