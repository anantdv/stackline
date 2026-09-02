import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import CameraControlsImpl from "camera-controls";
import {
  capacityColor,
  type ViewerBin,
  type ViewerLayout,
} from "@/components/warehouse/data";

export type DisplayMode = "solid" | "wireframe" | "heatmap" | "xray";
export type NavMode = "orbit" | "pan" | "walk";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const KRAFT = new THREE.Color("#C8A27A");

function codeTone(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) % 997;
  return 0.68 + (h % 30) / 100;
}

/** Canvas-texture cache for bin ID label sprites (works offline). */
const labelTextureCache = new Map<string, THREE.CanvasTexture>();
function binLabelTexture(code: string): THREE.CanvasTexture {
  const hit = labelTextureCache.get(code);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 80;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(7,9,12,0.78)";
  ctx.beginPath();
  ctx.roundRect(4, 8, 312, 64, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#E6EDF3";
  ctx.font = '600 40px "JetBrains Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(code, 160, 42);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  labelTextureCache.set(code, tex);
  return tex;
}

/* ------------------------------------------------------------------ */
/* Mode appearance targets                                             */
/* ------------------------------------------------------------------ */

interface BinTarget {
  color: THREE.Color;
  opacity: number;
  wire: boolean;
  heightFrac: number; // fraction of usable level height
}

function binTarget(bin: ViewerBin, mode: DisplayMode, showCartons: boolean): BinTarget {
  const tone = codeTone(bin.code);
  const filled = bin.usedQty > 0 && showCartons;
  const fillFrac = Math.max(bin.fill / 100, 0.12);
  if (bin.blocked)
    return { color: new THREE.Color("#F4504E"), opacity: 0.3, wire: false, heightFrac: 0.04 };
  switch (mode) {
    case "heatmap":
      return filled
        ? { color: new THREE.Color(capacityColor(bin.fill)), opacity: 0.96, wire: false, heightFrac: fillFrac * 0.82 }
        : { color: new THREE.Color("#202833"), opacity: 0.3, wire: false, heightFrac: 0.035 };
    case "wireframe":
      return {
        color: new THREE.Color(filled ? "#9FB2C8" : "#4A586C"),
        opacity: filled ? 0.9 : 0.4,
        wire: true,
        heightFrac: filled ? fillFrac * 0.82 : 0.8,
      };
    case "xray":
      return filled
        ? { color: KRAFT.clone().multiplyScalar(tone + 0.25), opacity: 1, wire: false, heightFrac: fillFrac * 0.82 }
        : { color: new THREE.Color("#2A3442"), opacity: 0.08, wire: false, heightFrac: 0.035 };
    case "solid":
    default:
      return filled
        ? { color: KRAFT.clone().multiplyScalar(tone), opacity: 1, wire: false, heightFrac: fillFrac * 0.82 }
        : { color: new THREE.Color("#242C37"), opacity: 0.35, wire: false, heightFrac: 0.035 };
  }
}

function steelTarget(mode: DisplayMode) {
  switch (mode) {
    case "heatmap":
      return { up: "#232B36", beam: "#3A4552", opacity: 0.9, wire: false, emissive: 0.02 };
    case "wireframe":
      return { up: "#55637A", beam: "#FF6B1A", opacity: 0.85, wire: true, emissive: 0.1 };
    case "xray":
      return { up: "#39424E", beam: "#FF6B1A", opacity: 0.1, wire: false, emissive: 0.04 };
    case "solid":
    default:
      return { up: "#39424E", beam: "#FF6B1A", opacity: 1, wire: false, emissive: 0.12 };
  }
}

/* ------------------------------------------------------------------ */
/* Rack steel (instanced uprights + beams) with crossfading materials  */
/* ------------------------------------------------------------------ */

function RackSteel({
  bays,
  levels,
  bayW,
  levelH,
  depth,
  mode,
}: {
  bays: number;
  levels: number;
  bayW: number;
  levelH: number;
  depth: number;
  mode: DisplayMode;
}) {
  const uprights = useRef<THREE.InstancedMesh>(null);
  const beams = useRef<THREE.InstancedMesh>(null);
  const upMat = useRef<THREE.MeshStandardMaterial>(null);
  const beamMat = useRef<THREE.MeshStandardMaterial>(null);
  const rackW = bays * bayW;
  const rackH = levels * levelH;

  useEffect(() => {
    const m = new THREE.Matrix4();
    if (uprights.current) {
      let i = 0;
      for (let b = 0; b <= bays; b++) {
        for (const side of [-1, 1]) {
          m.makeTranslation(b * bayW - rackW / 2, rackH / 2, (side * depth) / 2);
          uprights.current.setMatrixAt(i++, m);
        }
      }
      uprights.current.instanceMatrix.needsUpdate = true;
    }
    if (beams.current) {
      let i = 0;
      for (let b = 0; b < bays; b++) {
        for (let l = 0; l < levels; l++) {
          for (const side of [-1, 1]) {
            m.makeTranslation(
              (b + 0.5) * bayW - rackW / 2,
              l * levelH + levelH - 0.05,
              (side * depth) / 2
            );
            beams.current.setMatrixAt(i++, m);
          }
        }
      }
      beams.current.instanceMatrix.needsUpdate = true;
    }
  }, [bays, levels, bayW, levelH, depth, rackW, rackH]);

  // Crossfade steel materials on mode change (~0.4s)
  useFrame((_, dt) => {
    const t = steelTarget(mode);
    const d = Math.min(dt, 0.05);
    const lerpTo = (mat: THREE.MeshStandardMaterial | null, hex: string) => {
      if (!mat) return;
      mat.color.lerp(new THREE.Color(hex), 1 - Math.exp(-d / 0.13));
      mat.opacity = THREE.MathUtils.damp(mat.opacity, t.opacity, 10, d);
      mat.wireframe = t.wire;
      if (mat.emissiveIntensity !== undefined)
        mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, t.emissive, 10, d);
    };
    lerpTo(upMat.current, t.up);
    lerpTo(beamMat.current, t.beam);
  });

  return (
    <group>
      <instancedMesh
        ref={uprights}
        args={[undefined, undefined, (bays + 1) * 2]}
        key={`u${bays}-${levels}-${rackH}`}
      >
        <boxGeometry args={[0.12, rackH, 0.12]} />
        <meshStandardMaterial
          ref={upMat}
          color="#39424E"
          roughness={0.6}
          metalness={0.4}
          transparent
        />
      </instancedMesh>
      <instancedMesh
        ref={beams}
        args={[undefined, undefined, bays * levels * 2]}
        key={`b${bays}-${levels}`}
      >
        <boxGeometry args={[bayW - 0.12, 0.1, 0.07]} />
        <meshStandardMaterial
          ref={beamMat}
          color="#FF6B1A"
          roughness={0.45}
          metalness={0.3}
          emissive="#FF6B1A"
          emissiveIntensity={0.12}
          transparent
        />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Individual selectable bin box                                       */
/* ------------------------------------------------------------------ */

function BinBox({
  bin,
  layout,
  mode,
  showCartons,
  selected,
  onSelect,
  onHover,
}: {
  bin: ViewerBin;
  layout: ViewerLayout;
  mode: DisplayMode;
  showCartons: boolean;
  selected: boolean;
  onSelect: (bin: ViewerBin) => void;
  onHover: (bin: ViewerBin | null) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  const rackW = layout.bays * layout.bayW;
  const x = (bin.bay - 0.5) * layout.bayW - rackW / 2;
  const baseY = (bin.level - 1) * layout.levelH;
  const w = layout.bayW - 0.22;
  const d = layout.depth - 0.22;
  const usableH = layout.levelH - 0.18;

  useFrame((_, dt) => {
    const t = binTarget(bin, mode, showCartons);
    const delta = Math.min(dt, 0.05);
    const k = 1 - Math.exp(-delta / 0.13); // ~0.4s crossfade
    const m = mat.current;
    const g = mesh.current;
    if (!m || !g) return;
    m.color.lerp(t.color, k);
    m.opacity = THREE.MathUtils.damp(m.opacity, t.opacity, 10, delta);
    m.wireframe = t.wire;
    m.emissive.set(selected ? "#FF6B1A" : "#000000");
    m.emissiveIntensity = selected ? 0.35 : 0;
    const targetH = Math.max(usableH * t.heightFrac, 0.05);
    const h = THREE.MathUtils.damp(g.scale.y, targetH, 8, delta);
    g.scale.set(w, h, d);
    g.position.y = baseY + h / 2 + 0.04;
  });

  return (
    <mesh
      ref={mesh}
      position={[x, baseY + 0.1, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(bin);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(bin);
      }}
      onPointerOut={() => onHover(null)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        ref={mat}
        color="#242C37"
        roughness={0.85}
        metalness={0.03}
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Selection frame + bin ID label sprite                               */
/* ------------------------------------------------------------------ */

function SelectionFrame({
  bin,
  layout,
}: {
  bin: ViewerBin;
  layout: ViewerLayout;
}) {
  const g = useRef<THREE.Group>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const edges = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(layout.bayW - 0.06, layout.levelH - 0.04, layout.depth - 0.06)
      ),
    [layout.bayW, layout.levelH, layout.depth]
  );
  const rackW = layout.bays * layout.bayW;
  const x = (bin.bay - 0.5) * layout.bayW - rackW / 2;
  const y = (bin.level - 1) * layout.levelH + layout.levelH / 2;

  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 6) * 0.035;
    g.current?.scale.setScalar(s);
    if (mat.current) mat.current.opacity = 0.65 + Math.sin(clock.elapsedTime * 6) * 0.35;
  });

  return (
    <group ref={g} position={[x, y, 0]}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={mat} color="#FF6B1A" transparent linewidth={2} />
      </lineSegments>
    </group>
  );
}

function BinLabelSprite({
  bin,
  layout,
}: {
  bin: ViewerBin;
  layout: ViewerLayout;
}) {
  const tex = useMemo(() => binLabelTexture(bin.code), [bin.code]);
  const rackW = layout.bays * layout.bayW;
  const x = (bin.bay - 0.5) * layout.bayW - rackW / 2;
  const y = (bin.level - 1) * layout.levelH + layout.levelH * 0.55;
  const s = Math.max(layout.bayW * 0.62, 0.7);
  return (
    <sprite position={[x, y, layout.depth / 2 + 0.22]} scale={[s, s * 0.25, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  );
}

/* ------------------------------------------------------------------ */
/* Rack row with explode spring (stiffness 120, damping 18)            */
/* ------------------------------------------------------------------ */

function ExplodeRow({
  index,
  center,
  spacing,
  exploded,
  children,
}: {
  index: number;
  center: number;
  spacing: number;
  exploded: boolean;
  children: ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  const spring = useRef({ x: 0, v: 0 });

  useFrame((_, dt) => {
    const s = spring.current;
    const d = Math.min(dt, 0.033);
    const target = exploded ? 1 : 0;
    s.v += ((target - s.x) * 120 - s.v * 18) * d;
    s.x += s.v * d;
    g.current?.position.set(0, 0, (index - center) * spacing * (1 + s.x * 0.85));
  });

  return <group ref={g}>{children}</group>;
}

/* ------------------------------------------------------------------ */
/* Camera rig: orbit / pan via CameraControls, walk via WASD+drag      */
/* ------------------------------------------------------------------ */

function WalkControls({
  active,
  bounds,
  start,
}: {
  active: boolean;
  bounds: { x: number; z: number };
  start: { x: number; z: number };
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const look = useRef({ yaw: 0, pitch: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!active) return;
    look.current = { yaw: 0, pitch: 0 };
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, 0, 0);
    camera.position.set(start.x, 1.7, start.z);

    const kd = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      keys.current.add(e.code);
    };
    const ku = (e: KeyboardEvent) => keys.current.delete(e.code);
    const el = gl.domElement;
    const pd = (e: PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const pm = (e: PointerEvent) => {
      if (!drag.current) return;
      look.current.yaw -= (e.clientX - drag.current.x) * 0.0032;
      look.current.pitch = THREE.MathUtils.clamp(
        look.current.pitch - (e.clientY - drag.current.y) * 0.0032,
        -1.15,
        1.15
      );
      drag.current = { x: e.clientX, y: e.clientY };
    };
    const pu = () => (drag.current = null);

    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    el.addEventListener("pointerdown", pd);
    el.addEventListener("pointermove", pm);
    el.addEventListener("pointerup", pu);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      el.removeEventListener("pointerdown", pd);
      el.removeEventListener("pointermove", pm);
      el.removeEventListener("pointerup", pu);
      keys.current.clear();
    };
  }, [active, camera, gl, start.x, start.z]);

  useFrame((_, dt) => {
    if (!active) return;
    const d = Math.min(dt, 0.05);
    camera.rotation.y = look.current.yaw;
    camera.rotation.x = look.current.pitch;
    const speed = keys.current.has("ShiftLeft") || keys.current.has("ShiftRight") ? 9 : 4.5;
    const k = keys.current;
    const f =
      (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) -
      (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const r =
      (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) -
      (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    if (f || r) {
      const sin = Math.sin(look.current.yaw);
      const cos = Math.cos(look.current.yaw);
      camera.position.x += (-sin * f + cos * r) * speed * d;
      camera.position.z += (-cos * f - sin * r) * speed * d;
    }
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -bounds.x, bounds.x);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -bounds.z, bounds.z);
    camera.position.y = 1.7;
  });

  return null;
}

function CameraRig({
  navMode,
  extentW,
  extentZ,
}: {
  navMode: NavMode;
  extentW: number;
  extentZ: number;
}) {
  const controls = useRef<CameraControlsImpl | null>(null);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (navMode === "walk") return; // controls unmounted in walk mode
    c.enabled = true;
    c.mouseButtons.left =
      navMode === "pan"
        ? CameraControlsImpl.ACTION.TRUCK
        : CameraControlsImpl.ACTION.ROTATE;
    const d = Math.max(extentW, extentZ) * 1.02 + 9;
    c.setLookAt(d * 0.72, d * 0.6, d * 0.72, 0, 1.2, 0, true);
  }, [navMode, extentW, extentZ, camera]);

  if (navMode === "walk") return null;

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={5}
      maxDistance={140}
      minPolarAngle={THREE.MathUtils.degToRad(18)}
      maxPolarAngle={THREE.MathUtils.degToRad(78)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export interface ViewerSceneProps {
  layout: ViewerLayout;
  mode: DisplayMode;
  navMode: NavMode;
  showCartons: boolean;
  showLabels: boolean;
  exploded: boolean;
  selectedCode: string | null;
  onSelect: (bin: ViewerBin | null) => void;
}

function Scene({
  layout,
  mode,
  navMode,
  showCartons,
  showLabels,
  exploded,
  selectedCode,
  onSelect,
}: ViewerSceneProps) {
  const [hovered, setHovered] = useState<ViewerBin | null>(null);

  const rowsBins = useMemo(() => {
    const rows: ViewerBin[][] = Array.from({ length: layout.rows }, () => []);
    for (const b of layout.bins) rows[b.rackIndex]?.push(b);
    return rows;
  }, [layout]);

  const rackW = layout.bays * layout.bayW;
  const spacing = layout.depth + layout.aisle;
  const center = (layout.rows - 1) / 2;
  const extentZ = layout.rows * spacing;
  const extentW = rackW + layout.aisle * 2;
  const ground = Math.max(extentW, extentZ) * 3 + 40;

  const hoverPos = useMemo(() => {
    if (!hovered) return null;
    const x = (hovered.bay - 0.5) * layout.bayW - rackW / 2;
    const y = (hovered.level - 1) * layout.levelH + layout.levelH + 0.45;
    return { row: hovered.rackIndex, pos: [x, y, 0] as [number, number, number] };
  }, [hovered, layout, rackW]);

  return (
    <>
      <CameraRig navMode={navMode} extentW={extentW} extentZ={extentZ} />
      <WalkControls
        active={navMode === "walk"}
        bounds={{ x: extentW / 2 + 4, z: extentZ / 2 + 6 }}
        start={{ x: 0, z: extentZ / 2 + 4 }}
      />

      <color attach="background" args={["#07090C"]} />
      <fog attach="fog" args={["#07090C", ground * 0.35, ground * 0.95]} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[18, 26, 10]} intensity={1.1} color="#FFB27A" />
      <directionalLight position={[-14, 18, -12]} intensity={0.45} color="#2DD4BF" />

      {/* Floor + blueprint grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[ground, ground]} />
        <meshStandardMaterial color="#0C0F13" roughness={1} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[ground, ground]}
        cellSize={1.2}
        cellThickness={0.6}
        cellColor="#1E2833"
        sectionSize={6}
        sectionThickness={1}
        sectionColor="#274050"
        fadeDistance={ground * 0.55}
        fadeStrength={2}
      />

      {rowsBins.map((bins, r) => (
        <ExplodeRow
          key={`${r}-${layout.code}`}
          index={r}
          center={center}
          spacing={spacing}
          exploded={exploded}
        >
          <RackSteel
            bays={layout.bays}
            levels={layout.levels}
            bayW={layout.bayW}
            levelH={layout.levelH}
            depth={layout.depth}
            mode={mode}
          />
          {bins.map((bin) => (
            <BinBox
              key={bin.code}
              bin={bin}
              layout={layout}
              mode={mode}
              showCartons={showCartons}
              selected={bin.code === selectedCode}
              onSelect={(b) => onSelect(b)}
              onHover={setHovered}
            />
          ))}
          {(showLabels || mode === "xray") &&
            bins.map((bin) => (
              <BinLabelSprite key={`lbl-${bin.code}`} bin={bin} layout={layout} />
            ))}
          {selectedCode &&
            bins.some((b) => b.code === selectedCode) && (
              <SelectionFrame
                bin={bins.find((b) => b.code === selectedCode)!}
                layout={layout}
              />
            )}
          {hoverPos && hoverPos.row === r && navMode !== "walk" && (
            <Html
              position={hoverPos.pos}
              center
              style={{ pointerEvents: "none" }}
              zIndexRange={[30, 0]}
            >
              <div className="whitespace-nowrap rounded border border-linestrong bg-void/90 px-2.5 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink0 shadow-glow">
                {hovered?.code}
                <span style={{ color: capacityColor(hovered?.fill ?? 0) }}>
                  {" "}
                  · {Math.round(hovered?.fill ?? 0)}%
                </span>
              </div>
            </Html>
          )}
        </ExplodeRow>
      ))}
    </>
  );
}

export default function ViewerScene(props: ViewerSceneProps) {
  const cursor =
    props.navMode === "walk"
      ? "crosshair"
      : props.navMode === "pan"
        ? "move"
        : "grab";
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [26, 20, 26], fov: 32, near: 0.1, far: 600 }}
      style={{ width: "100%", height: "100%", cursor }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <Scene {...props} />
    </Canvas>
  );
}
