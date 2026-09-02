import { z } from "zod";
import { authedQuery, createRouter, publicQuery } from "../middleware";
import * as q from "../queries/logistics";
import { volumetricWeightKg, chargeableWeight } from "@contracts/logistics";

export const scanningRouter = createRouter({
  listRecords: publicQuery
    .input(
      z
        .object({
          warehouseId: z.number().int().optional(),
          xrayFlag: z.enum(["clear", "review", "blocked"]).optional(),
          limit: z.number().int().min(1).max(500).optional(),
        })
        .optional(),
    )
    .query(({ input }) => q.listScanRecords(input ?? {})),

  /** Record a DWS (dim-weigh-scan) capture; volumetric computed server-side. */
  recordScan: authedQuery
    .input(
      z.object({
        parcelId: z.string().min(1),
        warehouseId: z.number().int(),
        dockId: z.number().int().nullable().optional(),
        lengthM: z.number().positive(),
        widthM: z.number().positive(),
        heightM: z.number().positive(),
        actualWeightKg: z.number().min(0),
        volumetricDivisor: z.number().positive().optional(),
        contentsGuess: z.string().nullable().optional(),
        xrayFlag: z.enum(["clear", "review", "blocked"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const volKg = volumetricWeightKg(
        input.lengthM,
        input.widthM,
        input.heightM,
        input.volumetricDivisor ?? 5000,
      );
      const record = await q.createScanRecord({
        parcelId: input.parcelId,
        warehouseId: input.warehouseId,
        dockId: input.dockId ?? null,
        lengthM: input.lengthM,
        widthM: input.widthM,
        heightM: input.heightM,
        actualWeightKg: input.actualWeightKg,
        volumetricWeightKg: Math.round(volKg * 100) / 100,
        xrayFlag: input.xrayFlag ?? "clear",
        contentsGuess: input.contentsGuess ?? null,
      });
      return {
        ...record,
        chargeable: record
          ? chargeableWeight(record.actualWeightKg, record.volumetricWeightKg)
          : null,
      };
    }),

  flagReview: authedQuery
    .input(
      z.object({
        id: z.number().int(),
        flag: z.enum(["clear", "review", "blocked"]),
      }),
    )
    .mutation(({ input }) => q.updateScanFlag(input.id, input.flag)),
});
