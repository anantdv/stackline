import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";
import {
  NODE_TYPES,
  NODE_TYPE_MAP,
  NODE_COLOR_HEX,
  NODE_W,
  NODE_H,
  makeNode,
  type BuilderGraph,
  type BuilderNode,
  type NodeTypeKey,
} from "@/components/workflow/builder-data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const dx = Math.max(48, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function WorkflowBuilder({
  graph,
  onChange,
}: {
  graph: BuilderGraph;
  onChange: (g: BuilderGraph) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const canvasPoint = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const addNode = (type: NodeTypeKey) => {
    const n = graph.nodes.length;
    const x = 24 + ((n * 150) % 620);
    const y = 28 + ((n * 74) % 300);
    onChange({ ...graph, nodes: [...graph.nodes, makeNode(type, x, y)] });
  };

  const moveNode = (id: string, x: number, y: number) => {
    onChange({
      ...graph,
      nodes: graph.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    });
  };

  const removeNode = (id: string) => {
    onChange({
      nodes: graph.nodes.filter((n) => n.id !== id),
      edges: graph.edges.filter((e) => e.from !== id && e.to !== id),
    });
    if (pendingFrom === id) setPendingFrom(null);
  };

  const connect = (to: string) => {
    if (!pendingFrom || pendingFrom === to) {
      setPendingFrom(null);
      return;
    }
    const exists = graph.edges.some((e) => e.from === pendingFrom && e.to === to);
    if (!exists) {
      onChange({
        ...graph,
        edges: [...graph.edges, { id: `e-${pendingFrom}-${to}-${Date.now()}`, from: pendingFrom, to }],
      });
    }
    setPendingFrom(null);
    setCursor(null);
  };

  const removeEdge = (id: string) =>
    onChange({ ...graph, edges: graph.edges.filter((e) => e.id !== id) });

  const onNodePointerDown = (e: React.PointerEvent, node: BuilderNode) => {
    if ((e.target as HTMLElement).closest("[data-port]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = canvasPoint(e);
    dragRef.current = { id: node.id, dx: p.x - node.x, dy: p.y - node.y };
  };

  const onNodePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const p = canvasPoint(e);
    moveNode(
      drag.id,
      Math.max(0, Math.min(r.width - NODE_W, p.x - drag.dx)),
      Math.max(0, Math.min(r.height - NODE_H, p.y - drag.dy))
    );
  };

  const onNodePointerUp = () => {
    dragRef.current = null;
  };

  const nodeById = (id: string) => graph.nodes.find((n) => n.id === id);

  return (
    <section id="builder" className="scroll-mt-24 bg-void py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <SectionKicker>BUILDER</SectionKicker>
            <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
              <SplitWords text="Wire it yourself." />
            </h2>
            <p className="mt-4 text-ink1">
              Add nodes from the palette, drag them into place, and click an
              output port <span className="text-data">○</span> then an input port
              to connect. Click any wire to remove it.
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mt-10"
        >
          <BlueprintCard className="overflow-hidden">
            {/* palette toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-line bg-raised/40 px-4 py-3">
              <span className="mr-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                <Plus className="h-3 w-3" /> Add
              </span>
              {NODE_TYPES.map((t) => {
                const hex = NODE_COLOR_HEX[t.color];
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => addNode(t.key)}
                    className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-[10px] tracking-[0.1em] text-ink1 transition-colors duration-200 hover:text-ink0"
                    style={{ borderColor: undefined }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${hex}88`)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
                    {t.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => onChange({ nodes: [], edges: [] })}
                className="ml-auto flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2 transition-colors hover:border-crit hover:text-crit"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>

            {/* canvas */}
            <div
              ref={canvasRef}
              className="blueprint-grid relative h-[440px] touch-none overflow-hidden bg-void/60"
              onPointerMove={(e) => pendingFrom && setCursor(canvasPoint(e))}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) {
                  setPendingFrom(null);
                  setCursor(null);
                }
              }}
            >
              {/* edges */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                {graph.edges.map((e) => {
                  const a = nodeById(e.from);
                  const b = nodeById(e.to);
                  if (!a || !b) return null;
                  const d = edgePath(a, b);
                  return (
                    <g key={e.id} className="pointer-events-auto">
                      {/* fat invisible hit target */}
                      <path
                        d={d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="14"
                        className="cursor-pointer"
                        onClick={() => removeEdge(e.id)}
                      >
                        <title>Click to remove</title>
                      </path>
                      <path
                        d={d}
                        fill="none"
                        stroke="#2DD4BF"
                        strokeOpacity="0.55"
                        strokeWidth="1.5"
                        strokeDasharray="4 5"
                        className="animate-dash-flow"
                      />
                    </g>
                  );
                })}
                {/* pending connection line */}
                {pendingFrom && cursor && nodeById(pendingFrom) && (
                  <path
                    d={edgePath(nodeById(pendingFrom)!, {
                      x: cursor.x - NODE_W,
                      y: cursor.y - NODE_H / 2,
                    })}
                    fill="none"
                    stroke="#FF6B1A"
                    strokeWidth="1.5"
                    strokeDasharray="3 4"
                    strokeOpacity="0.8"
                  />
                )}
              </svg>

              {/* empty state */}
              {graph.nodes.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rounded-lg border border-dashed border-linestrong px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink2">
                    Canvas empty — add a node from the palette
                  </span>
                </div>
              )}

              {/* nodes */}
              {graph.nodes.map((n) => {
                const def = NODE_TYPE_MAP[n.type];
                const hex = NODE_COLOR_HEX[def.color];
                const Icon = def.icon;
                const isPending = pendingFrom === n.id;
                return (
                  <div
                    key={n.id}
                    className="group/node absolute cursor-grab active:cursor-grabbing"
                    style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                    onPointerDown={(e) => onNodePointerDown(e, n)}
                    onPointerMove={onNodePointerMove}
                    onPointerUp={onNodePointerUp}
                  >
                    <div
                      className={cn(
                        "flex h-full flex-col justify-center rounded-lg border bg-surface px-3 transition-colors",
                        isPending ? "border-brand" : "border-line group-hover/node:border-linestrong"
                      )}
                      style={isPending ? { boxShadow: `0 0 16px ${hex}44` } : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: hex }} />
                        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink0">
                          {def.label}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-[0.12em] text-ink2">
                        {n.caption}
                      </div>
                    </div>

                    {/* input port */}
                    <button
                      type="button"
                      data-port="in"
                      aria-label={`Input port of ${n.caption}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        connect(n.id);
                      }}
                      className={cn(
                        "absolute -left-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-void transition-transform hover:scale-125",
                        pendingFrom && pendingFrom !== n.id ? "border-brand" : "border-linestrong"
                      )}
                      style={pendingFrom && pendingFrom !== n.id ? { borderColor: "#FF6B1A" } : { borderColor: `${hex}aa` }}
                    />
                    {/* output port */}
                    <button
                      type="button"
                      data-port="out"
                      aria-label={`Output port of ${n.caption}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingFrom(isPending ? null : n.id);
                      }}
                      className={cn(
                        "absolute -right-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 transition-transform hover:scale-125",
                        isPending ? "bg-brand" : "bg-void"
                      )}
                      style={{ borderColor: isPending ? "#FF6B1A" : `${hex}aa` }}
                    />
                    {/* delete */}
                    <button
                      type="button"
                      aria-label={`Remove ${n.caption}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNode(n.id);
                      }}
                      className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-line bg-raised text-ink2 transition-colors hover:border-crit hover:text-crit group-hover/node:flex"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* footer strip */}
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
              <span>
                Nodes {graph.nodes.length} · Edges {graph.edges.length}
              </span>
              <span>
                {pendingFrom ? "Click an input port to connect — click canvas to cancel" : "Drag nodes · wire ports · click wire to cut"}
              </span>
            </div>
          </BlueprintCard>
        </motion.div>
      </div>
    </section>
  );
}
