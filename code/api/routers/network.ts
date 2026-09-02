import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import * as q from "../queries/logistics";

export const networkRouter = createRouter({
  /** Locations with nested warehouses + per-warehouse stock/value rollup. */
  listLocations: publicQuery.query(() => q.listLocationsWithWarehouses()),

  /** Location → warehouse → rack hierarchy (bin counts at rack level). */
  locationTree: publicQuery.query(() => q.locationTree()),

  /** Inter-warehouse transfer board (movements of type 'transfer'). */
  transfers: publicQuery
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).optional(),
          crossWarehouseOnly: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const rows = await q.listTransfers(input?.limit ?? 50);
      return input?.crossWarehouseOnly
        ? rows.filter((r) => r.crossWarehouse)
        : rows;
    }),
});
