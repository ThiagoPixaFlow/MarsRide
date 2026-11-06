export type DriverAvatarGlyph = "visor" | "halo" | "bolt" | "crown" | "leaf" | "orbit";

export interface DriverAvatar {
  primary: string;
  secondary: string;
  glyph: DriverAvatarGlyph;
}

/**
 * Descrição da personalidade. Na Fase 3, estes dados alimentam as instruções
 * do modelo de IA (montadas no servidor).
 */
export interface DriverPersona {
  tone: string;
  interests: string[];
  conversationStyle: string;
  catchphrase: string;
}

export interface Driver {
  id: string;
  name: string;
  title: string;
  personalitySummary: string;
  traits: string[];
  bio: string;
  specialty: string;
  rating: number;
  completedTrips: number;
  solsOnMars: number;
  languages: string[];
  avatar: DriverAvatar;
  avatarUrl?: string;
  persona: DriverPersona;
  isActive: boolean;
}

