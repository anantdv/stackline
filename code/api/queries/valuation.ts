/**
 * Valuation queries — stock value aggregates at rack/cluster(warehouse)/
 * warehouse granularity × item/group/variant breakdowns, plus aging buckets.
 *
 * Price resolution order (per item):
 *   1. Live ERPNext Item Price (when an enabled config exists and fetch works)
 *   2. items.standardRate (cached ERP price)
 *   3. Built-in demo INR rates
 */
import { getDb } from "./connection";
import { getErpnextConfig } from "./wms";
import {
  bins,
  items,
  locations,
  placements,
  racks,
  warehouses,
  type Item,
  type Placement,
  type Rack,
  type Warehouse,
} from "@db/schema";

// ---------------------------------------------------------------------------
// Demo price list (realistic INR rates), keyed by item_code / SKU
// ---------------------------------------------------------------------------

export const DEMO_ITEM_PRICES: Array<{
  item_code: string;
  price_list_rate: number;
  currency: string;
}> = [
  { item_code: "SKU-1001", price_list_rate: 1450, currency: "INR" },
  { item_code: "SKU-1002", price_list_rate: 4899, currency: "INR" },
  { item_code: "SKU-1003", price_list_rate: 13499, currency: "INR" },
  { item_code: "SKU-1004", price_list_rate: 2299, currency: "INR" },
  { item_code: "SKU-1005", price_list_rate: 1899, currency: "INR" },
  { item_code: "SKU-1006", price_list_rate: 2799, currency: "INR" },
  { item_code: "SKU-2001", price_list_rate: 349, currency: "INR" },
  { item_code: "SKU-2002", price_list_rate: 499, currency: "INR" },
  { item_code: "SKU-2003", price_list_rate: 899, currency: "INR" },
  { item_code: "SKU-3001", price_list_rate: 1299, currency: "INR" },
  { item_code: "SKU-3002", price_list_rate: 649, currency: "INR" },
  { item_code: "SKU-3003", price_list_rate: 2149, currency: "INR" },
];

const DEMO_PRICE_BY_CODE = new Map(
  DEMO_ITEM_PRICES.map((p) => [p.item_code, p.price_list_rate]),
);

export interface PriceSource {
  /** true when values come from a live ERPNext Item Price fetch. */
  live: boolean;
  source: "erpnext-live" | "cache" | "demo";
}

export interface PriceMap {
  priceByItemId: Map<number, number>;
  source: PriceSource;
}

/** Fetch live Item Prices from ERPNext; null on any failure. */
export async function fetchLiveItemPrices(): Promise<Array<{
  item_code: string;
  price_list_rate: number;
  currency: string;
}> | null> {
  const cfg = await getErpnextConfig();
  if (!cfg || !cfg.enabled || !cfg.baseUrl || !cfg.apiKey) return null;
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/api/resource/Item Price?fields=${encodeURIComponent('["item_code","price_list_rate","currency"]')}&limit_page_length=2000`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `token ${cfg.apiKey}:${cfg.apiSecret}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data?: Array<{ item_code: string; price_list_rate: number; currency: string }>;
    };
    return body.data ?? [];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve a price (INR) for every item in the catalog. */
export async function resolvePriceMap(): Promise<PriceMap> {
  const db = getDb();
  const allItems = await db.select().from(items);

  const livePrices = await fetchLiveItemPrices();
  const liveByCode = new Map(
    (livePrices ?? []).map((p) => [p.item_code, p.price_list_rate]),
  );

  const priceByItemId = new Map<number, number>();
  let anyLive = false;
  let anyCache = false;
  for (const item of allItems) {
    const code = item.erpnextItemCode ?? item.sku;
    const live = liveByCode.get(code);
    if (live != null) {
      priceByItemId.set(item.id, live);
      anyLive = true;
    } else if (item.standardRate != null) {
      priceByItemId.set(item.id, item.standardRate);
      anyCache = true;
    } else {
      priceByItemId.set(item.id, DEMO_PRICE_BY_CODE.get(code) ?? 0);
    }
  }

  const source: PriceSource = anyLive
    ? { live: true, source: "erpnext-live" }
    : anyCache
      ? { live: false, source: "cache" }
      : { live: false, source: "demo" };
  return { priceByItemId, source };
}

export function priceOf(priceMap: PriceMap, item: Item): number {
  return priceMap.priceByItemId.get(item.id) ?? item.standardRate ?? 0;
}

// ---------------------------------------------------------------------------
// Stock graph loading (plain selects + manual assembly — MariaDB-safe)
// ---------------------------------------------------------------------------

export interface StockGraph {
  placementList: Placement[];
  binById: Map<number, { id: number; rackId: number; code: string }>;
  rackById: Map<number, Rack>;
  warehouseById: Map<number, Warehouse>;
  itemById: Map<number, Item>;
}

export async function loadStockGraph(): Promise<StockGraph> {
  const db = getDb();
  const [placementList, binList, rackList, warehouseList, itemList] =
    await Promise.all([
      db.select().from(placements),
      db.select().from(bins),
      db.select().from(racks),
      db.select().from(warehouses),
      db.select().from(items),
    ]);
  return {
    placementList: placementList.filter((p) => p.qty > 0),
    binById: new Map(binList.map((b) => [b.id, b])),
    rackById: new Map(rackList.map((r) => [r.id, r])),
    warehouseById: new Map(warehouseList.map((w) => [w.id, w])),
    itemById: new Map(itemList.map((i) => [i.id, i])),
  };
}

export type ValuationBreakdown = "byItem" | "byGroup" | "byVariant";

export interface ValuationRow {
  /** Breakdown key: sku / groupCode / variant label. */
  key: string;
  label: string;
  qty: number;
  valueInr: number;
}

interface ScopedPlacement {
  placement: Placement;
  item: Item;
  warehouseId: number;
  rackId: number;
}

function scopePlacements(
  graph: StockGraph,
  scope: { warehouseId?: number; rackId?: number },
): ScopedPlacement[] {
  const out: ScopedPlacement[] = [];
  for (const p of graph.placementList) {
    const bin = graph.binById.get(p.binId);
    if (!bin) continue;
    const rack = graph.rackById.get(bin.rackId);
    if (!rack) continue;
    if (scope.warehouseId != null && rack.warehouseId !== scope.warehouseId)
      continue;
    if (scope.rackId != null && rack.id !== scope.rackId) continue;
    const item = graph.itemById.get(p.itemId);
    if (!item) continue;
    out.push({ placement: p, item, warehouseId: rack.warehouseId, rackId: rack.id });
  }
  return out;
}

function breakdownKey(item: Item, breakdown: ValuationBreakdown) {
  switch (breakdown) {
    case "byItem":
      return { key: item.sku, label: item.name };
    case "byGroup":
      return { key: item.groupCode, label: item.groupCode };
    case "byVariant":
      return {
        key: item.variant ?? "(none)",
        label: item.variant ?? "No variant",
      };
  }
}

function aggregateRows(
  scoped: ScopedPlacement[],
  breakdown: ValuationBreakdown,
  priceMap: PriceMap,
): ValuationRow[] {
  const byKey = new Map<string, ValuationRow>();
  for (const { placement, item } of scoped) {
    const { key, label } = breakdownKey(item, breakdown);
    let row = byKey.get(key);
    if (!row) {
      row = { key, label, qty: 0, valueInr: 0 };
      byKey.set(key, row);
    }
    row.qty += placement.qty;
    row.valueInr += placement.qty * priceOf(priceMap, item);
  }
  return [...byKey.values()].sort((a, b) => b.valueInr - a.valueInr);
}

export interface ValuationGroup {
  id: number;
  code: string;
  name: string;
  rows: ValuationRow[];
  totalQty: number;
  totalValueInr: number;
}

function groupTotals(rows: ValuationRow[]) {
  return {
    totalQty: rows.reduce((s, r) => s + r.qty, 0),
    totalValueInr: rows.reduce((s, r) => s + r.valueInr, 0),
  };
}

/** Network-wide, grouped per warehouse. */
export async function valuationByWarehouse(breakdown: ValuationBreakdown) {
  const [graph, priceMap] = await Promise.all([loadStockGraph(), resolvePriceMap()]);
  const scoped = scopePlacements(graph, {});
  const byWarehouse = new Map<number, ScopedPlacement[]>();
  for (const sp of scoped) {
    const arr = byWarehouse.get(sp.warehouseId) ?? [];
    arr.push(sp);
    byWarehouse.set(sp.warehouseId, arr);
  }
  const groups: ValuationGroup[] = [];
  for (const [warehouseId, list] of byWarehouse) {
    const wh = graph.warehouseById.get(warehouseId);
    const rows = aggregateRows(list, breakdown, priceMap);
    groups.push({
      id: warehouseId,
      code: wh?.code ?? `WH-${warehouseId}`,
      name: wh?.name ?? `Warehouse ${warehouseId}`,
      rows,
      ...groupTotals(rows),
    });
  }
  groups.sort((a, b) => b.totalValueInr - a.totalValueInr);
  return { source: priceMap.source, groups };
}

/** One warehouse, grouped per rack ("cluster"). */
export async function valuationByCluster(
  warehouseId: number,
  breakdown: ValuationBreakdown,
) {
  const [graph, priceMap] = await Promise.all([loadStockGraph(), resolvePriceMap()]);
  const scoped = scopePlacements(graph, { warehouseId });
  const byRack = new Map<number, ScopedPlacement[]>();
  for (const sp of scoped) {
    const arr = byRack.get(sp.rackId) ?? [];
    arr.push(sp);
    byRack.set(sp.rackId, arr);
  }
  const groups: ValuationGroup[] = [];
  for (const [rackId, list] of byRack) {
    const rack = graph.rackById.get(rackId);
    const rows = aggregateRows(list, breakdown, priceMap);
    groups.push({
      id: rackId,
      code: rack?.name ?? `R-${rackId}`,
      name: `Rack ${rack?.name ?? rackId}`,
      rows,
      ...groupTotals(rows),
    });
  }
  groups.sort((a, b) => b.totalValueInr - a.totalValueInr);
  const warehouse = graph.warehouseById.get(warehouseId) ?? null;
  return { source: priceMap.source, warehouse, groups };
}

/** One rack, flat breakdown rows. */
export async function valuationByRack(
  rackId: number,
  breakdown: ValuationBreakdown,
) {
  const [graph, priceMap] = await Promise.all([loadStockGraph(), resolvePriceMap()]);
  const scoped = scopePlacements(graph, { rackId });
  const rows = aggregateRows(scoped, breakdown, priceMap);
  const rack = graph.rackById.get(rackId) ?? null;
  return { source: priceMap.source, rack, rows, ...groupTotals(rows) };
}

// ---------------------------------------------------------------------------
// Aging buckets (from placements.createdAt)
// ---------------------------------------------------------------------------

export interface AgingBucket {
  bucket: "lt30d" | "d30to90" | "gt90d";
  label: string;
  qty: number;
  valueInr: number;
  skus: number;
}

export async function valuationAging(warehouseId?: number) {
  const [graph, priceMap] = await Promise.all([loadStockGraph(), resolvePriceMap()]);
  const scoped = scopePlacements(graph, { warehouseId });
  const now = Date.now();
  const DAY = 24 * 3600 * 1000;
  const buckets: AgingBucket[] = [
    { bucket: "lt30d", label: "< 30 days", qty: 0, valueInr: 0, skus: 0 },
    { bucket: "d30to90", label: "30–90 days", qty: 0, valueInr: 0, skus: 0 },
    { bucket: "gt90d", label: "> 90 days", qty: 0, valueInr: 0, skus: 0 },
  ];
  const skuSets: Array<Set<string>> = [new Set(), new Set(), new Set()];
  for (const { placement, item } of scoped) {
    const ageDays = (now - placement.createdAt.getTime()) / DAY;
    const idx = ageDays < 30 ? 0 : ageDays <= 90 ? 1 : 2;
    buckets[idx].qty += placement.qty;
    buckets[idx].valueInr += placement.qty * priceOf(priceMap, item);
    skuSets[idx].add(item.sku);
  }
  buckets.forEach((b, i) => (b.skus = skuSets[i].size));
  return { source: priceMap.source, buckets };
}

// ---------------------------------------------------------------------------
// Network totals
// ---------------------------------------------------------------------------

export async function valuationNetworkTotals() {
  const db = getDb();
  const [graph, priceMap, locationList] = await Promise.all([
    loadStockGraph(),
    resolvePriceMap(),
    db.select().from(locations),
  ]);
  const scoped = scopePlacements(graph, {});
  let totalQty = 0;
  let totalValueInr = 0;
  const warehouseIds = new Set<number>();
  const skus = new Set<string>();
  for (const { placement, item, warehouseId } of scoped) {
    totalQty += placement.qty;
    totalValueInr += placement.qty * priceOf(priceMap, item);
    warehouseIds.add(warehouseId);
    skus.add(item.sku);
  }
  return {
    source: priceMap.source,
    totalQty,
    totalValueInr,
    warehousesWithStock: warehouseIds.size,
    locations: locationList.length,
    skus: skus.size,
  };
}
