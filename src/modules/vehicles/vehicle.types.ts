export type VehicleCategory = "go" | "prime";

export type VehicleFleetStatus = "active" | "maintenance";

/** Estado operacional derivado em tempo real pela simulação. */
export type VehicleOperationalStatus = "available" | "on_trip" | "assigned" | "maintenance";

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  model: string;
  category: VehicleCategory;
  capacity: number;
  paintColor: string;
  accentColor: string;
  driverId: string | null;
  fleetStatus: VehicleFleetStatus;
  /** Sequência de nós da malha viária percorrida em loop durante a patrulha. */
  patrolLoop: string[] | null;
  /** Fração (0–1) do loop onde o rover se encontra no instante zero. */
  patrolOffset: number;
  /** Nó onde o rover fica estacionado quando não patrulha. */
  parkedNodeId: string | null;
  batteryLevel: number;
  features: string[];
}

export interface VehicleCategoryMeta {
  label: string;
  description: string;
  priceMultiplier: number;
}

export const VEHICLE_CATEGORY_META: Record<VehicleCategory, VehicleCategoryMeta> = {
  go: {
    label: "RedRide Go",
    description: "Rover compacto, ágil e eficiente",
    priceMultiplier: 1,
  },
  prime: {
    label: "RedRide Prime",
    description: "Cabine panorâmica e mais conforto",
    priceMultiplier: 1.45,
  },
};

export const VEHICLE_STATUS_LABEL: Record<VehicleOperationalStatus, string> = {
  available: "Disponível",
  on_trip: "Em corrida",
  assigned: "Sua viagem",
  maintenance: "Em manutenção",
};

