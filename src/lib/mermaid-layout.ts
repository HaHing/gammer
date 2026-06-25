// ─── Mermaid Flowchart Layout (powered by dagre) ───
// Uses dagre for professional-grade layered graph layout with proper
// edge crossing minimization, cycle handling, and dynamic sizing.

import dagre from '@dagrejs/dagre';
import type { MermaidFlowchart, MermaidNode, MermaidEdge } from './mermaid-parser';

export interface LayoutNode {
  id: string;
  label: string;
  shape: MermaidNode['shape'];
  x: number; // center x
  y: number; // center y
  w: number;
  h: number;
}

export interface LayoutEdge {
  from: string;
  to: string;
  label?: string;
  style: MermaidEdge['style'];
  arrow: boolean;
  points: Array<{ x: number; y: number }>;
}

export interface LayoutSubgraph {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  subgraphs: LayoutSubgraph[];
  direction: MermaidFlowchart['direction'];
}

export interface LayoutBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ─── Constants ───
const NODE_H = 0.75;
const NODE_MIN_W = 1.4;
const NODE_MAX_W = 2.4;
const CHAR_W = 0.13;
const SUBGRAPH_PAD = 0.25;
const READABLE_MIN_SCALE = 0.55;

function computeNodeSize(node: MermaidNode): { w: number; h: number } {
  const textLen = node.label.length;
  const w = Math.min(NODE_MAX_W, Math.max(NODE_MIN_W, textLen * CHAR_W + 0.5));
  const h = node.shape === 'diamond' ? NODE_H + 0.2 : NODE_H;
  return { w, h };
}

// ─── Main Layout Function ───
export function layoutFlowchart(graph: MermaidFlowchart, bounds: LayoutBounds): LayoutResult {
  if (graph.nodes.length === 0) {
    return { nodes: [], edges: [], subgraphs: [], direction: graph.direction };
  }

  const attempts = buildAttemptPlan(graph.direction);
  let best: { layout: LayoutResult; scale: number } | null = null;

  for (const attempt of attempts) {
    const current = runLayoutAttempt(graph, bounds, attempt);
    if (!best || current.scale > best.scale) best = current;
    if (current.scale >= READABLE_MIN_SCALE) return current.layout;
  }

  return best?.layout ?? { nodes: [], edges: [], subgraphs: [], direction: graph.direction };
}

interface LayoutAttempt {
  direction: MermaidFlowchart['direction'];
  nodesep: number;
  edgesep: number;
  ranksep: number;
}

function buildAttemptPlan(direction: MermaidFlowchart['direction']): LayoutAttempt[] {
  const fallbackDir: MermaidFlowchart['direction'] =
    direction === 'LR' || direction === 'RL' ? 'TD'
      : direction === 'BT' ? 'LR'
        : 'LR';

  const plan: LayoutAttempt[] = [
    { direction, nodesep: 40, edgesep: 20, ranksep: 50 },
    { direction, nodesep: 28, edgesep: 14, ranksep: 34 },
    { direction: fallbackDir, nodesep: 24, edgesep: 12, ranksep: 28 },
    { direction: 'TD', nodesep: 18, edgesep: 10, ranksep: 22 },
  ];

  // de-duplicate same attempt signatures
  const seen = new Set<string>();
  return plan.filter((p) => {
    const key = `${p.direction}-${p.nodesep}-${p.edgesep}-${p.ranksep}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapDirectionToRankdir(direction: MermaidFlowchart['direction']): 'TB' | 'LR' | 'BT' | 'RL' {
  if (direction === 'TD') return 'TB';
  return direction;
}

function runLayoutAttempt(
  graph: MermaidFlowchart,
  bounds: LayoutBounds,
  attempt: LayoutAttempt
): { layout: LayoutResult; scale: number } {
  const rankdir = mapDirectionToRankdir(attempt.direction);

  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir,
    nodesep: attempt.nodesep,
    edgesep: attempt.edgesep,
    ranksep: attempt.ranksep,
    marginx: 8,
    marginy: 8,
    acyclicer: 'greedy',
    ranker: 'network-simplex',
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeById = new Map<string, MermaidNode>();
  const SCALE = 72;

  for (const node of graph.nodes) {
    nodeById.set(node.id, node);
    const size = computeNodeSize(node);
    g.setNode(node.id, {
      label: node.label,
      width: size.w * SCALE,
      height: size.h * SCALE,
    });
  }

  for (const sg of graph.subgraphs) {
    g.setNode(sg.id, { label: sg.label, clusterLabelPos: 'top' });
    for (const nid of sg.nodeIds) {
      if (g.hasNode(nid)) g.setParent(nid, sg.id);
    }
  }

  for (let i = 0; i < graph.edges.length; i++) {
    const e = graph.edges[i];
    g.setEdge(e.from, e.to, {
      label: e.label || '',
      width: e.label ? Math.min(e.label.length * 6 + 10, 80) : 0,
      height: e.label ? 18 : 0,
      labelpos: 'c',
      _idx: i, // preserve edge index for mapping back
    });
  }

  dagre.layout(g);

  const graphLabel = g.graph();
  const dagreW = graphLabel.width || 1;
  const dagreH = graphLabel.height || 1;

  const scaleX = bounds.w / (dagreW / SCALE);
  const scaleY = bounds.h / (dagreH / SCALE);
  const scale = Math.min(scaleX, scaleY, 1.0);

  const actualW = (dagreW / SCALE) * scale;
  const actualH = (dagreH / SCALE) * scale;
  const offsetX = bounds.x + (bounds.w - actualW) / 2;
  const offsetY = bounds.y + (bounds.h - actualH) / 2;

  function tx(px: number): number { return offsetX + (px / SCALE) * scale; }
  function ty(py: number): number { return offsetY + (py / SCALE) * scale; }
  function tw(pw: number): number { return (pw / SCALE) * scale; }

  const layoutNodes: LayoutNode[] = [];
  const nodePositions = new Map<string, LayoutNode>();

  for (const nid of g.nodes()) {
    const dagreNode = g.node(nid);
    if (!dagreNode) continue;

    const mNode = nodeById.get(nid);
    if (!mNode) continue; // skip subgraph container nodes

    const ln: LayoutNode = {
      id: nid,
      label: mNode.label,
      shape: mNode.shape,
      x: tx(dagreNode.x),
      y: ty(dagreNode.y),
      w: tw(dagreNode.width),
      h: tw(dagreNode.height),
    };
    layoutNodes.push(ln);
    nodePositions.set(nid, ln);
  }

  const layoutEdges: LayoutEdge[] = [];
  for (const edgeObj of g.edges()) {
    const dagreEdge = g.edge(edgeObj);
    if (!dagreEdge) continue;

    const origIdx = dagreEdge._idx as number;
    const origEdge = graph.edges[origIdx];
    if (!origEdge) continue;

    const points = (dagreEdge.points || []).map((p: { x: number; y: number }) => ({
      x: tx(p.x),
      y: ty(p.y),
    }));

    if (points.length === 0) {
      const fromNode = nodePositions.get(origEdge.from);
      const toNode = nodePositions.get(origEdge.to);
      if (fromNode && toNode) {
        points.push({ x: fromNode.x, y: fromNode.y }, { x: toNode.x, y: toNode.y });
      }
    }

    layoutEdges.push({
      from: origEdge.from,
      to: origEdge.to,
      label: origEdge.label,
      style: origEdge.style,
      arrow: origEdge.arrow,
      points,
    });
  }

  const layoutSubgraphs: LayoutSubgraph[] = [];
  for (const sg of graph.subgraphs) {
    const members = sg.nodeIds
      .map(nid => nodePositions.get(nid))
      .filter((n): n is LayoutNode => !!n);
    if (members.length === 0) continue;

    const minX = Math.min(...members.map(n => n.x - n.w / 2)) - SUBGRAPH_PAD;
    const maxX = Math.max(...members.map(n => n.x + n.w / 2)) + SUBGRAPH_PAD;
    const minY = Math.min(...members.map(n => n.y - n.h / 2)) - SUBGRAPH_PAD - 0.25;
    const maxY = Math.max(...members.map(n => n.y + n.h / 2)) + SUBGRAPH_PAD;

    layoutSubgraphs.push({
      id: sg.id,
      label: sg.label,
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    });
  }

  return {
    layout: { nodes: layoutNodes, edges: layoutEdges, subgraphs: layoutSubgraphs, direction: attempt.direction },
    scale,
  };
}
