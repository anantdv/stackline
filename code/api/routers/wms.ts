import { z } from "zod";
import { adminQuery, authedQuery, createRouter, publicQuery } from "../middleware";
import { cartonsPerBin, allocateCartons } from "@contracts/wms";
import * as q from "../queries/wms";
import { getDb } from "../queries/connection";
import { bins, placements, items } from "@db/schema";
import { eq } from "drizzle-orm";

const rackInput = z.object({
  name: z.string().min(1),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  rotationDeg: z.number().int().optional(),
  bays: z.number().int().min(1),
  levels: z.number().int().min(1),
  bayWidthM: z.number().positive(),
  bayDepthM: z.number().positive(),
  levelHeightM: z.number().positive(),
});

const warehouseInput = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  lengthM: z.number().positive(),
  widthM: z.number().positive(),
  heightM: z.number().positive(),
  aisleWidthM: z.number().positive().optional(),
  erpnextWarehouse: z.string().nullable().optional(),
});

const itemInput = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  cartonLengthM: z.number().positive(),
  cartonWidthM: z.number().positive(),
  cartonHeightM: z.number().positive(),
  cartonWeightKg: z.number().min(0),
  erpnextItemCode: z.string().nullable().optional(),
});

const movementType = z.enum([
  "receipt",
  "putaway",
  "transfer",
  "pick",
  "dispatch",
]);
const movementStatus = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

const warehousesRouter = createRouter({
  list: publicQuery.query(() => q.listWarehouses()),
  get: publicQuery
    .input(z.object({ id: z.number().int() }))
    .query(({ input }) => q.getWarehouse(input.id)),
  create: adminQuery.input(warehouseInput).mutation(({ input }) =>
    q.createWarehouse({
      name: input.name,
      code: input.code,
      lengthM: input.lengthM,
      widthM: input.widthM,
      heightM: input.heightM,
      aisleWidthM: input.aisleWidthM ?? 3,
      erpnextWarehouse: input.erpnextWarehouse ?? null,
    }),
  ),
  update: adminQuery
    .input(z.object({ id: z.number().int(), data: warehouseInput.partial() }))
    .mutation(({ input }) => q.updateWarehouse(input.id, input.data)),
});

const layoutRouter = createRouter({
  getFullLayout: publicQuery
    .input(z.object({ warehouseId: z.number().int() }))
    .query(({ input }) => q.getWarehouseWithLayout(input.warehouseId)),
  saveLayout: adminQuery
    .input(
      z.object({
        warehouseId: z.number().int(),
        warehouse: warehouseInput.partial().optional(),
        racks: z.array(rackInput),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.warehouse) {
        await q.updateWarehouse(input.warehouseId, input.warehouse);
      }
      const result = await q.upsertLayout(input.warehouseId, input.racks);
      return result;
    }),
  generateBins: adminQuery
    .input(z.object({ rackId: z.number().int() }))
    .mutation(({ input }) => q.generateBins(input.rackId)),
});

const itemsRouter = createRouter({
  list: publicQuery.query(() => q.listItems()),
  create: adminQuery.input(itemInput).mutation(({ input }) =>
    q.createItem({ ...input, erpnextItemCode: input.erpnextItemCode ?? null }),
  ),
  update: adminQuery
    .input(z.object({ id: z.number().int(), data: itemInput.partial() }))
    .mutation(({ input }) => q.updateItem(input.id, input.data)),
});

const stockRouter = createRouter({
  binContents: publicQuery
    .input(z.object({ binId: z.number().int() }))
    .query(({ input }) => q.getBinContents(input.binId)),
  capacityPreview: publicQuery
    .input(z.object({ binId: z.number().int(), itemId: z.number().int() }))
    .query(async ({ input }) => {
      const db = getDb();
      const bin = await db.query.bins.findFirst({
        where: eq(bins.id, input.binId),
      });
      const item = await db.query.items.findFirst({
        where: eq(items.id, input.itemId),
      });
      if (!bin || !item) return null;
      const used = await db
        .select()
        .from(placements)
        .where(eq(placements.binId, bin.id));
      const usedQty = used.reduce((s, p) => s + p.qty, 0);
      const fit = cartonsPerBin(
        bin,
        {
          lengthM: item.cartonLengthM,
          widthM: item.cartonWidthM,
          heightM: item.cartonHeightM,
        },
        bin.maxWeightKg,
        item.cartonWeightKg,
      );
      return {
        bin,
        item,
        capacity: fit.count,
        usedQty,
        available: Math.max(0, fit.count - usedQty),
        orientation: fit.orientation,
        perAxis: fit.perAxis,
        weightLimited: fit.weightLimited,
      };
    }),
  warehouseUtilization: publicQuery
    .input(z.object({ warehouseId: z.number().int() }))
    .query(({ input }) => q.getWarehouseUtilization(input.warehouseId)),
  stockSummary: publicQuery
    .input(z.object({ warehouseId: z.number().int().optional() }))
    .query(({ input }) => q.getStockSummary(input.warehouseId)),
});

const allocationRouter = createRouter({
  /** Read-only allocation plan; does not touch the database state. */
  suggest: publicQuery
    .input(
      z.object({
        warehouseId: z.number().int(),
        itemId: z.number().int(),
        qty: z.number().int().positive(),
        strategy: z.enum(["fefo", "velocity", "balanced"]).default("balanced"),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const item = await db.query.items.findFirst({
        where: eq(items.id, input.itemId),
      });
      if (!item) throw new Error(`Item ${input.itemId} not found`);
      const { binList, placementList } = await q.getBinsForWarehouse(
        input.warehouseId,
      );
      const levelByBin = new Map(binList.map((b) => [b.id, b.level]));
      const placementsByBin = new Map<number, typeof placementList>();
      for (const p of placementList) {
        const arr = placementsByBin.get(p.binId) ?? [];
        arr.push(p);
        placementsByBin.set(p.binId, arr);
      }
      // Look up SKU for each placement's item to detect consolidation bins.
      const allItems = await db.select().from(items);
      const skuByItemId = new Map(allItems.map((i) => [i.id, i.sku]));

      const result = allocateCartons({
        bins: binList.map((b) => {
          const ps = placementsByBin.get(b.id) ?? [];
          return {
            id: b.id,
            code: b.code,
            widthM: b.widthM,
            depthM: b.depthM,
            heightM: b.heightM,
            maxWeightKg: b.maxWeightKg,
            status: b.status,
            level: levelByBin.get(b.id) ?? b.level,
            usedQty: ps.reduce((s, p) => s + p.qty, 0),
            currentPlacements: ps.map((p) => ({
              sku: skuByItemId.get(p.itemId) ?? null,
              qty: p.qty,
            })),
          };
        }),
        carton: {
          lengthM: item.cartonLengthM,
          widthM: item.cartonWidthM,
          heightM: item.cartonHeightM,
        },
        cartonWeightKg: item.cartonWeightKg,
        sku: item.sku,
        qty: input.qty,
        strategy: input.strategy,
      });
      return { ...result, item };
    }),
  /** Execute a suggested plan: create putaway movements + update placements. */
  execute: adminQuery
    .input(
      z.object({
        itemId: z.number().int(),
        reference: z.string().optional(),
        allocations: z.array(
          z.object({ binId: z.number().int(), qty: z.number().int().positive() }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const created = [];
      for (const alloc of input.allocations) {
        const mv = await q.recordMovement({
          type: "putaway",
          itemId: input.itemId,
          qty: alloc.qty,
          toBinId: alloc.binId,
          status: "pending",
          reference: input.reference ?? null,
        });
        if (mv) {
          const completed = await q.completeMovement(mv.id);
          created.push(completed);
        }
      }
      return { movements: created };
    }),
});

const movementsRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        warehouseId: z.number().int().optional(),
        status: movementStatus.optional(),
        type: movementType.optional(),
        limit: z.number().int().min(1).max(500).optional(),
      }),
    )
    .query(({ input }) => q.listMovements(input)),
  create: authedQuery
    .input(
      z.object({
        type: movementType,
        itemId: z.number().int(),
        qty: z.number().int().positive(),
        fromBinId: z.number().int().nullable().optional(),
        toBinId: z.number().int().nullable().optional(),
        reference: z.string().nullable().optional(),
      }),
    )
    .mutation(({ input }) =>
      q.recordMovement({
        type: input.type,
        itemId: input.itemId,
        qty: input.qty,
        fromBinId: input.fromBinId ?? null,
        toBinId: input.toBinId ?? null,
        status: "pending",
        reference: input.reference ?? null,
      }),
    ),
  updateStatus: authedQuery
    .input(z.object({ id: z.number().int(), status: movementStatus }))
    .mutation(async ({ input }) => {
      if (input.status === "completed") {
        return q.completeMovement(input.id);
      }
      return q.updateMovementStatus(input.id, input.status);
    }),
  complete: authedQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(({ input }) => q.completeMovement(input.id)),
});

export const wmsRouter = createRouter({
  warehouses: warehousesRouter,
  layout: layoutRouter,
  items: itemsRouter,
  stock: stockRouter,
  allocation: allocationRouter,
  movements: movementsRouter,
});
