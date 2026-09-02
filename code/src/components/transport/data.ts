import type { PackItem, VehicleCargoSpace } from "@contracts/types";

/* ------------------------------------------------------------------ */
/* Baked transport demo data (transport.md §2–3, design-delta §6).     */
/* ------------------------------------------------------------------ */

export interface DemoVehicle {
  key: string;
  name: string;
  /** Cargo inner dims in meters (flatbed has no height). */
  dims: string;
  payloadT: number;
  cbm: number | null;
  space: VehicleCargoSpace | null;
  chip: { label: string; tone: "reserved" | "free" | "plan" | "maintenance" };
  reg?: string;
}

export const DEMO_VEHICLES: DemoVehicle[] = [
  {
    key: "c20",
    name: "CONTAINER 20FT",
    dims: "5.90×2.35×2.39M",
    payloadT: 21.7,
    cbm: 33,
    space: { lengthM: 5.9, widthM: 2.35, heightM: 2.39, maxWeightKg: 21700 },
    chip: { label: "RESERVED · SO-2841", tone: "reserved" },
    reg: "MSKU-2041-7",
  },
  {
    key: "c40",
    name: "CONTAINER 40FT HC",
    dims: "12.03×2.35×2.69M",
    payloadT: 26.5,
    cbm: 76,
    space: { lengthM: 12.03, widthM: 2.35, heightM: 2.69, maxWeightKg: 26500 },
    chip: { label: "FREE", tone: "free" },
    reg: "MSKU-8841-0",
  },
  {
    key: "t32",
    name: "TRUCK 32FT MXL",
    dims: "9.8×2.4×2.6M",
    payloadT: 16,
    cbm: 61,
    space: { lengthM: 9.8, widthM: 2.4, heightM: 2.6, maxWeightKg: 16000 },
    chip: { label: "PLAN 91%", tone: "plan" },
    reg: "TRK-07 · MH-04-CD-8812",
  },
  {
    key: "lcv14",
    name: "LCV 14FT",
    dims: "4.3×1.9×1.8M",
    payloadT: 1,
    cbm: 14,
    space: { lengthM: 4.3, widthM: 1.9, heightM: 1.8, maxWeightKg: 1000 },
    chip: { label: "FREE", tone: "free" },
    reg: "TRK-12 · MH-12-GH-2210",
  },
  {
    key: "flat40",
    name: "TRAILER 40FT FLATBED",
    dims: "12.2×2.5M DECK",
    payloadT: 28,
    cbm: null,
    space: null,
    chip: { label: "MAINTENANCE", tone: "maintenance" },
    reg: "TRL-03 · MH-04-KL-5541",
  },
];

/** Utilization-by-vehicle strip (transport.md §2). */
export const CAPACITY_STRIP = [
  { id: "TRK-07", pct: 91 },
  { id: "TRK-12", pct: 64 },
  { id: "MSKU-2041", pct: 78 },
  { id: "MSKU-8841", pct: 0 },
  { id: "TRL-03", pct: 0 },
];

/* ------------------------- optimizer cargo ------------------------- */

/** Headline run = seeded LP-0417 canon: 792 cartons → 91.2% cube on TRK-07. */
export const OPTIMIZER_VEHICLE: VehicleCargoSpace = {
  lengthM: 9.8,
  widthM: 2.4,
  heightM: 2.6,
  maxWeightKg: 16000,
};

export const OPTIMIZER_CARGO: PackItem[] = [
  { id: "CTN-444040", l: 0.44, w: 0.4, h: 0.4, weightKg: 8, qty: 798 },
];

export const OPTIMIZER_RAIL_ROWS = [
  { label: "CTN 440×400×400 · 8.0KG × 798", tone: "ink" as const },
  { label: "DIMS FROM /scanning-bay ✓", tone: "data" as const },
  { label: "6 CTNS → NEXT VEHICLE TRK-12", tone: "warn" as const },
];

/** Hero loop cargo (40ft HC container, small readable batch). */
export const HERO_VEHICLE: VehicleCargoSpace = {
  lengthM: 12.03,
  widthM: 2.35,
  heightM: 2.69,
  maxWeightKg: 26500,
};

export const HERO_CARGO: PackItem[] = [
  { id: "CTN-504040", l: 0.5, w: 0.4, h: 0.4, weightKg: 9.5, qty: 48 },
];

/**
 * Placement schedule: accelerating stagger (design: 0.12s → 0.03s gaps,
 * ~3.2s total). Gaps shrink as the run progresses so the fill accelerates.
 */
export function buildSchedule(count: number, totalSec = 3.2): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const f = count <= 1 ? 1 : i / (count - 1);
    out.push(totalSec * (1 - Math.pow(1 - f, 1.7)));
  }
  return out;
}

/* ------------------------- route / sequence (§6) ------------------------- */

export const ROUTE_STOPS = [
  { id: "STOP-1", label: "DEL-NCR · OKHLA" },
  { id: "STOP-2", label: "GURUGRAM SEC-18" },
  { id: "STOP-3", label: "NOIDA SEC-63" },
  { id: "STOP-4", label: "GHAZIABAD" },
  { id: "STOP-5", label: "FARIDABAD" },
];

/** LIFO by stop: last stop loads first (rear) → first stop at the door. */
export const LOAD_SEQUENCE = [
  { n: "01", stop: "STOP-5", what: "CARTONS ×8", pos: "REAR" },
  { n: "02", stop: "STOP-4", what: "CARTONS ×16", pos: "REAR-MID" },
  { n: "03", stop: "STOP-3", what: "CARTONS ×22", pos: "MID" },
  { n: "04", stop: "STOP-2", what: "CARTONS ×14", pos: "MID-DOOR" },
  { n: "05", stop: "STOP-1", what: "PALLETS ×2", pos: "DOOR-SIDE" },
];
