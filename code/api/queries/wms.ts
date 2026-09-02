import { getDb } from "./connection";
import {
  warehouses,
  racks,
  bins,
  items,
  placements,
  movements,
  erpnextConfigs,
  type InsertWarehouse,
  type InsertItem,
  type InsertMovement,
} from "@db/schema";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Warehouses
// ---------------------------------------------------------------------------

export async function listWarehouses() {
  return getDb().select().from(warehouses).orderBy(asc(warehouses.id));
}

export async function getWarehouse(id: number) {
  return getDb().query.warehouses.findFirst({ where: eq(warehouses.id, id) });
}

export async function createWarehouse(data: InsertWarehouse) {
  const [{ id }] = await getDb().insert(warehouses).values(data).$returningId();
  return getWarehouse(id);
}

export async function updateWarehouse(
  id: number,
  data: Partial<InsertWarehouse>,
) {
  await getDb().update(warehouses).set(data).where(eq(warehouses.id, id));
  return getWarehouse(id);
}

// ---------------------------------------------------------------------------
// Full layout (warehouse + racks + bins + placements + items)
// ---------------------------------------------------------------------------

export async function getWarehouseWithLayout(warehouseId: number) {
  const warehouse = await getWarehouse(warehouseId);
  if (!warehouse) return null;

  // Manual assembly (flat selects) — portable across MySQL/MariaDB/TiDB,
  // unlike deeply nested relational queries with orderBy.
  const rackRows = await getDb()
    .select()
    .from(racks)
    .where(eq(racks.warehouseId, warehouseId))
    .orderBy(asc(racks.name));

  const result = [];
  for (const rack of rackRows) {
    const binRows = await getDb()
      .select()
      .from(bins)
      .where(eq(bins.rackId, rack.id))
      .orderBy(asc(bins.level), asc(bins.bay));
    const binsWithPlacements = [];
    for (const bin of binRows) {
      const placementRows = await getDb()
        .select()
        .from(placements)
        .where(eq(placements.binId, bin.id));
      const placementsWithItems = [];
      for (const p of placementRows) {
        const item = await getDb().query.items.findFirst({
          where: eq(items.id, p.itemId),
        });
        placementsWithItems.push({ ...p, item: item ?? null });
      }
      binsWithPlacements.push({ ...bin, placements: placementsWithItems });
    }
    result.push({ ...rack, bins: binsWithPlacements });
  }

  return { ...warehouse, racks: result };
}

// ---------------------------------------------------------------------------
// Layout persistence (idempotent save / regeneration)
// ---------------------------------------------------------------------------

export interface LayoutRackInput {
  name: string;
  positionX?: number;
  positionY?: number;
  rotationDeg?: number;
  bays: number;
  levels: number;
  bayWidthM: number;
  bayDepthM: number;
  levelHeightM: number;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Bin code format: {rack}-{bay}-{level}-01 (e.g. A-04-02-01). */
export function binCode(rackName: string, bay: number, level: number) {
  return `${rackName}-${pad2(bay)}-${pad2(level)}-01`;
}

/** Create any missing bins for a rack's bays × levels grid. Idempotent. */
export async function generateBins(rackId: number) {
  const db = getDb();
  const rack = await db.query.racks.findFirst({ where: eq(racks.id, rackId) });
  if (!rack) throw new Error(`Rack ${rackId} not found`);

  const existing = await db
    .select({ code: bins.code })
    .from(bins)
    .where(eq(bins.rackId, rackId));
  const existingCodes = new Set(existing.map((b) => b.code));

  const toInsert: Array<typeof bins.$inferInsert> = [];
  for (let level = 1; level <= rack.levels; level++) {
    for (let bay = 1; bay <= rack.bays; bay++) {
      const code = binCode(rack.name, bay, level);
      if (existingCodes.has(code)) continue;
      toInsert.push({
        rackId,
        bay,
        level,
        code,
        widthM: rack.bayWidthM,
        depthM: rack.bayDepthM,
        heightM: rack.levelHeightM,
        status: "active",
      });
    }
  }
  if (toInsert.length > 0) {
    await db.insert(bins).values(toInsert);
  }
  return db.select().from(bins).where(eq(bins.rackId, rackId));
}

export interface SaveLayoutResult {
  racks: number;
  bins: number;
  skippedRacks: string[]; // racks not deleted because they still hold stock
}

/**
 * Idempotently persist a warehouse layout: upsert racks by (warehouseId, name)
 * and bins by (rackId, code). Racks removed from the layout are deleted only
 * when they hold no placements; otherwise they are kept and reported.
 */
export async function upsertLayout(
  warehouseId: number,
  rackInputs: LayoutRackInput[],
): Promise<SaveLayoutResult> {
  const db = getDb();
  const existing = await db
    .select()
    .from(racks)
    .where(eq(racks.warehouseId, warehouseId));
  const byName = new Map(existing.map((r) => [r.name, r]));
  const keptRackIds = new Set<number>();

  let binCount = 0;
  for (const input of rackInputs) {
    let rackId: number;
    const rack = byName.get(input.name);
    if (rack) {
      rackId = rack.id;
      await db
        .update(racks)
        .set({
          positionX: input.positionX ?? 0,
          positionY: input.positionY ?? 0,
          rotationDeg: input.rotationDeg ?? 0,
          bays: input.bays,
          levels: input.levels,
          bayWidthM: input.bayWidthM,
          bayDepthM: input.bayDepthM,
          levelHeightM: input.levelHeightM,
        })
        .where(eq(racks.id, rack.id));
    } else {
      const [{ id }] = await db
        .insert(racks)
        .values({
          warehouseId,
          name: input.name,
          positionX: input.positionX ?? 0,
          positionY: input.positionY ?? 0,
          rotationDeg: input.rotationDeg ?? 0,
          bays: input.bays,
          levels: input.levels,
          bayWidthM: input.bayWidthM,
          bayDepthM: input.bayDepthM,
          levelHeightM: input.levelHeightM,
        })
        .$returningId();
      rackId = id;
    }
    keptRackIds.add(rackId);
    const rackBins = await generateBins(rackId);
    binCount += rackBins.length;
  }

  // Delete racks that were removed from the layout, unless they hold stock.
  const skippedRacks: string[] = [];
  const removed = existing.filter((r) => !keptRackIds.has(r.id));
  for (const rack of removed) {
    const rackBins = await db
      .select({ id: bins.id })
      .from(bins)
      .where(eq(bins.rackId, rack.id));
    const binIds = rackBins.map((b) => b.id);
    let hasStock = false;
    if (binIds.length > 0) {
      const stock = await db
        .select({ id: placements.id })
        .from(placements)
        .where(and(inArray(placements.binId, binIds), ne(placements.qty, 0)))
        .limit(1);
      hasStock = stock.length > 0;
    }
    if (hasStock) {
      skippedRacks.push(rack.name);
    } else {
      await db.delete(racks).where(eq(racks.id, rack.id)); // cascades bins
    }
  }

  return { racks: rackInputs.length, bins: binCount, skippedRacks };
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function listItems() {
  return getDb().select().from(items).orderBy(asc(items.sku));
}

export async function getItem(id: number) {
  return getDb().query.items.findFirst({ where: eq(items.id, id) });
}

export async function createItem(data: InsertItem) {
  const [{ id }] = await getDb().insert(items).values(data).$returningId();
  return getItem(id);
}

export async function updateItem(id: number, data: Partial<InsertItem>) {
  await getDb().update(items).set(data).where(eq(items.id, id));
  return getItem(id);
}

// ---------------------------------------------------------------------------
// Bins / stock
// ---------------------------------------------------------------------------

export async function getBinContents(binId: number) {
  const db = getDb();
  const bin = await db.query.bins.findFirst({ where: eq(bins.id, binId) });
  if (!bin) return null;
  const rack = await db.query.racks.findFirst({
    where: eq(racks.id, bin.rackId),
  });
  const placementRows = await db
    .select()
    .from(placements)
    .where(eq(placements.binId, binId));
  const placementsWithItems = [];
  for (const p of placementRows) {
    const item = await db.query.items.findFirst({
      where: eq(items.id, p.itemId),
    });
    placementsWithItems.push({ ...p, item: item ?? null });
  }
  return { ...bin, rack: rack ?? null, placements: placementsWithItems };
}

export async function getBinsForWarehouse(warehouseId: number) {
  const db = getDb();
  const rackRows = await db
    .select()
    .from(racks)
    .where(eq(racks.warehouseId, warehouseId));
  if (rackRows.length === 0) return { rackList: [], binList: [], placementList: [] };

  const rackList = rackRows;
  const binList = await db
    .select()
    .from(bins)
    .where(
      inArray(
        bins.rackId,
        rackList.map((r) => r.id),
      ),
    );
  const placementList =
    binList.length === 0
      ? []
      : await db
          .select()
          .from(placements)
          .where(
            inArray(
              placements.binId,
              binList.map((b) => b.id),
            ),
          );
  return { rackList, binList, placementList };
}

// ---------------------------------------------------------------------------
// Movements — transactional placement updates
// ---------------------------------------------------------------------------

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function adjustPlacement(
  tx: Tx,
  binId: number,
  itemId: number,
  delta: number,
) {
  const existing = await tx.query.placements.findFirst({
    where: and(eq(placements.binId, binId), eq(placements.itemId, itemId)),
  });
  if (!existing) {
    if (delta < 0) {
      throw new Error(`Insufficient stock in bin ${binId} for item ${itemId}`);
    }
    await tx.insert(placements).values({ binId, itemId, qty: delta });
    return;
  }
  const next = existing.qty + delta;
  if (next < 0) {
    throw new Error(
      `Insufficient stock in bin ${binId}: have ${existing.qty}, need ${-delta}`,
    );
  }
  if (next === 0) {
    await tx.delete(placements).where(eq(placements.id, existing.id));
  } else {
    await tx
      .update(placements)
      .set({ qty: next })
      .where(eq(placements.id, existing.id));
  }
}

/** Insert a movement row (status as provided, default pending). */
export async function recordMovement(data: InsertMovement) {
  const [{ id }] = await getDb().insert(movements).values(data).$returningId();
  return getDb().query.movements.findFirst({ where: eq(movements.id, id) });
}

/**
 * Complete a movement atomically: apply the placement changes implied by its
 * type and mark it completed. No-op if already completed/cancelled.
 */
export async function completeMovement(movementId: number) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const mv = await tx.query.movements.findFirst({
      where: eq(movements.id, movementId),
    });
    if (!mv) throw new Error(`Movement ${movementId} not found`);
    if (mv.status === "completed" || mv.status === "cancelled") return mv;

    switch (mv.type) {
      case "receipt":
      case "putaway":
        if (!mv.toBinId) throw new Error("Movement has no destination bin");
        await adjustPlacement(tx, mv.toBinId, mv.itemId, mv.qty);
        break;
      case "pick":
      case "dispatch":
        if (!mv.fromBinId) throw new Error("Movement has no source bin");
        await adjustPlacement(tx, mv.fromBinId, mv.itemId, -mv.qty);
        break;
      case "transfer":
        if (!mv.fromBinId || !mv.toBinId) {
          throw new Error("Transfer requires both source and destination bins");
        }
        await adjustPlacement(tx, mv.fromBinId, mv.itemId, -mv.qty);
        await adjustPlacement(tx, mv.toBinId, mv.itemId, mv.qty);
        break;
      default:
        throw new Error(`Unknown movement type: ${mv.type}`);
    }

    await tx
      .update(movements)
      .set({ status: "completed" })
      .where(eq(movements.id, movementId));
    return tx.query.movements.findFirst({
      where: eq(movements.id, movementId),
    });
  });
}

export async function listMovements(filters: {
  warehouseId?: number;
  status?: string;
  type?: string;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (filters.status) conditions.push(eq(movements.status, filters.status));
  if (filters.type) conditions.push(eq(movements.type, filters.type));

  const rows = await db
    .select()
    .from(movements)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(movements.id))
    .limit(filters.limit ?? 200);

  const allItems = await db.select().from(items);
  const itemById = new Map(allItems.map((i) => [i.id, i]));
  const withItems = rows.map((m) => ({
    ...m,
    item: itemById.get(m.itemId) ?? null,
  }));

  if (filters.warehouseId != null) {
    const { binList } = await getBinsForWarehouse(filters.warehouseId);
    const idSet = new Set(binList.map((b) => b.id));
    return withItems.filter(
      (m) =>
        (m.fromBinId != null && idSet.has(m.fromBinId)) ||
        (m.toBinId != null && idSet.has(m.toBinId)),
    );
  }
  return withItems;
}

export async function updateMovementStatus(id: number, status: string) {
  await getDb().update(movements).set({ status }).where(eq(movements.id, id));
  return getDb().query.movements.findFirst({ where: eq(movements.id, id) });
}

export async function setMovementStockEntry(id: number, stockEntry: string) {
  await getDb()
    .update(movements)
    .set({ erpnextStockEntry: stockEntry })
    .where(eq(movements.id, id));
}

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

export async function getStockSummary(warehouseId?: number) {
  const db = getDb();
  let binFilter: Set<number> | null = null;
  if (warehouseId != null) {
    const { binList } = await getBinsForWarehouse(warehouseId);
    binFilter = new Set(binList.map((b) => b.id));
  }

  const allPlacements = await db.select().from(placements);
  const allItems = await db.select().from(items);
  const itemById = new Map(allItems.map((i) => [i.id, i]));
  const byItem = new Map<
    number,
    { itemId: number; sku: string; name: string; totalQty: number; binIds: Set<number> }
  >();
  for (const p of allPlacements) {
    if (binFilter && !binFilter.has(p.binId)) continue;
    if (p.qty <= 0) continue;
    const item = itemById.get(p.itemId);
    if (!item) continue;
    let entry = byItem.get(p.itemId);
    if (!entry) {
      entry = {
        itemId: p.itemId,
        sku: item.sku,
        name: item.name,
        totalQty: 0,
        binIds: new Set(),
      };
      byItem.set(p.itemId, entry);
    }
    entry.totalQty += p.qty;
    entry.binIds.add(p.binId);
  }
  return [...byItem.values()].map((e) => ({
    itemId: e.itemId,
    sku: e.sku,
    name: e.name,
    totalQty: e.totalQty,
    binsUsed: e.binIds.size,
  }));
}

export async function getWarehouseUtilization(warehouseId: number) {
  const { rackList, binList, placementList } =
    await getBinsForWarehouse(warehouseId);
  const qtyByBin = new Map<number, number>();
  for (const p of placementList) {
    qtyByBin.set(p.binId, (qtyByBin.get(p.binId) ?? 0) + p.qty);
  }
  const usedBins = binList.filter((b) => (qtyByBin.get(b.id) ?? 0) > 0);
  const totalQty = placementList.reduce((s, p) => s + p.qty, 0);
  return {
    warehouseId,
    racks: rackList.length,
    bins: binList.length,
    usedBins: usedBins.length,
    emptyBins: binList.length - usedBins.length,
    utilizationPercent:
      binList.length === 0 ? 0 : (usedBins.length / binList.length) * 100,
    totalCartons: totalQty,
  };
}

// ---------------------------------------------------------------------------
// ERPNext config (single-row table)
// ---------------------------------------------------------------------------

export async function getErpnextConfig() {
  const db = getDb();
  const rows = await db.select().from(erpnextConfigs).limit(1);
  return rows[0] ?? null;
}

export async function saveErpnextConfig(data: {
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  enabled?: number;
  lastSyncAt?: Date | null;
}) {
  const db = getDb();
  const existing = await getErpnextConfig();
  if (!existing) {
    const [{ id }] = await db
      .insert(erpnextConfigs)
      .values({
        baseUrl: data.baseUrl ?? "",
        apiKey: data.apiKey ?? "",
        apiSecret: data.apiSecret ?? "",
        enabled: data.enabled ?? 0,
        lastSyncAt: data.lastSyncAt ?? null,
      })
      .$returningId();
    const rows = await db
      .select()
      .from(erpnextConfigs)
      .where(eq(erpnextConfigs.id, id));
    return rows[0];
  }
  await db
    .update(erpnextConfigs)
    .set(data)
    .where(eq(erpnextConfigs.id, existing.id));
  const rows = await db
    .select()
    .from(erpnextConfigs)
    .where(eq(erpnextConfigs.id, existing.id));
  return rows[0];
}
