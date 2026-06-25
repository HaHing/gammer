// ─── Mermaid Flowchart Parser ───
// Server-safe (no DOM dependency) regex-based parser for Mermaid flowchart syntax.
// Parses: graph direction, node definitions, edges, subgraphs.

export interface MermaidNode {
  id: string;
  label: string;
  shape: 'rect' | 'rounded' | 'diamond' | 'circle' | 'stadium' | 'hexagon' | 'cylinder';
}

export interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
  style: 'solid' | 'dotted' | 'thick';
  arrow: boolean;
}

export interface MermaidSubgraph {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface MermaidFlowchart {
  direction: 'TD' | 'LR' | 'BT' | 'RL';
  nodes: MermaidNode[];
  edges: MermaidEdge[];
  subgraphs: MermaidSubgraph[];
}

// ─── Node shape patterns ───
// Order matters: longer delimiters must come first to avoid partial matching
const SHAPE_PATTERNS: Array<{ open: string; close: string; shape: MermaidNode['shape'] }> = [
  { open: '((', close: '))', shape: 'circle' },
  { open: '([', close: '])', shape: 'stadium' },
  { open: '[(', close: ')]', shape: 'cylinder' },
  { open: '{{', close: '}}', shape: 'hexagon' },
  { open: '{', close: '}', shape: 'diamond' },
  { open: '(', close: ')', shape: 'rounded' },
  { open: '[', close: ']', shape: 'rect' },
];

// ─── Edge patterns ───
// Matches: -->, ---,  -.->  ==>, -->|label|, -- text -->
const EDGE_RE = /^(\S+?)\s+(={3,}|={2}>|--+>|-\.+-\.?->?|-\.+>|--+|--\s+.+?\s+-->?)\s*(?:\|([^|]*)\|)?\s*(\S+)$/;

function parseNodeDef(raw: string): { id: string; label: string; shape: MermaidNode['shape'] } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  for (const { open, close, shape } of SHAPE_PATTERNS) {
    const openIdx = trimmed.indexOf(open);
    if (openIdx <= 0) continue;
    const closeIdx = trimmed.lastIndexOf(close);
    if (closeIdx <= openIdx) continue;

    const id = trimmed.slice(0, openIdx).trim();
    // Validate id: alphanumeric + underscores + hyphens
    if (!/^[\w-]+$/.test(id)) continue;
    const label = trimmed.slice(openIdx + open.length, closeIdx).trim();
    if (!label) continue;

    // Strip surrounding quotes if present
    const cleanLabel = label.replace(/^["']|["']$/g, '');
    return { id, label: cleanLabel, shape };
  }

  // Bare ID (no shape brackets) → implicit rect
  if (/^[\w-]+$/.test(trimmed)) {
    return { id: trimmed, label: trimmed, shape: 'rect' };
  }

  return null;
}

function parseEdgeStyle(arrow: string): { style: MermaidEdge['style']; arrow: boolean; label?: string } {
  const trimmedArrow = arrow.trim();

  // Thick: ==> or ===
  if (/^={2,}/.test(trimmedArrow)) {
    return { style: 'thick', arrow: trimmedArrow.endsWith('>') };
  }

  // Dotted: -.-> or -.- or -.->
  if (/^-\./.test(trimmedArrow)) {
    return { style: 'dotted', arrow: trimmedArrow.endsWith('>') };
  }

  // Text label in middle: -- text -->
  if (/^--\s+.+\s+-->?$/.test(trimmedArrow)) {
    const m = trimmedArrow.match(/^--\s+(.+?)\s+-->?$/);
    return { style: 'solid', arrow: trimmedArrow.endsWith('>'), label: m?.[1] };
  }

  // Solid: --> or ---
  return { style: 'solid', arrow: trimmedArrow.endsWith('>') };
}

export function parseMermaidFlowchart(code: string): MermaidFlowchart {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

  let direction: MermaidFlowchart['direction'] = 'TD';
  const nodeMap = new Map<string, MermaidNode>();
  const edges: MermaidEdge[] = [];
  const subgraphs: MermaidSubgraph[] = [];
  const subgraphStack: MermaidSubgraph[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse graph/flowchart direction
    const dirMatch = line.match(/^(?:graph|flowchart)\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (dirMatch) {
      const d = dirMatch[1].toUpperCase();
      direction = d === 'TB' ? 'TD' : d as MermaidFlowchart['direction'];
      continue;
    }

    // Skip graph/flowchart without direction
    if (/^(?:graph|flowchart)\s*$/i.test(line)) continue;

    // Skip classDef, style, click directives
    if (/^(?:classDef|style|click|class)\s/i.test(line)) continue;

    // Subgraph start
    const sgMatch = line.match(/^subgraph\s+(\S+)(?:\s*\[(.+?)\])?\s*$/);
    if (sgMatch) {
      const sg: MermaidSubgraph = {
        id: sgMatch[1],
        label: sgMatch[2] || sgMatch[1],
        nodeIds: [],
      };
      subgraphStack.push(sg);
      subgraphs.push(sg);
      continue;
    }

    // Subgraph end
    if (/^end\s*$/i.test(line)) {
      subgraphStack.pop();
      continue;
    }

    // Try parsing as edge(s) — support chained: A --> B --> C
    if (tryParseEdges(line, nodeMap, edges, subgraphStack)) continue;

    // Try parsing as standalone node definition
    const nodeDef = parseNodeDef(line);
    if (nodeDef) {
      ensureNode(nodeMap, nodeDef.id, nodeDef.label, nodeDef.shape);
      if (subgraphStack.length > 0) {
        subgraphStack[subgraphStack.length - 1].nodeIds.push(nodeDef.id);
      }
      continue;
    }
  }

  return {
    direction,
    nodes: Array.from(nodeMap.values()),
    edges,
    subgraphs,
  };
}

function ensureNode(
  nodeMap: Map<string, MermaidNode>,
  id: string,
  label?: string,
  shape?: MermaidNode['shape']
): void {
  const existing = nodeMap.get(id);
  if (!existing) {
    nodeMap.set(id, { id, label: label || id, shape: shape || 'rect' });
  } else if (label && label !== id && existing.label === id) {
    // Update label if the existing node was implicitly created (label === id)
    existing.label = label;
    if (shape) existing.shape = shape;
  }
}

function tryParseEdges(
  line: string,
  nodeMap: Map<string, MermaidNode>,
  edges: MermaidEdge[],
  subgraphStack: MermaidSubgraph[]
): boolean {
  // Tokenize: split on edge operators while preserving node definitions
  const edgeOperators = findEdgeOperators(line);
  if (edgeOperators.length === 0) return false;

  const segments = splitByEdges(line, edgeOperators);
  if (segments.length < 2) return false;

  // Parse each segment as node(s) — handle multi-target "B & C & D"
  const parsedSegments: Array<Array<{ id: string; label: string; shape: MermaidNode['shape'] }>> = [];
  for (const seg of segments) {
    // Check for multi-target: "B & C & D"
    const parts = seg.split(/\s*&\s*/).map(p => p.trim()).filter(Boolean);
    const parsedGroup: Array<{ id: string; label: string; shape: MermaidNode['shape'] }> = [];
    for (const part of parts) {
      const nd = parseNodeDef(part);
      if (!nd) return false;
      parsedGroup.push(nd);
    }
    if (parsedGroup.length === 0) return false;
    parsedSegments.push(parsedGroup);
  }

  // Register all nodes and create edges
  // For multi-target: A --> B & C creates edges A→B and A→C
  for (let j = 0; j < parsedSegments.length; j++) {
    for (const nd of parsedSegments[j]) {
      ensureNode(nodeMap, nd.id, nd.label, nd.shape);
      if (subgraphStack.length > 0) {
        const currentSg = subgraphStack[subgraphStack.length - 1];
        if (!currentSg.nodeIds.includes(nd.id)) {
          currentSg.nodeIds.push(nd.id);
        }
      }
    }

    if (j > 0) {
      const op = edgeOperators[j - 1];
      const edgeInfo = parseEdgeStyle(op.operator);
      // Connect each node in previous segment to each node in current segment
      for (const fromNd of parsedSegments[j - 1]) {
        for (const toNd of parsedSegments[j]) {
          edges.push({
            from: fromNd.id,
            to: toNd.id,
            label: op.label || edgeInfo.label,
            style: edgeInfo.style,
            arrow: edgeInfo.arrow,
          });
        }
      }
    }
  }

  return true;
}

interface EdgeOperator {
  operator: string;
  label?: string;
  start: number;
  end: number;
}

function findEdgeOperators(line: string): EdgeOperator[] {
  const results: EdgeOperator[] = [];
  // Match edge patterns: supports both spaced (A --> B) and compact (A-->B) syntax
  // Also supports |label| after operator
  const re = /\s*(={2,}>|--+>|-\.+-\.?->?|-\.+>|--+|={3,}|-\.+-)(?:\|([^|]*)\|)?\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    // Avoid matching at the very start (would mean no source node)
    if (m.index === 0) continue;
    results.push({
      operator: m[1],
      label: m[2] || undefined,
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return results;
}

function splitByEdges(line: string, operators: EdgeOperator[]): string[] {
  const segments: string[] = [];
  let pos = 0;
  for (const op of operators) {
    segments.push(line.slice(pos, op.start).trim());
    pos = op.end;
  }
  segments.push(line.slice(pos).trim());
  return segments.filter(Boolean);
}
