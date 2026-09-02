import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { authedQuery, createRouter, publicQuery } from "../middleware";
import * as q from "../queries/logistics";
import { getDb } from "../queries/connection";
import { complianceDocs, gatePasses } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import { docStatusFromValidity } from "@contracts/logistics";

const passStatus = z.enum([
  "scheduled",
  "at-gate",
  "in-yard",
  "completed",
  "cancelled",
]);

function nextPassNo(existing: Array<{ passNo: string }>) {
  let max = 2800;
  for (const p of existing) {
    const m = /^GP-(\d+)$/.exec(p.passNo);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `GP-${max + 1}`;
}

export const gateRouter = createRouter({
  /** Ops board: IN / YARD / OUT lanes for one warehouse. */
  board: publicQuery
    .input(z.object({ warehouseId: z.number().int() }))
    .query(async ({ input }) => {
      const passes = await q.listGatePasses({ warehouseId: input.warehouseId });
      const active = passes.filter(
        (p) => p.status === "scheduled" || p.status === "at-gate" || p.status === "in-yard",
      );
      const now = Date.now();
      const waitMinutes = (p: (typeof passes)[number]) =>
        p.inAt ? Math.max(0, Math.round((now - p.inAt.getTime()) / 60000)) : 0;
      return {
        inLane: active
          .filter((p) => p.direction === "in" && p.status !== "in-yard")
          .map((p) => ({ ...p, waitMinutes: waitMinutes(p) })),
        yard: active
          .filter((p) => p.status === "in-yard")
          .map((p) => ({ ...p, waitMinutes: waitMinutes(p) })),
        outLane: active
          .filter((p) => p.direction === "out" && p.status !== "in-yard")
          .map((p) => ({ ...p, waitMinutes: waitMinutes(p) })),
        completedToday: passes.filter((p) => p.status === "completed").slice(0, 20),
      };
    }),

  schedulePass: authedQuery
    .input(
      z.object({
        warehouseId: z.number().int(),
        vehicleId: z.number().int(),
        direction: z.enum(["in", "out"]),
        driverName: z.string().min(1),
        purpose: z.string().default(""),
        docRef: z.string().nullable().optional(),
        scheduledAt: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await getDb()
        .select({ passNo: gatePasses.passNo })
        .from(gatePasses);
      return q.createGatePass({
        passNo: nextPassNo(existing),
        warehouseId: input.warehouseId,
        vehicleId: input.vehicleId,
        direction: input.direction,
        driverName: input.driverName,
        purpose: input.purpose,
        docRef: input.docRef ?? null,
        scheduledAt: input.scheduledAt ?? null,
        status: "scheduled",
      });
    }),

  /**
   * Advance a pass through its lifecycle. Gate-out (completing an outbound
   * pass) is blocked when the linked EWB is expired.
   */
  updatePassStatus: authedQuery
    .input(z.object({ id: z.number().int(), status: passStatus }))
    .mutation(async ({ input }) => {
      const pass = await q.getGatePass(input.id);
      if (!pass) throw new TRPCError({ code: "NOT_FOUND", message: "Gate pass not found" });

      if (input.status === "completed" && pass.direction === "out") {
        // Validate the linked compliance docs (via docRef = EWB docNo, or
        // any EWB tied to the pass doc reference).
        const db = getDb();
        const docs = pass.docRef
          ? await db
              .select()
              .from(complianceDocs)
              .where(eq(complianceDocs.docNo, pass.docRef))
              .orderBy(desc(complianceDocs.id))
          : [];
        const ewb = docs.find((d) => d.docType === "EWB");
        if (ewb) {
          const live = docStatusFromValidity(ewb.validUntil, new Date());
          if (live === "expired") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Cannot gate out: EWB ${ewb.docNo} is expired. Regenerate the e-way bill before dispatch.`,
            });
          }
        }
      }

      const patch: Parameters<typeof q.updateGatePass>[1] = { status: input.status };
      if (input.status === "at-gate" || input.status === "in-yard") {
        if (pass.direction === "in" && !pass.inAt) patch.inAt = new Date();
      }
      if (input.status === "completed") {
        const now = new Date();
        if (pass.direction === "out") patch.outAt = now;
        else if (!pass.inAt) patch.inAt = now;
      }
      return q.updateGatePass(input.id, patch);
    }),

  /** Docks of a warehouse with currently active passes (schedule view). */
  dockSchedule: publicQuery
    .input(z.object({ warehouseId: z.number().int() }))
    .query(async ({ input }) => {
      const [dockList, passes] = await Promise.all([
        q.listDocks(input.warehouseId),
        q.listGatePasses({ warehouseId: input.warehouseId }),
      ]);
      const active = passes.filter(
        (p) => p.status === "at-gate" || p.status === "in-yard",
      );
      const upcoming = passes.filter((p) => p.status === "scheduled");
      return dockList.map((d) => ({
        ...d,
        busy:
          d.type === "inbound"
            ? active.some((p) => p.direction === "in")
            : d.type === "outbound"
              ? active.some((p) => p.direction === "out")
              : active.length > 0,
        activePasses: active.filter(
          (p) => d.type === "both" || p.direction === (d.type === "inbound" ? "in" : "out"),
        ),
        upcoming: upcoming.filter(
          (p) => d.type === "both" || p.direction === (d.type === "inbound" ? "in" : "out"),
        ),
      }));
    }),
});
