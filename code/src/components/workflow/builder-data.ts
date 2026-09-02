import {
  ScanBarcode,
  BadgeCheck,
  Move3d,
  Package,
  Scale,
  UserCheck,
  GitFork,
  Printer,
  type LucideIcon,
} from "lucide-react";

export type NodeTypeKey =
  | "SCAN"
  | "VERIFY"
  | "MOVE"
  | "PACK"
  | "WEIGH"
  | "APPROVE"
  | "DECIDE"
  | "PRINT";

export type NodeColor = "data" | "brand" | "warn" | "crit";

export const NODE_COLOR_HEX: Record<NodeColor, string> = {
  data: "#2DD4BF",
  brand: "#FF6B1A",
  warn: "#FFB020",
  crit: "#F4504E",
};

export interface NodeTypeDef {
  key: NodeTypeKey;
  label: string;
  color: NodeColor;
  colorName: string; // human readable
  icon: LucideIcon;
  description: string;
}

export const NODE_TYPES: NodeTypeDef[] = [
  { key: "SCAN", label: "SCAN", color: "data", colorName: "Data", icon: ScanBarcode, description: "Barcode/QR gate; blocks until valid scan" },
  { key: "VERIFY", label: "VERIFY", color: "data", colorName: "Data", icon: BadgeCheck, description: "Qty/weight/batch validation against expected" },
  { key: "MOVE", label: "MOVE", color: "brand", colorName: "Action", icon: Move3d, description: "Visual transfer; posts Stock Entry" },
  { key: "PACK", label: "PACK", color: "brand", colorName: "Action", icon: Package, description: "Cartonization + packing slip" },
  { key: "WEIGH", label: "WEIGH", color: "data", colorName: "Data", icon: Scale, description: "Scale capture, tolerance check" },
  { key: "APPROVE", label: "APPROVE", color: "warn", colorName: "Decision", icon: UserCheck, description: "Role-gated approval step" },
  { key: "DECIDE", label: "DECIDE", color: "warn", colorName: "Decision", icon: GitFork, description: "Conditional branch on any field" },
  { key: "PRINT", label: "PRINT", color: "brand", colorName: "Action", icon: Printer, description: "Labels, slips, QR sheets" },
];

export const NODE_TYPE_MAP: Record<NodeTypeKey, NodeTypeDef> = Object.fromEntries(
  NODE_TYPES.map((t) => [t.key, t])
) as Record<NodeTypeKey, NodeTypeDef>;

/* ------------------------------------------------------------------ */
/* Builder graph model                                                 */
/* ------------------------------------------------------------------ */

export const NODE_W = 128;
export const NODE_H = 52;

export interface BuilderNode {
  id: string;
  type: NodeTypeKey;
  /** Short instance label shown under the type name. */
  caption: string;
  x: number;
  y: number;
}

export interface BuilderEdge {
  id: string;
  from: string;
  to: string;
}

export interface BuilderGraph {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export interface WorkflowTemplate {
  key: string;
  title: string;
  blurb: string;
  meta: string;
  nodes: { type: NodeTypeKey; caption: string; x: number; y: number }[];
  /** Pairs of node indexes. */
  edges: [number, number][];
}

export const TEMPLATES: WorkflowTemplate[] = [
  {
    key: "inbound-receiving",
    title: "Inbound Receiving",
    blurb: "ASN match, scan, QC, allocate, putaway",
    meta: "NODES 5 · AVG CYCLE 4.2 MIN",
    nodes: [
      { type: "VERIFY", caption: "ASN MATCH", x: 30, y: 160 },
      { type: "SCAN", caption: "CARTON GATE", x: 200, y: 160 },
      { type: "DECIDE", caption: "QC?", x: 370, y: 160 },
      { type: "MOVE", caption: "PUTAWAY", x: 540, y: 90 },
      { type: "PRINT", caption: "BIN LABEL", x: 710, y: 90 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    key: "directed-putaway",
    title: "Directed Putaway",
    blurb: "Engine-routed placement with capacity guardrails",
    meta: "NODES 4 · AVG CYCLE 2.8 MIN",
    nodes: [
      { type: "SCAN", caption: "PALLET", x: 40, y: 170 },
      { type: "DECIDE", caption: "ENGINE PICK", x: 220, y: 170 },
      { type: "MOVE", caption: "PLACE", x: 400, y: 170 },
      { type: "VERIFY", caption: "CONFIRM BIN", x: 580, y: 170 },
    ],
    edges: [[0, 1], [1, 2], [2, 3]],
  },
  {
    key: "wave-picking",
    title: "Wave Picking",
    blurb: "Batched pick routes across zones, path-optimized",
    meta: "NODES 6 · AVG CYCLE 6.5 MIN",
    nodes: [
      { type: "DECIDE", caption: "WAVE PLAN", x: 30, y: 170 },
      { type: "SCAN", caption: "ZONE A", x: 200, y: 90 },
      { type: "SCAN", caption: "ZONE B", x: 200, y: 250 },
      { type: "MOVE", caption: "PICK", x: 380, y: 170 },
      { type: "VERIFY", caption: "QTY CHECK", x: 550, y: 170 },
      { type: "PACK", caption: "TO TOTE", x: 720, y: 170 },
    ],
    edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]],
  },
  {
    key: "pack-ship",
    title: "Pack & Ship",
    blurb: "Cartonization, weigh, label, manifest",
    meta: "NODES 4 · AVG CYCLE 3.1 MIN",
    nodes: [
      { type: "PACK", caption: "CARTONIZE", x: 60, y: 170 },
      { type: "WEIGH", caption: "SCALE", x: 240, y: 170 },
      { type: "PRINT", caption: "LABEL", x: 420, y: 170 },
      { type: "APPROVE", caption: "MANIFEST", x: 600, y: 170 },
    ],
    edges: [[0, 1], [1, 2], [2, 3]],
  },
  {
    key: "cycle-count",
    title: "Cycle Count",
    blurb: "Rolling zone counts with variance approval",
    meta: "NODES 5 · AVG CYCLE 1.9 MIN",
    nodes: [
      { type: "SCAN", caption: "BIN", x: 40, y: 170 },
      { type: "VERIFY", caption: "COUNT", x: 210, y: 170 },
      { type: "DECIDE", caption: "VARIANCE?", x: 380, y: 170 },
      { type: "APPROVE", caption: "SUPERVISOR", x: 550, y: 90 },
      { type: "PRINT", caption: "REPORT", x: 550, y: 250 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [2, 4]],
  },
  {
    key: "returns-qc",
    title: "Returns QC",
    blurb: "Inspect, grade, restock or quarantine",
    meta: "NODES 6 · AVG CYCLE 5.4 MIN",
    nodes: [
      { type: "SCAN", caption: "RMA GATE", x: 30, y: 170 },
      { type: "DECIDE", caption: "GRADE", x: 200, y: 170 },
      { type: "MOVE", caption: "RESTOCK", x: 380, y: 90 },
      { type: "MOVE", caption: "QUARANTINE", x: 380, y: 250 },
      { type: "APPROVE", caption: "DISPOSITION", x: 560, y: 250 },
      { type: "PRINT", caption: "CREDIT NOTE", x: 560, y: 90 },
    ],
    edges: [[0, 1], [1, 2], [1, 3], [2, 5], [3, 4]],
  },
];

let counter = 0;
const nextId = () => `n${++counter}`;

/** Instantiate a template into a fresh builder graph (fresh node/edge ids). */
export function instantiateTemplate(t: WorkflowTemplate): BuilderGraph {
  const ids = t.nodes.map(() => nextId());
  return {
    nodes: t.nodes.map((n, i) => ({ id: ids[i], type: n.type, caption: n.caption, x: n.x, y: n.y })),
    edges: t.edges.map(([a, b]) => ({ id: nextId(), from: ids[a], to: ids[b] })),
  };
}

export function makeNode(type: NodeTypeKey, x: number, y: number): BuilderNode {
  return { id: nextId(), type, caption: NODE_TYPE_MAP[type].label, x, y };
}
