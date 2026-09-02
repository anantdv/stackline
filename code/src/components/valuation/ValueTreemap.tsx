import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { Home } from "lucide-react";
import ErpPriceBadge from "./ErpPriceBadge";
import { inrCompact, num } from "@/components/network/demo";
import type { TMNode } from "./demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VW = 1000;
const VH = 560;

/** Aging color scale: teal <30d → warn 30–90d → crit >90d. */
export function ageClass(ageDays: number | undefined) {
  const a = ageDays ?? 0;
  if (a < 30) return { fill: "fill-data/30", stroke: "stroke-data", text: "text-data" };
  if (a <= 90) return { fill: "fill-warn/25", stroke: "stroke-warn", text: "text-warn" };
  return { fill: "fill-crit/25", stroke: "stroke-crit", text: "text-crit" };
}

function sum(node: TMNode): number {
  if (node.value != null && !node.children) return node.value;
  return (node.children ?? []).reduce((s, c) => s + sum(c), 0);
}

/** Dead stock = leaf value with age > 90d within the node. */
function deadStock(node: TMNode): number {
  if (!node.children) return (node.ageDays ?? 0) > 90 ? node.value ?? 0 : 0;
  return node.children.reduce((s, c) => s + deadStock(c), 0);
}

type Hover = { node: TMNode; x: number; y: number; share: number };

export default function ValueTreemap({
  root,
  live,
  className,
}: {
  root: TMNode;
  live: boolean;
  className?: string;
}) {
  const [path, setPath] = useState<TMNode[]>([root]);
  const [hover, setHover] = useState<Hover | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* reset zoom whenever the dataset changes */
  const rootRef = useRef(root);
  if (rootRef.current !== root) {
    rootRef.current = root;
    if (path[0] !== root) setPath([root]);
  }

  const current = path[path.length - 1];

  const leaves = useMemo(() => {
    const h = hierarchy<TMNode>(current, (d) => d.children)
      .sum((d) => (d.children ? 0 : d.value ?? 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const layout = treemap<TMNode>()
      .tile(treemapSquarify)
      .size([VW, VH])
      .paddingInner(6)
      .paddingOuter(4)
      .round(true);
    return layout(h).children ?? [];
  }, [current]);

  const totalValue = sum(current);
  const stats = {
    value: totalValue,
    qty: current.qty ?? leaves.reduce((s, l) => s + (l.data.qty ?? 0), 0),
    age: current.ageDays ?? 0,
    dead: deadStock(current),
  };

  const zoomTo = (node: TMNode) => {
    if (!node.children || node.children.length === 0) return;
    setPath([...path, node]);
  };
  const zoomOutTo = (idx: number) => setPath(path.slice(0, idx + 1));

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      {/* breadcrumb + reset + legend */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setPath([path[0]])}
          className="flex items-center gap-1.5 rounded border border-line px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-ink1 transition-colors hover:border-brand hover:text-brand"
        >
          <Home className="h-3 w-3" /> RESET
        </button>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] tracking-[0.12em]">
          {path.map((n, i) => (
            <span key={`${n.name}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink2">▸</span>}
              <button
                onClick={() => zoomOutTo(i)}
                className={cn(
                  "transition-colors",
                  i === path.length - 1 ? "text-brand" : "text-ink1 hover:text-ink0"
                )}
              >
                {n.name}
              </button>
            </span>
          ))}
        </div>
        {/* aging legend */}
        <div className="ml-auto flex items-center gap-3 font-mono text-[9px] tracking-[0.12em] text-ink2">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-data/60" /> &lt;30D
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-warn/60" /> 30–90D
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-crit/60" /> &gt;90D
          </span>
        </div>
      </div>

      {/* treemap canvas */}
      <div
        className="relative w-full"
        style={{ aspectRatio: `${VW}/${VH}` }}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="h-full w-full"
          onMouseMove={(e) => {
            const r = wrapRef.current?.getBoundingClientRect();
            if (r && hover) setHover({ ...hover, x: e.clientX - r.left, y: e.clientY - r.top });
          }}
        >
          {leaves.map((l, i) => {
            const d = l.data;
            const w = l.x1 - l.x0;
            const hgt = l.y1 - l.y0;
            const c = ageClass(d.ageDays);
            const share = (sum(d) / Math.max(1, totalValue)) * 100;
            return (
              <motion.g
                key={d.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, delay: Math.min(i * 0.02, 0.5), ease: EASE }}
                style={{ transformOrigin: `${(l.x0 + l.x1) / 2}px ${(l.y0 + l.y1) / 2}px`, cursor: d.children ? "pointer" : "default" }}
              >
                <motion.rect
                  rx={6}
                  animate={{ x: l.x0, y: l.y0, width: Math.max(w, 1), height: Math.max(hgt, 1) }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className={cn(c.fill, c.stroke)}
                  strokeWidth={d.children ? 1.6 : 1}
                  onClick={() => zoomTo(d)}
                  onMouseEnter={(e) => {
                    const r = wrapRef.current?.getBoundingClientRect();
                    setHover({
                      node: d,
                      share,
                      x: r ? e.clientX - r.left : 0,
                      y: r ? e.clientY - r.top : 0,
                    });
                  }}
                />
                {w > 90 && hgt > 40 && (
                  <>
                    <text
                      x={l.x0 + 10}
                      y={l.y0 + 20}
                      fontSize={13}
                      fontFamily="'JetBrains Mono', monospace"
                      letterSpacing={0.8}
                      className="fill-ink0"
                      pointerEvents="none"
                    >
                      {d.name.length > Math.floor(w / 9) ? `${d.name.slice(0, Math.floor(w / 9))}…` : d.name}
                    </text>
                    <text
                      x={l.x0 + 10}
                      y={l.y0 + 38}
                      fontSize={11}
                      fontFamily="'JetBrains Mono', monospace"
                      className={c.text}
                      pointerEvents="none"
                    >
                      {inrCompact(sum(d))}
                    </text>
                    {hgt > 62 && (
                      <text
                        x={l.x0 + 10}
                        y={l.y0 + 54}
                        fontSize={9}
                        fontFamily="'JetBrains Mono', monospace"
                        className="fill-ink2"
                        pointerEvents="none"
                      >
                        AGE {d.ageDays ?? 0}D · {share.toFixed(0)}%
                      </text>
                    )}
                  </>
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* hover tooltip */}
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-30 max-w-[300px] rounded-lg border border-linestrong bg-raised p-3 shadow-xl"
              style={{
                left: Math.min(hover.x + 14, (wrapRef.current?.clientWidth ?? 400) - 300),
                top: Math.max(hover.y - 20, 8),
              }}
            >
              <div className="font-mono text-[11px] font-semibold tracking-[0.1em] text-ink0">
                {hover.node.name}
              </div>
              <div className="mt-1 font-mono text-[10px] leading-relaxed text-ink1">
                {hover.node.meta ?? `${num(hover.node.qty ?? 0)} UNITS · AGE ${hover.node.ageDays ?? 0}D`}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-semibold text-data font-tnum">
                  {inrCompact(sum(hover.node))} · {hover.share.toFixed(0)}% OF VIEW
                </span>
                <ErpPriceBadge live={live} size="sm" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* zoom-level metric strip */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
        {[
          { label: "VALUE", value: inrCompact(stats.value) },
          { label: "UNITS", value: num(stats.qty) },
          { label: "AVG AGE", value: `${stats.age}D` },
          { label: "DEAD STOCK", value: inrCompact(stats.dead) },
        ].map((s) => (
          <div key={s.label}>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={s.value}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="font-display text-lg font-semibold text-ink0 font-tnum md:text-xl"
              >
                {s.value}
              </motion.div>
            </AnimatePresence>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
