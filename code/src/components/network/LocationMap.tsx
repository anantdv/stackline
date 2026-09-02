import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { NetLocation } from "./demo";
import { cn } from "@/lib/utils";

/**
 * LocationMap — stylized, non-geographic-exact India map.
 * Dots-grid silhouette + hairline graticule, location pins as pulsing
 * orange/teal nodes with mono labels, animated dashed teal transfer arcs.
 * Fully procedural SVG; all colors via theme tokens (Tailwind fill-/stroke-
 * utilities read the CSS custom properties, so Daylight flips for free).
 */

const W = 800;
const H = 600;
const LNG = { min: 67, max: 91 };
const LAT = { min: 6, max: 36 };

function project(lat: number, lng: number) {
  const x = ((lng - LNG.min) / (LNG.max - LNG.min)) * (W - 90) + 40;
  const y = ((LAT.max - lat) / (LAT.max - LAT.min)) * (H - 60) + 20;
  return { x, y };
}

/* Rough mainland-India silhouette (lng, lat), clockwise from Kutch. */
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
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

type Props = {
  locations: NetLocation[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  onHover?: (id: number | null) => void;
  interactive?: boolean;
  showLabels?: boolean;
  className?: string;
};

export default function LocationMap({
  locations,
  selectedId = null,
  onSelect,
  onHover,
  interactive = true,
  showLabels = true,
  className,
}: Props) {
  const [hoverId, setHoverId] = useState<number | null>(null);

  /* Dots grid — deterministic, clipped to the silhouette. */
  const dots = useMemo(() => {
    const out: Array<{ x: number; y: number }> = [];
    const step = 15;
    for (let lat = LAT.min; lat <= LAT.max; lat += step / 20) {
      for (let lng = LNG.min; lng <= LNG.max; lng += step / 20) {
        if (pointInPolygon(lat, lng)) {
          out.push(project(lat, lng));
        }
      }
    }
    return out;
  }, []);

  const pins = useMemo(
    () =>
      locations.map((l) => ({
        loc: l,
        ...project(l.lat, l.lng),
      })),
    [locations]
  );

  /* Transfer arcs: consecutive pin pairs + closing arc, curved beziers. */
  const arcs = useMemo(() => {
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < pins.length - 1; i++) pairs.push([i, i + 1]);
    if (pins.length > 2) pairs.push([pins.length - 1, 0]);
    return pairs.map(([a, b], i) => {
      const p1 = pins[a];
      const p2 = pins[b];
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      /* perpendicular lift so the arc bows away from the chord */
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const lift = len * 0.22 * (i % 2 === 0 ? 1 : -1);
      const cx = mx - (dy / len) * lift;
      const cy = my + (dx / len) * lift;
      return {
        id: `${p1.loc.id}-${p2.loc.id}`,
        d: `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`,
        a: p1.loc.id,
        b: p2.loc.id,
        width: 1.4 + ((i * 7) % 3) * 0.9,
      };
    });
  }, [pins]);

  const activeId = hoverId ?? selectedId;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="Stylized map of warehouse locations in India"
    >
      {/* graticule */}
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={`gv-${i}`}
          x1={((W - 90) / 7) * (i + 1) + 20}
          y1={0}
          x2={((W - 90) / 7) * (i + 1) + 20}
          y2={H}
          className="stroke-linestrong"
          strokeWidth={0.5}
          strokeDasharray="2 6"
          opacity={0.4}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={`gh-${i}`}
          x1={0}
          y1={((H - 60) / 5) * (i + 1) + 10}
          x2={W}
          y2={((H - 60) / 5) * (i + 1) + 10}
          className="stroke-linestrong"
          strokeWidth={0.5}
          strokeDasharray="2 6"
          opacity={0.4}
        />
      ))}

      {/* dots-grid landmass */}
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={1.7}
          className="fill-linestrong"
          opacity={0.55}
        />
      ))}

      {/* transfer arcs */}
      {arcs.map((a) => {
        const dim =
          activeId != null && a.a !== activeId && a.b !== activeId;
        return (
          <g key={a.id} opacity={dim ? 0.18 : 1} style={{ transition: "opacity 0.35s" }}>
            <path
              d={a.d}
              fill="none"
              className="stroke-data"
              strokeWidth={a.width}
              strokeDasharray="7 7"
              opacity={0.28}
            />
            <path
              d={a.d}
              fill="none"
              className="stroke-data animate-dash-flow"
              strokeWidth={a.width}
              strokeDasharray="7 17"
              strokeLinecap="round"
              opacity={0.9}
            />
          </g>
        );
      })}

      {/* location pins */}
      {pins.map((p, i) => {
        const selected = selectedId === p.loc.id;
        const hovered = hoverId === p.loc.id;
        return (
          <g
            key={p.loc.id}
            transform={`translate(${p.x} ${p.y})`}
            style={{ cursor: interactive ? "pointer" : "default" }}
            onClick={interactive && onSelect ? () => onSelect(p.loc.id) : undefined}
            onMouseEnter={() => {
              if (!interactive) return;
              setHoverId(p.loc.id);
              onHover?.(p.loc.id);
            }}
            onMouseLeave={() => {
              setHoverId(null);
              onHover?.(null);
            }}
          >
            {/* teal ping ring */}
            <motion.circle
              r={10}
              fill="none"
              className="stroke-data"
              strokeWidth={1.4}
              initial={false}
              animate={{ r: [10, 30], opacity: [0.75, 0] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeOut",
              }}
            />
            {/* selection ring */}
            {(selected || hovered) && (
              <motion.circle
                r={16}
                fill="none"
                className="stroke-brand"
                strokeWidth={1.6}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <circle r={9} className="fill-data-soft stroke-data" strokeWidth={1} />
            <circle r={selected || hovered ? 5 : 4} className="fill-brand" />
            {/* mono label chip */}
            {showLabels && (
              <g transform="translate(14 -14)">
                <rect
                  x={-6}
                  y={-11}
                  width={p.loc.code.length * 7.4 + 12}
                  height={18}
                  rx={4}
                  className="fill-surface stroke-linestrong"
                  strokeWidth={0.75}
                  opacity={0.94}
                />
                <text
                  className="fill-ink1"
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing={1}
                >
                  {p.loc.code}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
