/**
 * Simula a latência de rede dos serviços mockados para que estados de
 * carregamento sejam exercitados desde a Fase 1.
 */
export function simulateLatency(minMs = 180, maxMs = 520): Promise<void> {
  const duration = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

