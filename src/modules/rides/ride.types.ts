import type { Driver } from "@/modules/drivers/driver.types";
import type { Location } from "@/modules/locations/location.types";
import type { Vehicle, VehicleCategory } from "@/modules/vehicles/vehicle.types";
import type { ISODateString, Vec2 } from "@/types/common";

export type RideStatus =
  | "requested"
  | "searching_driver"
  | "awaiting_approval"
  | "driver_approved"
  | "approaching_pickup"
  | "boarding"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_driver_available";

/** Caminho simulado que o navegador consegue animar (`route_data`). */
export interface RoutePath {
  points: Vec2[];
  /** Nó da malha correspondente a cada ponto (null quando o ponto está no meio de uma via). */
  nodeIds: Array<string | null>;
  /** Comprimento total em unidades da cena. */
  length: number;
}

export type RideStopStatus = "planned" | "reached";

export interface RideStop {
  id: string;
  locationId: string;
  /** Distância ao longo da rota da viagem em que a parada acontece. */
  atDistance: number;
  dwellMs: number;
  price: number;
  status: RideStopStatus;
  addedAt: ISODateString;
}

export type CandidateAttemptStatus = "presented" | "approved" | "declined" | "expired";

export interface RideCandidateAttempt {
  id: string;
  rideId: string;
  driverId: string;
  vehicleId: string;
  status: CandidateAttemptStatus;
  presentedAt: ISODateString;
  respondedAt: ISODateString | null;
}

export type RideEventType =
  | "ride_requested"
  | "searching_driver"
  | "candidate_presented"
  | "candidate_declined"
  | "no_driver_available"
  | "driver_approved"
  | "approaching_pickup"
  | "driver_arriving"
  | "driver_arrived"
  | "trip_started"
  | "poi_passed"
  | "dust_alert"
  | "stop_added"
  | "stop_reached"
  | "approaching_destination"
  | "ride_completed"
  | "payment_captured"
  | "ride_cancelled";

export interface RideEvent {
  id: string;
  rideId: string;
  type: RideEventType;
  title: string;
  description: string | null;
  createdAt: ISODateString;
}

export interface Ride {
  id: string;
  userId: string;
  originId: string;
  destinationId: string;
  category: VehicleCategory;
  status: RideStatus;
  estimatedPrice: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  finalPrice: number | null;
  driverId: string | null;
  vehicleId: string | null;
  activeAttemptId: string | null;
  approachRoute: RoutePath | null;
  tripRoute: RoutePath;
  stops: RideStop[];
  requestedAt: ISODateString;
  searchStartedAt: ISODateString | null;
  approvedAt: ISODateString | null;
  approachStartsAt: ISODateString | null;
  pickupEta: ISODateString | null;
  startedAt: ISODateString | null;
  completedAt: ISODateString | null;
  cancelledAt: ISODateString | null;
  cancellationReason: string | null;
  paymentTransactionId: string | null;
  /** Semente dos eventos demonstrativos (determinística por viagem). */
  scenarioSeed: number;
}

/** Viagem com as entidades relacionadas resolvidas, pronta para a interface. */
export interface RideDetails {
  ride: Ride;
  origin: Location;
  destination: Location;
  stopLocations: Location[];
  driver: Driver | null;
  vehicle: Vehicle | null;
  activeAttempt: RideCandidateAttempt | null;
  attempts: RideCandidateAttempt[];
  events: RideEvent[];
}

export interface RideSummary {
  id: string;
  status: RideStatus;
  category: VehicleCategory;
  origin: Location;
  destination: Location;
  driver: Driver | null;
  vehicle: Vehicle | null;
  price: number;
  distanceKm: number;
  stopsCount: number;
  requestedAt: ISODateString;
  completedAt: ISODateString | null;
}

export interface RideQuoteOption {
  category: VehicleCategory;
  price: number;
  availableVehicles: number;
}

export interface RideQuote {
  originId: string;
  destinationId: string;
  distanceKm: number;
  durationMin: number;
  route: Vec2[];
  options: RideQuoteOption[];
}

export interface StopPreview {
  locationId: string;
  price: number;
  extraDistanceKm: number;
  extraDurationMin: number;
}

