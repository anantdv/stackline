/**
 * Dashboard (v3) — baked demo dataset per dashboard.md §9 canon.
 *
 * Every surface on /dashboard renders fully from this dataset when the tRPC
 * API is unreachable or returns empty rows. Live query results are adapted
 * onto these shapes in `useDashboardData.ts`.
 *
 * Canon: 3 locations (MUM-BHIWANDI / DEL-NCR / BLR-EAST), 4 warehouses
 * (MAIN DC · DEL-01 · DEL-02 · BLR-01), ₹18,42,30,000 network value,
 * EWB 3371 2205 8814 expired · EWB 5520 1188 3092 expiring ·
 * EWB 2841 9912 4471 valid 22h, 8 vehicles (6 enroute, TRK-07 overdue),
 * 12 scan records (9 clear / 2 review / 1 blocked), LP-0417 91.2%,
 * customers ACME / NOVA.
 */
import { binFillPercent } from "@contracts/types";
import { hash01 } from "@/components/network/demo";
import type { TMNode } from "@/components/valuation/demo";

export type DashWindow = "24h" | "7d" | "30d";
export type Health = "ok" | "warn" | "crit";

/** Capacity color scale as CSS-var strings (theme-aware). */
export function capVar(pct: number): string {
  if (pct >= 90) return "var(--crit)";
  if (pct >= 70) return "var(--warn)";
  return "var(--data)";
}

/** Load-plan ring scale — deliberate inversion: high fill is GOOD. */
export function ringVar(pct: number): string {
  if (pct >= 85) return "var(--data)";
  if (pct >= 60) return "var(--warn)";
  return "var(--crit)";
}

export const healthVar = (h: Health): string =>
  h === "crit" ? "var(--crit)" : h === "warn" ? "var(--warn)" : "var(--data)";

/* ------------------------------------------------------------------ */
/* Network canon                                                     */
/* ------------------------------------------------------------------ */

export type DashWarehouse = {
  id: number;
  code: string;
  name: string;
  locCode: string;
  util: number;
  bins: number;
  usedBins: number;
  zones: number[]; // 6 zone utils (A–F)
};

export type DashLocation = {
  id: number;
  code: string;
  name: string;
  lat: number;
  lng: number;
  health: Health;
  warehouses: DashWarehouse[];
};

function zoneUtils(whCode: string, base: number): number[] {
  return Array.from({ length: 6 }, (_, i) =>
    Math.max(24, Math.min(99, Math.round(base - 14 + hash01(`zone:${whCode}:${i}`) * 30)))
  );
}

export const DEMO_LOCATIONS: DashLocation[] = [
  {
    id: 1, code: "MUM-BHIWANDI", name: "Mumbai — Bhiwandi",
    lat: 19.076, lng: 72.877, health: "ok",
    warehouses: [
      { id: 1, code: "MAIN DC", name: "Main DC", locCode: "MUM-BHIWANDI", util: 84, bins: 1440, usedBins: 1210, zones: zoneUtils("MAIN DC", 84) },
    ],
  },
  {
    id: 2, code: "DEL-NCR", name: "Delhi NCR",
    lat: 28.613, lng: 77.209, health: "crit",
    warehouses: [
      { id: 2, code: "DEL-01", name: "Delhi NCR FMCG DC", locCode: "DEL-NCR", util: 61, bins: 1280, usedBins: 781, zones: zoneUtils("DEL-01", 61) },
      { id: 3, code: "DEL-02", name: "Delhi NCR Multi DC", locCode: "DEL-NCR", util: 92, bins: 1280, usedBins: 1208, zones: zoneUtils("DEL-02", 92) },
    ],
  },
  {
    id: 3, code: "BLR-EAST", name: "Bengaluru East",
    lat: 12.971, lng: 77.594, health: "warn",
    warehouses: [
      { id: 4, code: "BLR-01", name: "Bengaluru Electronics Hub", locCode: "BLR-EAST", util: 76, bins: 1120, usedBins: 851, zones: zoneUtils("BLR-01", 76) },
    ],
  },
];

export const ALL_WAREHOUSES: DashWarehouse[] = DEMO_LOCATIONS.flatMap((l) => l.warehouses);

/** Capacity heat grid cell fill derived through the shared binFillPercent helper. */
export function zoneCellFill(wh: DashWarehouse, zoneIdx: number): number {
  const util = wh.zones[zoneIdx] ?? wh.util;
  /* simulate cartons occupying a standard 1.2×1.0×1.6m bin */
  const bin = { widthM: 1.2, depthM: 1.0, heightM: 1.6 };
  const carton = 0.4 * 0.3 * 0.25; // 0.03 m³ standard carton
  const full = Math.floor((bin.widthM * bin.depthM * bin.heightM) / carton);
  const placements = [{ qty: Math.max(1, Math.round((util / 100) * full)), cartonLengthM: 0.4, cartonWidthM: 0.3, cartonHeightM: 0.25 }];
  return Math.round(binFillPercent(bin, placements));
}

/* ------------------------------------------------------------------ */
/* KPI canon                                                         */
/* ------------------------------------------------------------------ */

export const KPI_DEMO = {
  stockValueInr: 18_42_30_000, // rupees — renders ₹18.42Cr, tooltip exact
  unitsOnHand: 284_170,
  capacityUtil: 78.4,
  openMovements: 137,
  movementSplit: { putaway: 42, pick: 61, transfer: 34 },
  vehiclesEnroute: 6,
  vehiclesTotal: 8,
  exceptions: 4,
  deltas: {
    stockValue: "+2.4",
    units: "+0.8",
    capacity: "+1.2",
    movements: "-6",
    vehicles: "+2",
    exceptions: "+1",
  },
} as const;

/** Deterministic 24/7/30-point sparkline series for a KPI. */
export function sparkSeries(key: string, window: DashWindow, trend: "up" | "down" | "flat" = "up"): number[] {
  const n = window === "24h" ? 24 : window === "7d" ? 7 : 30;
  const dir = trend === "up" ? 1 : trend === "down" ? -1 : 0;
  const out: number[] = [];
  let v = 42 + hash01(`spark:${key}:0`) * 16;
  for (let i = 0; i < n; i++) {
    v += (hash01(`spark:${key}:${i}`) - 0.44) * 9 + dir * 0.9;
    out.push(Math.max(6, Math.min(96, v)));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Transfers / fleet canon                                           */
/* ------------------------------------------------------------------ */

export type DashTransfer = {
  id: string;
  fromLoc: string;
  toLoc: string;
  qty: number;
  valueLabel: string;
  eta: string;
  truck: string;
};

export const DEMO_ACTIVE_TRANSFERS: DashTransfer[] = [
  { id: "STO-2025-0117", fromLoc: "MUM-BHIWANDI", toLoc: "DEL-NCR", qty: 240, valueLabel: "₹62L", eta: "6H 20M", truck: "TRK-07" },
  { id: "STO-2025-0118", fromLoc: "DEL-NCR", toLoc: "BLR-EAST", qty: 180, valueLabel: "₹41L", eta: "11H 05M", truck: "TRK-12" },
];

export type DashVehicle = {
  id: number;
  code: string;
  regNo: string;
  status: "ENROUTE" | "AT GATE" | "OVERDUE" | "IDLE";
  route: string;
  fromLoc: string;
  toLoc: string;
  progress: number; // 0–100
  eta: string;
  speedKmh: number;
};

export const DEMO_VEHICLES: DashVehicle[] = [
  { id: 1, code: "TRK-01", regNo: "MH-04-GH-2201", status: "ENROUTE", route: "MUM→DEL", fromLoc: "MUM-BHIWANDI", toLoc: "DEL-NCR", progress: 64, eta: "4H 10M", speedKmh: 58 },
  { id: 2, code: "TRK-04", regNo: "MH-12-PQ-3355", status: "AT GATE", route: "DOCK 1 · LP-0417", fromLoc: "MUM-BHIWANDI", toLoc: "MUM-BHIWANDI", progress: 96, eta: "DOCKING", speedKmh: 0 },
  { id: 3, code: "TRK-07", regNo: "MH-04-GH-1107", status: "OVERDUE", route: "DEL→MUM", fromLoc: "DEL-NCR", toLoc: "MUM-BHIWANDI", progress: 42, eta: "+38M LATE", speedKmh: 0 },
  { id: 4, code: "TRK-09", regNo: "DL-01-CA-8814", status: "ENROUTE", route: "DEL→BLR", fromLoc: "DEL-NCR", toLoc: "BLR-EAST", progress: 31, eta: "9H 40M", speedKmh: 62 },
  { id: 5, code: "TRK-12", regNo: "KA-05-MN-4412", status: "ENROUTE", route: "DEL→BLR", fromLoc: "DEL-NCR", toLoc: "BLR-EAST", progress: 22, eta: "11H 05M", speedKmh: 54 },
  { id: 6, code: "TRK-15", regNo: "MH-46-BV-6630", status: "ENROUTE", route: "BLR→MUM", fromLoc: "BLR-EAST", toLoc: "MUM-BHIWANDI", progress: 71, eta: "3H 20M", speedKmh: 49 },
  { id: 7, code: "TRK-18", regNo: "DL-08-RT-9021", status: "ENROUTE", route: "MUM→DEL", fromLoc: "MUM-BHIWANDI", toLoc: "DEL-NCR", progress: 12, eta: "14H 30M", speedKmh: 61 },
  { id: 8, code: "TRK-21", regNo: "KA-01-HX-7743", status: "ENROUTE", route: "BLR→DEL", fromLoc: "BLR-EAST", toLoc: "DEL-NCR", progress: 55, eta: "6H 45M", speedKmh: 57 },
];

/* ------------------------------------------------------------------ */
/* Ops feed canon                                                    */
/* ------------------------------------------------------------------ */

export type FeedType = "PUTAWAY" | "GATE" | "GPS" | "EWB" | "SCAN" | "TRANSFER" | "SYNC";

export type FeedEvent = {
  id: string;
  at: number; // epoch ms
  type: FeedType;
  message: string;
  location: string;
  doc?: string;
  href: string;
  tone: Health; // chip tone within the type's color family
};

const FEED_ROTATION: Array<Omit<FeedEvent, "id" | "at">> = [
  { type: "PUTAWAY", message: "PUTAWAY #2841 COMPLETE ▸ A-04-02-03 · MAIN DC", location: "MAIN DC", doc: "MV-2841", href: "/network", tone: "ok" },
  { type: "GATE", message: "GATE IN GJ-01-AB-4421 ▸ DOCK 3 · DEL-01", location: "DEL-01", doc: "GP-2841", href: "/gate", tone: "ok" },
  { type: "GPS", message: "TRK-07 ▸ NH-48 KM 212 · 62 KM/H", location: "DEL→MUM", href: "/fleet", tone: "ok" },
  { type: "EWB", message: "EWB 5520 1188 3092 ▸ 2H LEFT · INV/2025/0117", location: "DEL-01", doc: "INV/2025/0117", href: "/dispatch?doc=5520", tone: "warn" },
  { type: "SCAN", message: "X-RAY FLAG ▸ PKG-7781 REVIEW · BLR-01", location: "BLR-01", doc: "SCN-0012", href: "/scanning-bay", tone: "warn" },
  { type: "TRANSFER", message: "STO-2025-0118 CREATED ▸ BLR→DEL · 180 CARTONS", location: "BLR-01", doc: "STO-2025-0118", href: "/network", tone: "ok" },
  { type: "SYNC", message: "ERPNext SYNC OK · 12MS", location: "NETWORK", href: "/erpnext", tone: "ok" },
  { type: "PUTAWAY", message: "PUTAWAY #2844 COMPLETE ▸ B-02-03-01 · DEL-02", location: "DEL-02", doc: "MV-2844", href: "/network", tone: "ok" },
  { type: "SCAN", message: "PARCEL #5581 CLEAR ▸ DIMS OK · MAIN DC", location: "MAIN DC", doc: "SCN-0014", href: "/scanning-bay", tone: "ok" },
  { type: "GATE", message: "GATE OUT TRK-15 ▸ GP-2842 SEALED · BLR-01", location: "BLR-01", doc: "GP-2842", href: "/gate", tone: "ok" },
  { type: "EWB", message: "EWB 2841 9912 4471 ✓ VALID 22H · INV/2025/0091", location: "MAIN DC", doc: "INV/2025/0091", href: "/dispatch", tone: "ok" },
  { type: "GPS", message: "TRK-21 ▸ NH-44 KM 404 · 57 KM/H", location: "BLR→DEL", href: "/fleet", tone: "ok" },
];

/** Initial 12-event buffer, newest first, spaced ~90s apart. */
export function seedFeed(now: number): FeedEvent[] {
  return FEED_ROTATION.map((e, i) => ({
    ...e,
    id: `seed-${i}`,
    at: now - (i + 1) * 90_000 - Math.round(hash01(`feed:${i}`) * 40_000),
  }));
}

let feedSeq = 0;
/** Demo emitter: one plausible event, rotating types (dashboard.md §3b). */
export function nextFeedEvent(now: number): FeedEvent {
  const i = feedSeq++;
  const base = FEED_ROTATION[i % FEED_ROTATION.length];
  const serial = 2845 + i;
  const message =
    base.type === "PUTAWAY"
      ? `PUTAWAY #${serial} COMPLETE ▸ A-04-02-${String(3 + (i % 5)).padStart(2, "0")} · ${base.location}`
      : base.message;
  return { ...base, message, id: `live-${now}-${i}`, at: now };
}

/* ------------------------------------------------------------------ */
/* Exception Center canon                                            */
/* ------------------------------------------------------------------ */

export type ExceptionRow = {
  id: string;
  sev: "CRIT" | "WARN";
  type: string;
  description: string;
  location: string;
  ageMinutes: number;
  owner: string; // module name
  href: string; // deep link
};

export const DEMO_EXCEPTIONS: ExceptionRow[] = [
  { id: "ex-1", sev: "CRIT", type: "EWB EXPIRED", description: "EWB 3371 2205 8814 expired 41m ago — INV/2025/0098 (ACME) still on TRK-09", location: "DEL-NCR", ageMinutes: 41, owner: "DISPATCH", href: "/dispatch?doc=3371" },
  { id: "ex-2", sev: "CRIT", type: "CAPACITY", description: "DEL-02 at 92% — putaway blocking likely within 24h", location: "DEL-02", ageMinutes: 132, owner: "NETWORK", href: "/network?loc=DEL-NCR" },
  { id: "ex-3", sev: "WARN", type: "EWB EXPIRING", description: "EWB 5520 1188 3092 — 2h left · INV/2025/0117 (NOVA) · 412 km remaining", location: "DEL-01", ageMinutes: 118, owner: "DISPATCH", href: "/dispatch?doc=5520" },
  { id: "ex-4", sev: "WARN", type: "BIN BLOCKED", description: "SCN-0012 blocked bin B-02-03-01 after x-ray density mismatch", location: "BLR-01", ageMinutes: 64, owner: "SCANNING BAY", href: "/scanning-bay?doc=SCN-0012" },
  { id: "ex-5", sev: "WARN", type: "X-RAY REVIEW", description: "2 scan records awaiting human review · BLR-01 tunnel", location: "BLR-01", ageMinutes: 52, owner: "SCANNING BAY", href: "/scanning-bay" },
  { id: "ex-6", sev: "WARN", type: "DEAD STOCK", description: "₹12.6L aging >90d — top: SKU-0417 lot L-2211 · MAIN DC", location: "MAIN DC", ageMinutes: 2880, owner: "VALUATION", href: "/valuation?wh=MAIN-DC" },
  { id: "ex-7", sev: "WARN", type: "SLA BREACH", description: "ACME order SO-0417 dispatch +6h past promised window", location: "DEL-NCR", ageMinutes: 362, owner: "3PL PORTAL", href: "/3pl-portal" },
  { id: "ex-8", sev: "WARN", type: "VEHICLE OVERDUE", description: "TRK-07 last GPS tick 38m ago — geofence exit missed · DEL→MUM", location: "DEL→MUM", ageMinutes: 38, owner: "FLEET", href: "/fleet" },
];

/* ------------------------------------------------------------------ */
/* Status mosaic canon                                               */
/* ------------------------------------------------------------------ */

export type DockChip = {
  dock: string;
  state: "LOADING" | "IDLE" | "GATE IN" | "SCHEDULED";
  detail: string;
  tone: Health | "accent";
};

export const DEMO_DOCKS: DockChip[] = [
  { dock: "DOCK 1", state: "LOADING", detail: "TRK-04 · LP-0417", tone: "accent" },
  { dock: "DOCK 2", state: "IDLE", detail: "NEXT SLOT 15:00", tone: "ok" },
  { dock: "DOCK 3", state: "GATE IN", detail: "GJ-01-AB-4421", tone: "ok" },
  { dock: "DOCK 4", state: "SCHEDULED", detail: "14:30 · NOVA ASN-2211", tone: "ok" },
];

export type DashPlan = { planNo: string; vehicle: string; utilPct: number; volValue: string };

export const DEMO_PLANS: DashPlan[] = [
  { planNo: "LP-0417", vehicle: "TRK-04", utilPct: 91.2, volValue: "₹18.4L" },
  { planNo: "LP-0418", vehicle: "TRK-12", utilPct: 78.5, volValue: "₹9.6L" },
  { planNo: "LP-0419", vehicle: "TRK-21", utilPct: 54.0, volValue: "₹6.1L" },
];

export type ChainNode = { key: string; label: string; href: string; status: Health };

export const CHAIN: ChainNode[] = [
  { key: "scan", label: "SCAN", href: "/scanning-bay", status: "warn" },
  { key: "load", label: "LOAD", href: "/transport", status: "ok" },
  { key: "dispatch", label: "DISPATCH", href: "/dispatch", status: "crit" },
  { key: "gate", label: "GATE", href: "/gate", status: "ok" },
  { key: "fleet", label: "FLEET", href: "/fleet", status: "warn" },
];

/* ------------------------------------------------------------------ */
/* Mini treemap canon (depth 2: warehouse → item group)              */
/* ------------------------------------------------------------------ */

function groupLeaves(wh: string, groups: Array<[string, number, number]>): TMNode[] {
  return groups.map(([name, lakhs, ageDays]) => ({
    name,
    value: lakhs * 100_000,
    ageDays,
    meta: `${wh} ▸ ${name} · AVG AGE ${ageDays}D`,
  }));
}

export const DEMO_TREE: TMNode = {
  name: "NETWORK",
  children: [
    { name: "MAIN DC", value: 7_86_00_000, ageDays: 31, children: groupLeaves("MAIN DC", [["ELECTRONICS", 342, 41], ["FMCG", 218, 22], ["APPAREL", 146, 55], ["DEAD STOCK", 80, 121]]) },
    { name: "DEL-01", value: 4_12_00_000, ageDays: 24, children: groupLeaves("DEL-01", [["FMCG", 262, 18], ["BULK", 118, 44], ["RETURNS", 32, 96]]) },
    { name: "DEL-02", value: 3_44_00_000, ageDays: 38, children: groupLeaves("DEL-02", [["ELECTRONICS", 188, 33], ["APPAREL", 104, 47], ["FMCG", 52, 81]]) },
    { name: "BLR-01", value: 3_00_00_000, ageDays: 29, children: groupLeaves("BLR-01", [["ELECTRONICS", 196, 26], ["COMPONENTS", 72, 52], ["COLD", 32, 12]]) },
  ],
};

/* ------------------------------------------------------------------ */
/* Compliance canon (for live-adapted exception derivation)          */
/* ------------------------------------------------------------------ */

export const EWB_CANON = {
  expired: "3371 2205 8814",
  expiring: "5520 1188 3092",
  healthy: "2841 9912 4471",
} as const;

/** How many scan records by flag in the demo canon. */
export const SCAN_CANON = { clear: 9, review: 2, blocked: 1 } as const;
