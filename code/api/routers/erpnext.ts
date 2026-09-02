import { z } from "zod";
import { adminQuery, createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as q from "../queries/wms";
import { bins, items, movements, placements, racks, warehouses } from "@db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { ErpnextConfig } from "@db/schema";
import { DEMO_ITEM_PRICES } from "../queries/valuation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskConfig(cfg: ErpnextConfig | null) {
  if (!cfg) return null;
  const secret = cfg.apiSecret ?? "";
  return {
    id: cfg.id,
    baseUrl: cfg.baseUrl,
    apiKey: cfg.apiKey,
    apiSecretMasked: secret ? `••••${secret.slice(-4)}` : "",
    enabled: cfg.enabled,
    lastSyncAt: cfg.lastSyncAt,
    createdAt: cfg.createdAt,
    updatedAt: cfg.updatedAt,
  };
}

type LiveConfig = ErpnextConfig & { enabled: number };

/** Return the saved config when ERPNext integration is enabled, else null. */
async function liveConfig(): Promise<LiveConfig | null> {
  const cfg = await q.getErpnextConfig();
  if (!cfg || !cfg.enabled || !cfg.baseUrl || !cfg.apiKey) return null;
  return cfg;
}

async function erpFetch(
  cfg: LiveConfig,
  path: string,
  init?: RequestInit,
  timeoutMs = 8000,
) {
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `token ${cfg.apiKey}:${cfg.apiSecret}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Demo-mode mock data (used when no enabled ERPNext config exists)
// ---------------------------------------------------------------------------

const DEMO_WAREHOUSES = [
  { name: "Main DC - Demo", warehouse_name: "Main DC", is_group: 0 },
  { name: "Stores - Demo", warehouse_name: "Stores", is_group: 0 },
  { name: "Finished Goods - Demo", warehouse_name: "Finished Goods", is_group: 0 },
  { name: "Work In Progress - Demo", warehouse_name: "Work In Progress", is_group: 0 },
];

const DEMO_ITEMS = [
  { item_code: "SKU-1001", item_name: "Wireless Mouse", stock_uom: "Nos" },
  { item_code: "SKU-1002", item_name: "Mechanical Keyboard", stock_uom: "Nos" },
  { item_code: "SKU-1003", item_name: "27in Monitor", stock_uom: "Nos" },
  { item_code: "SKU-1004", item_name: "USB-C Hub", stock_uom: "Nos" },
  { item_code: "SKU-1005", item_name: "Laptop Stand", stock_uom: "Nos" },
  { item_code: "SKU-1006", item_name: "Webcam HD", stock_uom: "Nos" },
];

const DEMO_STOCK = [
  { item_code: "SKU-1001", warehouse: "Main DC - Demo", actual_qty: 240 },
  { item_code: "SKU-1002", warehouse: "Main DC - Demo", actual_qty: 128 },
  { item_code: "SKU-1003", warehouse: "Stores - Demo", actual_qty: 56 },
  { item_code: "SKU-1004", warehouse: "Main DC - Demo", actual_qty: 300 },
  { item_code: "SKU-1005", warehouse: "Finished Goods - Demo", actual_qty: 88 },
  { item_code: "SKU-1006", warehouse: "Stores - Demo", actual_qty: 0 },
];

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const erpnextRouter = createRouter({
  getConfig: publicQuery.query(async () => {
    const cfg = await q.getErpnextConfig();
    return maskConfig(cfg);
  }),

  saveConfig: adminQuery
    .input(
      z.object({
        baseUrl: z.string().url().or(z.literal("")),
        apiKey: z.string(),
        // Empty string = keep existing secret.
        apiSecret: z.string().optional(),
        enabled: z.number().int().min(0).max(1),
      }),
    )
    .mutation(async ({ input }) => {
      const data: Parameters<typeof q.saveErpnextConfig>[0] = {
        baseUrl: input.baseUrl,
        apiKey: input.apiKey,
        enabled: input.enabled,
      };
      if (input.apiSecret) data.apiSecret = input.apiSecret;
      const saved = await q.saveErpnextConfig(data);
      return maskConfig(saved);
    }),

  testConnection: publicQuery.query(async () => {
    const cfg = await liveConfig();
    if (!cfg) {
      return {
        demo: true as const,
        ok: true,
        message:
          "Demo mode: no enabled ERPNext config. Simulated connection as Administrator.",
        user: "Administrator",
      };
    }
    try {
      const res = await erpFetch(cfg, "/api/method/frappe.auth.get_logged_user");
      if (!res.ok) {
        return {
          demo: false as const,
          ok: false,
          message: `ERPNext responded with HTTP ${res.status}`,
        };
      }
      const body = (await res.json()) as { message?: string };
      return {
        demo: false as const,
        ok: true,
        message: "Connected",
        user: body.message ?? null,
      };
    } catch (err) {
      return {
        demo: false as const,
        ok: false,
        message: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }),

  fetchWarehouses: publicQuery.query(async () => {
    const cfg = await liveConfig();
    if (!cfg) return { demo: true as const, data: DEMO_WAREHOUSES };
    const res = await erpFetch(
      cfg,
      `/api/resource/Warehouse?fields=${encodeURIComponent('["name","warehouse_name","is_group"]')}&limit_page_length=500`,
    );
    if (!res.ok) throw new Error(`ERPNext HTTP ${res.status}`);
    const body = (await res.json()) as { data: unknown[] };
    return { demo: false as const, data: body.data };
  }),

  fetchItems: publicQuery.query(async () => {
    const cfg = await liveConfig();
    if (!cfg) return { demo: true as const, data: DEMO_ITEMS };
    const res = await erpFetch(
      cfg,
      `/api/resource/Item?fields=${encodeURIComponent('["item_code","item_name","stock_uom"]')}&limit_page_length=500`,
    );
    if (!res.ok) throw new Error(`ERPNext HTTP ${res.status}`);
    const body = (await res.json()) as { data: unknown[] };
    return { demo: false as const, data: body.data };
  }),

  fetchItemPrices: publicQuery.query(async () => {
    const cfg = await liveConfig();
    if (!cfg) return { demo: true as const, data: DEMO_ITEM_PRICES };
    const res = await erpFetch(
      cfg,
      `/api/resource/Item Price?fields=${encodeURIComponent('["item_code","price_list_rate","currency"]')}&limit_page_length=2000`,
    );
    if (!res.ok) throw new Error(`ERPNext HTTP ${res.status}`);
    const body = (await res.json()) as { data: unknown[] };
    return { demo: false as const, data: body.data };
  }),

  fetchStockLevels: publicQuery.query(async () => {
    const cfg = await liveConfig();
    if (!cfg) return { demo: true as const, data: DEMO_STOCK };
    const res = await erpFetch(
      cfg,
      `/api/resource/Bin?fields=${encodeURIComponent('["item_code","warehouse","actual_qty"]')}&limit_page_length=1000`,
    );
    if (!res.ok) throw new Error(`ERPNext HTTP ${res.status}`);
    const body = (await res.json()) as { data: unknown[] };
    return { demo: false as const, data: body.data };
  }),

  pushStockEntry: adminQuery
    .input(z.object({ movementId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const mv = await db.query.movements.findFirst({
        where: eq(movements.id, input.movementId),
      });
      if (!mv) throw new Error(`Movement ${input.movementId} not found`);
      const mvItem = await db.query.items.findFirst({
        where: eq(items.id, mv.itemId),
      });
      if (!mvItem) throw new Error(`Item ${mv.itemId} not found`);

      const cfg = await liveConfig();
      if (!cfg) {
        const name = `MAT-STE-DEMO-${String(mv.id).padStart(5, "0")}`;
        await q.setMovementStockEntry(mv.id, name);
        return { demo: true as const, stockEntry: name };
      }

      const stockEntryType =
        mv.type === "receipt"
          ? "Material Receipt"
          : mv.type === "pick" || mv.type === "dispatch"
            ? "Material Issue"
            : "Material Transfer";

      // Resolve ERPNext warehouse names from bins (via their racks).
      async function erpWarehouseForBin(binId: number | null) {
        if (binId == null) return undefined;
        const bin = await db.query.bins.findFirst({
          where: eq(bins.id, binId),
        });
        if (!bin) return undefined;
        const rack = await db.query.racks.findFirst({
          where: eq(racks.id, bin.rackId),
        });
        if (!rack) return undefined;
        const warehouse = await db.query.warehouses.findFirst({
          where: eq(warehouses.id, rack.warehouseId),
        });
        return warehouse?.erpnextWarehouse ?? warehouse?.name;
      }

      const sourceWarehouse = await erpWarehouseForBin(mv.fromBinId);
      const targetWarehouse = await erpWarehouseForBin(mv.toBinId);

      const doc = {
        stock_entry_type: stockEntryType,
        ...(sourceWarehouse ? { from_warehouse: sourceWarehouse } : {}),
        ...(targetWarehouse ? { to_warehouse: targetWarehouse } : {}),
        items: [
          {
            item_code: mvItem.erpnextItemCode ?? mvItem.sku,
            qty: mv.qty,
            ...(sourceWarehouse ? { s_warehouse: sourceWarehouse } : {}),
            ...(targetWarehouse ? { t_warehouse: targetWarehouse } : {}),
          },
        ],
        remarks: `Stackline movement #${mv.id}${mv.reference ? ` (${mv.reference})` : ""}`,
      };

      const res = await erpFetch(cfg, "/api/resource/Stock Entry", {
        method: "POST",
        body: JSON.stringify(doc),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`ERPNext HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      const body = (await res.json()) as { data?: { name?: string } };
      const name = body.data?.name ?? "";
      if (name) await q.setMovementStockEntry(mv.id, name);
      return { demo: false as const, stockEntry: name };
    }),

  syncDown: adminQuery
    .input(z.object({ warehouseId: z.number().int() }))
    .mutation(async ({ input }) => {
      const cfg = await liveConfig();
      if (!cfg) {
        await q.saveErpnextConfig({ lastSyncAt: new Date() });
        return {
          demo: true as const,
          itemsUpserted: 0,
          placementsUpserted: 0,
          message:
            "Demo mode: sync simulated, no remote ERPNext instance configured.",
        };
      }

      const db = getDb();
      const warehouse = await q.getWarehouse(input.warehouseId);
      if (!warehouse) throw new Error(`Warehouse ${input.warehouseId} not found`);
      const erpWarehouse = warehouse.erpnextWarehouse ?? warehouse.name;

      // 1. Pull items.
      const itemsRes = await erpFetch(
        cfg,
        `/api/resource/Item?fields=${encodeURIComponent('["item_code","item_name"]')}&limit_page_length=1000`,
      );
      if (!itemsRes.ok) throw new Error(`ERPNext HTTP ${itemsRes.status}`);
      const itemBody = (await itemsRes.json()) as {
        data: Array<{ item_code: string; item_name: string }>;
      };

      let itemsUpserted = 0;
      for (const ei of itemBody.data) {
        const existing = await db.query.items.findFirst({
          where: eq(items.erpnextItemCode, ei.item_code),
        });
        if (existing) {
          await db
            .update(items)
            .set({ name: ei.item_name })
            .where(eq(items.id, existing.id));
        } else {
          // Unknown carton dims — use a sensible default carton.
          await db.insert(items).values({
            sku: ei.item_code,
            name: ei.item_name,
            cartonLengthM: 0.4,
            cartonWidthM: 0.3,
            cartonHeightM: 0.3,
            cartonWeightKg: 10,
            erpnextItemCode: ei.item_code,
          });
        }
        itemsUpserted++;
      }

      // 2. Pull stock levels (ERPNext Bin doctype) for this warehouse.
      const stockRes = await erpFetch(
        cfg,
        `/api/resource/Bin?fields=${encodeURIComponent('["item_code","warehouse","actual_qty"]')}&filters=${encodeURIComponent(JSON.stringify([["warehouse", "=", erpWarehouse]]))}&limit_page_length=2000`,
      );
      if (!stockRes.ok) throw new Error(`ERPNext HTTP ${stockRes.status}`);
      const stockBody = (await stockRes.json()) as {
        data: Array<{ item_code: string; warehouse: string; actual_qty: number }>;
      };

      // Local bins of this warehouse keyed by bin code.
      const rackRows = await db
        .select()
        .from(racks)
        .where(eq(racks.warehouseId, input.warehouseId));
      const binRows =
        rackRows.length === 0
          ? []
          : await db
              .select()
              .from(bins)
              .where(
                inArray(
                  bins.rackId,
                  rackRows.map((r) => r.id),
                ),
              );
      const binByCode = new Map(binRows.map((b) => [b.code, b]));
      const localItems = await db.select().from(items);
      const itemByErpCode = new Map(
        localItems
          .filter((i) => i.erpnextItemCode)
          .map((i) => [i.erpnextItemCode as string, i]),
      );

      let placementsUpserted = 0;
      for (const row of stockBody.data) {
        const item = itemByErpCode.get(row.item_code);
        if (!item || row.actual_qty <= 0) continue;
        // Match a local bin whose code equals the ERPNext warehouse/bin code.
        const bin = binByCode.get(row.warehouse) ?? binRows[0];
        if (!bin) continue;
        const placement = await db.query.placements.findFirst({
          where: and(eq(placements.binId, bin.id), eq(placements.itemId, item.id)),
        });
        if (placement) {
          await db
            .update(placements)
            .set({ qty: Math.round(row.actual_qty) })
            .where(eq(placements.id, placement.id));
        } else {
          await db.insert(placements).values({
            binId: bin.id,
            itemId: item.id,
            qty: Math.round(row.actual_qty),
          });
        }
        placementsUpserted++;
      }

      await q.saveErpnextConfig({ lastSyncAt: new Date() });
      return {
        demo: false as const,
        itemsUpserted,
        placementsUpserted,
        message: "Sync complete",
      };
    }),
});
