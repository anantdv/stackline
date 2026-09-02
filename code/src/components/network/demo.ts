/**
 * Network page — baked demo dataset.
 *
 * Matches the DB seed (db/seed.ts): 3 locations (Mumbai — Bhiwandi,
 * Delhi NCR, Bengaluru East) and 4 warehouses (Main DC multi-category,
 * DEL-01 single-category FMCG, DEL-02 multi, BLR-01 electronics).
 * Used whenever the tRPC API is unreachable/empty so every demo works
 * without ERPNext. Currency values are in INR rupees.
 */
import { formatINR } from "@contracts/logistics";

/* ---------------------------------------------------------------- */
/* Formatting helpers                                                */
/* ---------------------------------------------------------------- */

/** Format rupees with Indian digit grouping (formatINR takes paise). */
export function inr(rupees: number): string {
  return formatINR(Math.round(rupees * 100));
}

/** Compact Indian notation: ₹18.42Cr / ₹86.4L / ₹1,240. */
export function inrCompact(rupees: number): string {
  const abs = Math.abs(rupees);
  if (abs >= 1e7) return `₹${(rupees / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(rupees / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${(rupees / 1e3).toFixed(1)}K`;
  return inr(rupees);
}

export function num(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Deterministic pseudo-random in [0,1) from a string key. */
export function hash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/* ---------------------------------------------------------------- */
/* Demo model                                                        */
/* ---------------------------------------------------------------- */

export type DemoRack = { code: string; util: number };

export type DemoZone = {
  code: string;
  name: string;
  /** zoning rule chip, e.g. CCTV / AMBIENT / 4°C */
  rule: string;
  bins: number;
  util: number;
  skus: number;
  valueInr: number;
  topSkus: { sku: string; name: string; qty: number }[];
  racks: DemoRack[];
};

export type DemoWarehouse = {
  id: number;
  code: string;
  name: string;
  category: string;
  categoryMode: "single-category" | "multi-category";
  bins: number;
  racks: number;
  skus: number;
  util: number;
  valueInr: number;
  zones: DemoZone[];
};

export type DemoLocation = {
  id: number;
  code: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  warehouses: DemoWarehouse[];
};

function rackStrip(zoneCode: string, count: number): DemoRack[] {
  return Array.from({ length: count }, (_, i) => ({
    code: `${zoneCode}-${String(i + 1).padStart(2, "0")}`,
    util: Math.round(38 + hash01(`${zoneCode}:${i}`) * 60),
  }));
}

function zone(
  code: string,
  name: string,
  rule: string,
  bins: number,
  util: number,
  skus: number,
  valueInr: number,
  topSkus: DemoZone["topSkus"],
  rackCount = 12
): DemoZone {
  return { code, name, rule, bins, util, skus, valueInr, topSkus, racks: rackStrip(code, rackCount) };
}

export const DEMO_NETWORK: DemoLocation[] = [
  {
    id: 1,
    code: "MUM-BHIWANDI",
    name: "Mumbai — Bhiwandi",
    city: "Mumbai",
    region: "WEST ZONE",
    lat: 19.076,
    lng: 72.877,
    warehouses: [
      {
        id: 1,
        code: "MAIN-DC",
        name: "Main DC",
        category: "MULTI-CATEGORY",
        categoryMode: "multi-category",
        bins: 8412,
        racks: 24,
        skus: 1842,
        util: 82,
        valueInr: 6_84_00_000,
        zones: [
          zone("A", "FAST-MOVING A", "AMBIENT", 1240, 82, 412, 86_40_000, [
            { sku: "SKU-0417", name: "Wireless Scanner", qty: 1240 },
            { sku: "SKU-2001", name: "Kraft Carton 12×9", qty: 4200 },
            { sku: "SKU-1004", name: "USB-C Hub 7-in-1", qty: 860 },
          ]),
          zone("B", "ELECTRONICS (SECURED)", "CCTV", 2140, 88, 620, 3_42_00_000, [
            { sku: "SKU-1003", name: 'Monitor 27" 4K', qty: 210 },
            { sku: "SKU-1002", name: "LED Strip RGB 5m", qty: 1330 },
            { sku: "SKU-1001", name: "Barcode Scanner", qty: 940 },
          ]),
          zone("C", "APPAREL", "AMBIENT", 3012, 74, 586, 1_18_00_000, [
            { sku: "SKU-3001", name: "Cotton Tee — M", qty: 2400 },
            { sku: "SKU-3003", name: "Denim Jacket", qty: 480 },
            { sku: "SKU-3002", name: "Polo — L", qty: 1120 },
          ]),
          zone("D", "COLD 4°C", "4°C", 2020, 91, 224, 1_37_60_000, [
            { sku: "SKU-4001", name: "Probiotic Drink", qty: 3100 },
            { sku: "SKU-4002", name: "Paneer 200g", qty: 1750 },
            { sku: "SKU-4003", name: "Cold Brew 250ml", qty: 980 },
          ]),
        ],
      },
    ],
  },
  {
    id: 2,
    code: "DEL-NCR",
    name: "Delhi NCR",
    city: "New Delhi",
    region: "NORTH ZONE",
    lat: 28.613,
    lng: 77.209,
    warehouses: [
      {
        id: 2,
        code: "DEL-01",
        name: "Delhi NCR FMCG DC",
        category: "FMCG · SINGLE-CATEGORY",
        categoryMode: "single-category",
        bins: 3120,
        racks: 12,
        skus: 412,
        util: 76,
        valueInr: 3_06_00_000,
        zones: [
          zone("F", "FAST-MOVING A", "VELOCITY", 1420, 84, 186, 1_62_00_000, [
            { sku: "SKU-2002", name: "Atta 5kg", qty: 5200 },
            { sku: "SKU-2003", name: "Basmati Rice 1kg", qty: 3100 },
            { sku: "SKU-2001", name: "Toor Dal 1kg", qty: 4400 },
          ]),
          zone("R", "BULK RESERVE", "FEFO", 1240, 71, 142, 1_18_00_000, [
            { sku: "SKU-2005", name: "Sunflower Oil 5L", qty: 860 },
            { sku: "SKU-2004", name: "Sugar 25kg", qty: 240 },
            { sku: "SKU-2006", name: "Detergent 4kg", qty: 620 },
          ]),
          zone("X", "RETURNS", "QC HOLD", 460, 42, 84, 26_00_000, [
            { sku: "SKU-2002", name: "Atta 5kg", qty: 120 },
            { sku: "SKU-2008", name: "Ghee 1L", qty: 96 },
            { sku: "SKU-2003", name: "Basmati Rice 1kg", qty: 140 },
          ]),
        ],
      },
      {
        id: 3,
        code: "DEL-02",
        name: "Delhi NCR Multi DC",
        category: "MULTI-CATEGORY",
        categoryMode: "multi-category",
        bins: 4280,
        racks: 16,
        skus: 968,
        util: 84,
        valueInr: 4_86_00_000,
        zones: [
          zone("A", "ELECTRONICS (SECURED)", "CCTV", 1180, 86, 284, 2_24_00_000, [
            { sku: "SKU-1003", name: 'Monitor 27" 4K', qty: 160 },
            { sku: "SKU-0417", name: "Wireless Scanner", qty: 480 },
            { sku: "SKU-1005", name: "Webcam HD", qty: 720 },
          ]),
          zone("B", "APPAREL", "AMBIENT", 1620, 79, 402, 1_06_00_000, [
            { sku: "SKU-3001", name: "Cotton Tee — M", qty: 1860 },
            { sku: "SKU-3004", name: "Track Pants", qty: 540 },
            { sku: "SKU-3002", name: "Polo — L", qty: 880 },
          ]),
          zone("C", "FMCG", "FEFO", 980, 90, 196, 92_00_000, [
            { sku: "SKU-2003", name: "Basmati Rice 1kg", qty: 2100 },
            { sku: "SKU-2007", name: "Masala Mix", qty: 3400 },
            { sku: "SKU-2001", name: "Toor Dal 1kg", qty: 1800 },
          ]),
          zone("D", "SPARES", "BIN-SMALL", 500, 63, 86, 64_00_000, [
            { sku: "SKU-5001", name: "Conveyor Belt 2m", qty: 44 },
            { sku: "SKU-5002", name: "Scanner Battery", qty: 210 },
            { sku: "SKU-5003", name: "Forklift Fuse Kit", qty: 96 },
          ]),
        ],
      },
    ],
  },
  {
    id: 3,
    code: "BLR-EAST",
    name: "Bengaluru East",
    city: "Bengaluru",
    region: "SOUTH ZONE",
    lat: 12.971,
    lng: 77.594,
    warehouses: [
      {
        id: 4,
        code: "BLR-01",
        name: "Bengaluru Electronics Hub",
        category: "ELECTRONICS",
        categoryMode: "multi-category",
        bins: 2960,
        racks: 14,
        skus: 620,
        util: 71,
        valueInr: 3_66_00_000,
        zones: [
          zone("E", "ELECTRONICS (SECURED)", "CCTV · ESD", 1360, 78, 322, 2_42_00_000, [
            { sku: "SKU-1003", name: 'Monitor 27" 4K', qty: 180 },
            { sku: "SKU-1006", name: "Mech Keyboard", qty: 640 },
            { sku: "SKU-1002", name: "LED Strip RGB 5m", qty: 920 },
          ]),
          zone("C", "COMPONENTS", "ESD", 940, 66, 214, 84_00_000, [
            { sku: "SKU-1101", name: "Raspberry Pi 5", qty: 320 },
            { sku: "SKU-1102", name: "SSD 1TB NVMe", qty: 410 },
            { sku: "SKU-1103", name: "PSU 650W", qty: 150 },
          ]),
          zone("K", "COLD 4°C", "4°C", 660, 69, 84, 40_00_000, [
            { sku: "SKU-4001", name: "Probiotic Drink", qty: 1200 },
            { sku: "SKU-4004", name: "Yogurt 400g", qty: 860 },
            { sku: "SKU-4003", name: "Cold Brew 250ml", qty: 420 },
          ]),
        ],
      },
    ],
  },
];

export const NETWORK_TOTALS = {
  locations: DEMO_NETWORK.length,
  warehouses: DEMO_NETWORK.reduce((s, l) => s + l.warehouses.length, 0),
  zones: DEMO_NETWORK.reduce((s, l) => s + l.warehouses.reduce((a, w) => a + w.zones.length, 0), 0),
  bins: DEMO_NETWORK.reduce((s, l) => s + l.warehouses.reduce((a, w) => a + w.bins, 0), 0),
  skus: DEMO_NETWORK.reduce((s, l) => s + l.warehouses.reduce((a, w) => a + w.skus, 0), 0),
  valueInr: DEMO_NETWORK.reduce((s, l) => s + l.warehouses.reduce((a, w) => a + w.valueInr, 0), 0),
};

/* ---------------------------------------------------------------- */
/* Transfers (inter-warehouse)                                       */
/* ---------------------------------------------------------------- */

export type DemoTransfer = {
  id: string;
  erpDoc: string;
  fromCode: string;
  toCode: string;
  fromLoc: string;
  toLoc: string;
  skus: number;
  qty: number;
  valueInr: number;
  status: "IN TRANSIT" | "DOCKED" | "RECEIVED ✓";
  truck: string;
  eta: string;
};

export const DEMO_TRANSFERS: DemoTransfer[] = [
  { id: "STO-2025-0117", erpDoc: "STE-0117", fromCode: "MAIN-DC", toCode: "DEL-01", fromLoc: "MUM-BHIWANDI", toLoc: "DEL-NCR", skus: 14, qty: 240, valueInr: 18_60_000, status: "IN TRANSIT", truck: "TRK-07", eta: "6H 20M" },
  { id: "STO-2025-0116", erpDoc: "STE-0116", fromCode: "BLR-01", toCode: "MAIN-DC", fromLoc: "BLR-EAST", toLoc: "MUM-BHIWANDI", skus: 9, qty: 180, valueInr: 22_40_000, status: "IN TRANSIT", truck: "TRK-12", eta: "11H 05M" },
  { id: "STO-2025-0115", erpDoc: "STE-0115", fromCode: "DEL-02", toCode: "BLR-01", fromLoc: "DEL-NCR", toLoc: "BLR-EAST", skus: 22, qty: 420, valueInr: 12_80_000, status: "DOCKED", truck: "TRK-03", eta: "DOCK 04" },
  { id: "STO-2025-0114", erpDoc: "STE-0114", fromCode: "MAIN-DC", toCode: "DEL-02", fromLoc: "MUM-BHIWANDI", toLoc: "DEL-NCR", skus: 6, qty: 96, valueInr: 4_20_000, status: "RECEIVED ✓", truck: "TRK-07", eta: "DONE" },
  { id: "STO-2025-0113", erpDoc: "STE-0113", fromCode: "DEL-01", toCode: "MAIN-DC", fromLoc: "DEL-NCR", toLoc: "MUM-BHIWANDI", skus: 11, qty: 310, valueInr: 4_90_000, status: "RECEIVED ✓", truck: "TRK-19", eta: "DONE" },
];

/* ---------------------------------------------------------------- */
/* Live-data adaptation                                              */
/* ---------------------------------------------------------------- */

/** Normalized location shape consumed by the map + panels. */
export type NetLocation = {
  id: number;
  code: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  warehouses: {
    id: number;
    code: string;
    name: string;
    category: string;
    categoryMode: string;
    bins: number;
    skus: number;
    valueInr: number;
    util: number;
  }[];
  totals: { warehouses: number; bins: number; valueInr: number };
};

/** Map tRPC `network.listLocations` rows onto NetLocation; null if unusable. */
export function adaptLocations(
  rows:
    | Array<{
        id: number;
        code: string;
        name: string;
        region: string;
        lat: number;
        lng: number;
        warehouses: Array<{
          id: number;
          code: string;
          name: string;
          categoryMode: string;
          bins: number;
          skus: number;
          valueInr: number;
        }>;
        totals: { warehouses: number; bins: number; valueInr: number };
      }>
    | undefined
): NetLocation[] | null {
  if (!rows || rows.length === 0) return null;
  return rows.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    region: l.region.toUpperCase(),
    lat: l.lat,
    lng: l.lng,
    totals: l.totals,
    warehouses: l.warehouses.map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      category: w.categoryMode === "single-category" ? "SINGLE-CATEGORY" : "MULTI-CATEGORY",
      categoryMode: w.categoryMode,
      bins: w.bins,
      skus: w.skus,
      valueInr: w.valueInr,
      util: Math.round(55 + hash01(w.code) * 40),
    })),
  }));
}

/** Demo fallback as NetLocation[]. */
export const DEMO_NET_LOCATIONS: NetLocation[] = DEMO_NETWORK.map((l) => ({
  id: l.id,
  code: l.code,
  name: l.name,
  region: l.region,
  lat: l.lat,
  lng: l.lng,
  totals: {
    warehouses: l.warehouses.length,
    bins: l.warehouses.reduce((s, w) => s + w.bins, 0),
    valueInr: l.warehouses.reduce((s, w) => s + w.valueInr, 0),
  },
  warehouses: l.warehouses.map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
    category: w.category,
    categoryMode: w.categoryMode,
    bins: w.bins,
    skus: w.skus,
    valueInr: w.valueInr,
    util: w.util,
  })),
}));
