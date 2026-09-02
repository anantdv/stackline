/**
 * Valuation page — baked demo dataset + hierarchy builders.
 * Mirrors the seed catalog (SKU-1xxx electronics, SKU-2xxx FMCG,
 * SKU-3xxx apparel …) with INR rates matching api/queries/valuation.ts
 * DEMO_ITEM_PRICES. All currency values in INR rupees.
 */
import { hash01 } from "@/components/network/demo";

export type DemoItem = {
  sku: string;
  name: string;
  group: string;
  variant: string;
  qty: number;
  rate: number;
  ageDays: number;
  warehouse: string;
  rack: string;
};

const I = (
  sku: string,
  name: string,
  group: string,
  variant: string,
  qty: number,
  rate: number,
  ageDays: number,
  warehouse: string,
  rack: string
): DemoItem => ({ sku, name, group, variant, qty, rate, ageDays, warehouse, rack });

export const DEMO_ITEMS: DemoItem[] = [
  /* MAIN-DC (Mumbai) — multi-category */
  I("SKU-0417", "Wireless Scanner", "ELEC", "BLACK", 1240, 1485, 22, "MAIN-DC", "A-04"),
  I("SKU-1001", "Barcode Scanner", "ELEC", "BLACK", 940, 1450, 18, "MAIN-DC", "A-06"),
  I("SKU-1002", "LED Strip RGB 5m", "ELEC", "RGB", 1330, 4899, 41, "MAIN-DC", "B-02"),
  I("SKU-1003", 'Monitor 27" 4K', "ELEC", "27IN", 210, 13499, 96, "MAIN-DC", "B-03"),
  I("SKU-1004", "USB-C Hub 7-in-1", "ELEC", "7-IN-1", 860, 2299, 12, "MAIN-DC", "A-08"),
  I("SKU-3001", "Cotton Tee", "APPAREL", "M / NAVY", 2400, 1299, 34, "MAIN-DC", "C-01"),
  I("SKU-3002", "Polo", "APPAREL", "L / BLACK", 1120, 649, 58, "MAIN-DC", "C-02"),
  I("SKU-3003", "Denim Jacket", "APPAREL", "L / INDIGO", 480, 2149, 112, "MAIN-DC", "C-05"),
  I("SKU-4001", "Probiotic Drink", "COLD", "200ML", 3100, 120, 8, "MAIN-DC", "D-01"),
  I("SKU-4002", "Paneer 200g", "COLD", "200G", 1750, 95, 5, "MAIN-DC", "D-02"),
  I("SKU-4003", "Cold Brew 250ml", "COLD", "250ML", 980, 160, 14, "MAIN-DC", "D-03"),
  /* DEL-01 (Delhi FMCG, single-category) */
  I("SKU-2001", "Toor Dal 1kg", "FMCG", "1KG", 4400, 349, 19, "DEL-01", "F1-01"),
  I("SKU-2002", "Atta 5kg", "FMCG", "5KG", 5200, 499, 24, "DEL-01", "F1-02"),
  I("SKU-2003", "Basmati Rice 1kg", "FMCG", "1KG", 3100, 899, 47, "DEL-01", "F2-01"),
  I("SKU-2005", "Sunflower Oil 5L", "FMCG", "5L", 860, 1150, 66, "DEL-01", "F2-03"),
  I("SKU-2004", "Sugar 25kg", "FMCG", "25KG", 240, 1250, 124, "DEL-01", "R-01"),
  I("SKU-2006", "Detergent 4kg", "FMCG", "4KG", 620, 780, 91, "DEL-01", "R-02"),
  I("SKU-2008", "Ghee 1L", "FMCG", "1L", 96, 640, 88, "DEL-01", "X-01"),
  /* DEL-02 (Delhi multi) */
  I("SKU-1005", "Webcam HD", "ELEC", "HD", 720, 1899, 29, "DEL-02", "M1-02"),
  I("SKU-1006", "Mech Keyboard", "ELEC", "TKL", 410, 2799, 74, "DEL-02", "M1-04"),
  I("SKU-3004", "Track Pants", "APPAREL", "M / GREY", 540, 899, 44, "DEL-02", "M2-01"),
  I("SKU-2007", "Masala Mix", "FMCG", "100G", 3400, 85, 16, "DEL-02", "M2-05"),
  I("SKU-5001", "Conveyor Belt 2m", "SPARES", "2M", 44, 9800, 152, "DEL-02", "M2-08"),
  I("SKU-5002", "Scanner Battery", "SPARES", "STD", 210, 1450, 63, "DEL-02", "M2-09"),
  /* BLR-01 (Bengaluru electronics) */
  I("SKU-1101", "Raspberry Pi 5", "ELEC", "8GB", 320, 8900, 38, "BLR-01", "E1-01"),
  I("SKU-1102", "SSD 1TB NVMe", "ELEC", "1TB", 410, 5400, 55, "BLR-01", "E1-03"),
  I("SKU-1103", "PSU 650W", "ELEC", "650W", 150, 4200, 118, "BLR-01", "E2-02"),
  I("SKU-1002B", "LED Strip RGB 10m", "ELEC", "RGB-10M", 920, 4899, 26, "BLR-01", "E3-01"),
  I("SKU-4004", "Yogurt 400g", "COLD", "400G", 860, 68, 6, "BLR-01", "K-01"),
];

export const WAREHOUSE_LOC: Record<string, string> = {
  "MAIN-DC": "MUM-BHIWANDI",
  "DEL-01": "DEL-NCR",
  "DEL-02": "DEL-NCR",
  "BLR-01": "BLR-EAST",
};

export const DEMO_WAREHOUSES = ["MAIN-DC", "DEL-01", "DEL-02", "BLR-01"];
export const DEMO_RACKS = ["A-01", "A-02", "A-03", "A-04", "A-05", "A-06", "A-07", "A-08", "A-09", "A-10", "A-11", "A-12"];

export const value = (i: DemoItem) => i.qty * i.rate;

/* ---------------------------------------------------------------- */
/* Treemap hierarchy                                                 */
/* ---------------------------------------------------------------- */

export type TMNode = {
  name: string;
  value?: number;
  qty?: number;
  ageDays?: number;
  /** display extras for tooltips */
  meta?: string;
  children?: TMNode[];
};

export type Scope = "NETWORK" | "LOCATION" | "WAREHOUSE" | "CLUSTER" | "RACK";
export type Breakdown = "byItem" | "byGroup" | "byVariant";

function leafOf(items: DemoItem[], breakdown: Breakdown): TMNode[] {
  if (breakdown === "byItem") {
    return items.map((i) => ({
      name: i.sku,
      value: value(i),
      qty: i.qty,
      ageDays: i.ageDays,
      meta: `${i.name} · ${i.qty.toLocaleString("en-IN")} UNITS · RATE ₹${i.rate.toLocaleString("en-IN")} · AGE ${i.ageDays}D`,
    }));
  }
  const by = new Map<string, { qty: number; value: number; ageW: number }>();
  for (const i of items) {
    const key = breakdown === "byGroup" ? i.group : i.variant;
    const cur = by.get(key) ?? { qty: 0, value: 0, ageW: 0 };
    cur.qty += i.qty;
    cur.value += value(i);
    cur.ageW += i.ageDays * value(i);
    by.set(key, cur);
  }
  return [...by.entries()]
    .map(([k, v]) => ({
      name: k,
      value: v.value,
      qty: v.qty,
      ageDays: Math.round(v.ageW / Math.max(1, v.value)),
      meta: `${v.qty.toLocaleString("en-IN")} UNITS`,
    }))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
}

function grouped(items: DemoItem[], keyFn: (i: DemoItem) => string) {
  const m = new Map<string, DemoItem[]>();
  for (const i of items) {
    const k = keyFn(i);
    m.set(k, [...(m.get(k) ?? []), i]);
  }
  return m;
}

function aggNode(name: string, children: TMNode[]): TMNode {
  const value = children.reduce((s, c) => s + (c.value ?? 0), 0);
  const qty = children.reduce((s, c) => s + (c.qty ?? 0), 0);
  const ageW = children.reduce((s, c) => s + (c.ageDays ?? 0) * (c.value ?? 0), 0);
  return {
    name,
    value,
    qty,
    ageDays: Math.round(ageW / Math.max(1, value)),
    children,
  };
}

/** Build the demo hierarchy for a scope × breakdown (with pickers). */
export function buildHierarchy(
  scope: Scope,
  breakdown: Breakdown,
  warehouse: string,
  rack: string
): TMNode {
  const items = DEMO_ITEMS;

  const leavesByGroup = (list: DemoItem[]): TMNode[] => {
    if (breakdown === "byItem") {
      // group → item leaves
      return [...grouped(list, (i) => i.group).entries()]
        .map(([g, gs]) => aggNode(g, leafOf(gs, "byItem")))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    }
    return leafOf(list, breakdown);
  };

  const warehouseNode = (wh: string): TMNode => {
    const list = items.filter((i) => i.warehouse === wh);
    if (scope === "CLUSTER") {
      return aggNode(
        wh,
        [...grouped(list, (i) => i.rack).entries()]
          .map(([r, rs]) => aggNode(r, leavesByGroup(rs)))
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      );
    }
    return aggNode(wh, leavesByGroup(list));
  };

  if (scope === "RACK") {
    const whRack = rack;
    const list = items.filter((i) => i.warehouse === warehouse && i.rack.startsWith(whRack.split("-")[0]));
    const scoped = list.length > 0 ? list : items.filter((i) => i.warehouse === warehouse);
    return aggNode(`${warehouse} ▸ ${rack}`, leafOf(scoped, breakdown));
  }
  if (scope === "WAREHOUSE" || scope === "CLUSTER") {
    return warehouseNode(warehouse);
  }
  /* NETWORK / LOCATION: location → warehouse → … */
  return aggNode(
    "NETWORK",
    [...grouped(items, (i) => WAREHOUSE_LOC[i.warehouse]).entries()].map(
      ([loc, ls]) =>
        aggNode(
          loc,
          [...grouped(ls, (i) => i.warehouse).entries()].map(([wh]) =>
            warehouseNode(wh)
          )
        )
    )
  );
}

/* ---------------------------------------------------------------- */
/* Aging + dead stock                                                */
/* ---------------------------------------------------------------- */

export const DEMO_AGING = [
  { label: "0–30D", valueInr: 7_84_00_000, qty: 18_420, skus: 14 },
  { label: "30–60D", valueInr: 5_12_00_000, qty: 9_810, skus: 9 },
  { label: "60–90D", valueInr: 3_28_00_000, qty: 5_240, skus: 6 },
  { label: "90D+", valueInr: 2_18_00_000, qty: 2_960, skus: 5 },
];

export const DEMO_DEAD_STOCK = DEMO_ITEMS
  .filter((i) => i.ageDays >= 60)
  .sort((a, b) => value(b) - value(a))
  .slice(0, 8)
  .map((i) => ({
    sku: i.sku,
    name: i.name,
    group: i.group,
    qty: i.qty,
    valueInr: value(i),
    daysIdle: i.ageDays,
    action:
      i.ageDays > 120 ? "MARKDOWN" : i.group === "FMCG" ? "TRANSFER → DEL-01" : i.warehouse !== "MAIN-DC" ? "TRANSFER → MUM" : "BUNDLE",
  }));

/* ---------------------------------------------------------------- */
/* Timeline (24h value series + events)                              */
/* ---------------------------------------------------------------- */

export type TimelineEvent = {
  hour: number;
  kind: "receipt" | "dispatch" | "price";
  label: string;
  delta: number;
  detail?: string;
};

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { hour: 9.2, kind: "receipt", label: "09:12 RECEIPT GRN-0117", delta: 4_20_000 },
  { hour: 11.67, kind: "dispatch", label: "11:40 DISPATCH INV-0098", delta: -6_10_000 },
  { hour: 14.08, kind: "price", label: "14:05 PRICE UPDATE FROM ERPNEXT", delta: 0, detail: "SKU-0417 RATE ₹1,460 → ₹1,485 (+1.7%) · 412 SKUS REPRICED" },
  { hour: 16.5, kind: "receipt", label: "16:30 RECEIPT GRN-0121", delta: 2_80_000 },
];

export function buildTimeline(base: number): number[] {
  const pts: number[] = [];
  let v = base - 3_40_000;
  for (let h = 0; h <= 24; h += 0.5) {
    v += (hash01(`tl:${h}`) - 0.42) * 60_000;
    for (const e of TIMELINE_EVENTS) {
      if (Math.abs(h - e.hour) < 0.26) v += e.delta;
    }
    pts.push(Math.max(0, v));
  }
  return pts;
}

/* Deterministic bin value density for the heatmap lens. */
export function binValueDensity(rackCode: string, level: number): number {
  return hash01(`bin:${rackCode}:${level}`);
}
