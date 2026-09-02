import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import type { PlacedItem, VehicleCargoSpace } from "@contracts/types";
import { useTheme, themeColor } from "@/lib/theme";

/**
 * LoadPlanScene (design-delta §4.9) — R3F isometric truck/container cutaway.
 * Wireframe shell (orange edges, ghost walls), instanced cartons packing in
 * sequence along teal bezier paths, HTML HUD overlays (utilization ring,
 * counter, axle bars). Drag-orbit only. Unmounts off-viewport.
 *
 * The placement clock runs INSIDE the canvas (useFrame) so parents never
 * re-render per frame. `runKey` restarts the packing run; the per-item
 * `schedule` (seconds, accelerating stagger) decides when each carton flies.
 *
 * Coordinate mapping from the packer: packer x → scene X (length),
 * packer y → scene Z (width), packer z → scene Y (up).
 */

export type LoadPlanMode = "solid" | "wireframe" | "layers" | "sequence";

export interface LoadPlanSceneProps {
  cargo: VehicleCargoSpace;
  placed: PlacedItem[];
  /** Per-item flight start times (seconds). */
  schedule: number[];
  /** Bump to (re)start the packing run; 0 = hold empty vehicle. */
  runKey: number;
  mode?: LoadPlanMode;
  /** Stop count for SEQUENCE recolor (stop 1 teal → last stop orange). */
  stops?: number;
  detail?: "hero" | "full";
  /** Final utilization percentages — HUD sweeps with placement progress. */
  finalVolPct?: number;
  finalWtPct?: number;
  leftoverNote?: string;
  className?: string;
}

const FLIGHT_TIME = 0.55;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* ------------------------- theme palette ------------------------- */
function useScenePalette() {
  const theme = useTheme();
  return useMemo(() => {
    return {
      floor: theme === "light" ? "#E8EDF2" : "#0C0F13",
      fog: themeColor("--bg-void") || (theme === "light" ? "#E4E9EE" : "#07090C"),
      edge: themeColor("--accent") || "#FF6B1A",
      ghost: themeColor("--bg-surface") || (theme === "light" ? "#ffffff" : "#12161C"),
      teal: themeColor("--data") || "#2DD4BF",
      carton: theme === "light" ? "#D8B48C" : "#C8A27A",
      upright: theme === "light" ? "#8A94A0" : "#39424E",
      ambient: theme === "light" ? 0.55 : 0.25,
      key: theme === "light" ? 0.55 : 0.3,
    };
  }, [theme]);
}

type Palette = ReturnType<typeof useScenePalette>;

/* ------------------------- shared clock ------------------------- */
type Clock = { current: number };

function Timekeeper({ clock, running, onPlaced, schedule, total }: {
  clock: Clock;
  running: boolean;
  onPlaced: (n: number) => void;
  schedule: number[];
  total: number;
}) {
  const last = useRef(-1);
  useFrame((_, delta) => {
    if (!running) return;
    clock.current += Math.min(delta, 0.1);
    let n = 0;
    for (let i = 0; i < total; i++) if ((schedule[i] ?? Infinity) <= clock.current) n++;
    if (n !== last.current) {
      last.current = n;
      onPlaced(n);
    }
  });
  return null;
}

/* ------------------------- carton instances ------------------------- */
const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scl = new THREE.Vector3();
const _col = new THREE.Color();
const _orange = new THREE.Color();

function Cartons({
  placed, clock, running, schedule, mode, stops = 5, palette, space,
}: {
  placed: PlacedItem[];
  clock: Clock;
  running: boolean;
  schedule: number[];
  mode: LoadPlanMode;
  stops?: number;
  palette: Palette;
  space: VehicleCargoSpace;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const targets = useMemo(
    () =>
      placed.map((p) => ({
        x: p.x + p.dx / 2 - space.lengthM / 2,
        y: p.z + p.dz / 2,
        z: p.y + p.dy / 2 - space.widthM / 2,
        dx: p.dx,
        dy: p.dz,
        dz: p.dy,
        layer: Math.round(p.z / 0.42),
      })),
    [placed, space.lengthM, space.widthM]
  );

  useEffect(() => {
    _orange.set(palette.edge);
  }, [palette.edge]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const now = clock.current;
    let n = 0;
    if (running) {
      for (let i = 0; i < targets.length; i++) if ((schedule[i] ?? Infinity) <= now) n = i + 1;
    }
    for (let i = 0; i < n; i++) {
      const t = targets[i];
      const raw = THREE.MathUtils.clamp((now - (schedule[i] ?? 0)) / FLIGHT_TIME, 0, 1);
      const e = easeOutCubic(raw);
      const sx = -space.lengthM / 2 - 5;
      const sy = space.heightM + 2.5;
      const u = 1 - e;
      _pos.set(
        u * u * sx + 2 * u * e * ((sx + t.x) / 2) + e * e * t.x,
        u * u * sy + 2 * u * e * (sy + 1.5) + e * e * t.y,
        u * u * 0 + 2 * u * e * t.z + e * e * t.z
      );
      const pop = 0.6 + 0.4 * e;
      const settle = raw >= 1 ? 1 + 0.1 * Math.max(0, 1 - (now - (schedule[i] ?? 0) - FLIGHT_TIME) / 0.15) : pop;
      const lift = mode === "layers" ? t.layer * 0.32 : 0;
      _scl.set(t.dx * settle, t.dy * settle, t.dz * settle);
      _pos.y += lift;
      _mat.compose(_pos, _quat, _scl);
      m.setMatrixAt(i, _mat);
      if (mode === "sequence") {
        const stopIdx = Math.min(stops - 1, Math.floor((i / Math.max(1, targets.length)) * stops));
        _col.set(palette.teal).lerp(_orange, stopIdx / Math.max(1, stops - 1));
      } else {
        const v = 1 + (((i * 37) % 11) / 10 - 0.5) * 0.3;
        _col.set(palette.carton).multiplyScalar(v);
      }
      m.setColorAt(i, _col);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, Math.max(1, targets.length)]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      {mode === "wireframe" ? (
        <meshBasicMaterial wireframe color={palette.teal} transparent opacity={0.85} />
      ) : (
        <meshStandardMaterial roughness={0.85} metalness={0.02} transparent opacity={0.96} />
      )}
    </instancedMesh>
  );
}

/* ------------------------- vehicle shell ------------------------- */
function VehicleShell({ space, palette }: { space: VehicleCargoSpace; palette: Palette }) {
  const { lengthM: L, widthM: W, heightM: H } = space;
  const edges = useMemo(() => {
    const geo = new THREE.BoxGeometry(L, H, W);
    const e = new THREE.EdgesGeometry(geo);
    geo.dispose();
    return e;
  }, [L, W, H]);
  return (
    <group position={[0, H / 2, 0]}>
      <mesh>
        <boxGeometry args={[L, H, W]} />
        <meshBasicMaterial color={palette.ghost} transparent opacity={0.1} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={palette.edge} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

/* ------------------------- teal flight path ------------------------- */
function FlightPath({
  placed, clock, schedule, palette, space,
}: {
  placed: PlacedItem[];
  clock: Clock;
  schedule: number[];
  palette: Palette;
  space: VehicleCargoSpace;
}) {
  const [active, setActive] = useState(-1);
  useFrame(() => {
    const now = clock.current;
    let a = -1;
    for (let i = placed.length - 1; i >= 0; i--) {
      const s = schedule[i] ?? Infinity;
      if (now >= s && now - s < FLIGHT_TIME + 0.1) {
        a = i;
        break;
      }
    }
    if (a !== active) setActive(a);
  });
  const points = useMemo(() => {
    if (active < 0) return null;
    const p = placed[active];
    const tx = p.x + p.dx / 2 - space.lengthM / 2;
    const ty = p.z + p.dz / 2;
    const tz = p.y + p.dy / 2 - space.widthM / 2;
    const sx = -space.lengthM / 2 - 5;
    const sy = space.heightM + 2.5;
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(sx, sy, 0),
      new THREE.Vector3((sx + tx) / 2, sy + 1.5, tz),
      new THREE.Vector3(tx, ty, tz)
    ).getPoints(24);
  }, [active, placed, space]);
  if (!points) return null;
  return <Line points={points} color={palette.teal} lineWidth={2} transparent opacity={0.7} />;
}

/* ------------------------- scene root ------------------------- */
function SceneRoot(props: LoadPlanSceneProps & { palette: Palette; clock: Clock; onPlaced: (n: number) => void }) {
  const { cargo, palette, runKey } = props;
  const running = runKey > 0;
  useEffect(() => {
    props.clock.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);
  const dist = Math.max(cargo.lengthM, cargo.widthM) * 1.5 + 8;
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[dist, cargo.heightM * 2 + 7, dist]}
        zoom={props.detail === "hero" ? 26 : 30}
        near={-100}
        far={300}
      />
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableRotate
        target={[0, cargo.heightM / 2, 0]}
        maxPolarAngle={Math.PI / 2.05}
      />
      <fog attach="fog" args={[palette.fog, 60, 160]} />
      <ambientLight intensity={palette.ambient} />
      <directionalLight position={[12, 18, 8]} intensity={palette.key + 0.6} color="#ffe8d6" />
      <directionalLight position={[-10, 8, -6]} intensity={palette.key * 0.6} color={palette.teal} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color={palette.floor} />
      </mesh>
      <gridHelper args={[90, 90, palette.upright, palette.upright]} position={[0, 0.001, 0]} />
      <VehicleShell space={cargo} palette={palette} />
      <Cartons
        placed={props.placed}
        clock={props.clock}
        running={running}
        schedule={props.schedule}
        mode={props.mode ?? "solid"}
        stops={props.stops}
        palette={palette}
        space={cargo}
      />
      <FlightPath placed={props.placed} clock={props.clock} schedule={props.schedule} palette={palette} space={cargo} />
      <Timekeeper
        clock={props.clock}
        running={running}
        onPlaced={props.onPlaced}
        schedule={props.schedule}
        total={props.placed.length}
      />
    </>
  );
}

/* ------------------------- HUD overlays ------------------------- */
function UtilRing({ volPct, wtPct }: { volPct: number; wtPct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const ri = r - 8;
  const ci = 2 * Math.PI * ri;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface/80 px-3 py-2 backdrop-blur">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="var(--data)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, volPct) / 100)}
          style={{ transition: "stroke-dashoffset 0.25s linear" }}
        />
        <circle cx="32" cy="32" r={ri} fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={ri} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={ci} strokeDashoffset={ci * (1 - Math.min(100, wtPct) / 100)}
          style={{ transition: "stroke-dashoffset 0.25s linear" }}
        />
      </svg>
      <div className="font-mono text-[10px] uppercase leading-4 tracking-[0.12em]">
        <div className="font-tnum text-data">VOL {volPct.toFixed(0)}%</div>
        <div className="font-tnum text-brand">WT {wtPct.toFixed(0)}%</div>
      </div>
    </div>
  );
}

function AxleBars({ wtPct }: { wtPct: number }) {
  const rows = [
    { label: "STEER", pct: Math.min(115, wtPct * 0.9 + 8), limit: "6T" },
    { label: "DRIVE", pct: Math.min(108, wtPct * 1.04), limit: "19T" },
  ];
  return (
    <div className="space-y-2 rounded-lg border border-line bg-surface/80 px-3 py-2 backdrop-blur">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between gap-6 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
            <span>{r.label}</span>
            <span className={r.pct > 100 ? "text-crit" : "text-data"}>
              {r.pct.toFixed(0)}% / {r.limit} {r.pct > 100 ? "✕" : "✓"}
            </span>
          </div>
          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-raised">
            <div
              className={r.pct > 100 ? "h-full rounded-full bg-crit" : "h-full rounded-full bg-data"}
              style={{ width: `${Math.min(100, r.pct)}%`, transition: "width 0.4s ease" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------- exported component ------------------------- */
export default function LoadPlanScene(props: LoadPlanSceneProps) {
  const palette = useScenePalette();
  const wrapRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [placedCount, setPlacedCount] = useState(0);

  useEffect(() => {
    setPlacedCount(0);
    clockRef.current = 0;
  }, [props.runKey]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNearViewport(e.isIntersecting), {
      rootMargin: "50% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const total = Math.max(1, props.placed.length);
  const frac = placedCount / total;
  const volPct = (props.finalVolPct ?? 0) * frac;
  const wtPct = (props.finalWtPct ?? 0) * frac;

  return (
    <div ref={wrapRef} className={props.className} style={{ position: "relative" }}>
      {nearViewport && (
        <Canvas dpr={[1, 1.75]} style={{ position: "absolute", inset: 0 }} gl={{ antialias: true }}>
          <SceneRoot {...props} palette={palette} clock={clockRef} onPlaced={setPlacedCount} />
        </Canvas>
      )}
      <div className="pointer-events-none absolute right-3 top-3">
        <UtilRing volPct={volPct} wtPct={wtPct} />
      </div>
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-line bg-surface/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink1 backdrop-blur">
        <span className="font-tnum text-ink0">{placedCount}</span>
        <span className="text-ink2">/{props.placed.length} ITEMS PLACED</span>
        {props.leftoverNote && <div className="mt-1 text-warn">{props.leftoverNote}</div>}
      </div>
      {props.detail === "full" && (
        <div className="pointer-events-none absolute bottom-3 left-3">
          <AxleBars wtPct={wtPct} />
        </div>
      )}
    </div>
  );
}
