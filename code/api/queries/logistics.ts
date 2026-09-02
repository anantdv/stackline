/**
 * v2 logistics queries — locations, customers, docks, vehicles, gate passes,
 * scan records, load plans, routes. Plain select() + manual assembly only
 * (MariaDB-safe; no relational `with:`).
 */
import { getDb } from "./connection";
import {
  customers,
  docks,
  gatePasses,
  items,
  loadPlans,
  locations,
  racks,
  bins,
  routes,
  scanRecords,
  vehicles,
  warehouses,
  movements,
  type InsertGatePass,
  type InsertLoadPlan,
  type InsertScanRecord,
} from "@db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { loadStockGraph, priceOf, resolvePriceMap } from "./valuation";

// ---------------------------------------------------------------------------
// Locations / network
// ---------------------------------------------------------------------------

export async function listLocations() {
  return getDb().select().from(locations).orderBy(asc(locations.id));
}

export async function getLocation(id: number) {
  return getDb().query.locations.findFirst({ where: eq(locations.id, id) });
}

export async function listWarehousesWithLocation() {
  const db = getDb();
  const warehouseList = await db.select().from(warehouses).orderBy(asc(warehouses.id));
  const locationList = await db.select().from(locations);
  const locById = new Map(locationList.map((l) => [l.id, l]));
  return warehouseList.map((w) => ({
    ...w,
    location: w.locationId != null ? (locById.get(w.locationId) ?? null) : null,
  }));
}

/** Locations with nested warehouses, each with a stock/value rollup. */
export async function listLocationsWithWarehouses() {
  const [graph, priceMap, warehouseList, locationList, rackList, binList] =
    await Promise.all([
      loadStockGraph(),
      resolvePriceMap(),
      getDb().select().from(warehouses).orderBy(asc(warehouses.id)),
      getDb().select().from(locations).orderBy(asc(locations.id)),
      getDb().select().from(racks),
      getDb().select().from(bins),
    ]);

  // Roll up placements per warehouse.
  const rollupByWarehouse = new Map<
    number,
    { totalQty: number; valueInr: number; skus: Set<string> }
  >();
  for (const p of graph.placementList) {
    const bin = graph.binById.get(p.binId);
    const rack = bin ? graph.rackById.get(bin.rackId) : undefined;
    if (!rack) continue;
    const item = graph.itemById.get(p.itemId);
    if (!item) continue;
    let roll = rollupByWarehouse.get(rack.warehouseId);
    if (!roll) {
      roll = { totalQty: 0, valueInr: 0, skus: new Set() };
      rollupByWarehouse.set(rack.warehouseId, roll);
    }
    roll.totalQty += p.qty;
    roll.valueInr += p.qty * priceOf(priceMap, item);
    roll.skus.add(item.sku);
  }

  const racksByWarehouse = new Map<number, number>();
  for (const r of rackList) {
    racksByWarehouse.set(r.warehouseId, (racksByWarehouse.get(r.warehouseId) ?? 0) + 1);
  }
  const binsByWarehouse = new Map<number, number>();
  for (const b of binList) {
    const rack = graph.rackById.get(b.rackId);
    if (rack) binsByWarehouse.set(rack.warehouseId, (binsByWarehouse.get(rack.warehouseId) ?? 0) + 1);
  }

  const warehousesNested = warehouseList.map((w) => {
    const roll = rollupByWarehouse.get(w.id);
    return {
      ...w,
      racks: racksByWarehouse.get(w.id) ?? 0,
      bins: binsByWarehouse.get(w.id) ?? 0,
      totalQty: roll?.totalQty ?? 0,
      valueInr: roll?.valueInr ?? 0,
      skus: roll?.skus.size ?? 0,
    };
  });

  return locationList.map((loc) => {
    const whs = warehousesNested.filter((w) => w.locationId === loc.id);
    return {
      ...loc,
      warehouses: whs,
      totals: {
        warehouses: whs.length,
        bins: whs.reduce((s, w) => s + w.bins, 0),
        totalQty: whs.reduce((s, w) => s + w.totalQty, 0),
        valueInr: whs.reduce((s, w) => s + w.valueInr, 0),
      },
    };
  });
}

/** Location → warehouse → rack tree (counts only at the rack level). */
export async function locationTree() {
  const db = getDb();
  const [locationList, warehouseList, rackList, binList] = await Promise.all([
    db.select().from(locations).orderBy(asc(locations.id)),
    db.select().from(warehouses).orderBy(asc(warehouses.id)),
    db.select().from(racks).orderBy(asc(racks.name)),
    db.select().from(bins),
  ]);
  const binsByRack = new Map<number, number>();
  for (const b of binList) {
    binsByRack.set(b.rackId, (binsByRack.get(b.rackId) ?? 0) + 1);
  }
  return locationList.map((loc) => ({
    ...loc,
    warehouses: warehouseList
      .filter((w) => w.locationId === loc.id)
      .map((w) => ({
        ...w,
        racks: rackList
          .filter((r) => r.warehouseId === w.id)
          .map((r) => ({ ...r, bins: binsByRack.get(r.id) ?? 0 })),
      })),
  }));
}

/** Inter-warehouse transfers (movements of type 'transfer') with endpoints. */
export async function listTransfers(limit = 50) {
  const db = getDb();
  const rows = await db
    .select()
    .from(movements)
    .where(eq(movements.type, "transfer"))
    .orderBy(desc(movements.id))
    .limit(limit);
  if (rows.length === 0) return [];

  const [itemList, binList, rackList, warehouseList] = await Promise.all([
    db.select().from(items),
    db.select().from(bins),
    db.select().from(racks),
    db.select().from(warehouses),
  ]);
  const itemById = new Map(itemList.map((i) => [i.id, i]));
  const binById = new Map(binList.map((b) => [b.id, b]));
  const rackById = new Map(rackList.map((r) => [r.id, r]));
  const whById = new Map(warehouseList.map((w) => [w.id, w]));

  const endpoint = (binId: number | null) => {
    if (binId == null) return { bin: null, rack: null, warehouse: null };
    const bin = binById.get(binId) ?? null;
    const rack = bin ? (rackById.get(bin.rackId) ?? null) : null;
    const warehouse = rack ? (whById.get(rack.warehouseId) ?? null) : null;
    return { bin, rack, warehouse };
  };

  return rows.map((m) => {
    const from = endpoint(m.fromBinId);
    const to = endpoint(m.toBinId);
    return {
      ...m,
      item: itemById.get(m.itemId) ?? null,
      from,
      to,
      crossWarehouse:
        from.warehouse != null &&
        to.warehouse != null &&
        from.warehouse.id !== to.warehouse.id,
    };
  });
}

// ---------------------------------------------------------------------------
// Customers (3PL portal)
// ---------------------------------------------------------------------------

export async function listCustomers() {
  return getDb().select().from(customers).orderBy(asc(customers.id));
}

export async function getCustomer(id: number) {
  return getDb().query.customers.findFirst({ where: eq(customers.id, id) });
}

// ---------------------------------------------------------------------------
// Docks
// ---------------------------------------------------------------------------

export async function listDocks(warehouseId?: number) {
  const db = getDb();
  return db
    .select()
    .from(docks)
    .where(warehouseId != null ? eq(docks.warehouseId, warehouseId) : undefined)
    .orderBy(asc(docks.code));
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export async function listVehicles() {
  return getDb().select().from(vehicles).orderBy(asc(vehicles.id));
}

export async function getVehicle(id: number) {
  return getDb().query.vehicles.findFirst({ where: eq(vehicles.id, id) });
}

export async function assignDriver(vehicleId: number, driverName: string) {
  const db = getDb();
  await db.update(vehicles).set({ driverName }).where(eq(vehicles.id, vehicleId));
  return getVehicle(vehicleId);
}

export async function updateVehiclePosition(
  vehicleId: number,
  gpsLat: number,
  gpsLng: number,
  status?: string,
) {
  const db = getDb();
  await db
    .update(vehicles)
    .set({ gpsLat, gpsLng, ...(status ? { status } : {}) })
    .where(eq(vehicles.id, vehicleId));
  return getVehicle(vehicleId);
}

// ---------------------------------------------------------------------------
// Gate passes
// ---------------------------------------------------------------------------

export async function listGatePasses(filters: {
  warehouseId?: number;
  status?: string;
  direction?: string;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (filters.warehouseId != null)
    conditions.push(eq(gatePasses.warehouseId, filters.warehouseId));
  if (filters.status) conditions.push(eq(gatePasses.status, filters.status));
  if (filters.direction) conditions.push(eq(gatePasses.direction, filters.direction));
  const passList = await db
    .select()
    .from(gatePasses)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(gatePasses.id))
    .limit(filters.limit ?? 200);
  if (passList.length === 0) return [];
  const vehicleList = await db.select().from(vehicles);
  const vehById = new Map(vehicleList.map((v) => [v.id, v]));
  return passList.map((p) => ({ ...p, vehicle: vehById.get(p.vehicleId) ?? null }));
}

export async function getGatePass(id: number) {
  return getDb().query.gatePasses.findFirst({ where: eq(gatePasses.id, id) });
}

export async function createGatePass(data: InsertGatePass) {
  const db = getDb();
  const [{ id }] = await db.insert(gatePasses).values(data).$returningId();
  return getGatePass(id);
}

export async function updateGatePass(
  id: number,
  data: Partial<InsertGatePass>,
) {
  const db = getDb();
  await db.update(gatePasses).set(data).where(eq(gatePasses.id, id));
  return getGatePass(id);
}

// ---------------------------------------------------------------------------
// Scan records
// ---------------------------------------------------------------------------

export async function listScanRecords(filters: {
  warehouseId?: number;
  xrayFlag?: string;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (filters.warehouseId != null)
    conditions.push(eq(scanRecords.warehouseId, filters.warehouseId));
  if (filters.xrayFlag) conditions.push(eq(scanRecords.xrayFlag, filters.xrayFlag));
  return db
    .select()
    .from(scanRecords)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(scanRecords.id))
    .limit(filters.limit ?? 200);
}

export async function createScanRecord(data: InsertScanRecord) {
  const db = getDb();
  const [{ id }] = await db.insert(scanRecords).values(data).$returningId();
  return db.query.scanRecords.findFirst({ where: eq(scanRecords.id, id) });
}

export async function updateScanFlag(id: number, xrayFlag: string) {
  const db = getDb();
  await db.update(scanRecords).set({ xrayFlag }).where(eq(scanRecords.id, id));
  return db.query.scanRecords.findFirst({ where: eq(scanRecords.id, id) });
}

// ---------------------------------------------------------------------------
// Load plans
// ---------------------------------------------------------------------------

export async function listLoadPlans(filters: {
  warehouseId?: number;
  vehicleId?: number;
  status?: string;
}) {
  const db = getDb();
  const conditions = [];
  if (filters.warehouseId != null)
    conditions.push(eq(loadPlans.warehouseId, filters.warehouseId));
  if (filters.vehicleId != null)
    conditions.push(eq(loadPlans.vehicleId, filters.vehicleId));
  if (filters.status) conditions.push(eq(loadPlans.status, filters.status));
  const planList = await db
    .select()
    .from(loadPlans)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(loadPlans.id));
  if (planList.length === 0) return [];
  const vehicleList = await db.select().from(vehicles);
  const vehById = new Map(vehicleList.map((v) => [v.id, v]));
  return planList.map((p) => ({ ...p, vehicle: vehById.get(p.vehicleId) ?? null }));
}

export async function getLoadPlan(id: number) {
  return getDb().query.loadPlans.findFirst({ where: eq(loadPlans.id, id) });
}

export async function createLoadPlan(data: InsertLoadPlan) {
  const db = getDb();
  const [{ id }] = await db.insert(loadPlans).values(data).$returningId();
  return getLoadPlan(id);
}

export async function updateLoadPlan(id: number, data: Partial<InsertLoadPlan>) {
  const db = getDb();
  await db.update(loadPlans).set(data).where(eq(loadPlans.id, id));
  return getLoadPlan(id);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function listRoutes(filters: {
  direction?: string;
  status?: string;
  vehicleId?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (filters.direction) conditions.push(eq(routes.direction, filters.direction));
  if (filters.status) conditions.push(eq(routes.status, filters.status));
  if (filters.vehicleId != null)
    conditions.push(eq(routes.vehicleId, filters.vehicleId));
  const routeList = await db
    .select()
    .from(routes)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(routes.id));
  if (routeList.length === 0) return [];
  const vehicleList = await db.select().from(vehicles);
  const vehById = new Map(vehicleList.map((v) => [v.id, v]));
  return routeList.map((r) => ({ ...r, vehicle: vehById.get(r.vehicleId) ?? null }));
}

export async function getRoute(id: number) {
  return getDb().query.routes.findFirst({ where: eq(routes.id, id) });
}

export async function updateRoute(
  id: number,
  data: Partial<{
    optimizedStopsJson: string;
    totalKm: number;
    etaMinutes: number;
    status: string;
    direction: string;
  }>,
) {
  const db = getDb();
  await db.update(routes).set(data).where(eq(routes.id, id));
  return getRoute(id);
}
