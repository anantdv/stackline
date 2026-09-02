import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as q from "../queries/logistics";
import * as comp from "../queries/compliance";
import { loadStockGraph, priceOf, resolvePriceMap } from "../queries/valuation";
import { invoices, movements } from "@db/schema";
import { desc, eq, inArray } from "drizzle-orm";

/**
 * 3PL portal router. Customers are linked to stock via their invoices →
 * movements → items; placements for those items form the customer's view.
 */
export const portalRouter = createRouter({
  listCustomers: publicQuery.query(() => q.listCustomers()),

  customerDashboard: publicQuery
    .input(z.object({ customerId: z.number().int() }))
    .query(async ({ input }) => {
      const db = getDb();
      const customer = await q.getCustomer(input.customerId);
      if (!customer) return null;

      const customerInvoices = await comp.listInvoices({
        customerId: input.customerId,
        limit: 200,
      });
      const movementIds = [
        ...new Set(
          customerInvoices
            .map((inv) => inv.movementId)
            .filter((id): id is number => id != null),
        ),
      ];
      const customerMovements =
        movementIds.length === 0
          ? []
          : await db
              .select()
              .from(movements)
              .where(inArray(movements.id, movementIds))
              .orderBy(desc(movements.id));

      const itemIds = [...new Set(customerMovements.map((m) => m.itemId))];

      // Stock view: placements for items the customer has transacted.
      const [graph, priceMap] = await Promise.all([
        loadStockGraph(),
        resolvePriceMap(),
      ]);
      const stockByItem = new Map<
        number,
        { sku: string; name: string; qty: number; valueInr: number }
      >();
      for (const p of graph.placementList) {
        if (!itemIds.includes(p.itemId)) continue;
        const item = graph.itemById.get(p.itemId);
        if (!item) continue;
        let row = stockByItem.get(p.itemId);
        if (!row) {
          row = { sku: item.sku, name: item.name, qty: 0, valueInr: 0 };
          stockByItem.set(p.itemId, row);
        }
        row.qty += p.qty;
        row.valueInr += p.qty * priceOf(priceMap, item);
      }
      const stock = [...stockByItem.values()].sort(
        (a, b) => b.valueInr - a.valueInr,
      );

      // Pipeline + SLA stats from the customer's movements.
      const pending = customerMovements.filter(
        (m) => m.status === "pending" || m.status === "in_progress",
      );
      const dispatches = customerMovements.filter((m) => m.type === "dispatch");
      const completed = dispatches.filter((m) => m.status === "completed");
      const turnaroundHours = completed.map(
        (m) => (m.updatedAt.getTime() - m.createdAt.getTime()) / 3_600_000,
      );
      const avgTurnaroundHours =
        turnaroundHours.length > 0
          ? turnaroundHours.reduce((s, h) => s + h, 0) / turnaroundHours.length
          : null;
      const completionRate =
        dispatches.length > 0 ? completed.length / dispatches.length : null;

      const billedPaise = customerInvoices.reduce(
        (s, inv) => s + inv.amountPaise + inv.taxPaise,
        0,
      );

      return {
        customer,
        priceSource: priceMap.source,
        kpis: {
          skusLive: stock.length,
          totalQty: stock.reduce((s, r) => s + r.qty, 0),
          stockValueInr: stock.reduce((s, r) => s + r.valueInr, 0),
          pendingOrders: pending.length,
          avgTurnaroundHours,
          completionRate,
          billedInr: billedPaise / 100,
        },
        stock,
        pipeline: {
          placed: customerMovements.filter((m) => m.status === "pending").length,
          inProgress: customerMovements.filter((m) => m.status === "in_progress")
            .length,
          completed: completed.length,
          cancelled: customerMovements.filter((m) => m.status === "cancelled")
            .length,
        },
        recentInvoices: customerInvoices.slice(0, 10),
      };
    }),

  customerMovements: publicQuery
    .input(
      z.object({
        customerId: z.number().int(),
        limit: z.number().int().min(1).max(200).optional(),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const customerInvoices = await db
        .select({ movementId: invoices.movementId })
        .from(invoices)
        .where(eq(invoices.customerId, input.customerId));
      const movementIds = [
        ...new Set(
          customerInvoices
            .map((r) => r.movementId)
            .filter((id): id is number => id != null),
        ),
      ];
      if (movementIds.length === 0) return [];
      return db
        .select()
        .from(movements)
        .where(inArray(movements.id, movementIds))
        .orderBy(desc(movements.id))
        .limit(input.limit ?? 50);
    }),
});
