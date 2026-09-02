/**
 * Dashboard §5b — Valuation rollup mini-treemap: compressed ValueTreemap
 * language (d3-hierarchy treemapSquarify) at fixed depth 2 — warehouse rects
 * → item-group sub-rects. No drill: click jumps to /valuation?wh=CODE.
 * Rect area = ₹ value; rect color = aging scale (teal <30d → warn → crit).
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { inrCompact } from "@/components/network/demo";
import type { TMNode } from "@/components/valuation/demo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VW = 480;
const VH = 300;

function ageFill(age: number | undefined): string {
  const a = age ?? 0;
  if (a < 30) return "var(--data)";
  if (a <= 90) return "var(--warn)";
  return "var(--crit)";
}

export default function MiniTreemap({ root }: { root: TMNode }) {
  const navigate = useNavigate();
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);

  /* depth-2 leaves: each warehouse node lays out its group children inside
     its own rect (paddingOuter separates the warehouse blocks). */
  const cells = useMemo(() => {
    const h = hierarchy<TMNode>(root, (d) => d.children)
      .sum((d) => (d.children ? 0 : d.value ?? 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const layout = treemap<TMNode>()
      .tile(treemapSquarify)
      .size([VW, VH])
      .paddingInner(4)
      .paddingOuter(6)
      .paddingTop(18)
      .round(true);
    const laid = layout(h);
    return (laid.children ?? []).flatMap((wh) =>
      (wh.children ?? []).map((leaf) => ({ wh, leaf }))
    );
  }, [root]);

  const flat = cells.flatMap(({ wh, leaf }) => [{ node: wh, isWh: true }, { node: leaf, isWh: false }]);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label="Stock value treemap by warehouse and item group">
        {flat.map(({ node, isWh }, i) => {
          const w = node.x1 - node.x0;
          const hgt = node.y1 - node.y0;
          const dim = hoverName != null && !isWh && node.data.name !== hoverName;
          return (
            <motion.g
              key={`${isWh ? "w" : "l"}-${node.data.name}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: dim ? 0.7 : 1 }}
              transition={{ duration: 0.7, delay: Math.min(i * 0.02, 0.6), ease: EASE }}
              style={{ transitionProperty: "opacity" }}
            >
              <rect
                x={node.x0}
                y={node.y0}
                width={Math.max(1, w)}
                height={Math.max(1, hgt)}
                rx={isWh ? 6 : 3}
                style={{
                  fill: isWh
                    ? "transparent"
                    : `color-mix(in srgb, ${ageFill(node.data.ageDays)} ${isWh ? 6 : 26}%, transparent)`,
                  stroke: isWh ? "var(--line-strong)" : ageFill(node.data.ageDays),
                  strokeWidth: isWh ? 1 : 0.75,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(
                    isWh
                      ? `/valuation?wh=${node.data.name}`
                      : `/valuation?wh=${(node.parent?.data.name ?? node.data.name).replace(" ", "-")}`
                  )
                }
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  const scale = rect.width / VW;
                  setHoverName(node.data.name);
                  setTip({
                    text: isWh
                      ? `${node.data.name} · ${inrCompact(node.value ?? 0)}`
                      : `${node.data.meta ?? node.data.name} · ${inrCompact(node.value ?? 0)}`,
                    x: (node.x0 + w / 2) * scale,
                    y: node.y0 * scale,
                  });
                }}
                onMouseLeave={() => {
                  setTip(null);
                  setHoverName(null);
                }}
              />
              {isWh && w > 70 && (
                <text
                  x={node.x0 + 8}
                  y={node.y0 + 13}
                  fontSize={9.5}
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing={0.8}
                  className="fill-ink1"
                  pointerEvents="none"
                >
                  {node.data.name} · {inrCompact(node.value ?? 0)}
                </text>
              )}
              {!isWh && w > 56 && hgt > 30 && (
                <text
                  x={node.x0 + 6}
                  y={node.y0 + 14}
                  fontSize={8.5}
                  fontFamily="'JetBrains Mono', monospace"
                  className="fill-ink1"
                  pointerEvents="none"
                >
                  {node.data.name.length > Math.floor(w / 7) ? `${node.data.name.slice(0, Math.floor(w / 7))}…` : node.data.name}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute z-30 max-w-[260px] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-linestrong bg-raised px-3 py-2 font-mono text-[10px] tracking-[0.06em] text-ink1 shadow-xl"
          style={{ left: tip.x, top: Math.max(tip.y - 6, 28) }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}
