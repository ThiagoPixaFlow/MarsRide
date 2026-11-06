import { ROAD_NODES_SEED, ROAD_EDGES_SEED, RoadNode } from "@/mocks/data/road-network";
import { distance, distanceToSegment, lerpVec } from "@/lib/geometry";
import { Vec2 } from "@/types/common";

/**
 * Grafo da malha viária de Nova Acidália.
 */
class RoadGraph {
  private nodesMap: Map<string, RoadNode> = new Map();
  private adjacency: Map<string, Array<{ targetId: string; distance: number }>> = new Map();

  constructor() {
    for (const node of ROAD_NODES_SEED) {
      this.nodesMap.set(node.id, node);
      this.adjacency.set(node.id, []);
    }

    for (const [fromId, toId] of ROAD_EDGES_SEED) {
      const fromNode = this.nodesMap.get(fromId);
      const toNode = this.nodesMap.get(toId);
      if (fromNode && toNode) {
        const dist = distance(fromNode.position, toNode.position);
        this.adjacency.get(fromId)?.push({ targetId: toId, distance: dist });
        this.adjacency.get(toId)?.push({ targetId: fromId, distance: dist });
      }
    }
  }

  getNode(id: string): RoadNode | undefined {
    return this.nodesMap.get(id);
  }

  getAllNodes(): RoadNode[] {
    return Array.from(this.nodesMap.values());
  }

  findClosestNode(point: Vec2): RoadNode {
    let closest: RoadNode = ROAD_NODES_SEED[0];
    let minD = Number.POSITIVE_INFINITY;

    for (const node of this.nodesMap.values()) {
      const d = distance(point, node.position);
      if (d < minD) {
        minD = d;
        closest = node;
      }
    }
    return closest;
  }

  /**
   * Encontra a rota mais eficiente partindo de uma posição arbitrária (x, z)
   * na malha viária até um nó de destino, garantindo que o rover continue
   * estritamente pela pista atual até o entroncamento mais vantajoso, sem nunca cortar terra.
   */
  findPathFromPosition(
    startPos: Vec2,
    endNodeId: string
  ): { points: Vec2[]; nodeIds: string[]; length: number } {
    // 1. Encontra a estrada real (aresta em ROAD_EDGES_SEED) em que o rover está trafegando
    let bestEdge: { fromId: string; toId: string; from: RoadNode; to: RoadNode } | null = null;
    let minDistanceToRoad = Number.POSITIVE_INFINITY;
    let bestT = 0;

    for (const [fromId, toId] of ROAD_EDGES_SEED) {
      const from = this.nodesMap.get(fromId);
      const to = this.nodesMap.get(toId);
      if (!from || !to) continue;

      const res = distanceToSegment(startPos, from.position, to.position);
      if (res.distance < minDistanceToRoad) {
        minDistanceToRoad = res.distance;
        bestEdge = { fromId, toId, from, to };
        bestT = res.t;
      }
    }

    if (!bestEdge) {
      const closest = this.findClosestNode(startPos);
      return this.findShortestPath(closest.id, endNodeId);
    }

    // O rover está fisicamente na estrada entre bestEdge.from e bestEdge.to.
    // Projeta a posição inicial exatamente sobre o eixo central da estrada
    const onRoadStartPos: Vec2 = lerpVec(bestEdge.from.position, bestEdge.to.position, bestT);

    // Avalia as duas opções válidas pela pista:
    // Opção 1: Seguir pela estrada atual em direção a bestEdge.from
    const pathViaFrom = this.findShortestPath(bestEdge.fromId, endNodeId);
    const distViaFrom = distance(onRoadStartPos, bestEdge.from.position) + pathViaFrom.length;

    // Opção 2: Seguir pela estrada atual em direção a bestEdge.to
    const pathViaTo = this.findShortestPath(bestEdge.toId, endNodeId);
    const distViaTo = distance(onRoadStartPos, bestEdge.to.position) + pathViaTo.length;

    const chosenPath = distViaFrom <= distViaTo ? pathViaFrom : pathViaTo;
    const chosenTargetNode = distViaFrom <= distViaTo ? bestEdge.from : bestEdge.to;

    // Constrói os pontos: começa exatamente no rover na estrada,
    // segue pela estrada até o nó da esquina escolhido, e depois segue a rota do grafo
    const points: Vec2[] = [onRoadStartPos];

    // Se o rover não está colado no nó da esquina, adiciona o nó da esquina
    if (distance(onRoadStartPos, chosenTargetNode.position) > 0.8) {
      points.push(chosenTargetNode.position);
    }

    // Adiciona os nós subsequentes do caminho (ignorando o primeiro se for o mesmo chosenTargetNode)
    for (let k = 1; k < chosenPath.points.length; k++) {
      points.push(chosenPath.points[k]);
    }

    return {
      points,
      nodeIds: chosenPath.nodeIds,
      length: Math.min(distViaFrom, distViaTo),
    };
  }

  /**
   * Encontra a rota mais curta entre dois nós usando Dijkstra.
   */
  findShortestPath(startNodeId: string, endNodeId: string): { points: Vec2[]; nodeIds: string[]; length: number } {
    if (startNodeId === endNodeId) {
      const node = this.nodesMap.get(startNodeId);
      return {
        points: node ? [node.position] : [],
        nodeIds: [startNodeId],
        length: 0,
      };
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const node of this.nodesMap.values()) {
      distances.set(node.id, Number.POSITIVE_INFINITY);
      previous.set(node.id, null);
      unvisited.add(node.id);
    }

    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Pega nó não visitado com menor distância
      let currentId: string | null = null;
      let minDistance = Number.POSITIVE_INFINITY;

      for (const id of unvisited) {
        const d = distances.get(id) ?? Number.POSITIVE_INFINITY;
        if (d < minDistance) {
          minDistance = d;
          currentId = id;
        }
      }

      if (!currentId || minDistance === Number.POSITIVE_INFINITY) {
        break; // Inatingível
      }

      if (currentId === endNodeId) {
        break; // Chegou ao destino
      }

      unvisited.delete(currentId);

      const neighbors = this.adjacency.get(currentId) ?? [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.targetId)) continue;

        const alt = minDistance + neighbor.distance;
        if (alt < (distances.get(neighbor.targetId) ?? Number.POSITIVE_INFINITY)) {
          distances.set(neighbor.targetId, alt);
          previous.set(neighbor.targetId, currentId);
        }
      }
    }

    // Reconstrói caminho
    const pathNodeIds: string[] = [];
    let curr: string | null = endNodeId;
    while (curr) {
      pathNodeIds.unshift(curr);
      curr = previous.get(curr) ?? null;
      if (curr === startNodeId) {
        pathNodeIds.unshift(curr);
        break;
      }
    }

    // Se o primeiro não for startNodeId, não há caminho conectado
    if (pathNodeIds[0] !== startNodeId) {
      const start = this.nodesMap.get(startNodeId);
      const end = this.nodesMap.get(endNodeId);
      return {
        points: [start?.position ?? { x: 0, z: 0 }, end?.position ?? { x: 0, z: 0 }],
        nodeIds: [startNodeId, endNodeId],
        length: distance(start?.position ?? { x: 0, z: 0 }, end?.position ?? { x: 0, z: 0 }),
      };
    }

    const points: Vec2[] = [];
    for (const id of pathNodeIds) {
      const node = this.nodesMap.get(id);
      if (node) points.push(node.position);
    }

    const totalLength = distances.get(endNodeId) ?? 0;
    return { points, nodeIds: pathNodeIds, length: totalLength };
  }
}

export const roadGraph = new RoadGraph();
