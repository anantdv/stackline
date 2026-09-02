import { lazy, Suspense, useMemo } from "react";
import type { PackItem, VehicleCargoSpace } from "@contracts/types";
import { packLoad } from "@contracts/types";
import type { LoadPlanSceneProps } from "@/components/three/LoadPlanScene";
import { buildSchedule } from "./data";

const Scene = lazy(() => import("@/components/three/LoadPlanScene"));

type Props = Omit<LoadPlanSceneProps, "placed" | "schedule" | "finalVolPct" | "finalWtPct" | "cargo"> & {
  cargo: VehicleCargoSpace;
  items: PackItem[];
  /** Total run duration in seconds (accelerating stagger). */
  runSec?: number;
};

/**
 * Lazy + Suspense wrapper around the R3F scene (code-split). Runs the real
 * client-side packer (`@contracts/logistics.packLoad`) so placements and
 * utilization are deterministic and consistent everywhere.
 */
export default function LazyLoadPlanScene({ items, runSec = 3.2, cargo, ...rest }: Props) {
  const packed = useMemo(() => packLoad(cargo, items), [cargo, items]);
  const schedule = useMemo(() => buildSchedule(packed.placed.length, runSec), [packed.placed.length, runSec]);
  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
          LOADING 3D PLANNER…
        </div>
      }
    >
      <Scene
        {...rest}
        cargo={cargo}
        placed={packed.placed}
        schedule={schedule}
        finalVolPct={packed.utilizationPct}
        finalWtPct={packed.weightUtilizationPct}
      />
    </Suspense>
  );
}
