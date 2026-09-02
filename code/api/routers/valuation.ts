import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import * as q from "../queries/valuation";

const breakdown = z.enum(["byItem", "byGroup", "byVariant"]).default("byItem");

export const valuationRouter = createRouter({
  /** Network-wide value, grouped per warehouse × breakdown. */
  byWarehouse: publicQuery
    .input(z.object({ breakdown }).optional())
    .query(({ input }) => q.valuationByWarehouse(input?.breakdown ?? "byItem")),

  /** One warehouse ("cluster"), grouped per rack × breakdown. */
  byCluster: publicQuery
    .input(z.object({ warehouseId: z.number().int(), breakdown }))
    .query(({ input }) =>
      q.valuationByCluster(input.warehouseId, input.breakdown),
    ),

  /** One rack, flat breakdown rows. */
  byRack: publicQuery
    .input(z.object({ rackId: z.number().int(), breakdown }))
    .query(({ input }) => q.valuationByRack(input.rackId, input.breakdown)),

  /** Aging buckets (<30 / 30–90 / >90 days) from placements.createdAt. */
  aging: publicQuery
    .input(z.object({ warehouseId: z.number().int().optional() }).optional())
    .query(({ input }) => q.valuationAging(input?.warehouseId)),

  /** Whole-network totals for hero stats. */
  networkTotals: publicQuery.query(() => q.valuationNetworkTotals()),

  /** Price source for the ErpPriceBadge (LIVE vs CACHE vs DEMO). */
  priceSource: publicQuery.query(async () => {
    const map = await q.resolvePriceMap();
    return map.source;
  }),
});
