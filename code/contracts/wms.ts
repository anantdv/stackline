/**
 * Shared WMS contracts — plain TypeScript types + pure, dependency-free
 * functions usable from BOTH the frontend and the backend.
 *
 * No zod, no drizzle, no node APIs. Runtime-light by design.
 */

// ---------------------------------------------------------------------------
// Entity types (mirror db/schema.ts; timestamps are Date — superjson preserves
// Date across the tRPC boundary)
// ---------------------------------------------------------------------------

export type BinStatus = "active" | "blocked";
export type MovementType =
  | "receipt"
  | "putaway"
  | "transfer"
  | "pick"
  | "dispatch";
export type MovementStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";
export type AllocationStrategy = "fefo" | "velocity" | "balanced";

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  aisleWidthM: number;
  erpnextWarehouse: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rack {
  id: number;
  warehouseId: number;
  name: string;
  positionX: number;
  positionY: number;
  rotationDeg: number;
  bays: number;
  levels: number;
  bayWidthM: number;
  bayDepthM: number;
  levelHeightM: number;
  createdAt: Date;
}

export interface Bin {
  id: number;
  rackId: number;
  bay: number;
  level: number;
  code: string;
  widthM: number;
  depthM: number;
  heightM: number;
  maxWeightKg: number; // 0 = unlimited
  status: string;
  createdAt: Date;
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  cartonLengthM: number;
  cartonWidthM: number;
  cartonHeightM: number;
  cartonWeightKg: number;
  erpnextItemCode: string | null;
  createdAt: Date;
}

export interface Placement {
  id: number;
  binId: number;
  itemId: number;
  qty: number;
  batchNo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Movement {
  id: number;
  type: string;
  itemId: number;
  qty: number;
  fromBinId: number | null;
  toBinId: number | null;
  status: string;
  reference: string | null;
  erpnextStockEntry: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Dimension shapes used by the pure functions
// ---------------------------------------------------------------------------

export interface BinDims {
  widthM: number;
  depthM: number;
  heightM: number;
}

export interface CartonDims {
  lengthM: number;
  widthM: number;
  heightM: number;
}

export interface Orientation {
  /** Carton axis ("lengthM" | "widthM" | "heightM") mapped to each bin axis. */
  alongWidth: keyof CartonDims;
  alongDepth: keyof CartonDims;
  alongHeight: keyof CartonDims;
}

export interface CartonsPerBinResult {
  /** Max number of cartons that fit (best orientation, weight-capped). */
  count: number;
  /** Best orientation (null when nothing fits). */
  orientation: Orientation | null;
  /** Cartons along each bin axis for the best orientation. */
  perAxis: { x: number; y: number; z: number };
  /** True when the count was limited by the bin weight capacity. */
  weightLimited: boolean;
}

// ---------------------------------------------------------------------------
// cartonsPerBin — try all 6 orientations of a carton inside a bin
// ---------------------------------------------------------------------------

const ORIENTATIONS: Orientation[] = [
  { alongWidth: "lengthM", alongDepth: "widthM", alongHeight: "heightM" },
  { alongWidth: "lengthM", alongDepth: "heightM", alongHeight: "widthM" },
  { alongWidth: "widthM", alongDepth: "lengthM", alongHeight: "heightM" },
  { alongWidth: "widthM", alongDepth: "heightM", alongHeight: "lengthM" },
  { alongWidth: "heightM", alongDepth: "lengthM", alongHeight: "widthM" },
  { alongWidth: "heightM", alongDepth: "widthM", alongHeight: "lengthM" },
];

export function cartonsPerBin(
  bin: BinDims,
  carton: CartonDims,
  maxWeightKg?: number,
  cartonWeightKg?: number,
): CartonsPerBinResult {
  let best: CartonsPerBinResult = {
    count: 0,
    orientation: null,
    perAxis: { x: 0, y: 0, z: 0 },
    weightLimited: false,
  };

  for (const o of ORIENTATIONS) {
    const x = Math.floor(bin.widthM / carton[o.alongWidth]);
    const y = Math.floor(bin.depthM / carton[o.alongDepth]);
    const z = Math.floor(bin.heightM / carton[o.alongHeight]);
    const count = x * y * z;
    if (count > best.count) {
      best = { count, orientation: o, perAxis: { x, y, z }, weightLimited: false };
    }
  }

  // Apply weight limit (maxWeightKg of 0/undefined = unlimited).
  if (best.count > 0 && maxWeightKg && maxWeightKg > 0 && cartonWeightKg && cartonWeightKg > 0) {
    const byWeight = Math.floor(maxWeightKg / cartonWeightKg);
    if (byWeight < best.count) {
      best = { ...best, count: Math.max(0, byWeight), weightLimited: true };
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// binFillPercent — volume-based fill estimate
// ---------------------------------------------------------------------------

export interface PlacementLike {
  qty: number;
  cartonLengthM?: number | null;
  cartonWidthM?: number | null;
  cartonHeightM?: number | null;
}

/**
 * Percentage (0–100) of bin volume occupied by the given placements.
 * Placements without carton dimensions are ignored (treated as 0 volume).
 */
export function binFillPercent(
  bin: BinDims,
  placements: PlacementLike[],
): number {
  const binVolume = bin.widthM * bin.depthM * bin.heightM;
  if (binVolume <= 0) return 0;
  let used = 0;
  for (const p of placements) {
    if (p.cartonLengthM && p.cartonWidthM && p.cartonHeightM) {
      used += p.qty * p.cartonLengthM * p.cartonWidthM * p.cartonHeightM;
    }
  }
  return Math.min(100, (used / binVolume) * 100);
}

// ---------------------------------------------------------------------------
// allocateCartons — greedy best-fit allocation of cartons across bins
// ---------------------------------------------------------------------------

export interface AllocatableBin extends BinDims {
  id: number;
  code: string;
  status: string;
  maxWeightKg?: number;
  /** Cartons already physically in the bin (all SKUs). */
  usedQty?: number;
  /** Existing placements, for SKU consolidation. */
  currentPlacements?: Array<{ sku?: string | null; qty: number }>;
  /** Rack level of the bin (used by the velocity strategy). */
  level?: number;
}

export interface AllocationEntry {
  binId: number;
  code: string;
  qty: number;
}

export interface AllocationResult {
  allocations: AllocationEntry[];
  /** Cartons that could not be placed anywhere. */
  unallocated: number;
}

export interface AllocateCartonsArgs {
  bins: AllocatableBin[];
  carton: CartonDims;
  cartonWeightKg?: number;
  /** SKU being allocated — used to prefer consolidating into same-SKU bins. */
  sku?: string;
  qty: number;
  strategy: AllocationStrategy;
}

function freeCapacity(
  b: AllocatableBin,
  carton: CartonDims,
  cartonWeightKg?: number,
): number {
  const cap = cartonsPerBin(b, carton, b.maxWeightKg, cartonWeightKg).count;
  const used = b.usedQty ?? 0;
  return Math.max(0, cap - used);
}

export function allocateCartons(args: AllocateCartonsArgs): AllocationResult {
  const { carton, cartonWeightKg, sku, qty, strategy } = args;

  type Candidate = { bin: AllocatableBin; free: number; holdsSku: boolean };
  const candidates: Candidate[] = [];
  for (const b of args.bins) {
    if (b.status !== "active") continue; // skip blocked bins
    const free = freeCapacity(b, carton, cartonWeightKg);
    if (free <= 0) continue; // skip full / non-fitting bins
    const holdsSku =
      !!sku &&
      (b.currentPlacements ?? []).some((p) => p.qty > 0 && p.sku === sku);
    candidates.push({ bin: b, free, holdsSku });
  }

  // Consolidation first: bins already holding this SKU.
  const consolidation = candidates.filter((c) => c.holdsSku);
  const rest = candidates.filter((c) => !c.holdsSku);

  const byStrategy = (a: Candidate, b: Candidate): number => {
    switch (strategy) {
      case "velocity":
        // Prefer lowest levels (fastest access), then code.
        return (
          (a.bin.level ?? 0) - (b.bin.level ?? 0) ||
          a.bin.code.localeCompare(b.bin.code)
        );
      case "fefo":
        // Deterministic location order (FEFO is batch-driven downstream).
        return a.bin.code.localeCompare(b.bin.code);
      case "balanced":
      default: {
        // Prefer the emptiest bin that fits.
        const fillA = (a.bin.usedQty ?? 0) / ((a.bin.usedQty ?? 0) + a.free || 1);
        const fillB = (b.bin.usedQty ?? 0) / ((b.bin.usedQty ?? 0) + b.free || 1);
        return fillA - fillB || a.bin.code.localeCompare(b.bin.code);
      }
    }
  };

  consolidation.sort(byStrategy);
  rest.sort(byStrategy);

  const allocations: AllocationEntry[] = [];
  let remaining = qty;
  for (const c of [...consolidation, ...rest]) {
    if (remaining <= 0) break;
    const take = Math.min(c.free, remaining);
    if (take <= 0) continue;
    allocations.push({ binId: c.bin.id, code: c.bin.code, qty: take });
    remaining -= take;
  }

  return { allocations, unallocated: remaining };
}
