/**
 * Configuração central do RedRide.
 *
 * Valores de negócio (preço, créditos, simulação) ficam aqui — e não espalhados
 * pelos componentes. Na Fase 2, estes valores migram para o backend/seed.
 */

export const APP_CONFIG = {
  name: "RedRide",
  tagline: "Mobilidade autônoma em Marte",
  colonyName: "Nova Acidália",
  regionName: "Planície Acidália · Setor 7",
} as const;

export const WALLET_CONFIG = {
  currency: "MCR",
  currencyName: "Créditos Marcianos",
  initialBalance: 1000,
  topUpAmount: 500,
  maxBalance: 10000,
} as const;

export const PRICING_CONFIG = {
  /** Tarifa fixa de partida. */
  baseFare: 12,
  /** Valor por quilômetro simulado. */
  perKm: 4.2,
  /** Tarifa mínima de uma viagem. */
  minimumFare: 18,
  /** Tarifa fixa por parada adicional. */
  stopFee: 8,
} as const;

export const SIMULATION_CONFIG = {
  /** Cada unidade da cena 3D representa 100 metros. */
  metersPerUnit: 100,
  /** 1 segundo real equivale a `timeScale` segundos simulados. */
  timeScale: 18,
  /** Velocidade média do rover com passageiro (km/h simulados). */
  tripSpeedKmh: 42,
  /** Velocidade do rover vazio a caminho do embarque (km/h simulados). */
  approachSpeedKmh: 60,
  /** Velocidade visual dos rovers em patrulha (unidades por segundo real). */
  patrolSpeedUnitsPerSecond: 1.7,
  /** Intervalo da busca por motorista (ms reais). */
  searchDurationMs: { min: 1800, max: 3200 },
  /** Tempo entre a aprovação e a partida do rover (ms reais). */
  approvalHoldMs: 1800,
  /** Partida automática após o rover chegar ao embarque (ms reais). */
  boardingAutoStartMs: 15000,
  /** Tempo parado em cada parada adicional (ms reais). */
  stopDwellMs: 6000,
  /** Ciclo de ocupação simulada dos rovers que patrulham a colônia (ms reais). */
  occupancyCycleMs: 140000,
  occupancyBusyMs: 38000,
  /** Número máximo de paradas adicionais por viagem. */
  maxStopsPerRide: 2,
} as const;

export const POLLING_CONFIG = {
  rideIntervalMs: 1000,
  chatIntervalMs: 1500,
} as const;

