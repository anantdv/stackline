import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter, publicQuery } from "../middleware";
import * as q from "../queries/logistics";
import {
  optimizeRoute as optimizeRouteFn,
  type GeoPoint,
  type RouteStop,
} from "@contracts/logistics";

interface RoutePayload {
  depot: GeoPoint & { label?: string };
  stops: RouteStop[];
  optimizedStops?: RouteStop[];
}

function parseRoutePayload(json: string | null): RoutePayload | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as RoutePayload;
    if (!parsed || !Array.isArray(parsed.stops) || !parsed.depot) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Deterministic pseudo-random jitter from vehicle id + 1.2s tick. */
function jitter(seed: number, tick: number, amplitude: number) {
  const x = Math.sin(seed * 127.1 + tick * 0.9) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amplitude;
}

export const fleetRouter = createRouter({
  /** Vehicles with live-ish GPS positions (mock jitter around seed coords). */
  liveVehicles: publicQuery.query(async () => {
    const vehicleList = await q.listVehicles();
    const tick = Math.floor(Date.now() / 1200);
    return vehicleList.map((v) => {
      const baseLat = v.gpsLat ?? 19.076;
      const baseLng = v.gpsLng ?? 72.877;
      const moving = v.status === "enroute";
      const lat = baseLat + jitter(v.id, tick, moving ? 0.02 : 0.002);
      const lng = baseLng + jitter(v.id * 3, tick, moving ? 0.02 : 0.002);
      const heading = moving
        ? Math.round((Math.atan2(jitter(v.id, tick, 1), jitter(v.id * 7, tick, 1)) * 180) / Math.PI + 180)
        : null;
      return {
        ...v,
        lat,
        lng,
        headingDeg: heading,
        speedKmh: moving ? Math.round(38 + Math.abs(jitter(v.id * 5, tick, 18))) : 0,
        lastPingAt: new Date(),
      };
    });
  }),

  /**
   * Optimize a route's stops (nearest-neighbor + 2-opt) and persist the
   * improved ordering back onto the route row.
   */
  optimizeRoute: adminQuery
    .input(z.object({ routeId: z.number().int() }))
    .mutation(async ({ input }) => {
      const route = await q.getRoute(input.routeId);
      if (!route)
        throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
      const payload = parseRoutePayload(route.optimizedStopsJson);
      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Route has no stop payload to optimize",
        });
      }
      const before = {
        orderedStops: payload.stops,
        totalKm: route.totalKm,
      };
      const after = optimizeRouteFn(payload.stops, payload.depot);
      const savedKm = Math.max(0, before.totalKm - after.totalKm);
      const avgKmh = 38;
      const etaMinutes = Math.round((after.totalKm / avgKmh) * 60);
      const nextPayload: RoutePayload = {
        ...payload,
        optimizedStops: after.orderedStops,
      };
      const updated = await q.updateRoute(route.id, {
        optimizedStopsJson: JSON.stringify(nextPayload),
        totalKm: after.totalKm,
        etaMinutes,
      });
      return {
        route: updated,
        before,
        after: { ...after, etaMinutes },
        savedKm: Math.round(savedKm * 10) / 10,
        savedPct:
          before.totalKm > 0
            ? Math.round((savedKm / before.totalKm) * 1000) / 10
            : 0,
      };
    }),

  assignDriver: adminQuery
    .input(
      z.object({ vehicleId: z.number().int(), driverName: z.string().min(1) }),
    )
    .mutation(({ input }) => q.assignDriver(input.vehicleId, input.driverName)),

  /** Run board grouped by direction: outward / inward / backhaul. */
  routeBoard: publicQuery.query(async () => {
    const routeList = await q.listRoutes({});
    const withStops = routeList.map((r) => {
      const payload = parseRoutePayload(r.optimizedStopsJson);
      const stops = payload?.optimizedStops ?? payload?.stops ?? [];
      return {
        ...r,
        depot: payload?.depot ?? null,
        stops,
        stopCount: stops.length,
      };
    });
    return {
      outward: withStops.filter((r) => r.direction === "outward"),
      inward: withStops.filter((r) => r.direction === "inward"),
      backhaul: withStops.filter((r) => r.direction === "backhaul"),
    };
  }),
});
