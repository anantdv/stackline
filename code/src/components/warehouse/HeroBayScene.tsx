import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Single rack bay assembling in a slow loop:                          */
/* uprights rise → beams snap in (click pulse) → cartons slide in.     */
/* Ping-pong cycle: 2.8s assemble, 2.8s disassemble.                   */
/* ------------------------------------------------------------------ */

const BAY_W = 2.7;
const LEVEL_H = 1.4;
const LEVELS = 4;
const DEPTH = 1.1;
const RACK_H = LEVELS * LEVEL_H;
const CYCLE = 2.8; // seconds per direction

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
/** 0→1→0 ping-pong phase over 2*CYCLE seconds */
const phase = (t: number) => {
  const m = (t % (CYCLE * 2)) / CYCLE;
  return m <= 1 ? m : 2 - m;
};

function Upright({ x, z, delay }: { x: number; z: number; delay: number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const p = phase(clock.elapsedTime);
    const k = easeOutCubic(THREE.MathUtils.clamp((p - delay) / 0.28, 0, 1));
    m.current?.scale.set(1, Math.max(k, 0.0001), 1);
    if (m.current) m.current.position.y = (RACK_H * Math.max(k, 0.0001)) / 2;
  });
  return (
    <mesh ref={m} position={[x, 0, z]} castShadow>
      <boxGeometry args={[0.12, RACK_H, 0.12]} />
      <meshStandardMaterial color="#39424E" roughness={0.6} metalness={0.4} />
    </mesh>
  );
}

function Beam({ y, z, delay }: { y: number; z: number; delay: number }) {
  const m = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const p = phase(clock.elapsedTime);
    const local = THREE.MathUtils.clamp((p - delay) / 0.14, 0, 1);
    // 80ms "click" scale-pulse when the beam locks in
    const pulseAge = (p - delay) / 0.08;
    const pulse =
      pulseAge > 0 && pulseAge < 1.6
        ? 1 + 0.16 * Math.exp(-pulseAge * 3) * Math.sin(pulseAge * 22)
        : 1;
    const k = easeOutBack(local) || 0.0001;
    m.current?.scale.set(Math.max(k * pulse, 0.0001), 1, 1);
    if (mat.current)
      mat.current.emissiveIntensity =
        0.12 + (pulseAge > 0 && pulseAge < 1 ? (1 - pulseAge) * 0.7 : 0);
  });
  return (
    <mesh ref={m} position={[0, y, z]}>
      <boxGeometry args={[BAY_W - 0.12, 0.1, 0.07]} />
      <meshStandardMaterial
        ref={mat}
        color="#FF6B1A"
        roughness={0.45}
        metalness={0.3}
        emissive="#FF6B1A"
        emissiveIntensity={0.12}
      />
    </mesh>
  );
}

function Carton({
  x,
  y,
  z,
  delay,
  seed,
}: {
  x: number;
  y: number;
  z: number;
  delay: number;
  seed: number;
}) {
  const m = useRef<THREE.Mesh>(null);
  const rng = useMemo(() => {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }, [seed]);
  const { sx, sy, sz, slideZ, tone } = useMemo(
    () => ({
      sx: 0.7 + rng() * 0.4,
      sy: 0.5 + rng() * 0.4,
      sz: 0.6 + rng() * 0.3,
      slideZ: 1.6 + rng() * 0.8,
      tone: 0.75 + rng() * 0.25,
    }),
    [rng]
  );
  useFrame(({ clock }) => {
    const p = phase(clock.elapsedTime);
    const k = easeOutCubic(THREE.MathUtils.clamp((p - delay) / 0.3, 0, 1));
    if (!m.current) return;
    m.current.position.z = z + (1 - k) * slideZ;
    m.current.scale.setScalar(Math.max(k, 0.0001));
  });
  const c = useMemo(
    () => new THREE.Color("#C8A27A").multiplyScalar(tone),
    [tone]
  );
  return (
    <mesh ref={m} position={[x, y, z]} castShadow>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color={c} roughness={0.85} metalness={0.02} />
    </mesh>
  );
}

function AssemblyScene({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);

  // Slow 20s dolly drift around the bay
  useFrame(({ camera, clock }) => {
    if (reduced) return;
    const a = clock.elapsedTime * ((Math.PI * 2) / 20) * 0.35;
    const r = 7.4;
    camera.position.set(Math.sin(0.62 + Math.sin(a) * 0.22) * r, 3.6 + Math.sin(a * 0.7) * 0.35, Math.cos(0.62 + Math.sin(a) * 0.22) * r);
    camera.lookAt(0, RACK_H * 0.42, 0);
  });

  const cartons = useMemo(() => {
    const arr: Array<{ x: number; y: number; z: number; delay: number; seed: number }> = [];
    let seed = 9001;
    for (let l = 0; l < LEVELS; l++) {
      // 2 cartons per level, some slots empty
      for (let cix = 0; cix < 2; cix++) {
        if ((l * 7 + cix * 3) % 5 === 4) continue;
        arr.push({
          x: (cix - 0.5) * 1.15 + (((l + cix) % 3) - 1) * 0.12,
          y: l * LEVEL_H + 0.42,
          z: ((l + cix * 2) % 2 ? -1 : 1) * 0.14,
          delay: 0.52 + l * 0.07 + cix * 0.09,
          seed: seed++,
        });
      }
    }
    return arr;
  }, []);

  return (
    <group ref={group}>
      <color attach="background" args={["#07090C"]} />
      <fog attach="fog" args={["#07090C", 14, 34]} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 9, 4]} intensity={1.15} color="#FFB27A" />
      <directionalLight position={[-5, 6, -5]} intensity={0.45} color="#2DD4BF" />

      {/* Floor + blueprint grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0C0F13" roughness={1} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[60, 60]}
        cellSize={1.1}
        cellThickness={0.6}
        cellColor="#1E2833"
        sectionSize={5.5}
        sectionThickness={1}
        sectionColor="#274050"
        fadeDistance={30}
        fadeStrength={2}
      />

      {/* Ghosts of neighbouring bays (context, static) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * BAY_W, 0, 0]}>
          {[-1, 1].map((sz) => (
            <mesh key={sz} position={[0, RACK_H / 2, (sz * DEPTH) / 2]}>
              <boxGeometry args={[0.1, RACK_H, 0.1]} />
              <meshStandardMaterial color="#232B36" roughness={0.7} metalness={0.4} transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* The assembling bay */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Upright
            key={`${sx}-${sz}`}
            x={(sx * (BAY_W - 0.12)) / 2}
            z={(sz * DEPTH) / 2}
            delay={sx * 0.02 + sz * 0.03}
          />
        ))
      )}
      {Array.from({ length: LEVELS }, (_, l) =>
        [-1, 1].map((sz) => (
          <Beam
            key={`${l}-${sz}`}
            y={l * LEVEL_H + LEVEL_H - 0.08}
            z={(sz * DEPTH) / 2}
            delay={0.3 + l * 0.08}
          />
        ))
      )}
      {cartons.map((c, i) => (
        <Carton key={i} {...c} />
      ))}

      {/* Dimension tick under the bay */}
      <mesh position={[0, 0.02, DEPTH / 2 + 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BAY_W, 0.03]} />
        <meshBasicMaterial color="#FF6B1A" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

export default function HeroBayScene() {
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
      camera={{ position: [4.6, 3.6, 5.8], fov: 34 }}
      style={{ width: "100%", height: "100%" }}
    >
      <AssemblyScene reduced={reduced} />
    </Canvas>
  );
}
