import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { useInView } from "framer-motion";
import * as THREE from "three";
import { useTheme, themeColor } from "@/lib/theme";

/**
 * ScanTunnel (design-delta §4.12) — the scanning bay's one heavy R3F scene:
 * conveyor belt right→left, teal translucent scan curtain with animated
 * scanlines, parcels passing through; curtain flashes on each crossing.
 * Theme-aware materials; unmounts when out of viewport.
 */

interface Parcel {
  x: number;
  speed: number;
  size: [number, number, number];
  z: number;
}

interface Palette {
  floor: string;
  fog: string;
  belt: string;
  rail: string;
  curtain: string;
  scanline: string;
  cartons: string[];
  ambient: number;
  key: number;
}

function usePalette(): Palette {
  const theme = useTheme();
  return useMemo(() => {
    const data = themeColor("--data") || (theme === "dark" ? "#2dd4bf" : "#0d9488");
    if (theme === "light") {
      return {
        floor: themeColor("--bg-page") || "#f2f5f8",
        fog: themeColor("--bg-void") || "#e4e9ee",
        belt: "#c7d0da",
        rail: "#8a94a0",
        curtain: data,
        scanline: data,
        cartons: ["#d8b48c", "#cfa87c", "#e0bd96", "#d2ae84"],
        ambient: 0.55,
        key: 0.9,
      };
    }
    return {
      floor: themeColor("--bg-page") || "#0b0e12",
      fog: themeColor("--bg-void") || "#07090c",
      belt: "#1a2029",
      rail: "#39424e",
      curtain: data,
      scanline: data,
      cartons: ["#c8a27a", "#b8936c", "#d0aa80", "#bf9a70"],
      ambient: 0.25,
      key: 0.5,
    };
  }, [theme]);
}

const CURTAIN_X = 0;
const SPAN = 7;

function Parcels({
  palette,
  flashRef,
  onPassRef,
}: {
  palette: Palette;
  flashRef: React.MutableRefObject<number>;
  onPassRef: React.MutableRefObject<(() => void) | undefined>;
}) {
  const parcels = useRef<Parcel[]>([
    { x: 5.2, speed: 1.5, size: [0.9, 0.62, 0.62], z: 0 },
    { x: 2.4, speed: 1.5, size: [0.7, 0.5, 0.55], z: 0 },
    { x: -1.2, speed: 1.5, size: [1.1, 0.8, 0.7], z: 0 },
    { x: -4.4, speed: 1.5, size: [0.8, 0.55, 0.5], z: 0 },
  ]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    parcels.current.forEach((p, i) => {
      const prev = p.x;
      p.x -= p.speed * step;
      if (prev > CURTAIN_X && p.x <= CURTAIN_X) {
        flashRef.current = 1;
        onPassRef.current?.();
      }
      if (p.x < -SPAN) {
        p.x = SPAN + Math.random() * 2;
        const s = 0.5 + Math.random() * 0.5;
        p.size = [s * (0.9 + Math.random() * 0.5), s * 0.72, s * 0.66];
      }
      const m = meshRefs.current[i];
      if (m) {
        m.position.x = p.x;
        m.position.y = 0.36 + p.size[1] / 2;
        m.scale.set(p.size[0], p.size[1], p.size[2]);
      }
    });
  });

  return (
    <>
      {parcels.current.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[p.x, 0.36 + p.size[1] / 2, p.z]}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={palette.cartons[i % palette.cartons.length]} roughness={0.85} />
        </mesh>
      ))}
    </>
  );
}

function Curtain({ palette, flashRef }: { palette: Palette; flashRef: React.MutableRefObject<number> }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const lines = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }, dt) => {
    flashRef.current = Math.max(0, flashRef.current - dt * 1.6);
    const glow = 0.16 + flashRef.current * 0.5;
    if (mat.current) mat.current.opacity = glow;
    const t = clock.elapsedTime;
    lines.current.forEach((l, i) => {
      if (!l) return;
      const phase = (t * 0.6 + i * 0.33) % 1;
      l.position.y = 1.9 - phase * 1.7;
      const lm = l.material as THREE.MeshBasicMaterial;
      lm.opacity = 0.25 + flashRef.current * 0.6;
    });
  });

  return (
    <group position={[CURTAIN_X, 0, 0]}>
      {/* translucent scan curtain plane */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.04, 1.9, 1.7]} />
        <meshBasicMaterial
          ref={mat}
          color={palette.curtain}
          transparent
          opacity={0.16}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* scanlines sweeping down inside the curtain */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            lines.current[i] = el;
          }}
          position={[0, 1.4 - i * 0.5, 0]}
        >
          <boxGeometry args={[0.06, 0.03, 1.7]} />
          <meshBasicMaterial color={palette.scanline} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
      {/* tunnel frame uprights */}
      {[-0.9, 0.9].map((z) => (
        <mesh key={z} position={[0, 1.0, z]}>
          <boxGeometry args={[0.08, 2.0, 0.08]} />
          <meshStandardMaterial color={palette.rail} roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[0.08, 0.08, 1.9]} />
        <meshStandardMaterial color={palette.rail} roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Conveyor({ palette }: { palette: Palette }) {
  const rollers = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const COUNT = 26;

  useFrame(({ clock }) => {
    const m = rollers.current;
    if (!m) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      dummy.position.set(-SPAN + (i * (2 * SPAN)) / (COUNT - 1), 0.28, 0);
      // spin around the cylinder's length axis (Y), then lay it along Z
      dummy.rotation.set(Math.PI / 2, t * 2.2, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* belt bed */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[2 * SPAN + 2, 0.16, 1.5]} />
        <meshStandardMaterial color={palette.belt} roughness={0.9} />
      </mesh>
      {/* rollers */}
      <instancedMesh ref={rollers} args={[undefined, undefined, COUNT]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 10]} />
        <meshStandardMaterial color={palette.rail} roughness={0.5} metalness={0.4} />
      </instancedMesh>
      {/* side rails */}
      {[-0.78, 0.78].map((z) => (
        <mesh key={z} position={[0, 0.34, z]}>
          <boxGeometry args={[2 * SPAN + 2, 0.05, 0.05]} />
          <meshStandardMaterial color={palette.rail} roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {/* legs */}
      {[-6, -2, 2, 6].map((x) =>
        [-0.6, 0.6].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.25, z]}>
            <boxGeometry args={[0.09, 0.9, 0.09]} />
            <meshStandardMaterial color={palette.rail} roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  );
}

function Scene({ onPassRef }: { onPassRef: React.MutableRefObject<(() => void) | undefined> }) {
  const palette = usePalette();
  const flashRef = useRef(0);
  return (
    <>
      <fog attach="fog" args={[palette.fog, 14, 34]} />
      <ambientLight intensity={palette.ambient} />
      <directionalLight position={[6, 8, 4]} intensity={palette.key} color="#ffe9d6" />
      <directionalLight position={[-5, 4, -3]} intensity={palette.key * 0.4} color={palette.curtain} />
      <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={palette.floor} roughness={1} />
      </mesh>
      <Grid
        position={[0, -0.7, 0]}
        args={[80, 80]}
        cellSize={1.2}
        sectionSize={6}
        cellColor={palette.rail}
        sectionColor={palette.curtain}
        cellThickness={0.4}
        sectionThickness={0.7}
        fadeDistance={30}
        fadeStrength={2}
      />
      <Conveyor palette={palette} />
      <Curtain palette={palette} flashRef={flashRef} />
      <Parcels palette={palette} flashRef={flashRef} onPassRef={onPassRef} />
    </>
  );
}

/**
 * Viewport-gated wrapper: mounts the Canvas only while on screen
 * (unmounts past ~150% scroll per design-delta §6 3D budget).
 */
export default function ScanTunnel({
  onParcelPass,
  className,
}: {
  onParcelPass?: () => void;
  className?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const inView = useInView(holder, { margin: "50% 0px 50% 0px" });
  const onPassRef = useRef<(() => void) | undefined>(onParcelPass);
  useEffect(() => {
    onPassRef.current = onParcelPass;
  }, [onParcelPass]);

  return (
    <div ref={holder} className={className} aria-hidden>
      {inView ? (
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [7.5, 4.2, 8], fov: 34 }}
          gl={{ antialias: true, alpha: true }}
          style={{ position: "absolute", inset: 0 }}
        >
          <Scene onPassRef={onPassRef} />
        </Canvas>
      ) : (
        <div className="absolute inset-0 bg-void" />
      )}
    </div>
  );
}
