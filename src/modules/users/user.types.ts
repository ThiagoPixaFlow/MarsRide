import type { VehicleCategory } from "@/modules/vehicles/vehicle.types";
import type { ISODateString } from "@/types/common";

export type ConversationLevel = "chatty" | "balanced" | "quiet";
export type MusicPreference = "ambient" | "synthwave" | "classical" | "silence";

export interface TravelPreferences {
  preferredCategory: VehicleCategory;
  conversationLevel: ConversationLevel;
  cabinTemperature: number;
  music: MusicPreference;
  accessibleBoarding: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarColor: string;
  occupation: string;
  homeLocationId: string;
  preferences: TravelPreferences;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserStats {
  completedRides: number;
  totalSpent: number;
  totalDistanceKm: number;
}

export const CONVERSATION_LEVEL_LABEL: Record<ConversationLevel, string> = {
  chatty: "Adoro conversar",
  balanced: "Equilibrado",
  quiet: "Prefiro silêncio",
};

export const MUSIC_LABEL: Record<MusicPreference, string> = {
  ambient: "Ambiente espacial",
  synthwave: "Synthwave",
  classical: "Clássica",
  silence: "Sem música",
};

export const AVATAR_COLORS = ["#e2602c", "#c9873f", "#3fb8ab", "#5b8def", "#a98bd6", "#d4577a", "#79c28a"] as const;

export const DEFAULT_PREFERENCES: TravelPreferences = {
  preferredCategory: "go",
  conversationLevel: "balanced",
  cabinTemperature: 21,
  music: "ambient",
  accessibleBoarding: false,
};

