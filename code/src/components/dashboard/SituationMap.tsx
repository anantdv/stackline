/**
 * Dashboard §3a — Situation Map: compact dashboard-scale reuse of the shared
 * LocationMap visual language (dots-grid India silhouette, hairline
 * graticule, teal transfer arcs) plus dashboard-only layers: per-site health
 * dots, warehouse satellite dots on hover, vehicle chevrons riding arcs, and
 * drill-through links. Pure SVG, theme-token colors only, no R3F (§Density).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  capVar,
  healthVar,
  type DashLocation,
  type DashTransfer,
  type DashVehicle,
} from "./demo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const W = 800;
const H = 600;
const LNG = { min: 67, max: 91 };
const LAT = { min: 6, max: 36 };

function project(lat: number, lng: number) {
  const x = ((lng - LNG.min) / (LNG.max - LNG.min)) * (W - 90) + 40;
  const y = ((LAT.max - lat) / (LAT.max - LAT.min)) * (H - 60) + 20;
  return { x, y };
}

/* Same silhouette dataset as the shared LocationMap (copied; that component
   does not export its projection geometry). */
const INDIA_OUTLINE: Array<[number, number]> = [
  [68.2, 23.7], [69.4, 22.4], [70.2, 20.9], [71.6, 20.2], [72.6, 19.1],
  [73.4, 17.4], [74.6, 15.6], [76.2, 13.2], [77.4, 8.4], [78.2, 9.4],
  [79.9, 11.9], [80.4, 13.6], [81.4, 15.9], [82.4, 17.1], [84.2, 18.6],
  [85.4, 20.1], [87.1, 21.4], [88.2, 22.1], [88.7, 23.4], [88.1, 25.0],
  [87.9, 26.6], [85.2, 26.9], [82.4, 27.8], [80.2, 28.9], [78.1, 29.8],
  [76.9, 30.6], [75.4, 32.0], [74.4, 33.8], [73.6, 34.2], [73.0, 33.2],
  [73.9, 31.6], [74.6, 30.4], [73.3, 29.3], [71.9, 27.9], [70.2, 26.9],
  [69.1, 25.3], [68.4, 24.2],
];

function pointInPolygon(lat: number, lng: number) {
  let inside = false;
  const n = INDIA_OUTLINE.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = INDIA_OUTLINE[i];
    const [xj, yj] = INDIA_OUTLINE[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

type Pt = { x: number; y: number };

/** Quadratic bezier with perpendicular lift between two points. */
function arcPath(a: Pt, b: Pt, bend: 1 | -1) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const lift = len * 0.22 * bend;
  const c = { x: mx - (dy / len) * lift, y: my + (dx / len) * lift };
  return {
    d: `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`,
    c,
    at: (t: number) => ({
      x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x,
      y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y,
      angle:
        (Math.atan2(
          2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y),
          2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x)
        ) * 180) / Math.PI,
    }),
  };
}

export default function SituationMap({
  locations,
  transfers,
  vehicles,
  selected,
  onSelect,
  visible,
  className,
}: {
  locations: DashLocation[];
  transfers: DashTransfer[];
  vehicles: DashVehicle[];
  selected: string | null;
  onSelect: (code: string | null) => void;
  visible: boolean;
  className?: string;
}) {
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [arcTip, setArcTip] = useState<string | null>(null);
  /* 1.2s mock tick drives chevron drift between polls */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const t = window.setInterval(() => setTick((v) => v + 1), 1200);
    return () => window.clearInterval(t);
  }, [visible]);

  const dots = useMemo(() => {
    const out: Pt[] = [];
    const step = 18;
    for (let lat = LAT.min; lat <= LAT.max; lat += step / 20) {
      for (let lng = LNG.min; lng <= LNG.max; lng += step / 20) {
        if (pointInPolygon(lat, lng)) out.push(project(lat, lng));
      }
    }
    return out;
  }, []);

  const pins = useMemo(
    () => locations.map((l) => ({ loc: l, ...project(l.lat, l.lng) })),
    [locations]
  );
  const pinByCode = useMemo(
    () => new Map(pins.map((p) => [p.loc.code, p])),
    [pins]
  );

  const arcs = useMemo(
    () =>
      transfers
        .map((t, i) => {
          const a = pinByCode.get(t.fromLoc);
          const b = pinByCode.get(t.toLoc);
          if (!a || !b) return null;
          return { transfer: t, ...arcPath(a, b, i % 2 === 0 ? 1 : -1) };
        })
        .filter((a): a is NonNullable<typeof a> => a != null),
    [transfers, pinByCode]
  );

  /* vehicles riding an arc: match fromLoc→toLoc against transfer lanes */
  const riders = useMemo(() => {
    const out: Array<{ v: DashVehicle; pos: { x: number; y: number; angle: number } }> = [];
    for (const v of vehicles) {
      if (v.status !== "ENROUTE" && v.status !== "OVERDUE") continue;
      const arc =
        arcs.find((a) => a.transfer.fromLoc === v.fromLoc && a.transfer.toLoc === v.toLoc) ??
        arcs.find((a) => a.transfer.toLoc === v.fromLoc && a.transfer.fromLoc === v.toLoc);
      if (!arc) continue;
      const drift = Math.sin(tick * 0.9 + v.id * 1.7) * 0.012;
      const t = Math.max(0.04, Math.min(0.96, v.progress / 100 + drift));
      out.push({ v, pos: arc.at(t) });
    }
    return out;
  }, [vehicles, arcs, tick]);

  const activeCode = hoverCode ?? selected;

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        role="img"
        aria-label="Network situation map of India with location health"
      >
        {/* graticule */}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`gv-${i}`} x1={((W - 90) / 7) * (i + 1) + 20} y1={0} x2={((W - 90) / 7) * (i + 1) + 20} y2={H}
            className="stroke-linestrong" strokeWidth={0.5} strokeDasharray="2 6" opacity={0.4} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`gh-${i}`} x1={0} y1={((H - 60) / 5) * (i + 1) + 10} x2={W} y2={((H - 60) / 5) * (i + 1) + 10}
            className="stroke-linestrong" strokeWidth={0.5} strokeDasharray="2 6" opacity={0.4} />
        ))}

        {/* dots-grid landmass */}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.6} className="fill-linestrong" opacity={0.5} />
        ))}

        {/* transfer arcs */}
        {arcs.map((a) => (
          <g key={a.transfer.id}>
            <path d={a.d} fill="none" className="stroke-data" strokeWidth={1.4 + Math.min(2.4, a.transfer.qty / 120)} strokeDasharray="7 7" opacity={0.25} />
            <path
              d={a.d} fill="none"
              className="stroke-data animate-dash-flow"
              strokeWidth={1.4 + Math.min(2.4, a.transfer.qty / 120)}
              strokeDasharray="7 17"
              strokeLinecap="round"
              opacity={0.85}
              style={{ animationDuration: "2s" }}
            />
            {/* wide invisible hit area for hover tooltip */}
            <path
              d={a.d} fill="none" stroke="transparent" strokeWidth={18}
              onMouseEnter={() => setArcTip(a.transfer.id)}
              onMouseLeave={() => setArcTip(null)}
            />
          </g>
        ))}

        {/* vehicle chevrons riding the arcs */}
        {riders.map(({ v, pos }) => (
          <Link key={v.id} to="/fleet" aria-label={`Open fleet — ${v.code}`}>
            <g
              transform={`translate(${pos.x} ${pos.y}) rotate(${pos.angle})`}
              style={{ transition: "transform 0.6s ease", cursor: "pointer" }}
            >
              <path
                d="M 7 0 L -5 -5 L -2 0 L -5 5 Z"
                style={{ fill: v.status === "OVERDUE" ? "var(--crit)" : "var(--accent)" }}
              />
            </g>
          </Link>
        ))}

        {/* location nodes */}
        {pins.map((p, i) => {
          const dim = activeCode != null && activeCode !== p.loc.code;
          const hovered = hoverCode === p.loc.code;
          return (
            <motion.g
              key={p.loc.code}
              transform={`translate(${p.x} ${p.y})`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: dim ? 0.5 : 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: EASE }}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(selected === p.loc.code ? null : p.loc.code)}
              onMouseEnter={() => setHoverCode(p.loc.code)}
              onMouseLeave={() => setHoverCode(null)}
            >
              {/* teal ping ring */}
              <motion.circle
                r={10} fill="none" className="stroke-data" strokeWidth={1.4}
                animate={{ r: [10, 28], opacity: [0.75, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: "easeOut" }}
              />
              <circle r={9} className="fill-data-soft stroke-data" strokeWidth={1} />
              <circle r={hovered || selected === p.loc.code ? 5 : 4} className="fill-brand" />

              {/* mono label chip + health dot */}
              <g transform="translate(14 -14)">
                <rect x={-6} y={-11} width={p.loc.code.length * 7.4 + 12} height={18} rx={4}
                  className="fill-surface stroke-linestrong" strokeWidth={0.75} opacity={0.94} />
                <text className="fill-ink1" fontSize={10} fontFamily="'JetBrains Mono', monospace" letterSpacing={1}>
                  {p.loc.code}
                </text>
                {/* per-site health dot (8px, halo so amber reads on white) */}
                <motion.g
                  transform={`translate(${p.loc.code.length * 7.4 + 12} -8)`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 300, damping: 18 }}
                >
                  <circle r={5} className="fill-surface stroke-linestrong" strokeWidth={1} />
                  <circle r={4} style={{ fill: healthVar(p.loc.health) }}>
                    {p.loc.health === "crit" && (
                      <animate attributeName="opacity" values="1;0.45;1" dur="2s" repeatCount="indefinite" />
                    )}
                  </circle>
                </motion.g>
              </g>

              {/* warehouse satellite dots (fan out on hover) */}
              {p.loc.warehouses.map((w, wi) => {
                const angle = (-40 + wi * 46) * (Math.PI / 180);
                const dist = 44;
                const sx = Math.cos(angle) * dist;
                const sy = Math.sin(angle) * dist + 18;
                return (
                  <motion.g
                    key={w.code}
                    initial={false}
                    animate={{
                      x: hovered ? sx : 0,
                      y: hovered ? sy : 0,
                      opacity: hovered ? 1 : 0,
                      scale: hovered ? 1 : 0.4,
                    }}
                    transition={{ duration: 0.3, delay: wi * 0.04, ease: EASE }}
                    style={{ pointerEvents: hovered ? "auto" : "none" }}
                  >
                    <circle r={4} style={{ fill: capVar(w.util) }} className="stroke-surface" strokeWidth={1.5} />
                    <g transform="translate(10 4)">
                      <rect x={-5} y={-9} width={(w.code.length + 6) * 6.4 + 10} height={15} rx={3}
                        className="fill-surface stroke-linestrong" strokeWidth={0.6} opacity={0.95} />
                      <text fontSize={8.5} fontFamily="'JetBrains Mono', monospace" className="fill-ink1">
                        {w.code} <tspan style={{ fill: capVar(w.util) }}>{w.util}%</tspan>
                      </text>
                    </g>
                  </motion.g>
                );
              })}
            </motion.g>
          );
        })}
      </svg>

      {/* arc hover tooltip */}
      {arcTip && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-lg border border-linestrong bg-raised px-3 py-2 font-mono text-[10px] tracking-[0.08em] text-ink1 shadow-xl">
          {(() => {
            const t = transfers.find((x) => x.id === arcTip);
            return t ? `${t.id} · ${t.qty} CARTONS · ${t.valueLabel} IN TRANSIT · ETA ${t.eta}` : "";
          })()}
        </div>
      )}
    </div>
  );
}
