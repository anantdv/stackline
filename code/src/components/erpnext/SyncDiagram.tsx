import { memo } from "react";
import { motion } from "framer-motion";
import BlueprintCard from "@/components/BlueprintCard";

/**
 * Hero sync diagram: [3D TWIN] ⇄ [SYNC ENGINE] ⇄ [ERPNEXT SITE] with
 * packets traveling both directions on curved SVG paths. Pure SVG +
 * framer-motion attribute animation; isolated + memoized perpetual loop.
 */

type NodeDef = {
  cx: number;
  label: string;
  sub: string;
  stroke: string;
  fill: string;
  text: string;
};

const NODES: NodeDef[] = [
  { cx: 82, label: "3D TWIN", sub: "STACKLINE UI", stroke: "rgba(255,107,26,0.55)", fill: "rgba(255,107,26,0.12)", text: "#FF6B1A" },
  { cx: 240, label: "SYNC", sub: "ENGINE", stroke: "rgba(148,163,184,0.35)", fill: "#1A2029", text: "#F4F7FA" },
  { cx: 398, label: "ERPNEXT", sub: "FRAPPE SITE", stroke: "rgba(45,212,191,0.55)", fill: "rgba(45,212,191,0.10)", text: "#2DD4BF" },
];

const NODE_W = 108;
const NODE_H = 52;
const CY = 92;

/** Curved lane between two node centers. dir: -1 arches up, +1 arches down. */
function lanePath(x1: number, x2: number, dir: -1 | 1) {
  const midX = (x1 + x2) / 2;
  const lift = 26 * dir;
  return `M ${x1} ${CY} Q ${midX} ${CY + lift * 2} ${x2} ${CY}`;
}

/** Points sampled along a quadratic bezier (for cx/cy keyframes). */
function quadPoints(x1: number, x2: number, dir: -1 | 1, samples = 5) {
  const midX = (x1 + x2) / 2;
  const cyy = CY + 26 * dir * 2;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
    const y = (1 - t) * (1 - t) * CY + 2 * (1 - t) * t * cyy + t * t * CY;
    pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  return pts;
}

const LANES = [
  // twin → erp (top arches), orange packets
  { from: 0, to: 2, dir: -1 as const, color: "#FF6B1A", label: "VISUAL MOVE → STOCK ENTRY" },
  // erp → twin (bottom arches), teal packets
  { from: 2, to: 0, dir: 1 as const, color: "#2DD4BF", label: "DELIVERY NOTE → TWIN UPDATE" },
];

function Packet({
  lane,
  index,
}: {
  lane: (typeof LANES)[number];
  index: number;
}) {
  const x1 = NODES[lane.from].cx + (lane.from < lane.to ? NODE_W / 2 : -NODE_W / 2);
  const x2 = NODES[lane.to].cx + (lane.from < lane.to ? -NODE_W / 2 : NODE_W / 2);
  const pts = quadPoints(x1, x2, lane.dir);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return (
    <motion.circle
      r={3.2}
      fill={lane.color}
      initial={false}
      animate={{
        cx: xs,
        cy: ys,
        opacity: [0, 1, 1, 1, 0],
      }}
      transition={{
        duration: 1.8,
        delay: index * 0.6,
        repeat: Infinity,
        ease: "linear",
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
      style={{ filter: `drop-shadow(0 0 4px ${lane.color})` }}
    />
  );
}

function SyncDiagramInner() {
  return (
    <BlueprintCard className="p-4 md:p-6">
      <svg viewBox="0 0 480 190" className="w-full" role="img" aria-label="Bidirectional sync between the 3D twin and ERPNext">
        {/* lanes */}
        {LANES.map((lane, i) => {
          const x1 = NODES[lane.from].cx + (lane.from < lane.to ? NODE_W / 2 : -NODE_W / 2);
          const x2 = NODES[lane.to].cx + (lane.from < lane.to ? -NODE_W / 2 : NODE_W / 2);
          return (
            <g key={i}>
              <path
                d={lanePath(x1, x2, lane.dir)}
                fill="none"
                stroke={lane.color}
                strokeOpacity={0.28}
                strokeWidth={1}
                strokeDasharray="4 6"
                className="animate-dash-flow"
              />
              {Array.from({ length: 3 }, (_, p) => (
                <Packet key={p} lane={lane} index={p} />
              ))}
            </g>
          );
        })}

        {/* nodes */}
        {NODES.map((n) => (
          <g key={n.label}>
            {/* pulse ring on packet arrival */}
            <circle
              cx={n.cx}
              cy={CY}
              r={10}
              fill="none"
              stroke={n.text}
              strokeWidth={1}
              className="animate-[ripple_2.4s_ease-out_infinite]"
            />
            <rect
              x={n.cx - NODE_W / 2}
              y={CY - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              fill={n.fill}
              stroke={n.stroke}
            />
            <text
              x={n.cx}
              y={CY - 3}
              textAnchor="middle"
              fill={n.text}
              fontSize={11}
              fontWeight={600}
              fontFamily="'Space Grotesk', sans-serif"
            >
              {n.label}
            </text>
            <text
              x={n.cx}
              y={CY + 13}
              textAnchor="middle"
              fill="#5C6773"
              fontSize={8}
              letterSpacing={1.4}
              fontFamily="'JetBrains Mono', monospace"
            >
              {n.sub}
            </text>
          </g>
        ))}

        {/* direction labels */}
        <text x={240} y={30} textAnchor="middle" fill="#9AA7B5" fontSize={9} letterSpacing={1.6} fontFamily="'JetBrains Mono', monospace">
          VISUAL MOVE → STOCK ENTRY
        </text>
        <text x={240} y={162} textAnchor="middle" fill="#9AA7B5" fontSize={9} letterSpacing={1.6} fontFamily="'JetBrains Mono', monospace">
          DELIVERY NOTE → TWIN UPDATE
        </text>
      </svg>

      <div className="mt-2 flex items-center justify-between border-t border-line px-2 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
        <span>REST · WEBHOOKS · SOCKETIO</span>
        <span className="flex items-center gap-2 text-data">
          <span className="h-1.5 w-1.5 rounded-full bg-data animate-pulse-dot" />
          12 MS
        </span>
      </div>
    </BlueprintCard>
  );
}

const SyncDiagram = memo(SyncDiagramInner);
export default SyncDiagram;
