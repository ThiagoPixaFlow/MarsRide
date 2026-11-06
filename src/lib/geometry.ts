import type { Vec2 } from "@/types/common";

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

export function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
}

/** Distâncias acumuladas de cada vértice desde o início da polilinha. */
export function cumulativeLengths(points: readonly Vec2[]): number[] {
  const result = [0];
  for (let i = 1; i < points.length; i++) {
    result.push(result[i - 1] + distance(points[i - 1], points[i]));
  }
  return result;
}

export function polylineLength(points: readonly Vec2[]): number {
  const lengths = cumulativeLengths(points);
  return lengths[lengths.length - 1] ?? 0;
}

export interface PolylineSample {
  point: Vec2;
  /** Ângulo de direção (radianos) no plano XZ, compatível com rotation.y. */
  heading: number;
  segmentIndex: number;
}

export function headingBetween(a: Vec2, b: Vec2): number {
  return Math.atan2(b.x - a.x, b.z - a.z);
}

/** Amostra um ponto a uma distância percorrida ao longo da polilinha. */
export function sampleAtDistance(
  points: readonly Vec2[],
  lengths: readonly number[],
  traveled: number,
): PolylineSample {
  if (points.length === 0) return { point: { x: 0, z: 0 }, heading: 0, segmentIndex: 0 };
  if (points.length === 1) return { point: points[0], heading: 0, segmentIndex: 0 };

  const total = lengths[lengths.length - 1];
  const d = Math.min(Math.max(traveled, 0), total);

  let index = 0;
  while (index < lengths.length - 2 && lengths[index + 1] < d) index++;

  const start = points[index];
  const end = points[index + 1];
  const segmentLength = lengths[index + 1] - lengths[index];
  const t = segmentLength > 0 ? (d - lengths[index]) / segmentLength : 0;

  return { point: lerpVec(start, end, t), heading: headingBetween(start, end), segmentIndex: index };
}

export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): { distance: number; t: number } {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const lengthSq = abx * abx + abz * abz;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / lengthSq));
  return { distance: distance(p, { x: a.x + abx * t, z: a.z + abz * t }), t };
}

/**
 * Menor distância entre um ponto e a polilinha, e a distância percorrida ao
 * longo dela até o ponto mais próximo.
 */
export function closestOnPolyline(
  p: Vec2,
  points: readonly Vec2[],
  lengths: readonly number[],
  fromDistance = 0,
): { distance: number; along: number } {
  let best = { distance: Number.POSITIVE_INFINITY, along: 0 };
  for (let i = 0; i < points.length - 1; i++) {
    if (lengths[i + 1] < fromDistance) continue;
    const { distance: d, t } = distanceToSegment(p, points[i], points[i + 1]);
    if (d < best.distance) {
      best = { distance: d, along: lengths[i] + (lengths[i + 1] - lengths[i]) * t };
    }
  }
  return best;
}

