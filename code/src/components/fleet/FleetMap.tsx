import { useEffect, useRef } from "react";
import { useTheme, themeColor } from "@/lib/theme";
import { DEPOTS, MAP_BOUNDS, type FleetVehicle } from "@/components/fleet/data";
import type { RouteStop } from "@contracts/types";

/**
 * FleetMap (design-delta §4.10) — canvas-2D stylized road map: slate landmass
 * blobs, hairline roads, depot glyphs; orange chevron vehicles with teal
 * dashed history trails; smooth position lerp on ~1.2s mock GPS ticks.
 * Theme-aware (all colors from CSS tokens); no map library, no tiles.
 */

export interface FleetMapRoute {
  stops: RouteStop[];
  direction: "outward" | "inward" | "backhaul";
}

interface VState {
  x: number;
  y: number;
  tx: number;
  ty: number;
  heading: number;
  trail: { x: number; y: number }[];
}

interface Palette {
  bg: string;
  land: string;
  landLine: string;
  road: string;
  label: string;
  depot: string;
  teal: string;
  warn: string;
  crit: string;
  ink2: string;
}

function readPalette(): Palette {
  const c = (t: string, fb: string) => themeColor(t) || fb;
  return {
    bg: c("--bg-page", "#0b0e12"),
    land: c("--bg-raised", "#1a2029"),
    landLine: c("--line-strong", "rgba(148,163,184,0.3)"),
    road: c("--line-strong", "rgba(148,163,184,0.3)"),
    label: c("--text-2", "#5c6773"),
    depot: c("--accent", "#ff6b1a"),
    teal: c("--data", "#2dd4bf"),
    warn: c("--warn", "#ffb020"),
    crit: c("--crit", "#f4504e"),
    ink2: c("--text-2", "#5c6773"),
  };
}

/** Fixed road network over the map bounds (stylized, traffic-free). */
const ROADS: [number, number][][] = [
  [
    [72.8, 19.36], [72.86, 19.3], [72.9, 19.22], [72.95, 19.14], [72.98, 19.06],
    [73.03, 19.0], [73.08, 18.95], [73.16, 18.9],
  ],
  [
    [72.82, 18.95], [72.88, 19.02], [72.93, 19.1], [72.99, 19.17],
    [73.05, 19.24], [73.09, 19.28], [73.14, 19.31], [73.24, 19.33],
  ],
  [
    [73.05, 18.88], [73.03, 18.96], [73.02, 19.05], [73.05, 19.14],
    [73.06, 19.22], [73.062, 19.292],
  ],
  [
    [72.86, 19.1], [72.9, 19.12], [72.96, 19.12], [73.02, 19.1],
  ],
];

/** Landmass blobs as [lng, lat] polygons over the bounds. */
const BLOBS: [number, number][][] = [
  [
    [72.78, 19.2], [72.84, 19.28], [72.95, 19.34], [73.05, 19.3],
    [73.0, 19.22], [72.9, 19.16], [72.8, 19.12],
  ],
  [
    [72.95, 19.05], [73.08, 19.1], [73.2, 19.06], [73.24, 18.94],
    [73.12, 18.9], [73.0, 18.94],
  ],
  [
    [72.8, 19.0], [72.88, 19.05], [72.94, 18.98], [72.9, 18.88], [72.82, 18.9],
  ],
];

const VEHICLE_COLOR: Record<FleetVehicle["state"], keyof Palette> = {
  moving: "teal",
  loading: "depot",
  idle: "ink2",
  delayed: "crit",
};

export default function FleetMap({
  vehicles,
  routes = [],
  showTrails = true,
  showRoutes = true,
  showGeofences = false,
  heartbeat = false,
  zoom = 1,
  demo = false,
  dim = false,
  onVehicleClick,
  className,
}: {
  vehicles: FleetVehicle[];
  routes?: FleetMapRoute[];
  showTrails?: boolean;
  showRoutes?: boolean;
  showGeofences?: boolean;
  heartbeat?: boolean;
  zoom?: number;
  /** internal 1.2s GPS jitter on top of prop positions (hero/demo) */
  demo?: boolean;
  dim?: boolean;
  onVehicleClick?: (v: FleetVehicle) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const palette = useRef<Palette>(readPalette());
  const vstate = useRef<Map<number, VState>>(new Map());
  const vehiclesRef = useRef(vehicles);
  const routesRef = useRef(routes);
  const zoomRef = useRef(zoom);
  const tickRef = useRef(0);
  const layers = useRef({ showTrails, showRoutes, showGeofences, heartbeat, dim });
  layers.current = { showTrails, showRoutes, showGeofences, heartbeat, dim };
  zoomRef.current = zoom;
  routesRef.current = routes;

  useEffect(() => {
    palette.current = readPalette();
  }, [theme]);

  // sync targets from props
  useEffect(() => {
    vehiclesRef.current = vehicles;
    for (const v of vehicles) {
      const s = vstate.current.get(v.id);
      if (s) {
        s.tx = v.lng;
        s.ty = v.lat;
        s.heading = v.headingDeg;
      } else {
        vstate.current.set(v.id, { x: v.lng, y: v.lat, tx: v.lng, ty: v.lat, heading: v.headingDeg, trail: [] });
      }
    }
  }, [vehicles]);

  // mock GPS tick: every 1.2s nudge moving vehicles along their heading (demo)
  useEffect(() => {
    if (!demo) return;
    const t = window.setInterval(() => {
      tickRef.current += 1;
      for (const v of vehiclesRef.current) {
        const s = vstate.current.get(v.id);
        if (!s) continue;
        if (v.state === "moving") {
          const rad = ((s.heading - 90) * Math.PI) / 180;
          const step = 0.008 + 0.004 * Math.sin(tickRef.current * 0.9 + v.id);
          s.tx += Math.cos(rad) * step;
          s.ty += Math.sin(rad) * step * -1;
          // keep inside bounds: bounce heading
          if (
            s.tx < MAP_BOUNDS.lngMin + 0.02 || s.tx > MAP_BOUNDS.lngMax - 0.02 ||
            s.ty < MAP_BOUNDS.latMin + 0.02 || s.ty > MAP_BOUNDS.latMax - 0.02
          ) {
            s.heading = (s.heading + 140) % 360;
            s.tx = Math.min(MAP_BOUNDS.lngMax - 0.02, Math.max(MAP_BOUNDS.lngMin + 0.02, s.tx));
            s.ty = Math.min(MAP_BOUNDS.latMax - 0.02, Math.max(MAP_BOUNDS.latMin + 0.02, s.ty));
          }
          s.trail.push({ x: s.x, y: s.y });
          if (s.trail.length > 26) s.trail.shift();
        }
      }
    }, 1200);
    return () => window.clearInterval(t);
  }, [demo]);

  // main draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    });
    ro.observe(canvas);

    const proj = (lng: number, lat: number): [number, number] => {
      const bx = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * w;
      const by = (1 - (lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * h;
      const z = zoomRef.current;
      return [w / 2 + (bx - w / 2) * z, h / 2 + (by - h / 2) * z];
    };

    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const p = palette.current;
      const L = layers.current;
      const t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // landmass blobs
      for (const blob of BLOBS) {
        ctx.beginPath();
        blob.forEach(([lng, lat], i) => {
          const [x, y] = proj(lng, lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = p.land;
        ctx.globalAlpha = L.dim ? 0.5 : 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = p.landLine;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // hairline roads
      ctx.strokeStyle = p.road;
      ctx.lineWidth = 1;
      ctx.globalAlpha = L.dim ? 0.4 : 0.7;
      for (const road of ROADS) {
        ctx.beginPath();
        road.forEach(([lng, lat], i) => {
          const [x, y] = proj(lng, lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // geofence rings around MUM-BHIWANDI
      if (L.showGeofences) {
        const depot = DEPOTS[0];
        const [dx, dy] = proj(depot.lng, depot.lat);
        const kmPx = Math.abs(proj(depot.lng + 0.01, depot.lat)[0] - dx) / 0.094; // ~px per km
        const rings: { km: number; color: string }[] = [
          { km: 2, color: p.warn },
          { km: 0.5, color: p.teal },
        ];
        rings.forEach((r, ri) => {
          const pulse = 1 + 0.05 * Math.sin(t * ((2 * Math.PI) / 2.4) + ri);
          ctx.beginPath();
          ctx.arc(dx, dy, r.km * kmPx * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = r.color;
          ctx.globalAlpha = 0.55;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        });
      }

      // routes: optimized teal hairline + dashed gray actual trail
      if (L.showRoutes) {
        for (const r of routesRef.current) {
          if (r.stops.length < 2) continue;
          const depot = DEPOTS[0];
          const pts = [[depot.lng, depot.lat], ...r.stops.map((s) => [s.lng, s.lat] as [number, number]), [depot.lng, depot.lat]];
          ctx.beginPath();
          pts.forEach(([lng, lat], i) => {
            const [x, y] = proj(lng, lat);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = p.teal;
          ctx.globalAlpha = L.dim ? 0.25 : 0.5;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          // actual trail: same path offset & dashed (divergence visible)
          ctx.beginPath();
          pts.forEach(([lng, lat], i) => {
            const jitter = Math.sin(i * 2.1) * 0.006;
            const [x, y] = proj(lng + jitter, lat + jitter * 0.7);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = p.ink2;
          ctx.globalAlpha = L.dim ? 0.15 : 0.4;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          // stop dots
          for (const s of r.stops) {
            const [x, y] = proj(s.lng, s.lat);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = p.teal;
            ctx.globalAlpha = L.dim ? 0.3 : 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }

      // depots: orange squares + mono labels
      for (const d of DEPOTS) {
        const [x, y] = proj(d.lng, d.lat);
        ctx.fillStyle = p.depot;
        ctx.globalAlpha = L.dim ? 0.6 : 1;
        ctx.fillRect(x - 5, y - 5, 10, 10);
        ctx.globalAlpha = 1;
        if (!L.dim) {
          ctx.font = "600 10px 'JetBrains Mono', monospace";
          ctx.fillStyle = p.label;
          ctx.fillText(d.id, x + 10, y + 3);
        }
      }

      // vehicles: lerp + chevrons + trails
      for (const v of vehiclesRef.current) {
        const s = vstate.current.get(v.id);
        if (!s) continue;
        s.x += (s.tx - s.x) * 0.06;
        s.y += (s.ty - s.y) * 0.06;

        if (L.showTrails && s.trail.length > 1) {
          ctx.beginPath();
          s.trail.forEach((pt, i) => {
            const [x, y] = proj(pt.x, pt.y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          const [cx, cy] = proj(s.x, s.y);
          ctx.lineTo(cx, cy);
          ctx.strokeStyle = p.teal;
          ctx.globalAlpha = L.dim ? 0.35 : 0.75;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }

        const [x, y] = proj(s.x, s.y);
        const color = p[VEHICLE_COLOR[v.state]];
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(((s.heading - 90) * Math.PI) / 180);
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = L.dim ? 0.7 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        if (!L.dim) {
          ctx.font = "600 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = p.label;
          ctx.fillText(v.code, x + 11, y + 3);
        }
      }

      // heartbeat pulse
      if (L.heartbeat) {
        const phase = (t % 4) / 4;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 40 + phase * Math.min(w, h) * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = p.teal;
        ctx.globalAlpha = (1 - phase) * 0.25;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // click → vehicle hit test
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onVehicleClick) return;
    const handler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      const proj = (lng: number, lat: number): [number, number] => {
        const bx = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * w;
        const by = (1 - (lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * h;
        const z = zoomRef.current;
        return [w / 2 + (bx - w / 2) * z, h / 2 + (by - h / 2) * z];
      };
      for (const v of vehiclesRef.current) {
        const s = vstate.current.get(v.id);
        if (!s) continue;
        const [x, y] = proj(s.x, s.y);
        if (Math.hypot(mx - x, my - y) < 16) {
          onVehicleClick(v);
          return;
        }
      }
    };
    canvas.addEventListener("click", handler);
    return () => canvas.removeEventListener("click", handler);
  }, [onVehicleClick]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", cursor: onVehicleClick ? "crosshair" : "default" }}
      className={className}
      aria-label="Stylized live fleet map"
    />
  );
}
