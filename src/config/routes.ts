export const ROUTES = {
  login: "/login",
  register: "/register",
  app: "/app",
  history: "/app/history",
  profile: "/app/profile",
  ride: (rideId: string) => `/app/ride/${rideId}`,
} as const;

/** Cookie apenas de roteamento otimista (não é um mecanismo de segurança). */
export const SESSION_HINT_COOKIE = "redride_session_hint";

