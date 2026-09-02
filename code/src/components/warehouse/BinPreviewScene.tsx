import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";

export interface BinPreviewProps {
  /** Bin dims in meters */
  bin: { w: number; d: number; h: number };
  /** Carton dims in meters (oriented: x=along width, y=along depth, z=along height) */
  carton: { x: number; y: number; z: number };
  /** Cartons along each axis */
  grid: { x: number; y: number; z: number };
  count: number;
  violation: boolean;
}

const MAX_RENDERED = 160;

function Cartons({ bin, carton, grid, count, violation }: BinPreviewProps) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const matRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  const rendered = Math.min(count, MAX_RENDERED);

  const targets = useMemo(() => {
    const pts: Array<[number, number, number]> = [];
    const gap = 0.012;
    const sx = carton.x + gap;
    const sy = carton.y + gap;
    const sz = carton.z + gap;
    let n = 0;
    outer: for (let z = 0; z < grid.z; z++)
      for (let y = 0; y < grid.y; y++)
        for (let x = 0; x < grid.x; x++) {
          if (n++ >= rendered) break outer;
          pts.push([
            -bin.w / 2 + carton.x / 2 + 0.03 + x * sx,
            carton.z / 2 + 0.02 + z * sz,
            -bin.d / 2 + carton.y / 2 + 0.03 + y * sy,
          ]);
        }
    return pts;
  }, [bin, carton, grid, rendered]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    for (let i = 0; i < refs.current.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const target = targets[i];
      if (target) {
        // Spring positions toward the new layout
        m.position.x = THREE.MathUtils.damp(m.position.x, target[0], 10, d);
        m.position.y = THREE.MathUtils.damp(m.position.y, target[1], 10, d);
        m.position.z = THREE.MathUtils.damp(m.position.z, target[2], 10, d);
        m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, 1, 10, d));
      } else {
        m.scale.setScalar(Math.max(m.scale.x - d * 4, 0.0001));
      }
      const mat = matRefs.current[i];
      if (mat) {
        mat.color.lerp(new THREE.Color(violation ? "#F4504E" : "#C8A27A"), 1 - Math.exp(-d / 0.1));
      }
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_RENDERED }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
            if (m && m.userData.born === undefined)
              m.userData.born = performance.now() / 1000;
          }}
          scale={0.0001}
          castShadow
        >
          <boxGeometry args={[carton.x, carton.z, carton.y]} />
          <meshStandardMaterial
            ref={(mm) => (matRefs.current[i] = mm)}
            color="#C8A27A"
            roughness={0.85}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  );
}

function PreviewScene(props: BinPreviewProps) {
  const { bin } = props;
  const group = useRef<THREE.Group>(null);
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(bin.w, bin.h, bin.d)),
    [bin.w, bin.h, bin.d]
  );

  useFrame(({ clock }) => {
    if (group.current)
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.5 + 0.5;
  });

  return (
    <>
      <color attach="background" args={["#07090C"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 3]} intensity={1.15} color="#FFB27A" />
      <directionalLight position={[-4, 5, -4]} intensity={0.45} color="#2DD4BF" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0C0F13" roughness={1} />
      </mesh>
      <Grid
        position={[0, 0.005, 0]}
        args={[24, 24]}
        cellSize={0.3}
        cellThickness={0.6}
        cellColor="#1E2833"
        sectionSize={1.5}
        sectionThickness={1}
        sectionColor="#274050"
        fadeDistance={14}
        fadeStrength={2}
      />

      <group ref={group} position={[0, 0, 0]}>
        {/* Wireframe bin */}
        <lineSegments geometry={edges} position={[0, bin.h / 2, 0]}>
          <lineBasicMaterial
            color={props.violation ? "#F4504E" : "#2DD4BF"}
            transparent
            opacity={0.9}
          />
        </lineSegments>
        <mesh position={[0, bin.h / 2, 0]}>
          <boxGeometry args={[bin.w, bin.h, bin.d]} />
          <meshStandardMaterial
            color="#2DD4BF"
            transparent
            opacity={0.045}
            depthWrite={false}
          />
        </mesh>
        <Cartons {...props} />
      </group>
    </>
  );
}

export default function BinPreviewScene(props: BinPreviewProps) {
  const d = Math.max(props.bin.w, props.bin.d) * 1.9 + 1.2;
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [d, d * 0.72, d], fov: 30 }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ camera }) => camera.lookAt(0, props.bin.h * 0.35, 0)}
    >
      <PreviewScene {...props} />
    </Canvas>
  );
}
