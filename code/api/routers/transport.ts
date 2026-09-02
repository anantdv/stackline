import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter, publicQuery } from "../middleware";
import * as q from "../queries/logistics";
import { packLoad, type PackLoadResult } from "@contracts/logistics";

const packItemInput = z.object({
  id: z.union([z.string(), z.number()]),
  l: z.number().positive(),
  w: z.number().positive(),
  h: z.number().positive(),
  weightKg: z.number().min(0),
  qty: z.number().int().min(1),
});

function planSequence(result: PackLoadResult) {
  return JSON.stringify({
    placed: result.placed,
    unplaced: result.unplaced,
    utilizationPct: result.utilizationPct,
    weightUtilizationPct: result.weightUtilizationPct,
  });
}

async function nextPlanNo(): Promise<string> {
  const plans = await q.listLoadPlans({});
  let max = 400;
  for (const p of plans) {
    const m = /^LP-(\d+)$/.exec(p.planNo);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `LP-${String(max + 1).padStart(4, "0")}`;
}

export const transportRouter = createRouter({
  listVehicles: publicQuery.query(() => q.listVehicles()),

  /** Smallest vehicle whose cargo space fits the whole consignment. */
  suggestVehicle: publicQuery
    .input(z.object({ items: z.array(packItemInput).min(1) }))
    .query(async ({ input }) => {
      const vehicleList = await q.listVehicles();
      const candidates = vehicleList
        .filter((v) => v.status !== "maintenance")
        .sort((a, b) => a.lengthM * a.widthM * a.heightM - b.lengthM * b.widthM * b.heightM);
      for (const vehicle of candidates) {
        const result = packLoad(vehicle, input.items);
        if (result.unplaced.length === 0) {
          return { vehicle, result };
        }
      }
      return { vehicle: null, result: null };
    }),

  /** Run the packer and persist the plan as 'optimized'. */
  createPlan: adminQuery
    .input(
      z.object({
        vehicleId: z.number().int(),
        warehouseId: z.number().int(),
        items: z.array(packItemInput).min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const vehicle = await q.getVehicle(input.vehicleId);
      if (!vehicle)
        throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle not found" });
      const result = packLoad(vehicle, input.items);
      const plan = await q.createLoadPlan({
        planNo: await nextPlanNo(),
        vehicleId: vehicle.id,
        warehouseId: input.warehouseId,
        status: "optimized",
        utilizationPct: Math.round(result.utilizationPct * 10) / 10,
        totalWeightKg: result.totalWeightKg,
        sequenceJson: planSequence(result),
      });
      return { plan, result };
    }),

  listPlans: publicQuery
    .input(
      z
        .object({
          warehouseId: z.number().int().optional(),
          vehicleId: z.number().int().optional(),
          status: z.enum(["draft", "optimized", "locked", "dispatched"]).optional(),
        })
        .optional(),
    )
    .query(({ input }) => q.listLoadPlans(input ?? {})),

  /** Plan with parsed sequenceJson (placed positions + rotation axis). */
  getPlan: publicQuery
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const plan = await q.getLoadPlan(input.id);
      if (!plan) return null;
      const vehicle = await q.getVehicle(plan.vehicleId);
      let sequence: unknown = null;
      if (plan.sequenceJson) {
        try {
          sequence = JSON.parse(plan.sequenceJson);
        } catch {
          sequence = null;
        }
      }
      return { ...plan, vehicle: vehicle ?? null, sequence };
    }),

  lockPlan: adminQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const plan = await q.getLoadPlan(input.id);
      if (!plan)
        throw new TRPCError({ code: "NOT_FOUND", message: "Load plan not found" });
      if (plan.status === "dispatched") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Plan already dispatched",
        });
      }
      return q.updateLoadPlan(input.id, { status: "locked" });
    }),
});
