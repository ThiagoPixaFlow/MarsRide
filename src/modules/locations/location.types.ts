import type { Vec2 } from "@/types/common";

export type LocationType =
  | "hub"
  | "commerce"
  | "leisure"
  | "residential"
  | "science"
  | "spaceport"
  | "energy"
  | "industry"
  | "viewpoint";

export interface Location {
  id: string;
  name: string;
  shortName: string;
  type: LocationType;
  district: string;
  description: string;
  /** Posição local na cena (equivalente a `map_x`/`map_z` do modelo de dados). */
  position: Vec2;
  highlights: string[];
  /** Curiosidades usadas pelos motoristas nas conversas. */
  facts: string[];
  openHours: string;
}

export interface LocationTypeMeta {
  label: string;
}

export const LOCATION_TYPE_META: Record<LocationType, LocationTypeMeta> = {
  hub: { label: "Centro da colônia" },
  commerce: { label: "Comércio" },
  leisure: { label: "Lazer" },
  residential: { label: "Residencial" },
  science: { label: "Ciência" },
  spaceport: { label: "Transporte" },
  energy: { label: "Energia" },
  industry: { label: "Indústria" },
  viewpoint: { label: "Mirante" },
};

