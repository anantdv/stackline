/**
 * Dashboard data layer (dashboard.md §9): every tRPC procedure the page
 * consumes, with `retry: 1`, staggered refetch intervals, visibility-aware
 * pausing, and full demo fallbacks so the page renders with an empty or
 * unreachable DB (stale-while-revalidate: last good data is kept, never
 * blanked after first paint).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import { docStatusFromValidity } from "@contracts/types";
import { hash01 } from "@/components/network/demo";
import type { TMNode } from "@/components/valuation/demo";
import {
  ALL_WAREHOUSES,
  CHAIN,
  DEMO_ACTIVE_TRANSFERS,
  DEMO_DOCKS,
  DEMO_EXCEPTIONS,
  DEMO_LOCATIONS,
  DEMO_PLANS,
  DEMO_TREE,
  DEMO_VEHICLES,
  KPI_DEMO,
  SCAN_CANON,
  type ChainNode,
  type DashLocation,
  type DashPlan,
  type DashTransfer,
  type DashVehicle,
  type DashWindow,
  type DockChip,
  type ExceptionRow,
  type FeedEvent,
  type Health,
  seedFeed,
} from "./demo";

/** True while the tab is visible — gates all refetch intervals (§9 rules). */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState !== "hidden"
  );
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return visible;
}

/* ------------------------------------------------------------------ */
/* Live → dash adapters                                              */
/* ------------------------------------------------------------------ */

type LocationRow = {
  id: number;
  code: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  warehouses: Array<{ id: number; code: string; name: string; bins: number }>;
};

function adaptLocations(rows: LocationRow[] | undefined): DashLocation[] | null {
  if (!rows || rows.length === 0) return null;
  return rows.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    lat: l.lat,
    lng: l.lng,
    health: "ok" as Health, // rolled up below from exceptions
    warehouses: l.warehouses.map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      locCode: l.code,
      util: Math.round(55 + hash01(w.code) * 40),
      bins: w.bins,
      usedBins: Math.round(w.bins * (0.55 + hash01(w.code) * 0.4)),
      zones: Array.from({ length: 6 }, (_, i) =>
        Math.max(24, Math.min(99, Math.round(55 + hash01(`${w.code}:${i}`) * 40)))
      ),
    })),
  }));
}

/* ------------------------------------------------------------------ */
/* Main hook                                                         */
/* ------------------------------------------------------------------ */

export function useDashboardData(timeWindow: DashWindow) {
  const visible = usePageVisible();
  const utils = trpc.useUtils();

  // Staggered intervals (§9): 30/60s cadences offset to avoid a herd.
  const iv = (ms: number) => (visible ? ms : false);
  const OPTS = { retry: 1, refetchOnWindowFocus: true } as const;

  const totalsQ = trpc.valuation.networkTotals.useQuery(undefined, {
    ...OPTS, refetchInterval: iv(30_000),
  });
  const priceQ = trpc.valuation.priceSource.useQuery(undefined, {
    ...OPTS, refetchInterval: iv(60_000),
  });
  const byWarehouseQ = trpc.valuation.byWarehouse.useQuery(
    { breakdown: "byGroup" },
    { ...OPTS, refetchInterval: iv(61_500) }
  );
  const agingQ = trpc.valuation.aging.useQuery({}, {
    ...OPTS, refetchInterval: iv(63_000),
  });
  const locationsQ = trpc.network.listLocations.useQuery(undefined, {
    ...OPTS, refetchInterval: iv(30_000),
  });
  const transfersQ = trpc.network.transfers.useQuery({}, {
    ...OPTS, refetchInterval: iv(15_000),
  });
  const movementsQ = trpc.wms.movements.list.useQuery({}, {
    ...OPTS, refetchInterval: iv(15_000),
  });
  const utilQ = trpc.wms.stock.warehouseUtilization.useQuery(
    { warehouseId: 1 },
    { ...OPTS, refetchInterval: iv(31_500) }
  );
  const vehiclesQ = trpc.fleet.liveVehicles.useQuery(undefined, {
    ...OPTS, refetchInterval: iv(3_000),
  });
  const routesQ = trpc.fleet.routeBoard.useQuery(undefined, {
    ...OPTS, refetchInterval: iv(60_000),
  });
  const gateQ = trpc.gate.board.useQuery({ warehouseId: 1 }, {
    ...OPTS, refetchInterval: iv(15_000),
  });
  const docsQ = trpc.compliance.listDocs.useQuery({}, {
    ...OPTS, refetchInterval: iv(15_000),
  });
  const invoicesQ = trpc.compliance.listInvoices.useQuery(undefined, {
    ...OPTS, refetchInterval: iv(60_000),
  });
  const scansQ = trpc.scanning.listRecords.useQuery({}, {
    ...OPTS, refetchInterval: iv(15_000),
  });
  const plansQ = trpc.transport.listPlans.useQuery({}, {
    ...OPTS, refetchInterval: iv(60_000),
  });

  /* Manual refresh: invalidate everything, spinner ≥0.6s, synced flash. */
  const [refreshing, setRefreshing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    const started = Date.now();
    await Promise.allSettled([
      utils.valuation.networkTotals.invalidate(),
      utils.valuation.priceSource.invalidate(),
      utils.valuation.byWarehouse.invalidate(),
      utils.valuation.aging.invalidate(),
      utils.network.listLocations.invalidate(),
      utils.network.transfers.invalidate(),
      utils.wms.movements.list.invalidate(),
      utils.wms.stock.warehouseUtilization.invalidate(),
      utils.fleet.liveVehicles.invalidate(),
      utils.fleet.routeBoard.invalidate(),
      utils.gate.board.invalidate(),
      utils.compliance.listDocs.invalidate(),
      utils.compliance.listInvoices.invalidate(),
      utils.scanning.listRecords.invalidate(),
      utils.transport.listPlans.invalidate(),
    ]);
    const wait = Math.max(0, 600 - (Date.now() - started));
    globalThis.setTimeout(() => {
      setRefreshing(false);
      setSyncedAt(new Date());
    }, wait);
  }, [refreshing, utils]);

  /* Price-source → ErpPriceBadge state (page-level). */
  const [liveOverride, setLiveOverride] = useState<boolean | null>(null);
  const apiLive = !!priceQ.data && priceQ.data.source !== "demo";
  const live = liveOverride ?? apiLive;

  /* ---------------------------- derivations ---------------------------- */

  const locations = useMemo<DashLocation[]>(() => {
    const adapted = adaptLocations(locationsQ.data as LocationRow[] | undefined);
    const base = adapted ?? DEMO_LOCATIONS;
    // MAIN DC live utilization when warehouse 1 is reachable
    if (utilQ.data && base.some((l) => l.warehouses.some((w) => w.id === 1))) {
      return base.map((l) => ({
        ...l,
        warehouses: l.warehouses.map((w) =>
          w.id === 1
            ? { ...w, util: Math.round(utilQ.data.utilizationPercent), usedBins: utilQ.data.usedBins, bins: utilQ.data.bins }
            : w
        ),
      }));
    }
    return base;
  }, [locationsQ.data, utilQ.data]);

  const docs = docsQ.data ?? [];
  const now = Date.now();
  const liveDocs = docs.filter((d) => d.docType === "EWB");
  const ewbStates = liveDocs.map((d) => ({
    no: d.docNo,
    status: docStatusFromValidity(d.validUntil, new Date(now), 4),
    validUntil: d.validUntil,
  }));
  const ewbExceptions = ewbStates.filter((e) => e.status === "expired" || e.status === "expiring");

  const vehicles = useMemo<DashVehicle[]>(() => {
    const d = vehiclesQ.data;
    if (!d || d.length === 0) return DEMO_VEHICLES;
    const byReg = new Map(DEMO_VEHICLES.map((v) => [v.regNo, v]));
    return d.map((sv, i) => {
      const demo = byReg.get(sv.regNo) ?? DEMO_VEHICLES[i % DEMO_VEHICLES.length];
      return {
        ...demo,
        id: sv.id,
        regNo: sv.regNo,
        status: sv.status === "enroute" ? "ENROUTE" : sv.status === "loading" ? "AT GATE" : demo.status,
        speedKmh: sv.speedKmh,
        progress: demo.progress,
      };
    });
  }, [vehiclesQ.data]);

  const plans = useMemo<DashPlan[]>(() => {
    const d = plansQ.data;
    if (!d || d.length === 0) return DEMO_PLANS;
    return d.slice(0, 3).map((p, i) => ({
      planNo: p.planNo,
      vehicle: p.vehicle?.regNo ?? DEMO_PLANS[i % DEMO_PLANS.length]?.vehicle ?? "—",
      utilPct: Math.round(p.utilizationPct * 10) / 10,
      volValue: DEMO_PLANS[i % DEMO_PLANS.length]?.volValue ?? "—",
    }));
  }, [plansQ.data]);

  const docks = useMemo<DockChip[]>(() => {
    const d = gateQ.data;
    if (!d || (d.inLane.length === 0 && d.yard.length === 0 && d.outLane.length === 0)) {
      return DEMO_DOCKS;
    }
    const chips: DockChip[] = [];
    const firstIn = d.inLane[0];
    const firstYard = d.yard[0];
    const firstOut = d.outLane[0];
    chips.push({
      dock: "DOCK 1",
      state: firstYard ? "LOADING" : "IDLE",
      detail: firstYard ? `${firstYard.vehicle?.regNo ?? "TRK"} · GP` : "NEXT SLOT 15:00",
      tone: firstYard ? "accent" : "ok",
    });
    chips.push({ dock: "DOCK 2", state: d.yard.length > 1 ? "LOADING" : "IDLE", detail: d.yard.length > 1 ? "IN YARD" : "NEXT SLOT 15:00", tone: d.yard.length > 1 ? "accent" : "ok" });
    chips.push({
      dock: "DOCK 3",
      state: firstIn ? "GATE IN" : "IDLE",
      detail: firstIn ? firstIn.vehicle?.regNo ?? "VEHICLE" : "—",
      tone: "ok",
    });
    chips.push({
      dock: "DOCK 4",
      state: firstOut ? "GATE IN" : "SCHEDULED",
      detail: firstOut ? firstOut.vehicle?.regNo ?? "OUT" : "14:30 · NOVA ASN-2211",
      tone: "ok",
    });
    return chips;
  }, [gateQ.data]);

  const scans = scansQ.data ?? [];
  const scanCounts = scans.length
    ? {
        clear: scans.filter((s) => s.xrayFlag === "clear").length,
        review: scans.filter((s) => s.xrayFlag === "review").length,
        blocked: scans.filter((s) => s.xrayFlag === "blocked").length,
      }
    : SCAN_CANON;

  /* Exception Center rows — derived where a source is live, canon elsewhere. */
  const exceptions = useMemo<ExceptionRow[]>(() => {
    const rows: ExceptionRow[] = [];
    if (ewbExceptions.length > 0) {
      ewbExceptions.slice(0, 3).forEach((e, i) => {
        const expired = e.status === "expired";
        rows.push({
          id: `ewb-${i}`,
          sev: expired ? "CRIT" : "WARN",
          type: expired ? "EWB EXPIRED" : "EWB EXPIRING",
          description: expired
            ? `EWB ${e.no} expired — shipment still enroute`
            : `EWB ${e.no} — under 4h validity left`,
          location: "NETWORK",
          ageMinutes: expired && e.validUntil ? Math.max(1, Math.round((now - e.validUntil.getTime()) / 60000)) : 45,
          owner: "DISPATCH",
          href: `/dispatch?doc=${e.no.split(" ")[0]}`,
        });
      });
    } else {
      rows.push(DEMO_EXCEPTIONS[0], DEMO_EXCEPTIONS[2]);
    }
    // capacity row: any warehouse ≥90%
    const crit = locations.flatMap((l) => l.warehouses).filter((w) => w.util >= 90);
    if (crit.length > 0) {
      rows.push({
        id: "cap-1", sev: "CRIT", type: "CAPACITY",
        description: `${crit[0].code} at ${crit[0].util}% — putaway blocking likely within 24h`,
        location: crit[0].code, ageMinutes: 132, owner: "NETWORK",
        href: `/network?loc=${crit[0].locCode}`,
      });
    }
    // scanning rows
    if (scanCounts.blocked > 0) rows.push(DEMO_EXCEPTIONS[3]);
    if (scanCounts.review > 0) rows.push(DEMO_EXCEPTIONS[4]);
    // dead stock
    const deadBucket = agingQ.data?.buckets.find((b) => b.bucket === "gt90d");
    if (deadBucket && deadBucket.valueInr > 0) {
      rows.push({
        id: "dead-1", sev: "WARN", type: "DEAD STOCK",
        description: `₹${(deadBucket.valueInr / 100_000).toFixed(1)}L aging >90d — top: SKU-0417 lot L-2211 · MAIN DC`,
        location: "MAIN DC", ageMinutes: 2880, owner: "VALUATION", href: "/valuation?wh=MAIN-DC",
      });
    } else {
      rows.push(DEMO_EXCEPTIONS[5]);
    }
    // SLA + overdue vehicle rows (canon)
    rows.push(DEMO_EXCEPTIONS[6], DEMO_EXCEPTIONS[7]);
    // dedupe by type, sort crit → age desc
    const seen = new Set<string>();
    return rows
      .filter((r) => (seen.has(r.type) ? false : (seen.add(r.type), true)))
      .sort((a, b) =>
        a.sev === b.sev ? b.ageMinutes - a.ageMinutes : a.sev === "CRIT" ? -1 : 1
      )
      .slice(0, 8);
  }, [ewbExceptions, locations, scanCounts, agingQ.data, now]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Per-location health roll-up (drives map health dots, §3a). */
  const locationsWithHealth = useMemo<DashLocation[]>(() => {
    const whToLoc = new Map<string, string>();
    for (const l of locations) for (const w of l.warehouses) whToLoc.set(w.code, l.code);
    const healthByLoc = new Map<string, Health>();
    for (const ex of exceptions) {
      const loc = whToLoc.get(ex.location) ?? (DEMO_LOCATIONS.some((l) => l.code === ex.location) ? ex.location : null);
      if (!loc) continue;
      const h: Health = ex.sev === "CRIT" ? "crit" : "warn";
      const cur = healthByLoc.get(loc) ?? "ok";
      if (h === "crit" || (h === "warn" && cur === "ok")) healthByLoc.set(loc, h);
    }
    return locations.map((l) => ({ ...l, health: healthByLoc.get(l.code) ?? "ok" }));
  }, [locations, exceptions]);

  /* KPI rollup */
  const kpis = useMemo(() => {
    const openMvs = (movementsQ.data ?? []).filter(
      (m) => m.status === "pending" || m.status === "in_progress"
    );
    const allWh = locations.flatMap((l) => l.warehouses);
    const binsTotal = allWh.reduce((s, w) => s + w.bins, 0);
    const util = binsTotal
      ? Math.round((allWh.reduce((s, w) => s + w.util * w.bins, 0) / binsTotal) * 10) / 10
      : KPI_DEMO.capacityUtil;
    const enroute = vehicles.filter((v) => v.status === "ENROUTE").length;
    return {
      stockValueInr: totalsQ.data?.totalValueInr || KPI_DEMO.stockValueInr,
      unitsOnHand: totalsQ.data?.totalQty || KPI_DEMO.unitsOnHand,
      capacityUtil: util,
      openMovements: openMvs.length || KPI_DEMO.openMovements,
      movementSplit: openMvs.length
        ? {
            putaway: openMvs.filter((m) => m.type === "putaway").length,
            pick: openMvs.filter((m) => m.type === "pick" || m.type === "dispatch").length,
            transfer: openMvs.filter((m) => m.type === "transfer").length,
          }
        : KPI_DEMO.movementSplit,
      vehiclesEnroute: enroute || KPI_DEMO.vehiclesEnroute,
      vehiclesTotal: vehicles.length || KPI_DEMO.vehiclesTotal,
      exceptions: ewbExceptions.length > 0 ? Math.max(ewbExceptions.length, 1) + 3 : KPI_DEMO.exceptions,
    };
  }, [totalsQ.data, movementsQ.data, locations, vehicles, ewbExceptions.length]);

  /* Transfers for map arcs: live in-transit cross-warehouse, else canon. */
  const transfers = useMemo<DashTransfer[]>(() => {
    const d = transfersQ.data;
    const liveRows = (d ?? []).filter(
      (t) => t.crossWarehouse && t.status !== "completed" && t.status !== "cancelled" && t.from.warehouse && t.to.warehouse
    );
    if (liveRows.length === 0) return DEMO_ACTIVE_TRANSFERS;
    const locOf = (whId: number) =>
      locations.flatMap((l) => l.warehouses).find((w) => w.id === whId)?.locCode ?? "NETWORK";
    return liveRows.slice(0, 2).map((t, i) => ({
      id: t.reference ?? `STO-2025-${String(117 + i).padStart(4, "0")}`,
      fromLoc: locOf(t.from.warehouse!.id),
      toLoc: locOf(t.to.warehouse!.id),
      qty: t.qty,
      valueLabel: "₹—",
      eta: "—",
      truck: DEMO_ACTIVE_TRANSFERS[i]?.truck ?? "TRK",
    }));
  }, [transfersQ.data, locations]);

  /* Mini treemap root: live byWarehouse × group, else canon tree. */
  const tree = useMemo<TMNode>(() => {
    const d = byWarehouseQ.data;
    if (!d || d.groups.length === 0) return DEMO_TREE;
    return {
      name: "NETWORK",
      children: d.groups.map((g) => ({
        name: g.code,
        value: g.totalValueInr,
        ageDays: Math.round(hash01(g.code) * 90),
        children: g.rows.slice(0, 6).map((r) => ({
          name: r.key,
          value: r.valueInr,
          qty: r.qty,
          ageDays: Math.round(hash01(r.key) * 120),
          meta: `${r.label} · ${r.qty.toLocaleString("en-IN")} UNITS`,
        })),
      })),
    };
  }, [byWarehouseQ.data]);

  const deadStockInr =
    agingQ.data?.buckets.find((b) => b.bucket === "gt90d")?.valueInr ?? 12_60_000;
  const totalValueInr = totalsQ.data?.totalValueInr || KPI_DEMO.stockValueInr;

  /* Chain health: worst status per module from current exceptions. */
  const chain = useMemo<ChainNode[]>(() => {
    const worst = (owners: string[]): Health => {
      const hits = exceptions.filter((e) => owners.includes(e.owner));
      if (hits.some((e) => e.sev === "CRIT")) return "crit";
      if (hits.length > 0) return "warn";
      return "ok";
    };
    return CHAIN.map((c) => {
      switch (c.key) {
        case "scan": return { ...c, status: worst(["SCANNING BAY"]) };
        case "dispatch": return { ...c, status: worst(["DISPATCH"]) };
        case "fleet": return { ...c, status: worst(["FLEET"]) };
        default: return c;
      }
    });
  }, [exceptions]);

  /* Feed: live-derived events (when sources respond), seed buffer, and
     whether the demo emitter should run (§3b / §9 fallback generator). */
  const feedLive = useMemo<FeedEvent[] | null>(() => {
    const events: FeedEvent[] = [];
    for (const m of (movementsQ.data ?? []).slice(0, 20)) {
      const type = m.type === "transfer" ? "TRANSFER" : "PUTAWAY";
      events.push({
        id: `mv-${m.id}`,
        at: new Date(m.createdAt).getTime(),
        type,
        message: `${m.type.toUpperCase()} #${m.id} ${m.status.toUpperCase()}${m.reference ? ` ▸ ${m.reference}` : ""}`,
        location: "NETWORK",
        doc: m.reference ?? undefined,
        href: "/network",
        tone: "ok",
      });
    }
    for (const e of ewbStates.slice(0, 8)) {
      events.push({
        id: `ewb-${e.no}`,
        at: now - 60_000,
        type: "EWB",
        message:
          e.status === "expired"
            ? `EWB ${e.no} ✕ EXPIRED`
            : e.status === "expiring"
              ? `EWB ${e.no} ▸ UNDER 4H LEFT`
              : `EWB ${e.no} ✓ VALID`,
        location: "DISPATCH",
        doc: e.no,
        href: "/dispatch",
        tone: e.status === "expired" ? "crit" : e.status === "expiring" ? "warn" : "ok",
      });
    }
    for (const s of scans.slice(0, 8)) {
      events.push({
        id: `scan-${s.id}`,
        at: new Date(s.createdAt).getTime(),
        type: "SCAN",
        message:
          s.xrayFlag === "clear"
            ? `PARCEL ${s.parcelId} CLEAR ▸ DIMS OK`
            : `X-RAY FLAG ▸ ${s.parcelId} ${s.xrayFlag.toUpperCase()}`,
        location: `WH-${s.warehouseId}`,
        doc: s.parcelId,
        href: "/scanning-bay",
        tone: s.xrayFlag === "blocked" ? "crit" : s.xrayFlag === "review" ? "warn" : "ok",
      });
    }
    if (events.length === 0) return null;
    return events.sort((a, b) => b.at - a.at).slice(0, 40);
  }, [movementsQ.data, ewbStates, scans, now]);

  const feedSeed = useMemo<FeedEvent[]>(() => seedFeed(Date.now()), []);
  const feedDemo =
    feedLive == null ||
    movementsQ.isError || gateQ.isError || docsQ.isError;

  /* fleet route board is used for fleet board route names when live */
  void routesQ;
  void invoicesQ;

  return {
    visible,
    live, setLiveOverride,
    refreshing, syncedAt, refresh,
    kpis,
    locations: locationsWithHealth,
    transfers,
    vehicles,
    plans,
    docks,
    scanCounts,
    exceptions,
    tree,
    deadStockInr,
    totalValueInr,
    chain,
    feedSeed,
    feedLive,
    feedDemo,
    movements: movementsQ.data ?? [],
    window: timeWindow,
  };
}

export type DashboardData = ReturnType<typeof useDashboardData>;

/* ALL_WAREHOUSES re-export for panels that only need the flat list */
export { ALL_WAREHOUSES };
