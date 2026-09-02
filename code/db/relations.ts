import { relations } from "drizzle-orm";
import { warehouses, racks, bins, items, placements, movements } from "./schema";

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  racks: many(racks),
}));

export const racksRelations = relations(racks, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [racks.warehouseId],
    references: [warehouses.id],
  }),
  bins: many(bins),
}));

export const binsRelations = relations(bins, ({ one, many }) => ({
  rack: one(racks, { fields: [bins.rackId], references: [racks.id] }),
  placements: many(placements),
  outgoingMovements: many(movements, { relationName: "fromBin" }),
  incomingMovements: many(movements, { relationName: "toBin" }),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  placements: many(placements),
  movements: many(movements),
}));

export const placementsRelations = relations(placements, ({ one }) => ({
  bin: one(bins, { fields: [placements.binId], references: [bins.id] }),
  item: one(items, { fields: [placements.itemId], references: [items.id] }),
}));

export const movementsRelations = relations(movements, ({ one }) => ({
  item: one(items, { fields: [movements.itemId], references: [items.id] }),
  fromBin: one(bins, {
    fields: [movements.fromBinId],
    references: [bins.id],
    relationName: "fromBin",
  }),
  toBin: one(bins, {
    fields: [movements.toBinId],
    references: [bins.id],
    relationName: "toBin",
  }),
}));
