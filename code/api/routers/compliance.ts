import { z } from "zod";
import { adminQuery, createRouter, publicQuery } from "../middleware";
import * as q from "../queries/compliance";

const shippingMethod = z.enum(["road", "sea", "air", "rail"]);
const docType = z.enum(["EWB", "IRN", "BOL", "AWB", "LR", "RR"]);
const docStatus = z.enum(["valid", "expiring", "expired", "draft"]);

export const complianceRouter = createRouter({
  /**
   * Generate an invoice + statutory document set for a dispatch movement.
   * Idempotent per movement: re-calling returns the existing invoice + docs.
   */
  generateInvoice: adminQuery
    .input(
      z.object({
        movementId: z.number().int(),
        shippingMethod,
        customerId: z.number().int().nullable().optional(),
        distanceKm: z.number().positive().optional(),
      }),
    )
    .mutation(({ input }) =>
      q.generateInvoiceForMovement({
        movementId: input.movementId,
        shippingMethod: input.shippingMethod,
        customerId: input.customerId ?? null,
        distanceKm: input.distanceKm,
      }),
    ),

  listDocs: publicQuery
    .input(
      z
        .object({
          status: docStatus.optional(),
          docType: docType.optional(),
          movementId: z.number().int().optional(),
          limit: z.number().int().min(1).max(500).optional(),
        })
        .optional(),
    )
    .query(({ input }) => q.listComplianceDocs(input ?? {})),

  /** Doc with parsed payloadJson (statutory form fields) + live status. */
  previewDoc: publicQuery
    .input(z.object({ id: z.number().int() }))
    .query(({ input }) => q.previewComplianceDoc(input.id)),

  listInvoices: publicQuery
    .input(
      z
        .object({
          customerId: z.number().int().optional(),
          status: z.enum(["draft", "issued", "paid"]).optional(),
          limit: z.number().int().min(1).max(500).optional(),
        })
        .optional(),
    )
    .query(({ input }) => q.listInvoices(input ?? {})),

  updateInvoiceStatus: adminQuery
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(["draft", "issued", "paid"]),
      }),
    )
    .mutation(({ input }) => q.updateInvoiceStatus(input.id, input.status)),
});
