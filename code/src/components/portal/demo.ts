/**
 * Baked demo tenant datasets for the 3PL portal (v2 convention: every demo
 * works without ERPNext). Live tRPC data overrides these when available.
 * Currency values are in INR paise where noted (formatINR expects paise).
 */

export type DemoCustomer = {
  id: number;
  code: string;
  name: string;
  brandColor: string;
  url: string;
};

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { id: 1, code: "ACME", name: "ACME Retail Pvt", brandColor: "#f97316", url: "portal.your3pl.com/acme" },
  { id: 2, code: "NOVA", name: "NOVA Health", brandColor: "#14b8a6", url: "portal.your3pl.com/nova" },
];

export type DemoKpis = {
  skusLive: number;
  orderAccuracy: number; // %
  avgDispatchHrs: number;
  stockValuePaise: number;
};

export type DemoWarehouseRow = { warehouse: string; share: number; cbm: number };
export type DemoFunnelRow = { stage: string; count: number };
export type DemoFeedRow = { time: string; text: string; tone: "data" | "warn" | "plain" };

export type DemoDashboard = {
  kpis: DemoKpis;
  warehouses: DemoWarehouseRow[];
  funnel: DemoFunnelRow[];
  feed: DemoFeedRow[];
  billing: { label: string; detail: string; amountPaise: number }[];
  invoicePaise: number;
  invoiceNo: string;
  alerts: string[];
};

export const DEMO_DASHBOARDS: Record<string, DemoDashboard> = {
  ACME: {
    kpis: { skusLive: 1842, orderAccuracy: 98.7, avgDispatchHrs: 24, stockValuePaise: 864000000 },
    warehouses: [
      { warehouse: "WH-MUM-01", share: 62, cbm: 4180 },
      { warehouse: "WH-MUM-02", share: 38, cbm: 2560 },
    ],
    funnel: [
      { stage: "PLACED", count: 46 },
      { stage: "PICKING", count: 31 },
      { stage: "PACKED", count: 18 },
      { stage: "DISPATCHED", count: 12 },
    ],
    feed: [
      { time: "09:41", text: "YOUR ORDER #SO-2841 PICKED · 8/8 LINES", tone: "data" },
      { time: "09:36", text: "ASN-2025-0117 DOCKED AT GATE 2", tone: "plain" },
      { time: "09:22", text: "SKU-0417 REPLENISHED · BIN A-04-02-03", tone: "plain" },
      { time: "09:07", text: "LOW STOCK SKU-1093 · 14 UNITS LEFT", tone: "warn" },
      { time: "08:54", text: "#SO-2837 DISPATCHED · EWB 2841 9912 4471", tone: "data" },
    ],
    billing: [
      { label: "STORAGE", detail: "1,240 CBM-DAYS × ₹4.2", amountPaise: 520800 },
      { label: "HANDLING", detail: "2,841 PICKS × ₹6", amountPaise: 1704600 },
      { label: "VAS KITTING", detail: "310 KITS × ₹42", amountPaise: 1302000 },
    ],
    invoicePaise: 18600000,
    invoiceNo: "INV/2025/0117",
    alerts: ["LOW STOCK SKU-0417", "ASN DOCKED 12:40", "INVOICE READY"],
  },
  NOVA: {
    kpis: { skusLive: 623, orderAccuracy: 99.4, avgDispatchHrs: 18, stockValuePaise: 412000000 },
    warehouses: [
      { warehouse: "WH-MUM-01", share: 45, cbm: 1980 },
      { warehouse: "WH-MUM-02", share: 55, cbm: 2420 },
    ],
    funnel: [
      { stage: "PLACED", count: 22 },
      { stage: "PICKING", count: 14 },
      { stage: "PACKED", count: 9 },
      { stage: "DISPATCHED", count: 7 },
    ],
    feed: [
      { time: "09:44", text: "YOUR ORDER #SO-1102 PACKED · 12/12 LINES", tone: "data" },
      { time: "09:31", text: "COLD-CHAIN BIN C-01-04-01 · 5.2°C OK", tone: "plain" },
      { time: "09:12", text: "ASN-2025-0441 RECEIVING · 6/9 PALLETS", tone: "plain" },
      { time: "08:58", text: "BATCH EXP FEFO HOLD · LOT NV-884", tone: "warn" },
      { time: "08:40", text: "#SO-1098 DISPATCHED · AWB 098-5531 4421", tone: "data" },
    ],
    billing: [
      { label: "STORAGE", detail: "860 CBM-DAYS × ₹5.1", amountPaise: 438600 },
      { label: "HANDLING", detail: "1,204 PICKS × ₹7", amountPaise: 842800 },
      { label: "VAS LABELLING", detail: "1,940 LABELS × ₹3", amountPaise: 582000 },
    ],
    invoicePaise: 1863400,
    invoiceNo: "INV/2025/0441",
    alerts: ["FEFO HOLD LOT NV-884", "ASN RECEIVING 67%", "INVOICE READY"],
  },
};

/** SLA gauge demo values (value, target %, display). */
export const DEMO_SLAS = [
  { label: "ORDER ACCURACY", value: 98.7, target: 98, suffix: "%", decimals: 1, caption: "TARGET 98%" },
  { label: "DISPATCH <24H", value: 96.2, target: 95, suffix: "%", decimals: 1, caption: "TARGET 95%" },
  { label: "DOCK-TO-STOCK", value: 4.1, target: 6, suffix: "H", decimals: 1, caption: "TARGET ≤6H", invert: true },
] as const;
