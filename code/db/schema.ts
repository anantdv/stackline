import {
  mysqlTable,
  serial,
  varchar,
  double,
  int,
  bigint,
  timestamp,
  text,
  uniqueIndex,
  index,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ---------------------------------------------------------------------------
// Warehouse Management System (WMS) tables
// ---------------------------------------------------------------------------

// v2: geographic locations (one location hosts many warehouses).
export const locations = mysqlTable("locations", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(), // 'MUM' | 'DEL' | 'BLR'
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }).notNull(), // e.g. 'West Zone'
  lat: double("lat").notNull(),
  lng: double("lng").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

export const warehouses = mysqlTable("warehouses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  lengthM: double("lengthM").notNull(),
  widthM: double("widthM").notNull(),
  heightM: double("heightM").notNull(),
  aisleWidthM: double("aisleWidthM").notNull().default(3),
  erpnextWarehouse: varchar("erpnextWarehouse", { length: 255 }),
  // v2 additions
  locationId: bigint("locationId", { mode: "number", unsigned: true }).references(
    () => locations.id,
  ),
  categoryMode: varchar("categoryMode", { length: 32 })
    .notNull()
    .default("multi-category"), // 'single-category' | 'multi-category'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
});

export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = typeof warehouses.$inferInsert;

export const racks = mysqlTable(
  "racks",
  {
    id: serial("id").primaryKey(),
    warehouseId: bigint("warehouseId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    positionX: double("positionX").notNull().default(0),
    positionY: double("positionY").notNull().default(0),
    rotationDeg: int("rotationDeg").notNull().default(0),
    bays: int("bays").notNull(),
    levels: int("levels").notNull(),
    bayWidthM: double("bayWidthM").notNull(),
    bayDepthM: double("bayDepthM").notNull(),
    levelHeightM: double("levelHeightM").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("racks_warehouse_idx").on(table.warehouseId),
    uniqueIndex("racks_warehouse_name_unique").on(table.warehouseId, table.name),
  ],
);

export type Rack = typeof racks.$inferSelect;
export type InsertRack = typeof racks.$inferInsert;

export const bins = mysqlTable(
  "bins",
  {
    id: serial("id").primaryKey(),
    rackId: bigint("rackId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => racks.id, { onDelete: "cascade" }),
    bay: int("bay").notNull(),
    level: int("level").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    widthM: double("widthM").notNull(),
    depthM: double("depthM").notNull(),
    heightM: double("heightM").notNull(),
    maxWeightKg: double("maxWeightKg").notNull().default(0), // 0 = unlimited
    status: varchar("status", { length: 16 }).notNull().default("active"), // 'active' | 'blocked'
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("bins_rack_idx").on(table.rackId),
    uniqueIndex("bins_rack_code_unique").on(table.rackId, table.code),
  ],
);

export type Bin = typeof bins.$inferSelect;
export type InsertBin = typeof bins.$inferInsert;

export const items = mysqlTable("items", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  cartonLengthM: double("cartonLengthM").notNull(),
  cartonWidthM: double("cartonWidthM").notNull(),
  cartonHeightM: double("cartonHeightM").notNull(),
  cartonWeightKg: double("cartonWeightKg").notNull(),
  erpnextItemCode: varchar("erpnextItemCode", { length: 255 }),
  // v2 additions
  groupCode: varchar("groupCode", { length: 64 }).notNull().default("GEN"), // 'ELEC' | 'FMCG' | 'PHARMA' | ...
  variant: varchar("variant", { length: 64 }), // e.g. '500ML' | 'RED'
  standardRate: double("standardRate"), // last cached ERPNext price (INR)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

export const placements = mysqlTable(
  "placements",
  {
    id: serial("id").primaryKey(),
    binId: bigint("binId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => bins.id, { onDelete: "cascade" }),
    itemId: bigint("itemId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => items.id),
    qty: int("qty").notNull(),
    batchNo: varchar("batchNo", { length: 128 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
  },
  (table) => [
    index("placements_bin_idx").on(table.binId),
    index("placements_item_idx").on(table.itemId),
    uniqueIndex("placements_bin_item_batch_unique").on(
      table.binId,
      table.itemId,
      table.batchNo,
    ),
  ],
);

export type Placement = typeof placements.$inferSelect;
export type InsertPlacement = typeof placements.$inferInsert;

export const movements = mysqlTable(
  "movements",
  {
    id: serial("id").primaryKey(),
    type: varchar("type", { length: 16 }).notNull(), // 'receipt'|'putaway'|'transfer'|'pick'|'dispatch'
    itemId: bigint("itemId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => items.id),
    qty: int("qty").notNull(),
    fromBinId: bigint("fromBinId", { mode: "number", unsigned: true }).references(
      () => bins.id,
    ),
    toBinId: bigint("toBinId", { mode: "number", unsigned: true }).references(
      () => bins.id,
    ),
    status: varchar("status", { length: 16 }).notNull().default("pending"), // 'pending'|'in_progress'|'completed'|'cancelled'
    reference: varchar("reference", { length: 255 }),
    erpnextStockEntry: varchar("erpnextStockEntry", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
  },
  (table) => [
    index("movements_item_idx").on(table.itemId),
    index("movements_from_bin_idx").on(table.fromBinId),
    index("movements_to_bin_idx").on(table.toBinId),
    index("movements_status_idx").on(table.status),
  ],
);

export type Movement = typeof movements.$inferSelect;
export type InsertMovement = typeof movements.$inferInsert;

export const erpnextConfigs = mysqlTable("erpnext_configs", {
  id: serial("id").primaryKey(),
  baseUrl: varchar("baseUrl", { length: 512 }).notNull().default(""),
  apiKey: varchar("apiKey", { length: 255 }).notNull().default(""),
  apiSecret: varchar("apiSecret", { length: 255 }).notNull().default(""),
  enabled: int("enabled").notNull().default(0), // boolean-ish: 0 = demo mode
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
});

export type ErpnextConfig = typeof erpnextConfigs.$inferSelect;
export type InsertErpnextConfig = typeof erpnextConfigs.$inferInsert;

// ---------------------------------------------------------------------------
// v2 — Network / 3PL / Logistics tables
// ---------------------------------------------------------------------------

// 3PL customers (portal tenants).
export const customers = mysqlTable("customers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brandColor: varchar("brandColor", { length: 32 }).notNull().default("#f97316"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export const docks = mysqlTable(
  "docks",
  {
    id: serial("id").primaryKey(),
    warehouseId: bigint("warehouseId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 32 }).notNull(), // 'D-01'
    type: varchar("type", { length: 16 }).notNull().default("both"), // 'inbound'|'outbound'|'both'
  },
  (table) => [
    index("docks_warehouse_idx").on(table.warehouseId),
    uniqueIndex("docks_warehouse_code_unique").on(table.warehouseId, table.code),
  ],
);

export type Dock = typeof docks.$inferSelect;
export type InsertDock = typeof docks.$inferInsert;

export const vehicles = mysqlTable("vehicles", {
  id: serial("id").primaryKey(),
  regNo: varchar("regNo", { length: 32 }).notNull().unique(), // 'MH-04-CD-8812'
  type: varchar("type", { length: 32 }).notNull(), // 'truck-32ft'|'truck-20ft'|'container-40'|'container-20'|'van'
  // Cargo inner dimensions.
  lengthM: double("lengthM").notNull(),
  widthM: double("widthM").notNull(),
  heightM: double("heightM").notNull(),
  maxWeightKg: double("maxWeightKg").notNull(),
  gpsLat: double("gpsLat"),
  gpsLng: double("gpsLng"),
  status: varchar("status", { length: 16 }).notNull().default("idle"), // 'idle'|'enroute'|'loading'|'maintenance'
  driverName: varchar("driverName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

export const gatePasses = mysqlTable(
  "gate_passes",
  {
    id: serial("id").primaryKey(),
    passNo: varchar("passNo", { length: 32 }).notNull().unique(), // 'GP-2841'
    warehouseId: bigint("warehouseId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => warehouses.id),
    vehicleId: bigint("vehicleId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => vehicles.id),
    direction: varchar("direction", { length: 8 }).notNull(), // 'in'|'out'
    driverName: varchar("driverName", { length: 255 }).notNull(),
    purpose: varchar("purpose", { length: 255 }).notNull().default(""),
    status: varchar("status", { length: 16 }).notNull().default("scheduled"), // 'scheduled'|'at-gate'|'in-yard'|'completed'|'cancelled'
    docRef: varchar("docRef", { length: 255 }), // EWB/BOL/invoice ref
    scheduledAt: timestamp("scheduledAt"),
    inAt: timestamp("inAt"),
    outAt: timestamp("outAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("gate_passes_warehouse_idx").on(table.warehouseId),
    index("gate_passes_status_idx").on(table.status),
  ],
);

export type GatePass = typeof gatePasses.$inferSelect;
export type InsertGatePass = typeof gatePasses.$inferInsert;

export const invoices = mysqlTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    invoiceNo: varchar("invoiceNo", { length: 64 }).notNull().unique(), // 'INV/2025/0117'
    customerId: bigint("customerId", { mode: "number", unsigned: true }).references(
      () => customers.id,
    ),
    warehouseId: bigint("warehouseId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => warehouses.id),
    movementId: bigint("movementId", { mode: "number", unsigned: true }).references(
      () => movements.id,
    ),
    amountPaise: bigint("amountPaise", { mode: "number", unsigned: true })
      .notNull()
      .default(0),
    taxPaise: bigint("taxPaise", { mode: "number", unsigned: true })
      .notNull()
      .default(0),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    shippingMethod: varchar("shippingMethod", { length: 16 })
      .notNull()
      .default("road"), // 'road'|'sea'|'air'|'rail'
    status: varchar("status", { length: 16 }).notNull().default("draft"), // 'draft'|'issued'|'paid'
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("invoices_customer_idx").on(table.customerId),
    index("invoices_movement_idx").on(table.movementId),
  ],
);

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export const complianceDocs = mysqlTable(
  "compliance_docs",
  {
    id: serial("id").primaryKey(),
    docType: varchar("docType", { length: 8 }).notNull(), // 'EWB'|'IRN'|'BOL'|'AWB'|'LR'|'RR'
    docNo: varchar("docNo", { length: 64 }).notNull().unique(),
    movementId: bigint("movementId", { mode: "number", unsigned: true }).references(
      () => movements.id,
    ),
    invoiceId: bigint("invoiceId", { mode: "number", unsigned: true }).references(
      () => invoices.id,
    ),
    payloadJson: text("payloadJson"), // statutory field list (JSON)
    validFrom: timestamp("validFrom"),
    validUntil: timestamp("validUntil"),
    status: varchar("status", { length: 16 }).notNull().default("draft"), // 'valid'|'expiring'|'expired'|'draft'
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("compliance_docs_movement_idx").on(table.movementId),
    index("compliance_docs_status_idx").on(table.status),
  ],
);

export type ComplianceDoc = typeof complianceDocs.$inferSelect;
export type InsertComplianceDoc = typeof complianceDocs.$inferInsert;

export const scanRecords = mysqlTable(
  "scan_records",
  {
    id: serial("id").primaryKey(),
    parcelId: varchar("parcelId", { length: 64 }).notNull(),
    warehouseId: bigint("warehouseId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => warehouses.id),
    dockId: bigint("dockId", { mode: "number", unsigned: true }).references(
      () => docks.id,
    ),
    lengthM: double("lengthM").notNull(),
    widthM: double("widthM").notNull(),
    heightM: double("heightM").notNull(),
    actualWeightKg: double("actualWeightKg").notNull(),
    volumetricWeightKg: double("volumetricWeightKg").notNull(),
    xrayFlag: varchar("xrayFlag", { length: 16 }).notNull().default("clear"), // 'clear'|'review'|'blocked'
    contentsGuess: varchar("contentsGuess", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("scan_records_warehouse_idx").on(table.warehouseId)],
);

export type ScanRecord = typeof scanRecords.$inferSelect;
export type InsertScanRecord = typeof scanRecords.$inferInsert;

export const loadPlans = mysqlTable(
  "load_plans",
  {
    id: serial("id").primaryKey(),
    planNo: varchar("planNo", { length: 32 }).notNull().unique(), // 'LP-0417'
    vehicleId: bigint("vehicleId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => vehicles.id),
    warehouseId: bigint("warehouseId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => warehouses.id),
    status: varchar("status", { length: 16 }).notNull().default("draft"), // 'draft'|'optimized'|'locked'|'dispatched'
    utilizationPct: double("utilizationPct").notNull().default(0),
    totalWeightKg: double("totalWeightKg").notNull().default(0),
    sequenceJson: text("sequenceJson"), // packed items with positions/axis (JSON)
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("load_plans_vehicle_idx").on(table.vehicleId)],
);

export type LoadPlan = typeof loadPlans.$inferSelect;
export type InsertLoadPlan = typeof loadPlans.$inferInsert;

export const routes = mysqlTable(
  "routes",
  {
    id: serial("id").primaryKey(),
    routeNo: varchar("routeNo", { length: 32 }).notNull().unique(), // 'TRIP-0417'
    vehicleId: bigint("vehicleId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => vehicles.id),
    direction: varchar("direction", { length: 16 }).notNull().default("outward"), // 'outward'|'inward'|'backhaul'
    status: varchar("status", { length: 16 }).notNull().default("planned"), // 'planned'|'active'|'completed'
    optimizedStopsJson: text("optimizedStopsJson"), // ordered stops (JSON)
    totalKm: double("totalKm").notNull().default(0),
    etaMinutes: int("etaMinutes").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("routes_vehicle_idx").on(table.vehicleId)],
);

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // nullable — set only for email+password accounts, never for Kimi OAuth users
  passwordHash: varchar("passwordHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
