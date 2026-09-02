/**
 * Compliance queries — invoices + statutory documents (EWB/IRN/BOL/AWB/LR/RR).
 * Plain select() + manual assembly only.
 */
import { getDb } from "./connection";
import {
  bins,
  complianceDocs,
  invoices,
  items,
  movements,
  racks,
  warehouses,
  type ComplianceDoc,
  type Invoice,
} from "@db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  docStatusFromValidity,
  ewayBillValidityHours,
  requiredDocsForMethod,
  type DocType,
  type ShippingMethod,
} from "@contracts/logistics";
import { resolvePriceMap, priceOf } from "./valuation";

// ---------------------------------------------------------------------------
// Number generation (deterministic from ids — demo-grade statutory formats)
// ---------------------------------------------------------------------------

function pad(n: number, width: number) {
  return String(n).padStart(width, "0");
}

export function invoiceNoForId(id: number) {
  return `INV/2025/${pad(id, 4)}`;
}

/** Invoice number derived from the movement (unique per movement). */
export function invoiceNoForMovement(movementId: number) {
  return `INV/2025/${pad(movementId, 4)}`;
}

export function docNoFor(type: DocType, invoiceId: number, seq: number) {
  const base = invoiceId * 100 + seq;
  switch (type) {
    case "EWB":
      return `EWB ${pad(2841 + (base % 1000), 4)} ${pad(9912 + (base % 8000), 4)} ${pad(4471 + (base % 9000), 4)}`;
    case "IRN":
      // IRN is a 64-char hash in reality; demo-grade deterministic hex.
      return Array.from({ length: 4 }, (_, i) =>
        ((base * 2654435761 + i * 40503) >>> 0).toString(16).padStart(8, "0"),
      ).join("");
    case "BOL":
      return `B/L MAEU-${pad(8000 + (base % 1000), 4)}-QF`;
    case "AWB":
      return `AWB 098-${pad(5000 + (base % 5000), 4)} ${pad(4000 + (base % 9000), 4)}`;
    case "LR":
      return `LR-${pad(20250000 + base, 8)}`;
    case "RR":
      return `RR-${pad(20250000 + base, 8)}`;
  }
}

// ---------------------------------------------------------------------------
// Invoice + document generation
// ---------------------------------------------------------------------------

const GST_RATE = 0.18;

export interface GeneratedInvoice {
  invoice: Invoice;
  docs: ComplianceDoc[];
  created: boolean;
}

function docPayload(
  type: DocType,
  ctx: {
    invoiceNo: string;
    itemSku: string;
    itemName: string;
    qty: number;
    amountInr: number;
    distanceKm: number;
    warehouseCode: string;
  },
): Record<string, unknown> {
  switch (type) {
    case "EWB":
      return {
        form: "EWB Part A/B",
        invoiceNo: ctx.invoiceNo,
        consignmentValueInr: ctx.amountInr,
        goods: `${ctx.qty} × ${ctx.itemName} (${ctx.itemSku})`,
        distanceKm: ctx.distanceKm,
        fromWarehouse: ctx.warehouseCode,
        transportMode: "ROAD",
      };
    case "IRN":
      return {
        form: "e-Invoice (GST)",
        invoiceNo: ctx.invoiceNo,
        taxableValueInr: ctx.amountInr,
        gstRatePct: GST_RATE * 100,
        qrPayload: `INV:${ctx.invoiceNo}`,
      };
    case "BOL":
      return {
        form: "Bill of Lading",
        shipper: ctx.warehouseCode,
        consignee: "TO ORDER",
        notify: "SAME AS CONSIGNEE",
        cargo: `${ctx.qty} CTNS ${ctx.itemName}`,
        invoiceNo: ctx.invoiceNo,
      };
    case "AWB":
      return {
        form: "Air Waybill",
        airlinePrefix: "098",
        invoiceNo: ctx.invoiceNo,
        pieces: ctx.qty,
        natureOfGoods: ctx.itemName,
      };
    case "LR":
      return {
        form: "Lorry Receipt",
        invoiceNo: ctx.invoiceNo,
        packages: ctx.qty,
        goods: ctx.itemName,
        freightBasis: "TO PAY",
      };
    case "RR":
      return {
        form: "Railway Receipt",
        invoiceNo: ctx.invoiceNo,
        packages: ctx.qty,
        goods: ctx.itemName,
        stationFrom: ctx.warehouseCode,
      };
  }
}

/**
 * Generate (idempotently) an invoice + the statutory document set for a
 * dispatch movement. Road → EWB+IRN+LR, sea → B/L, air → AWB, rail → EWB+RR.
 */
export async function generateInvoiceForMovement(args: {
  movementId: number;
  shippingMethod: ShippingMethod;
  customerId?: number | null;
  distanceKm?: number;
}): Promise<GeneratedInvoice> {
  const db = getDb();
  const mv = await db.query.movements.findFirst({
    where: eq(movements.id, args.movementId),
  });
  if (!mv) throw new Error(`Movement ${args.movementId} not found`);
  const item = await db.query.items.findFirst({ where: eq(items.id, mv.itemId) });
  if (!item) throw new Error(`Item ${mv.itemId} not found`);

  // Idempotent: reuse an existing invoice for this movement.
  const existing = await db.query.invoices.findFirst({
    where: eq(invoices.movementId, mv.id),
  });
  if (existing) {
    const docs = await db
      .select()
      .from(complianceDocs)
      .where(eq(complianceDocs.invoiceId, existing.id));
    return { invoice: existing, docs, created: false };
  }

  const priceMap = await resolvePriceMap();
  const unitRate = priceOf(priceMap, item);
  const amountPaise = Math.round(mv.qty * unitRate * 100);
  const taxPaise = Math.round(amountPaise * GST_RATE);

  // Resolve the dispatching warehouse via the movement's source bin.
  let warehouseCode = "WH";
  let warehouseId: number | null = null;
  if (mv.fromBinId != null) {
    const bin = await db.query.bins.findFirst({ where: eq(bins.id, mv.fromBinId) });
    const rack = bin
      ? await db.query.racks.findFirst({ where: eq(racks.id, bin.rackId) })
      : undefined;
    const warehouse = rack
      ? await db.query.warehouses.findFirst({
          where: eq(warehouses.id, rack.warehouseId),
        })
      : undefined;
    if (warehouse) {
      warehouseId = warehouse.id;
      warehouseCode = warehouse.code;
    }
  }
  if (warehouseId == null) {
    const anyWarehouse = (
      await db.select().from(warehouses).orderBy(asc(warehouses.id)).limit(1)
    )[0];
    if (!anyWarehouse) throw new Error("No warehouse exists for invoicing");
    warehouseId = anyWarehouse.id;
    warehouseCode = anyWarehouse.code;
  }

  const [{ id: invoiceId }] = await db
    .insert(invoices)
    .values({
      invoiceNo: invoiceNoForMovement(mv.id),
      customerId: args.customerId ?? null,
      warehouseId,
      movementId: mv.id,
      amountPaise,
      taxPaise,
      currency: "INR",
      shippingMethod: args.shippingMethod,
      status: "issued",
    })
    .$returningId();

  const invoice = (await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  }))!;

  const distanceKm = args.distanceKm ?? 120;
  const now = new Date();
  const docTypes = requiredDocsForMethod(args.shippingMethod);
  const docs: ComplianceDoc[] = [];
  for (let i = 0; i < docTypes.length; i++) {
    const type = docTypes[i];
    const hasValidity = type === "EWB";
    const validFrom = hasValidity ? now : null;
    const validUntil = hasValidity
      ? new Date(now.getTime() + ewayBillValidityHours(distanceKm) * 3600 * 1000)
      : null;
    const status = docStatusFromValidity(validUntil, now);
    const payload = docPayload(type, {
      invoiceNo: invoice.invoiceNo,
      itemSku: item.sku,
      itemName: item.name,
      qty: mv.qty,
      amountInr: amountPaise / 100,
      distanceKm,
      warehouseCode,
    });
    const [{ id: docId }] = await db
      .insert(complianceDocs)
      .values({
        docType: type,
        docNo: docNoFor(type, invoiceId, i + 1),
        movementId: mv.id,
        invoiceId,
        payloadJson: JSON.stringify(payload),
        validFrom,
        validUntil,
        status,
      })
      .$returningId();
    const doc = await db.query.complianceDocs.findFirst({
      where: eq(complianceDocs.id, docId),
    });
    if (doc) docs.push(doc);
  }

  return { invoice, docs, created: true };
}

// ---------------------------------------------------------------------------
// Listing / preview
// ---------------------------------------------------------------------------

/** Live status overlay: recompute from validity window when present. */
function withLiveStatus(doc: ComplianceDoc, now: Date): ComplianceDoc & { liveStatus: string } {
  const liveStatus = doc.validUntil
    ? docStatusFromValidity(doc.validUntil, now)
    : doc.status;
  return { ...doc, liveStatus };
}

export async function listComplianceDocs(filters: {
  status?: string;
  docType?: string;
  movementId?: number;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (filters.status) conditions.push(eq(complianceDocs.status, filters.status));
  if (filters.docType) conditions.push(eq(complianceDocs.docType, filters.docType));
  if (filters.movementId != null)
    conditions.push(eq(complianceDocs.movementId, filters.movementId));
  const rows = await db
    .select()
    .from(complianceDocs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(complianceDocs.id))
    .limit(filters.limit ?? 200);
  const now = new Date();
  return rows.map((d) => withLiveStatus(d, now));
}

export async function previewComplianceDoc(id: number) {
  const db = getDb();
  const doc = await db.query.complianceDocs.findFirst({
    where: eq(complianceDocs.id, id),
  });
  if (!doc) return null;
  let payload: Record<string, unknown> | null = null;
  if (doc.payloadJson) {
    try {
      payload = JSON.parse(doc.payloadJson) as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }
  const invoice = doc.invoiceId
    ? ((await db.query.invoices.findFirst({
        where: eq(invoices.id, doc.invoiceId),
      })) ?? null)
    : null;
  return { ...withLiveStatus(doc, new Date()), payload, invoice };
}

export async function listInvoices(filters: {
  customerId?: number;
  status?: string;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (filters.customerId != null)
    conditions.push(eq(invoices.customerId, filters.customerId));
  if (filters.status) conditions.push(eq(invoices.status, filters.status));
  return db
    .select()
    .from(invoices)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(invoices.id))
    .limit(filters.limit ?? 200);
}

export async function updateInvoiceStatus(id: number, status: string) {
  const db = getDb();
  await db.update(invoices).set({ status }).where(eq(invoices.id, id));
  return db.query.invoices.findFirst({ where: eq(invoices.id, id) });
}
