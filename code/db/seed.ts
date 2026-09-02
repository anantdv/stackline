import { getDb } from "../api/queries/connection";
import {
  warehouses,
  racks,
  bins,
  items,
  placements,
  movements,
  erpnextConfigs,
  locations,
  customers,
  docks,
  vehicles,
  gatePasses,
  complianceDocs,
  invoices,
  scanRecords,
  loadPlans,
  routes,
} from "./schema";
import { generateBins } from "../api/queries/wms";
import { and, eq } from "drizzle-orm";
import {
  packLoad,
  volumetricWeightKg,
  ewayBillValidityHours,
  docStatusFromValidity,
} from "@contracts/logistics";
import {
  docNoFor,
  invoiceNoForMovement,
} from "../api/queries/compliance";

const RACK_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];

const DEMO_ITEMS = [
  { sku: "SKU-1001", name: "Wireless Mouse", cartonLengthM: 0.45, cartonWidthM: 0.3, cartonHeightM: 0.25, cartonWeightKg: 8 },
  { sku: "SKU-1002", name: "Mechanical Keyboard", cartonLengthM: 0.5, cartonWidthM: 0.35, cartonHeightM: 0.2, cartonWeightKg: 12 },
  { sku: "SKU-1003", name: "27in Monitor", cartonLengthM: 0.7, cartonWidthM: 0.5, cartonHeightM: 0.2, cartonWeightKg: 9 },
  { sku: "SKU-1004", name: "USB-C Hub", cartonLengthM: 0.35, cartonWidthM: 0.25, cartonHeightM: 0.2, cartonWeightKg: 6 },
  { sku: "SKU-1005", name: "Laptop Stand", cartonLengthM: 0.55, cartonWidthM: 0.3, cartonHeightM: 0.3, cartonWeightKg: 10 },
  { sku: "SKU-1006", name: "Webcam HD", cartonLengthM: 0.3, cartonWidthM: 0.2, cartonHeightM: 0.15, cartonWeightKg: 4 },
];

export async function seedDatabase() {
  const db = getDb();
  console.log("Seeding database...");

  // --- Warehouse (idempotent by code) -------------------------------------
  let warehouse = await db.query.warehouses.findFirst({
    where: eq(warehouses.code, "MAIN-DC"),
  });
  if (!warehouse) {
    const [{ id }] = await db
      .insert(warehouses)
      .values({
        name: "Main DC",
        code: "MAIN-DC",
        lengthM: 60,
        widthM: 40,
        heightM: 12,
        aisleWidthM: 3.5,
        erpnextWarehouse: "Main DC - Demo",
      })
      .$returningId();
    warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    });
    console.log("Created warehouse Main DC");
  } else {
    console.log("Warehouse Main DC already exists, skipping");
  }
  if (!warehouse) throw new Error("Failed to create warehouse");

  // --- Racks: 2 aisles of 4 (A–D left, E–H right), 6 bays x 4 levels -------
  const rackIds: number[] = [];
  for (let i = 0; i < RACK_NAMES.length; i++) {
    const name = RACK_NAMES[i];
    const aisle = Math.floor(i / 4); // 0 or 1
    const slot = i % 4;
    const positionX = 6 + slot * 12; // 12m pitch between racks
    const positionY = aisle === 0 ? 5 : 5 + 4 + 3.5; // rack depth + aisle
    const existing = await db.query.racks.findFirst({
      where: (r, { and: a, eq: e }) =>
        a(e(r.warehouseId, warehouse.id), e(r.name, name)),
    });
    if (existing) {
      rackIds.push(existing.id);
      continue;
    }
    const [{ id }] = await db
      .insert(racks)
      .values({
        warehouseId: warehouse.id,
        name,
        positionX,
        positionY,
        rotationDeg: 0,
        bays: 6,
        levels: 4,
        bayWidthM: 1.4,
        bayDepthM: 1.2,
        levelHeightM: 1.6,
      })
      .$returningId();
    rackIds.push(id);
  }
  for (const rackId of rackIds) {
    await generateBins(rackId); // idempotent: creates missing bins only
  }
  console.log(`Racks: ${rackIds.length}, bins generated`);

  // --- Items (idempotent by sku) -------------------------------------------
  const itemIds: number[] = [];
  for (const it of DEMO_ITEMS) {
    const existing = await db.query.items.findFirst({
      where: eq(items.sku, it.sku),
    });
    if (existing) {
      itemIds.push(existing.id);
      continue;
    }
    const [{ id }] = await db
      .insert(items)
      .values({ ...it, erpnextItemCode: it.sku })
      .$returningId();
    itemIds.push(id);
  }
  console.log(`Items: ${itemIds.length}`);

  // --- Placements: fill ~35% of bins (only if none exist yet) --------------
  const placementCount = await db
    .select({ id: placements.id })
    .from(placements)
    .limit(1);
  if (placementCount.length === 0) {
    const binRows = await db.query.bins.findMany();
    let rngState = 42;
    const rand = () => {
      rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
      return rngState / 0x7fffffff;
    };
    const toInsert: Array<typeof placements.$inferInsert> = [];
    for (const bin of binRows) {
      if (rand() < 0.35) {
        const itemId = itemIds[Math.floor(rand() * itemIds.length)];
        toInsert.push({
          binId: bin.id,
          itemId,
          qty: 1 + Math.floor(rand() * 20),
          batchNo: `B${2025}${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}`,
        });
      }
    }
    if (toInsert.length > 0) {
      // Batch insert in chunks of 100.
      for (let i = 0; i < toInsert.length; i += 100) {
        await db.insert(placements).values(toInsert.slice(i, i + 100));
      }
    }
    console.log(`Placements: ${toInsert.length}`);
  } else {
    console.log("Placements already exist, skipping");
  }

  // --- Movements (~15 mixed types/statuses) --------------------------------
  const movementCount = await db
    .select({ id: movements.id })
    .from(movements)
    .limit(1);
  if (movementCount.length === 0) {
    const binRows = await db.query.bins.findMany();
    const types = ["receipt", "putaway", "transfer", "pick", "dispatch"] as const;
    const statuses = ["pending", "in_progress", "completed", "cancelled"] as const;
    const toInsert: Array<typeof movements.$inferInsert> = [];
    for (let i = 0; i < 15; i++) {
      const type = types[i % types.length];
      const fromBin = binRows[(i * 7) % binRows.length];
      const toBin = binRows[(i * 13 + 5) % binRows.length];
      toInsert.push({
        type,
        itemId: itemIds[i % itemIds.length],
        qty: 2 + ((i * 3) % 15),
        fromBinId:
          type === "transfer" || type === "pick" || type === "dispatch"
            ? fromBin.id
            : null,
        toBinId:
          type === "receipt" || type === "putaway" || type === "transfer"
            ? toBin.id
            : null,
        status: statuses[i % statuses.length],
        reference: `PO-2025-${String(100 + i)}`,
      });
    }
    await db.insert(movements).values(toInsert);
    console.log(`Movements: ${toInsert.length}`);
  } else {
    console.log("Movements already exist, skipping");
  }

  // --- ERPNext config row (demo mode, enabled=0) ----------------------------
  const cfg = await db.select({ id: erpnextConfigs.id }).from(erpnextConfigs).limit(1);
  if (cfg.length === 0) {
    await db.insert(erpnextConfigs).values({
      baseUrl: "https://erp.example.com",
      apiKey: "",
      apiSecret: "",
      enabled: 0,
    });
    console.log("ERPNext config row created (demo mode)");
  } else {
    console.log("ERPNext config already exists, skipping");
  }

  // =========================================================================
  // v2 SEED — network, logistics, compliance, gate, scanning, transport, fleet
  // =========================================================================

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000);
  const daysAgo = (d: number) => hoursAgo(d * 24);

  // --- Locations (idempotent by code) --------------------------------------
  const LOCATION_SEEDS = [
    { code: "MUM", name: "Mumbai — Bhiwandi", city: "Mumbai", region: "West Zone", lat: 19.076, lng: 72.877 },
    { code: "DEL", name: "Delhi NCR", city: "New Delhi", region: "North Zone", lat: 28.613, lng: 77.209 },
    { code: "BLR", name: "Bengaluru East", city: "Bengaluru", region: "South Zone", lat: 12.971, lng: 77.594 },
  ];
  const locationByCode = new Map<string, number>();
  for (const loc of LOCATION_SEEDS) {
    const existing = await db.query.locations.findFirst({
      where: eq(locations.code, loc.code),
    });
    if (existing) {
      locationByCode.set(loc.code, existing.id);
      continue;
    }
    const [{ id }] = await db.insert(locations).values(loc).$returningId();
    locationByCode.set(loc.code, id);
  }
  console.log(`Locations: ${locationByCode.size}`);

  // --- Assign Main DC to Mumbai + category mode -----------------------------
  await db
    .update(warehouses)
    .set({
      locationId: locationByCode.get("MUM") ?? null,
      categoryMode: "multi-category",
    })
    .where(eq(warehouses.id, warehouse.id));

  // --- v2 warehouses (idempotent by code) + small rack layouts --------------
  const V2_WAREHOUSES = [
    {
      code: "DEL-01",
      name: "Delhi NCR FMCG DC",
      locationCode: "DEL",
      categoryMode: "single-category",
      lengthM: 40, widthM: 28, heightM: 9,
      erpnextWarehouse: "Stores - Demo",
      rackNames: ["F1", "F2"],
    },
    {
      code: "DEL-02",
      name: "Delhi NCR Multi DC",
      locationCode: "DEL",
      categoryMode: "multi-category",
      lengthM: 45, widthM: 30, heightM: 10,
      erpnextWarehouse: null,
      rackNames: ["M1", "M2"],
    },
    {
      code: "BLR-01",
      name: "Bengaluru Electronics Hub",
      locationCode: "BLR",
      categoryMode: "multi-category",
      lengthM: 50, widthM: 32, heightM: 11,
      erpnextWarehouse: "Finished Goods - Demo",
      rackNames: ["E1", "E2", "E3"],
    },
  ] as const;

  const v2WarehouseIds: number[] = [];
  for (const wh of V2_WAREHOUSES) {
    let row = await db.query.warehouses.findFirst({
      where: eq(warehouses.code, wh.code),
    });
    if (!row) {
      const [{ id }] = await db
        .insert(warehouses)
        .values({
          name: wh.name,
          code: wh.code,
          lengthM: wh.lengthM,
          widthM: wh.widthM,
          heightM: wh.heightM,
          aisleWidthM: 3.5,
          erpnextWarehouse: wh.erpnextWarehouse,
          locationId: locationByCode.get(wh.locationCode) ?? null,
          categoryMode: wh.categoryMode,
        })
        .$returningId();
      row = await db.query.warehouses.findFirst({ where: eq(warehouses.id, id) });
      console.log(`Created warehouse ${wh.code}`);
    }
    if (!row) throw new Error(`Failed to create warehouse ${wh.code}`);
    v2WarehouseIds.push(row.id);

    // Racks: 3-4 bays × 3 levels each, idempotent by (warehouseId, name).
    for (let i = 0; i < wh.rackNames.length; i++) {
      const name = wh.rackNames[i];
      const existing = await db.query.racks.findFirst({
        where: and(eq(racks.warehouseId, row.id), eq(racks.name, name)),
      });
      let rackId = existing?.id;
      if (!rackId) {
        const [{ id }] = await db
          .insert(racks)
          .values({
            warehouseId: row.id,
            name,
            positionX: 6 + i * 12,
            positionY: 5,
            rotationDeg: 0,
            bays: 4,
            levels: 3,
            bayWidthM: 1.4,
            bayDepthM: 1.2,
            levelHeightM: 1.6,
          })
          .$returningId();
        rackId = id;
      }
      await generateBins(rackId);
    }
  }

  // --- Item groups / variants / standard rates ------------------------------
  const ITEM_ENRICHMENTS: Record<
    string,
    { groupCode: string; variant: string; standardRate: number }
  > = {
    "SKU-1001": { groupCode: "ELEC", variant: "BLACK", standardRate: 1450 },
    "SKU-1002": { groupCode: "ELEC", variant: "RGB", standardRate: 4899 },
    "SKU-1003": { groupCode: "ELEC", variant: "27IN", standardRate: 13499 },
    "SKU-1004": { groupCode: "ELEC", variant: "7-IN-1", standardRate: 2299 },
    "SKU-1005": { groupCode: "ELEC", variant: "ALUMINIUM", standardRate: 1899 },
    "SKU-1006": { groupCode: "ELEC", variant: "1080P", standardRate: 2799 },
  };
  for (const [sku, patch] of Object.entries(ITEM_ENRICHMENTS)) {
    await db.update(items).set(patch).where(eq(items.sku, sku));
  }

  const V2_ITEMS = [
    { sku: "SKU-2001", name: "Whole Wheat Atta", variant: "10KG", groupCode: "FMCG", cartonLengthM: 0.4, cartonWidthM: 0.3, cartonHeightM: 0.15, cartonWeightKg: 10.2, standardRate: 349 },
    { sku: "SKU-2002", name: "Basmati Rice", variant: "5KG", groupCode: "FMCG", cartonLengthM: 0.45, cartonWidthM: 0.3, cartonHeightM: 0.2, cartonWeightKg: 5.2, standardRate: 499 },
    { sku: "SKU-2003", name: "Cold-Pressed Oil", variant: "1L", groupCode: "FMCG", cartonLengthM: 0.35, cartonWidthM: 0.25, cartonHeightM: 0.3, cartonWeightKg: 9, standardRate: 899 },
    { sku: "SKU-3001", name: "Paracetamol 500mg", variant: "STRIP-10", groupCode: "PHARMA", cartonLengthM: 0.3, cartonWidthM: 0.2, cartonHeightM: 0.2, cartonWeightKg: 4, standardRate: 1299 },
    { sku: "SKU-3002", name: "Vitamin D3", variant: "BOTTLE-60", groupCode: "PHARMA", cartonLengthM: 0.25, cartonWidthM: 0.2, cartonHeightM: 0.15, cartonWeightKg: 3, standardRate: 649 },
    { sku: "SKU-3003", name: "Insulin Pen", variant: "5X3ML", groupCode: "PHARMA", cartonLengthM: 0.2, cartonWidthM: 0.15, cartonHeightM: 0.1, cartonWeightKg: 2, standardRate: 2149 },
  ];
  const v2ItemIds: number[] = [];
  for (const it of V2_ITEMS) {
    const existing = await db.query.items.findFirst({
      where: eq(items.sku, it.sku),
    });
    if (existing) {
      v2ItemIds.push(existing.id);
      continue;
    }
    const [{ id }] = await db
      .insert(items)
      .values({ ...it, erpnextItemCode: it.sku })
      .$returningId();
    v2ItemIds.push(id);
  }
  console.log(`v2 items: ${v2ItemIds.length}`);

  // --- Placements in the new warehouses (with aged stock for aging buckets) --
  let rngState2 = 7;
  const rand2 = () => {
    rngState2 = (rngState2 * 1103515245 + 12345) & 0x7fffffff;
    return rngState2 / 0x7fffffff;
  };
  const allItemIds = [...itemIds, ...v2ItemIds];
  for (const whId of v2WarehouseIds) {
    const whRacks = await db.select().from(racks).where(eq(racks.warehouseId, whId));
    if (whRacks.length === 0) continue;
    const binRows = (
      await Promise.all(
        whRacks.map((r) => db.select().from(bins).where(eq(bins.rackId, r.id))),
      )
    ).flat();
    if (binRows.length === 0) continue;
    let hasPlacements = false;
    for (const b of binRows) {
      const p = await db
        .select({ id: placements.id })
        .from(placements)
        .where(eq(placements.binId, b.id))
        .limit(1);
      if (p.length > 0) {
        hasPlacements = true;
        break;
      }
    }
    if (hasPlacements) continue;
    const toInsert: Array<typeof placements.$inferInsert> = [];
    let idx = 0;
    for (const bin of binRows) {
      if (rand2() < 0.4) {
        const itemId = allItemIds[Math.floor(rand2() * allItemIds.length)];
        const createdAt =
          idx % 5 === 4 ? daysAgo(100) : idx % 3 === 2 ? daysAgo(45) : daysAgo(5);
        toInsert.push({
          binId: bin.id,
          itemId,
          qty: 2 + Math.floor(rand2() * 18),
          batchNo: `B2025${String(1 + Math.floor(rand2() * 12)).padStart(2, "0")}`,
          createdAt,
        });
        idx++;
      }
    }
    if (toInsert.length > 0) {
      for (let i = 0; i < toInsert.length; i += 100) {
        await db.insert(placements).values(toInsert.slice(i, i + 100));
      }
    }
    console.log(`Warehouse ${whId}: ${toInsert.length} placements`);
  }

  // --- Customers (3PL) -------------------------------------------------------
  const CUSTOMER_SEEDS = [
    { code: "ACME", name: "Acme Consumer Goods", brandColor: "#f97316", contactEmail: "ops@acme.example" },
    { code: "NOVA", name: "Nova Pharma Distributors", brandColor: "#14b8a6", contactEmail: "logistics@nova.example" },
  ];
  const customerByCode = new Map<string, number>();
  for (const c of CUSTOMER_SEEDS) {
    const existing = await db.query.customers.findFirst({
      where: eq(customers.code, c.code),
    });
    if (existing) {
      customerByCode.set(c.code, existing.id);
      continue;
    }
    const [{ id }] = await db.insert(customers).values(c).$returningId();
    customerByCode.set(c.code, id);
  }
  console.log(`Customers: ${customerByCode.size}`);

  // --- Docks (6) --------------------------------------------------------------
  const DOCK_SEEDS = [
    { warehouseCode: "MAIN-DC", code: "D-01", type: "inbound" },
    { warehouseCode: "MAIN-DC", code: "D-02", type: "outbound" },
    { warehouseCode: "MAIN-DC", code: "D-03", type: "both" },
    { warehouseCode: "DEL-01", code: "D-01", type: "inbound" },
    { warehouseCode: "DEL-01", code: "D-02", type: "outbound" },
    { warehouseCode: "BLR-01", code: "D-01", type: "both" },
  ] as const;
  const warehouseByCode = new Map<string, number>();
  for (const code of ["MAIN-DC", "DEL-01", "DEL-02", "BLR-01"]) {
    const wh = await db.query.warehouses.findFirst({
      where: eq(warehouses.code, code),
    });
    if (wh) warehouseByCode.set(code, wh.id);
  }
  const dockIds: number[] = [];
  for (const d of DOCK_SEEDS) {
    const whId = warehouseByCode.get(d.warehouseCode);
    if (!whId) continue;
    const existing = await db.query.docks.findFirst({
      where: and(eq(docks.warehouseId, whId), eq(docks.code, d.code)),
    });
    if (existing) {
      dockIds.push(existing.id);
      continue;
    }
    const [{ id }] = await db
      .insert(docks)
      .values({ warehouseId: whId, code: d.code, type: d.type })
      .$returningId();
    dockIds.push(id);
  }
  console.log(`Docks: ${dockIds.length}`);

  // --- Vehicles (8, mixed types) ----------------------------------------------
  const VEHICLE_SEEDS = [
    { regNo: "MH-04-CD-8812", type: "truck-32ft", lengthM: 9.8, widthM: 2.4, heightM: 2.6, maxWeightKg: 16000, gpsLat: 19.12, gpsLng: 72.91, status: "enroute", driverName: "R. Patil" },
    { regNo: "MH-12-EF-2233", type: "truck-20ft", lengthM: 6.1, widthM: 2.4, heightM: 2.4, maxWeightKg: 8000, gpsLat: 18.52, gpsLng: 73.86, status: "idle", driverName: "A. Shinde" },
    { regNo: "GJ-01-AB-4421", type: "container-40", lengthM: 12.03, widthM: 2.35, heightM: 2.39, maxWeightKg: 26500, gpsLat: 19.07, gpsLng: 72.88, status: "loading", driverName: "S. Yadav" },
    { regNo: "DL-01-GH-7788", type: "truck-32ft", lengthM: 9.8, widthM: 2.4, heightM: 2.6, maxWeightKg: 16000, gpsLat: 28.62, gpsLng: 77.22, status: "enroute", driverName: "M. Singh" },
    { regNo: "DL-08-JK-5544", type: "container-20", lengthM: 5.9, widthM: 2.35, heightM: 2.39, maxWeightKg: 21700, gpsLat: 28.61, gpsLng: 77.2, status: "idle", driverName: null },
    { regNo: "KA-05-MN-9900", type: "truck-20ft", lengthM: 6.1, widthM: 2.4, heightM: 2.4, maxWeightKg: 8000, gpsLat: 12.97, gpsLng: 77.6, status: "enroute", driverName: "K. Rao" },
    { regNo: "KA-01-PQ-3311", type: "van", lengthM: 3.0, widthM: 1.7, heightM: 1.7, maxWeightKg: 1200, gpsLat: 12.98, gpsLng: 77.59, status: "idle", driverName: null },
    { regNo: "MH-14-RS-6677", type: "truck-32ft", lengthM: 9.8, widthM: 2.4, heightM: 2.6, maxWeightKg: 16000, gpsLat: 19.2, gpsLng: 72.97, status: "maintenance", driverName: null },
  ] as const;
  const vehicleIds: number[] = [];
  for (const v of VEHICLE_SEEDS) {
    const existing = await db.query.vehicles.findFirst({
      where: eq(vehicles.regNo, v.regNo),
    });
    if (existing) {
      vehicleIds.push(existing.id);
      continue;
    }
    const [{ id }] = await db.insert(vehicles).values(v).$returningId();
    vehicleIds.push(id);
  }
  console.log(`Vehicles: ${vehicleIds.length}`);

  // --- Ensure >=5 dispatch movements for invoicing ---------------------------
  const mainDcBins = await db
    .select()
    .from(bins)
    .where(
      and(
        eq(bins.rackId, (
          await db.query.racks.findFirst({
            where: and(eq(racks.warehouseId, warehouse.id), eq(racks.name, "A")),
          })
        )?.id ?? 0),
      ),
    );
  let dispatchMovements = await db
    .select()
    .from(movements)
    .where(eq(movements.type, "dispatch"));
  let extraIdx = 0;
  while (dispatchMovements.length < 5 && mainDcBins.length > 0) {
    const [{ id }] = await db
      .insert(movements)
      .values({
        type: "dispatch",
        itemId: allItemIds[extraIdx % allItemIds.length],
        qty: 4 + extraIdx * 3,
        fromBinId: mainDcBins[extraIdx % mainDcBins.length].id,
        status: "completed",
        reference: `SO-2025-${2800 + extraIdx}`,
        createdAt: hoursAgo(30 - extraIdx * 4),
      })
      .$returningId();
    void id;
    dispatchMovements = await db
      .select()
      .from(movements)
      .where(eq(movements.type, "dispatch"));
    extraIdx++;
  }
  dispatchMovements = dispatchMovements.slice(0, 5);

  // --- Invoices + compliance docs for 5 recent dispatches --------------------
  const acmeId = customerByCode.get("ACME") ?? null;
  const novaId = customerByCode.get("NOVA") ?? null;
  const DISPATCH_DOC_PLAN: Array<{
    method: "road" | "sea" | "air" | "rail";
    customerId: number | null;
    docTypes: Array<"EWB" | "IRN" | "BOL" | "AWB" | "LR" | "RR">;
    ewbHoursLeft: number | null; // null = no EWB
  }> = [
    { method: "road", customerId: acmeId, docTypes: ["IRN", "EWB", "LR"], ewbHoursLeft: 22 },
    { method: "road", customerId: acmeId, docTypes: ["IRN", "EWB", "LR"], ewbHoursLeft: 2 },
    { method: "sea", customerId: novaId, docTypes: ["BOL"], ewbHoursLeft: null },
    { method: "air", customerId: novaId, docTypes: ["AWB"], ewbHoursLeft: null },
    { method: "road", customerId: acmeId, docTypes: ["IRN", "EWB", "LR"], ewbHoursLeft: 46 },
  ];

  const ewbDocNos: string[] = [];
  const allItemsNow = await db.select().from(items);
  const itemById = new Map(allItemsNow.map((i) => [i.id, i]));
  for (let i = 0; i < dispatchMovements.length && i < DISPATCH_DOC_PLAN.length; i++) {
    const mv = dispatchMovements[i];
    const plan = DISPATCH_DOC_PLAN[i];
    const invoiceNo = invoiceNoForMovement(mv.id);
    const item = itemById.get(mv.itemId);
    const rate = item?.standardRate ?? 1000;
    const amountPaise = Math.round(mv.qty * rate * 100);
    const taxPaise = Math.round(amountPaise * 0.18);

    let invoice = await db.query.invoices.findFirst({
      where: eq(invoices.invoiceNo, invoiceNo),
    });
    if (!invoice) {
      const [{ id }] = await db
        .insert(invoices)
        .values({
          invoiceNo,
          customerId: plan.customerId,
          warehouseId: warehouse.id,
          movementId: mv.id,
          amountPaise,
          taxPaise,
          currency: "INR",
          shippingMethod: plan.method,
          status: "issued",
        })
        .$returningId();
      invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, id),
      });
    }
    if (!invoice) continue;

    for (let d = 0; d < plan.docTypes.length; d++) {
      const type = plan.docTypes[d];
      const docNo = docNoFor(type, invoice.id, d + 1);
      const existing = await db.query.complianceDocs.findFirst({
        where: eq(complianceDocs.docNo, docNo),
      });
      if (existing) {
        if (type === "EWB") ewbDocNos.push(existing.docNo);
        continue;
      }
      const isEwb = type === "EWB" && plan.ewbHoursLeft != null;
      const validFrom = isEwb ? hoursAgo(24) : null;
      const validUntil = isEwb ? hoursFromNow(plan.ewbHoursLeft!) : null;
      const status = isEwb
        ? docStatusFromValidity(validUntil, now)
        : "valid";
      const payload = {
        form:
          type === "EWB"
            ? "EWB Part A/B"
            : type === "IRN"
              ? "e-Invoice (GST)"
              : type === "BOL"
                ? "Bill of Lading"
                : type === "AWB"
                  ? "Air Waybill"
                  : type === "RR"
                    ? "Railway Receipt"
                    : "Lorry Receipt",
        invoiceNo,
        consignmentValueInr: amountPaise / 100,
        goods: `${mv.qty} × ${item?.name ?? "goods"} (${item?.sku ?? "?"})`,
        distanceKm: isEwb
          ? Math.max(1, (Math.ceil((plan.ewbHoursLeft ?? 24) / 24) - 1) * 100 + 50)
          : undefined,
        validityRule: isEwb
          ? `${ewayBillValidityHours(120)}h for 120 km (100km/day + 1)`
          : undefined,
        fromWarehouse: warehouse.code,
      };
      await db.insert(complianceDocs).values({
        docType: type,
        docNo,
        movementId: mv.id,
        invoiceId: invoice.id,
        payloadJson: JSON.stringify(payload),
        validFrom,
        validUntil,
        status,
      });
      if (type === "EWB") ewbDocNos.push(docNo);
    }
  }
  console.log(`Invoices/docs seeded for ${dispatchMovements.length} dispatches`);

  // --- Gate passes (10, mixed statuses) ---------------------------------------
  const GATE_PASS_STATUSES = [
    "scheduled", "at-gate", "in-yard", "completed", "cancelled",
    "scheduled", "at-gate", "in-yard", "completed", "at-gate",
  ] as const;
  const whCycle = ["MAIN-DC", "DEL-01", "BLR-01", "MAIN-DC", "DEL-01"];
  for (let i = 0; i < 10; i++) {
    const passNo = `GP-${2841 + i}`;
    const existing = await db.query.gatePasses.findFirst({
      where: eq(gatePasses.passNo, passNo),
    });
    if (existing) continue;
    const direction = i % 2 === 0 ? "in" : "out";
    const status = GATE_PASS_STATUSES[i];
    const vehicleId = vehicleIds[i % vehicleIds.length];
    const vehicle = VEHICLE_SEEDS[i % VEHICLE_SEEDS.length];
    await db.insert(gatePasses).values({
      passNo,
      warehouseId: warehouseByCode.get(whCycle[i % whCycle.length]) ?? warehouse.id,
      vehicleId,
      direction,
      driverName: vehicle.driverName ?? `Driver ${i + 1}`,
      purpose:
        direction === "in"
          ? `ASN-${1100 + i} inbound receiving`
          : `SO-2025-${2800 + i} dispatch`,
      status,
      docRef:
        direction === "out" && (status === "in-yard" || status === "completed")
          ? (ewbDocNos[i % Math.max(1, ewbDocNos.length)] ?? null)
          : null,
      scheduledAt: hoursAgo(2 - i),
      inAt:
        status === "at-gate" || status === "in-yard" || status === "completed"
          ? hoursAgo(1)
          : null,
      outAt: status === "completed" && direction === "out" ? now : null,
    });
  }
  console.log("Gate passes: 10");

  // --- Scan records (12) -------------------------------------------------------
  const scanCount = await db
    .select({ id: scanRecords.id })
    .from(scanRecords)
    .limit(1);
  if (scanCount.length === 0) {
    const SCAN_FLAGS = [
      "clear", "clear", "clear", "review", "clear", "clear",
      "clear", "review", "clear", "clear", "blocked", "clear",
    ] as const;
    const CONTENTS = [
      "Boxed electronics", "FMCG cartons", "Pharma strips", "Apparel",
      "Cables & adapters", "Mixed liquids (review)", "Documents",
      " boxed pharma (review)", "Rice bags", "Oil cartons",
      "Unidentified dense items", "Peripherals",
    ];
    const whIds = [warehouse.id, ...v2WarehouseIds];
    const toInsert: Array<typeof scanRecords.$inferInsert> = [];
    for (let i = 0; i < 12; i++) {
      const l = 0.3 + (i % 5) * 0.1;
      const w = 0.2 + (i % 4) * 0.08;
      const h = 0.15 + (i % 3) * 0.1;
      const vol = volumetricWeightKg(l, w, h);
      toInsert.push({
        parcelId: `PCL-${7700 + i}`,
        warehouseId: whIds[i % whIds.length],
        dockId: dockIds[i % dockIds.length] ?? null,
        lengthM: Math.round(l * 100) / 100,
        widthM: Math.round(w * 100) / 100,
        heightM: Math.round(h * 100) / 100,
        actualWeightKg: Math.round((4 + i * 0.9) * 10) / 10,
        volumetricWeightKg: Math.round(vol * 100) / 100,
        xrayFlag: SCAN_FLAGS[i],
        contentsGuess: CONTENTS[i].trim(),
        createdAt: hoursAgo(12 - i),
      });
    }
    await db.insert(scanRecords).values(toInsert);
    console.log("Scan records: 12");
  } else {
    console.log("Scan records already exist, skipping");
  }

  // --- Load plans (3; LP-0417 locked at ~91% util) ------------------------------
  const LOAD_PLAN_SEEDS: Array<{
    planNo: string;
    vehicleIdx: number;
    warehouseCode: string;
    status: "draft" | "optimized" | "locked";
    items: Array<{ id: string; l: number; w: number; h: number; weightKg: number; qty: number }>;
  }> = [
    {
      planNo: "LP-0417",
      vehicleIdx: 0, // 32ft truck
      warehouseCode: "MAIN-DC",
      status: "locked",
      items: [{ id: "CTN-44", l: 0.44, w: 0.4, h: 0.4, weightKg: 8, qty: 792 }],
    },
    {
      planNo: "LP-0418",
      vehicleIdx: 2, // 40ft container
      warehouseCode: "MAIN-DC",
      status: "optimized",
      items: [
        { id: "CTN-604038", l: 0.6, w: 0.4, h: 0.38, weightKg: 12.4, qty: 380 },
        { id: "CTN-504040", l: 0.5, w: 0.4, h: 0.4, weightKg: 9.5, qty: 250 },
        { id: "CTN-352530", l: 0.35, w: 0.25, h: 0.3, weightKg: 6, qty: 180 },
      ],
    },
    {
      planNo: "LP-0419",
      vehicleIdx: 1, // 20ft truck
      warehouseCode: "DEL-01",
      status: "draft",
      items: [
        { id: "SKU-2001", l: 0.4, w: 0.3, h: 0.15, weightKg: 10.2, qty: 60 },
        { id: "SKU-2002", l: 0.45, w: 0.3, h: 0.2, weightKg: 5.2, qty: 40 },
      ],
    },
  ];
  for (const lp of LOAD_PLAN_SEEDS) {
    const existing = await db.query.loadPlans.findFirst({
      where: eq(loadPlans.planNo, lp.planNo),
    });
    if (existing) continue;
    const vehicleRow = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleIds[lp.vehicleIdx]),
    });
    if (!vehicleRow) continue;
    const result = packLoad(vehicleRow, lp.items);
    await db.insert(loadPlans).values({
      planNo: lp.planNo,
      vehicleId: vehicleRow.id,
      warehouseId: warehouseByCode.get(lp.warehouseCode) ?? warehouse.id,
      status: lp.status,
      utilizationPct: Math.round(result.utilizationPct * 10) / 10,
      totalWeightKg: result.totalWeightKg,
      sequenceJson: JSON.stringify({
        placed: result.placed,
        unplaced: result.unplaced,
        utilizationPct: result.utilizationPct,
        weightUtilizationPct: result.weightUtilizationPct,
      }),
    });
  }
  console.log("Load plans: 3");

  // --- Routes (4, incl. a backhaul) ----------------------------------------------
  const ROUTE_SEEDS: Array<{
    routeNo: string;
    vehicleIdx: number;
    direction: "outward" | "inward" | "backhaul";
    status: "planned" | "active" | "completed";
    depot: { lat: number; lng: number; label: string };
    stops: Array<{ id: string; lat: number; lng: number; label: string }>;
  }> = [
    {
      routeNo: "TRIP-0417", vehicleIdx: 0, direction: "outward", status: "active",
      depot: { lat: 19.076, lng: 72.877, label: "MUM-BHIWANDI" },
      stops: [
        { id: "S1", lat: 19.21, lng: 72.97, label: "Thane" },
        { id: "S2", lat: 19.03, lng: 73.02, label: "Navi Mumbai" },
        { id: "S3", lat: 19.99, lng: 73.79, label: "Nashik" },
        { id: "S4", lat: 18.94, lng: 72.83, label: "Fort" },
        { id: "S5", lat: 19.29, lng: 72.86, label: "Vasai" },
        { id: "S6", lat: 19.17, lng: 72.95, label: "Kalyan" },
      ],
    },
    {
      routeNo: "TRIP-0418", vehicleIdx: 5, direction: "inward", status: "active",
      depot: { lat: 12.971, lng: 77.594, label: "BLR-EAST" },
      stops: [
        { id: "P1", lat: 13.03, lng: 77.6, label: "Whitefield supplier" },
        { id: "P2", lat: 12.92, lng: 77.62, label: "Electronic City supplier" },
        { id: "P3", lat: 12.99, lng: 77.55, label: "Peenya supplier" },
      ],
    },
    {
      routeNo: "TRIP-0419", vehicleIdx: 3, direction: "outward", status: "planned",
      depot: { lat: 28.613, lng: 77.209, label: "DEL-NCR" },
      stops: [
        { id: "D1", lat: 28.47, lng: 77.03, label: "Gurugram" },
        { id: "D2", lat: 28.68, lng: 77.45, label: "Noida" },
        { id: "D3", lat: 28.99, lng: 77.7, label: "Meerut" },
        { id: "D4", lat: 28.41, lng: 77.31, label: "Faridabad" },
      ],
    },
    {
      routeNo: "TRIP-0420", vehicleIdx: 1, direction: "backhaul", status: "planned",
      depot: { lat: 19.076, lng: 72.877, label: "MUM-BHIWANDI" },
      stops: [
        { id: "B1", lat: 18.52, lng: 73.86, label: "Pune pickup" },
        { id: "B2", lat: 19.85, lng: 75.23, label: "Aurangabad pickup" },
      ],
    },
  ];
  for (const r of ROUTE_SEEDS) {
    const existing = await db.query.routes.findFirst({
      where: eq(routes.routeNo, r.routeNo),
    });
    if (existing) continue;
    // Round-trip distance in listed (naive) order.
    let totalKm = 0;
    let cursor = r.depot;
    for (const s of r.stops) {
      const dLat = ((s.lat - cursor.lat) * Math.PI) / 180;
      const dLng = ((s.lng - cursor.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((cursor.lat * Math.PI) / 180) *
          Math.cos((s.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      totalKm += 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
      cursor = s;
    }
    const backLat = ((r.depot.lat - cursor.lat) * Math.PI) / 180;
    const backLng = ((r.depot.lng - cursor.lng) * Math.PI) / 180;
    const ab =
      Math.sin(backLat / 2) ** 2 +
      Math.cos((cursor.lat * Math.PI) / 180) *
        Math.cos((r.depot.lat * Math.PI) / 180) *
        Math.sin(backLng / 2) ** 2;
    totalKm += 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(ab)));
    totalKm = Math.round(totalKm * 10) / 10;
    await db.insert(routes).values({
      routeNo: r.routeNo,
      vehicleId: vehicleIds[r.vehicleIdx],
      direction: r.direction,
      status: r.status,
      optimizedStopsJson: JSON.stringify({ depot: r.depot, stops: r.stops }),
      totalKm,
      etaMinutes: Math.round((totalKm / 38) * 60),
    });
  }
  console.log("Routes: 4");

  console.log("Done.");
}

/** Seed only when the warehouses table is empty — safe to call on every boot. */
export async function seedIfEmpty() {
  const db = getDb();
  const existing = await db.query.warehouses.findFirst();
  if (existing) return false;
  await seedDatabase();
  return true;
}
// NOTE: pure module — the CLI entry lives in db/seed-cli.ts so that bundling
// this file into the server never triggers a run.
