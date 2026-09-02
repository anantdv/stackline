import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  CameraControls,
  Grid,
  Html,
  OrthographicCamera,
} from "@react-three/drei";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";

/* ------------------------------------------------------------------ */
/* Layout constants: 6 rows x 8 bays x 4 levels                        */
/* ------------------------------------------------------------------ */
const ROWS = 6;
const BAYS = 8;
const LEVELS = 4;
const BAY_W = 2;
const LEVEL_H = 1.6;
const DEPTH = 1.2;
const AISLE = 3.2;
const RACK_H = LEVELS * LEVEL_H;
const RACK_W = BAYS * BAY_W;

const rowZ = (r: number) => (r - (ROWS - 1) / 2) * (DEPTH + AISLE);
const bayCenterX = (b: number) => (b + 0.5) * BAY_W - RACK_W / 2;
const binY = (l: number) => l * LEVEL_H;

/** Deterministic pseudo-random so the twin is stable between renders. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/* ------------------------------------------------------------------ */
/* Rack frames + cartons, instanced, rising construction animation     */
/* ------------------------------------------------------------------ */
function RackRow({ row, delay }: { row: number; delay: number }) {
  const group = useRef<THREE.Group>(null);
  const uprights = useRef<THREE.InstancedMesh>(null);
  const beams = useRef<THREE.InstancedMesh>(null);
  const cartons = useRef<THREE.InstancedMesh>(null);

  const { cartonPositions, cartonColors } = useMemo(() => {
    const rand = seeded(1234 + row * 999);
    const positions: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    const kraft = new THREE.Color("#C8A27A");
    for (let b = 0; b < BAYS; b++) {
      for (let l = 0; l < LEVELS; l++) {
        if (rand() < 0.92) {
          positions.push(
            new THREE.Vector3(
              bayCenterX(b) + (rand() - 0.5) * 0.3,
              binY(l) + 0.42,
              rowZ(row) + (rand() - 0.5) * 0.3
            )
          );
          colors.push(
            kraft.clone().multiplyScalar(0.8 + rand() * 0.2)
          );
        }
      }
    }
    return { cartonPositions: positions, cartonColors: colors };
  }, [row]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    // Uprights: (BAYS+1) columns x 2 sides
    if (uprights.current) {
      let i = 0;
      for (let b = 0; b <= BAYS; b++) {
        for (const side of [-1, 1]) {
          m.makeTranslation(
            b * BAY_W - RACK_W / 2,
            RACK_H / 2,
            rowZ(row) + (side * DEPTH) / 2
          );
          uprights.current.setMatrixAt(i++, m);
        }
      }
      uprights.current.instanceMatrix.needsUpdate = true;
    }
    // Beams: BAYS x LEVELS x 2 sides
    if (beams.current) {
      let i = 0;
      for (let b = 0; b < BAYS; b++) {
        for (let l = 0; l < LEVELS; l++) {
          for (const side of [-1, 1]) {
            m.makeTranslation(
              bayCenterX(b),
              binY(l) + LEVEL_H - 0.05,
              rowZ(row) + (side * DEPTH) / 2
            );
            beams.current.setMatrixAt(i++, m);
          }
        }
      }
      beams.current.instanceMatrix.needsUpdate = true;
    }
    // Cartons
    if (cartons.current) {
      cartonPositions.forEach((p, i) => {
        m.makeTranslation(p.x, p.y, p.z);
        cartons.current!.setMatrixAt(i, m);
        cartons.current!.setColorAt(i, cartonColors[i]);
      });
      cartons.current.instanceMatrix.needsUpdate = true;
      if (cartons.current.instanceColor)
        cartons.current.instanceColor.needsUpdate = true;
    }
  }, [row, cartonPositions, cartonColors]);

  // Construction intro: racks rise, then cartons pop
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const rackT = THREE.MathUtils.clamp((t - delay) / 0.55, 0, 1);
    g.scale.y = easeOutCubic(rackT) || 0.0001;
    if (cartons.current) {
      const popT = THREE.MathUtils.clamp((t - 0.7 - delay) / 0.45, 0, 1);
      cartons.current.scale.setScalar(easeOutBack(popT) || 0.0001);
    }
  });

  return (
    <group ref={group}>
      <instancedMesh
        ref={uprights}
        args={[undefined, undefined, (BAYS + 1) * 2]}
        castShadow
      >
        <boxGeometry args={[0.12, RACK_H, 0.12]} />
        <meshStandardMaterial color="#39424E" roughness={0.6} metalness={0.4} />
      </instancedMesh>
      <instancedMesh
        ref={beams}
        args={[undefined, undefined, BAYS * LEVELS * 2]}
      >
        <boxGeometry args={[BAY_W - 0.12, 0.1, 0.07]} />
        <meshStandardMaterial
          color="#FF6B1A"
          roughness={0.45}
          metalness={0.3}
          emissive="#FF6B1A"
          emissiveIntensity={0.12}
        />
      </instancedMesh>
      <instancedMesh
        ref={cartons}
        args={[undefined, undefined, cartonPositions.length]}
        castShadow
      >
        <boxGeometry args={[0.95, 0.72, 0.85]} />
        <meshStandardMaterial roughness={0.85} metalness={0.02} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Ambient carton move along a teal bezier path + fading trail         */
/* ------------------------------------------------------------------ */
const TRAIL_POINTS = 72;

function MovingCarton({ enabled }: { enabled: boolean }) {
  const box = useRef<THREE.Mesh>(null);
  const trailGeom = useMemo(() => new THREE.BufferGeometry(), []);
  const trail = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: "#2DD4BF",
      dashSize: 0.35,
      gapSize: 0.2,
      transparent: true,
      opacity: 0,
    });
    const line = new THREE.Line(trailGeom, mat);
    line.frustumCulled = false;
    return line;
  }, [trailGeom]);

  const state = useRef({
    active: false,
    start: 0,
    dur: 2.2,
    nextAt: 2.5,
    fadeStart: -1,
    from: new THREE.Vector3(),
    ctrl: new THREE.Vector3(),
    to: new THREE.Vector3(),
    positions: new Float32Array(TRAIL_POINTS * 3),
    count: 0,
  });

  const rand = useMemo(() => seeded(777), []);

  useFrame(({ clock }) => {
    const s = state.current;
    const t = clock.elapsedTime;
    const mat = trail.material as THREE.LineDashedMaterial;

    if (!enabled) {
      mat.opacity = 0;
      if (box.current) box.current.visible = false;
      return;
    }

    // Schedule a new move
    if (!s.active && t >= s.nextAt) {
      const r1 = Math.floor(rand() * ROWS);
      let r2 = Math.floor(rand() * ROWS);
      if (r2 === r1) r2 = (r2 + 1) % ROWS;
      const b1 = Math.floor(rand() * BAYS);
      const b2 = Math.floor(rand() * BAYS);
      const l1 = Math.floor(rand() * 2);
      const l2 = Math.floor(rand() * 2);
      s.from.set(bayCenterX(b1), binY(l1) + 0.42, rowZ(r1));
      s.to.set(bayCenterX(b2), binY(l2) + 0.42, rowZ(r2));
      s.ctrl
        .copy(s.from)
        .add(s.to)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, 3.2, 0));
      s.active = true;
      s.start = t;
      s.count = 0;
      s.fadeStart = -1;
      mat.opacity = 0.95;
      if (box.current) box.current.visible = true;
    }

    if (s.active) {
      const k = Math.min(1, (t - s.start) / s.dur);
      const e = easeOutCubic(k);
      // Quadratic bezier
      const p = new THREE.Vector3()
        .copy(s.from)
        .multiplyScalar((1 - e) * (1 - e))
        .addScaledVector(s.ctrl, 2 * (1 - e) * e)
        .addScaledVector(s.to, e * e);
      if (box.current) {
        box.current.position.copy(p);
        box.current.rotation.y = e * Math.PI * 0.5;
      }
      // Trail
      if (s.count < TRAIL_POINTS) {
        s.positions[s.count * 3] = p.x;
        s.positions[s.count * 3 + 1] = p.y;
        s.positions[s.count * 3 + 2] = p.z;
        s.count++;
      }
      trailGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(s.positions, 3)
      );
      trailGeom.setDrawRange(0, s.count);
      trail.computeLineDistances();
      if (k >= 1) {
        s.active = false;
        s.nextAt = t + 3.5;
        s.fadeStart = t;
        if (box.current) box.current.visible = false;
      }
    } else if (s.fadeStart > 0) {
      const f = 1 - Math.min(1, (t - s.fadeStart) / 0.7);
      mat.opacity = f * 0.95;
      if (f <= 0) {
        s.fadeStart = -1;
        s.count = 0;
        trailGeom.setDrawRange(0, 0);
      }
    }
  });

  return (
    <group>
      <mesh ref={box} visible={false} castShadow>
        <boxGeometry args={[0.95, 0.72, 0.85]} />
        <meshStandardMaterial
          color="#C8A27A"
          roughness={0.8}
          emissive="#2DD4BF"
          emissiveIntensity={0.15}
        />
      </mesh>
      <primitive object={trail} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* AGV puck robots gliding along aisles                                */
/* ------------------------------------------------------------------ */
function Agv({
  aisleZ,
  speed,
  phase,
  enabled,
}: {
  aisleZ: number;
  speed: number;
  phase: number;
  enabled: boolean;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current || !enabled) return;
    const t = clock.elapsedTime * speed + phase;
    const x = Math.sin(t) * (RACK_W / 2 + 2.5);
    g.current.position.set(x, 0.1, aisleZ);
    g.current.rotation.y = Math.cos(t) > 0 ? 0 : Math.PI;
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.18, 24]} />
        <meshStandardMaterial color="#1A2029" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.34, 24]} />
        <meshBasicMaterial color="#FF6B1A" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Hover hit-boxes per rack row + floating mono bin label              */
/* ------------------------------------------------------------------ */
function RackHotspots({
  onHover,
}: {
  onHover: (h: { row: number; point: THREE.Vector3 } | null) => void;
}) {
  return (
    <group>
      {Array.from({ length: ROWS }, (_, r) => (
        <mesh
          key={r}
          position={[0, RACK_H / 2, rowZ(r)]}
          onPointerMove={(e) => {
            e.stopPropagation();
            onHover({ row: r, point: e.point.clone() });
          }}
          onPointerOut={() => onHover(null)}
          visible={false}
        >
          <boxGeometry args={[RACK_W + 0.4, RACK_H, DEPTH + 0.6]} />
          <meshBasicMaterial />
        </mesh>
      ))}
    </group>
  );
}

function binIdFor(row: number, point: THREE.Vector3) {
  const bay = THREE.MathUtils.clamp(
    Math.floor((point.x + RACK_W / 2) / BAY_W) + 1,
    1,
    BAYS
  );
  const level = THREE.MathUtils.clamp(
    Math.floor(point.y / LEVEL_H) + 1,
    1,
    LEVELS
  );
  const cap = 55 + ((row * 37 + bay * 13 + level * 7) % 43);
  return {
    id: `B-0${row + 1}-0${bay}-0${level}`,
    cap,
  };
}

/* ------------------------------------------------------------------ */
/* Camera rig: orthographic isometric, intro sweep + idle drift        */
/* ------------------------------------------------------------------ */
function Rig({ reduced }: { reduced: boolean }) {
  const controls = useRef<CameraControlsImpl | null>(null);
  const interacting = useRef(false);
  const introDone = useRef(false);

  useFrame(({ clock }, delta) => {
    const c = controls.current;
    if (!c || reduced) return;
    const t = clock.elapsedTime;
    // Intro: azimuth 30deg -> 45deg over ~1.8s
    const introK = Math.min(1, t / 1.8);
    const az = THREE.MathUtils.degToRad(30 + 15 * easeOutCubic(introK));
    if (!interacting.current) {
      const drift = introDone.current ? Math.sin(t * 0.15) * 0.06 : 0;
      c.azimuthAngle = az + drift;
      if (introK >= 1) introDone.current = true;
    }
    c.update(delta);
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      polarAngle={THREE.MathUtils.degToRad(55)}
      minPolarAngle={THREE.MathUtils.degToRad(40)}
      maxPolarAngle={THREE.MathUtils.degToRad(68)}
      minZoom={16}
      maxZoom={46}
      onStart={() => (interacting.current = true)}
      onEnd={() => (interacting.current = false)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
function Scene({ reduced }: { reduced: boolean }) {
  const [hover, setHover] = useState<{
    row: number;
    point: THREE.Vector3;
  } | null>(null);

  return (
    <>
      <OrthographicCamera makeDefault position={[42, 28, 42]} zoom={22} />
      <Rig reduced={reduced} />

      <color attach="background" args={["#07090C"]} />
      <fog attach="fog" args={["#07090C", 40, 120]} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[18, 26, 10]} intensity={1.1} color="#FFB27A" />
      <directionalLight position={[-14, 18, -12]} intensity={0.45} color="#2DD4BF" />

      {/* Floor + blueprint grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#0C0F13" roughness={1} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[220, 220]}
        cellSize={1.2}
        cellThickness={0.6}
        cellColor="#1E2833"
        sectionSize={6}
        sectionThickness={1}
        sectionColor="#274050"
        fadeDistance={90}
        fadeStrength={2}
      />

      {Array.from({ length: ROWS }, (_, r) => (
        <RackRow key={r} row={r} delay={0.25 + r * 0.12} />
      ))}

      <MovingCarton enabled={!reduced} />
      <Agv aisleZ={0} speed={0.28} phase={0} enabled={!reduced} />
      <Agv aisleZ={(DEPTH + AISLE) * 1.5} speed={0.22} phase={2.2} enabled={!reduced} />

      <RackHotspots onHover={setHover} />

      {/* Hover row highlight */}
      {hover && (
        <mesh position={[0, RACK_H / 2, rowZ(hover.row)]}>
          <boxGeometry args={[RACK_W + 0.5, RACK_H + 0.1, DEPTH + 0.7]} />
          <meshBasicMaterial color="#FF6B1A" transparent opacity={0.07} />
        </mesh>
      )}
      {hover && (
        <Html
          position={[
            hover.point.x,
            Math.min(hover.point.y + 0.9, RACK_H + 0.6),
            hover.point.z,
          ]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[30, 0]}
        >
          <div className="rounded border border-linestrong bg-void/90 px-2.5 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink0 shadow-glow whitespace-nowrap">
            {binIdFor(hover.row, hover.point).id}
            <span className="text-data">
              {" "}
              · {binIdFor(hover.row, hover.point).cap}%
            </span>
          </div>
        </Html>
      )}
    </>
  );
}

export default function HeroScene() {
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      style={{ width: "100%", height: "100%", cursor: "grab" }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).style.cursor = "grabbing";
      }}
      onPointerUp={(e) => {
        (e.target as HTMLElement).style.cursor = "grab";
      }}
    >
      <Scene reduced={reduced} />
    </Canvas>
  );
}
