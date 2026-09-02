import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter } from "../middleware";
import { analyzeFloorPlan } from "../lib/floorplan";
import {
  adaptiveBinarize,
  deskewBinary,
  downscaleGray,
  encodeAnnotatedPng,
  rotateGray,
  type GrayImage,
} from "../lib/image";
import { createWarehouse, upsertLayout, type LayoutRackInput } from "../queries/wms";
import { getDb } from "../queries/connection";

const RACK_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_DIM = 1700;

const inputSchema = z.object({
  /** base64 grayscale raster, preprocessed in the browser (any source format,
   *  EXIF-corrected, downscaled) — one byte per pixel, row-major */
  grayBase64: z.string().min(1000).max(12 * 1024 * 1024),
  imageWidth: z.number().int().min(200).max(MAX_DIM),
  imageHeight: z.number().int().min(200).max(MAX_DIM),
  name: z.string().min(2).max(120),
  code: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[A-Z0-9-]+$/i, "letters, digits, dashes only"),
  /** real-world dimensions of the drawn building — the sketch gives structure, these give scale */
  lengthM: z.number().min(5).max(1000),
  widthM: z.number().min(5).max(1000),
  heightM: z.number().min(3).max(40),
  levels: z.number().int().min(1).max(12).default(4),
  aisleWidthM: z.number().min(1).max(10).default(3),
});

export const twinRouter = createRouter({
  /**
   * Sketch → 3D twin. Pipeline: adaptive binarization (shadow-tolerant) →
   * projection-variance deskew → line/strip structure detection →
   * warehouse + racks + bins in the live database → annotated preview.
   */
  analyzeSketch: adminQuery
    .input(inputSchema)
    .mutation(async ({ input }) => {
      const raw = Buffer.from(input.grayBase64, "base64");
      if (raw.length !== input.imageWidth * input.imageHeight) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "image payload corrupt — please re-upload",
        });
      }
      const gray: GrayImage = {
        data: new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength),
        width: input.imageWidth,
        height: input.imageHeight,
      };

      // 1. adaptive binarize (handles shadows / uneven paper lighting)
      const binary: GrayImage = {
        data: adaptiveBinarize(gray, Math.max(12, Math.round(gray.width / 50))),
        width: gray.width,
        height: gray.height,
      };

      // 2. deskew via projection-variance maximization
      const { image: deskewed, angleDeg } = deskewBinary(binary);
      const grayDeskewed =
        angleDeg === 0
          ? gray
          : rotateGray(gray, (angleDeg * Math.PI) / 180, 255, true);

      // 3. structure detection on the clean binary (0 = ink, 255 = paper)
      const analysis = analyzeFloorPlan(deskewed.data, deskewed.width, deskewed.height);

      if (analysis.rows.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No rack rows detected. Use a top-view plan with clear parallel lines for rack rows and good contrast.",
        });
      }

      // scale: px → meters via wall bounds
      const mPerPxX = input.lengthM / analysis.bounds.w;
      const mPerPxY = input.widthM / analysis.bounds.h;
      const drawnAspect = analysis.bounds.w / analysis.bounds.h;
      const realAspect = input.lengthM / input.widthM;
      const notes: string[] = [...analysis.notes];
      if (angleDeg !== 0) notes.push(`deskewed by ${angleDeg}°`);
      if (Math.abs(drawnAspect - realAspect) / realAspect > 0.2) {
        notes.push(
          `drawing aspect ${drawnAspect.toFixed(2)} vs given dimensions ${realAspect.toFixed(2)} — check length/width`,
        );
      }

      // 4. create the warehouse
      const existing = await getDb().query.warehouses.findFirst({
        where: (t, { eq }) => eq(t.code, input.code.toUpperCase()),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `warehouse code ${input.code.toUpperCase()} already exists`,
        });
      }
      const created = await createWarehouse({
        name: input.name,
        code: input.code.toUpperCase(),
        lengthM: input.lengthM,
        widthM: input.widthM,
        heightM: input.heightM,
        aisleWidthM: input.aisleWidthM,
      });
      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "warehouse insert failed" });
      }
      const wh = created;

      // 5. rows → racks + bins
      const levelHeightM = Math.round((input.heightM / input.levels) * 100) / 100;
      const rackInputs: LayoutRackInput[] = analysis.rows.map((row, i) => {
        const rowLengthM = row.w * mPerPxX;
        const rowDepthM = Math.min(3, Math.max(0.6, row.h * mPerPxY));
        const bays =
          row.bays ?? Math.min(40, Math.max(1, Math.round(rowLengthM / 2.7)));
        return {
          name: RACK_NAMES[i] ?? `R${i + 1}`,
          positionX: Math.round((row.x - analysis.bounds.x) * mPerPxX * 100) / 100,
          positionY: Math.round((row.y - analysis.bounds.y) * mPerPxY * 100) / 100,
          rotationDeg: 0,
          bays,
          levels: input.levels,
          bayWidthM: Math.round((rowLengthM / bays) * 100) / 100,
          bayDepthM: Math.round(rowDepthM * 100) / 100,
          levelHeightM,
        };
      });
      const layout = await upsertLayout(wh.id, rackInputs);

      // 6. annotated preview (drawn server-side — the UI shows exactly what was detected)
      const previewGray = downscaleGray(grayDeskewed, 1000);
      const ps = previewGray.width / deskewed.width;
      const previewBuf = encodeAnnotatedPng(previewGray, [
        {
          rect: scaleRect(analysis.bounds, ps),
          rgb: [255, 107, 26], // brand orange — wall bounds
        },
        ...analysis.rows.map((r) => ({
          rect: scaleRect(r, ps),
          rgb: [45, 212, 191] as [number, number, number], // data teal — rack rows
          fillAlpha: 0.25,
        })),
      ]);

      return {
        warehouseId: wh.id,
        warehouseCode: wh.code,
        racks: layout.racks,
        bins: layout.bins,
        levels: input.levels,
        confidence: analysis.score,
        notes,
        rows: analysis.rows.map((row, i) => ({
          name: RACK_NAMES[i] ?? `R${i + 1}`,
          bays: rackInputs[i].bays,
          baysDetected: row.bays !== null,
          lengthM: rackInputs[i].bayWidthM * rackInputs[i].bays,
          depthM: rackInputs[i].bayDepthM,
        })),
        preview: {
          imageBase64: `data:image/png;base64,${previewBuf.toString("base64")}`,
        },
      };
    }),
});

function scaleRect<T extends { x: number; y: number; w: number; h: number }>(
  r: T,
  s: number,
) {
  return {
    x: Math.round(r.x * s),
    y: Math.round(r.y * s),
    w: Math.round(r.w * s),
    h: Math.round(r.h * s),
  };
}
