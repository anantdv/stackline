import { cartonsPerBin, binFillPercent } from "@contracts/wms";
import type { Warehouse, Rack, Bin, Item, Placement } from "@contracts/wms";

/* ------------------------------------------------------------------ */
/* Viewer model                                                        */
/* ------------------------------------------------------------------ */

export interface BinContentLine {
  sku: string;
  name: string;
  qty: number;
  batch: string;
  expiry: string;
  cartonWeightKg: number;
}

export interface ViewerBin {
  /** Rack-letter/bay/level identity, e.g. A-04-02-01 */
  code: string;
  /** Numeric DB id when backed by live data (null for demo/custom). */
  dbId: number | null;
  rackName: string;
  rackIndex: number;
  bay: number; // 1-based
  level: number; // 1-based
  /** Volume fill 0..100 */
  fill: number;
  usedQty: number;
  capacityCount: number;
  usedWeightKg: number;
  maxWeightKg: number;
  blocked: boolean;
  contents: BinContentLine[];
}

export interface ViewerLayout {
  name: string;
  code: string;
  live: boolean;
  rows: number;
  bays: number;
  levels: number;
  bayW: number; // m
  depth: number; // m
  levelH: number; // m
  aisle: number; // m
  bins: ViewerBin[];
  totalCartons: number;
  usedBins: number;
}

export interface TwinConfig {
  rows: number;
  bays: number;
  levels: number;
  bayWidthMm: number;
  levelHeightMm: number;
  depthMm: number;
}

export const DEFAULT_TWIN_CONFIG: TwinConfig = {
  rows: 4,
  bays: 6,
  levels: 3,
  bayWidthMm: 2700,
  levelHeightMm: 1400,
  depthMm: 1100,
};

/** Capacity color scale: <70 teal · 70–89 warn · ≥90 crit */
export function capacityColor(fill: number): string {
  if (fill >= 90) return "#F4504E";
  if (fill >= 70) return "#FFB020";
  return "#2DD4BF";
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const binCode = (rack: string, bay: number, level: number) =>
  `${rack}-${pad2(bay)}-${pad2(level)}-01`;

const RACK_LETTERS = "ABCDEFGHIJKL";

/* ------------------------------------------------------------------ */
/* Deterministic PRNG                                                  */
/* ------------------------------------------------------------------ */
export function seededRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------------------------------------------ */
/* Demo dataset — mirrors db/seed.ts ("Main DC": racks A–H, 6×4)       */
/* ------------------------------------------------------------------ */

export const DEMO_ITEMS: Array<
  Pick<
    Item,
    "sku" | "name" | "cartonLengthM" | "cartonWidthM" | "cartonHeightM" | "cartonWeightKg"
  > & { id: number }
> = [
  { id: 1, sku: "SKU-1001", name: "Wireless Mouse", cartonLengthM: 0.45, cartonWidthM: 0.3, cartonHeightM: 0.25, cartonWeightKg: 8 },
  { id: 2, sku: "SKU-1002", name: "Mechanical Keyboard", cartonLengthM: 0.5, cartonWidthM: 0.35, cartonHeightM: 0.2, cartonWeightKg: 12 },
  { id: 3, sku: "SKU-1003", name: "27in Monitor", cartonLengthM: 0.7, cartonWidthM: 0.5, cartonHeightM: 0.2, cartonWeightKg: 9 },
  { id: 4, sku: "SKU-1004", name: "USB-C Hub", cartonLengthM: 0.35, cartonWidthM: 0.25, cartonHeightM: 0.2, cartonWeightKg: 6 },
  { id: 5, sku: "SKU-1005", name: "Laptop Stand", cartonLengthM: 0.55, cartonWidthM: 0.3, cartonHeightM: 0.3, cartonWeightKg: 10 },
  { id: 6, sku: "SKU-1006", name: "Webcam HD", cartonLengthM: 0.3, cartonWidthM: 0.2, cartonHeightM: 0.15, cartonWeightKg: 4 },
];

const DEMO_BAY_W = 1.4;
const DEMO_DEPTH = 1.2;
const DEMO_LEVEL_H = 1.6;
const DEMO_AISLE = 3.5;
const DEMO_MAX_WEIGHT = 1200;

function expiryFromBatch(batch: string): string {
  // batch like B202507 → expiry one year later
  const m = /^B(\d{4})(\d{2})$/.exec(batch);
  if (!m) return "—";
  return `${Number(m[1]) + 1}-${m[2]}`;
}

/** Build the demo layout (fallback when the API/DB is unreachable). */
export function buildDemoLayout(): ViewerLayout {
  const bins: ViewerBin[] = [];
  const rng = seededRng(42);
  let totalCartons = 0;
  let usedBins = 0;

  for (let r = 0; r < 8; r++) {
    const rackName = RACK_LETTERS[r];
    for (let bay = 1; bay <= 6; bay++) {
      for (let level = 1; level <= 4; level++) {
        const code = binCode(rackName, bay, level);
        const binDims = {
          widthM: DEMO_BAY_W - 0.1,
          depthM: DEMO_DEPTH - 0.1,
          heightM: DEMO_LEVEL_H - 0.15,
        };
        const has = rng() < 0.58;
        const blocked = !has && rng() < 0.03;
        const contents: BinContentLine[] = [];
        let usedQty = 0;
        let usedWeightKg = 0;
        let capacityCount = 0;
        let fill = 0;

        if (has) {
          const lines = 1 + Math.floor(rng() * 2); // 1–2 SKUs per bin
          for (let li = 0; li < lines; li++) {
            const item = DEMO_ITEMS[Math.floor(rng() * DEMO_ITEMS.length)];
            const fit = cartonsPerBin(
              binDims,
              {
                lengthM: item.cartonLengthM,
                widthM: item.cartonWidthM,
                heightM: item.cartonHeightM,
              },
              DEMO_MAX_WEIGHT,
              item.cartonWeightKg
            );
            const cap = Math.max(fit.count, 1);
            const qty =
              li === 0
                ? Math.max(1, Math.round(cap * (0.25 + rng() * 0.75)))
                : Math.max(1, Math.round(cap * 0.2 * rng()));
            const batch = `B2025${pad2(1 + Math.floor(rng() * 12))}`;
            contents.push({
              sku: item.sku,
              name: item.name,
              qty,
              batch,
              expiry: expiryFromBatch(batch),
              cartonWeightKg: item.cartonWeightKg,
            });
            usedQty += qty;
            usedWeightKg += qty * item.cartonWeightKg;
            capacityCount = Math.max(capacityCount, cap);
          }
          fill = binFillPercent(
            binDims,
            contents.map((c) => {
              const item = DEMO_ITEMS.find((i) => i.sku === c.sku)!;
              return {
                qty: c.qty,
                cartonLengthM: item.cartonLengthM,
                cartonWidthM: item.cartonWidthM,
                cartonHeightM: item.cartonHeightM,
              };
            })
          );
          totalCartons += usedQty;
          usedBins++;
        } else {
          // capacity vs. a reference carton for readout purposes
          capacityCount = cartonsPerBin(
            binDims,
            { lengthM: 0.45, widthM: 0.3, heightM: 0.25 },
            DEMO_MAX_WEIGHT,
            8
          ).count;
        }

        bins.push({
          code,
          dbId: null,
          rackName,
          rackIndex: r,
          bay,
          level,
          fill: Math.min(100, fill),
          usedQty,
          capacityCount,
          usedWeightKg: Math.round(usedWeightKg),
          maxWeightKg: DEMO_MAX_WEIGHT,
          blocked,
          contents,
        });
      }
    }
  }

  return {
    name: "Main DC",
    code: "MAIN-DC",
    live: false,
    rows: 8,
    bays: 6,
    levels: 4,
    bayW: DEMO_BAY_W,
    depth: DEMO_DEPTH,
    levelH: DEMO_LEVEL_H,
    aisle: DEMO_AISLE,
    bins,
    totalCartons,
    usedBins,
  };
}

/* ------------------------------------------------------------------ */
/* Adapters: tRPC layout → viewer model                                */
/* ------------------------------------------------------------------ */

type LayoutRack = Rack & {
  bins: Array<Bin & { placements: Array<Placement & { item: Item | null }> }>;
};
export type FullLayout = Warehouse & { racks: LayoutRack[] };

export function adaptLiveLayout(layout: FullLayout): ViewerLayout {
  const racks = [...layout.racks].sort((a, b) => a.name.localeCompare(b.name));
  const bins: ViewerBin[] = [];
  let totalCartons = 0;
  let usedBins = 0;

  racks.forEach((rack, r) => {
    for (const bin of rack.bins) {
      const contents: BinContentLine[] = bin.placements
        .filter((p) => p.qty > 0)
        .map((p) => ({
          sku: p.item?.sku ?? `ITEM-${p.itemId}`,
          name: p.item?.name ?? "Unknown item",
          qty: p.qty,
          batch: p.batchNo ?? "—",
          expiry: p.batchNo ? expiryFromBatch(p.batchNo) : "—",
          cartonWeightKg: p.item?.cartonWeightKg ?? 0,
        }));
      const fill = binFillPercent(
        bin,
        bin.placements.map((p) => ({
          qty: p.qty,
          cartonLengthM: p.item?.cartonLengthM,
          cartonWidthM: p.item?.cartonWidthM,
          cartonHeightM: p.item?.cartonHeightM,
        }))
      );
      // Capacity vs. the dominant item (or a reference carton when empty)
      const ref = bin.placements.find((p) => p.item)?.item;
      const capacityCount = cartonsPerBin(
        bin,
        ref
          ? {
              lengthM: ref.cartonLengthM,
              widthM: ref.cartonWidthM,
              heightM: ref.cartonHeightM,
            }
          : { lengthM: 0.45, widthM: 0.3, heightM: 0.25 },
        bin.maxWeightKg,
        ref?.cartonWeightKg ?? 8
      ).count;
      const usedQty = contents.reduce((s, c) => s + c.qty, 0);
      const usedWeightKg = contents.reduce(
        (s, c) => s + c.qty * c.cartonWeightKg,
        0
      );
      totalCartons += usedQty;
      if (usedQty > 0) usedBins++;
      bins.push({
        code: bin.code,
        dbId: bin.id,
        rackName: rack.name,
        rackIndex: r,
        bay: bin.bay,
        level: bin.level,
        fill: Math.min(100, fill),
        usedQty,
        capacityCount,
        usedWeightKg: Math.round(usedWeightKg),
        maxWeightKg: bin.maxWeightKg,
        blocked: bin.status === "blocked",
        contents,
      });
    }
  });

  const first = racks[0];
  return {
    name: layout.name,
    code: layout.code,
    live: true,
    rows: racks.length,
    bays: first?.bays ?? 6,
    levels: first?.levels ?? 4,
    bayW: first?.bayWidthM ?? DEMO_BAY_W,
    depth: first?.bayDepthM ?? DEMO_DEPTH,
    levelH: first?.levelHeightM ?? DEMO_LEVEL_H,
    aisle: layout.aisleWidthM ?? DEMO_AISLE,
    bins,
    totalCartons,
    usedBins,
  };
}

/** Parametric custom twin from the configurator — empty, addressable bins. */
export function buildCustomLayout(cfg: TwinConfig): ViewerLayout {
  const bays = Math.max(1, Math.round(cfg.bays));
  const levels = Math.max(1, Math.round(cfg.levels));
  const rows = Math.max(1, Math.round(cfg.rows));
  const bayW = cfg.bayWidthMm / 1000;
  const levelH = cfg.levelHeightMm / 1000;
  const depth = cfg.depthMm / 1000;
  const bins: ViewerBin[] = [];

  for (let r = 0; r < rows; r++) {
    const rackName = RACK_LETTERS[r] ?? `R${r + 1}`;
    for (let bay = 1; bay <= bays; bay++) {
      for (let level = 1; level <= levels; level++) {
        const binDims = {
          widthM: bayW - 0.1,
          depthM: depth - 0.1,
          heightM: levelH - 0.15,
        };
        bins.push({
          code: binCode(rackName, bay, level),
          dbId: null,
          rackName,
          rackIndex: r,
          bay,
          level,
          fill: 0,
          usedQty: 0,
          capacityCount: cartonsPerBin(
            binDims,
            { lengthM: 0.45, widthM: 0.3, heightM: 0.25 },
            DEMO_MAX_WEIGHT,
            8
          ).count,
          usedWeightKg: 0,
          maxWeightKg: DEMO_MAX_WEIGHT,
          blocked: false,
          contents: [],
        });
      }
    }
  }

  return {
    name: "Custom Twin",
    code: "CUSTOM",
    live: false,
    rows,
    bays,
    levels,
    bayW,
    depth,
    levelH,
    aisle: DEMO_AISLE,
    bins,
    totalCartons: 0,
    usedBins: 0,
  };
}
