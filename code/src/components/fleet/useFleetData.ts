import { useMemo } from "react";
import { trpc } from "@/providers/trpc";
import {
  DEMO_ROUTES,
  DEMO_VEHICLES,
  type FleetRoute,
  type FleetVehicle,
} from "@/components/fleet/data";
import type { RouteStop } from "@contracts/types";

/**
 * Live fleet data with graceful demo fallback (design-delta §6):
 * polls `fleet.liveVehicles` every ~3s; if the DB is unreachable or empty the
 * baked 8-vehicle / 4-route dataset drives the page.
 */
export function useLiveVehicles(): { vehicles: FleetVehicle[]; live: boolean } {
  const q = trpc.fleet.liveVehicles.useQuery(undefined, {
    retry: 1,
    refetchInterval: 3000,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const d = q.data;
    if (q.isError || !d || d.length === 0) {
      return { vehicles: DEMO_VEHICLES, live: false };
    }
    // merge live positions/status onto the richer demo metadata by regNo
    const byReg = new Map(DEMO_VEHICLES.map((v) => [v.regNo, v]));
    const merged: FleetVehicle[] = d.map((sv, i) => {
      const demo = byReg.get(sv.regNo) ?? DEMO_VEHICLES[i % DEMO_VEHICLES.length];
      return {
        ...demo,
        id: sv.id,
        regNo: sv.regNo,
        lat: sv.lat,
        lng: sv.lng,
        headingDeg: sv.headingDeg ?? demo.headingDeg,
        speedKmh: sv.speedKmh,
        state:
          sv.status === "enroute"
            ? "moving"
            : sv.status === "loading"
              ? "loading"
              : "idle",
      };
    });
    return { vehicles: merged, live: true };
  }, [q.data, q.isError]);
}

export function useRouteBoard(): { routes: FleetRoute[]; live: boolean } {
  const q = trpc.fleet.routeBoard.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const d = q.data;
    if (q.isError || !d) return { routes: DEMO_ROUTES, live: false };
    const all = [...d.outward, ...d.inward, ...d.backhaul];
    if (all.length === 0) return { routes: DEMO_ROUTES, live: false };
    const byNo = new Map(DEMO_ROUTES.map((r) => [r.routeNo, r]));
    const routes: FleetRoute[] = all.map((r, i) => {
      const demo = byNo.get(r.routeNo) ?? DEMO_ROUTES[i % DEMO_ROUTES.length];
      return {
        ...demo,
        id: r.id,
        routeNo: r.routeNo,
        direction: (r.direction as FleetRoute["direction"]) ?? "outward",
        status: (r.status as FleetRoute["status"]) ?? "planned",
        stops: (r.stops as RouteStop[])?.length ? (r.stops as RouteStop[]) : demo.stops,
        totalKm: r.totalKm || demo.totalKm,
        etaMinutes: r.etaMinutes || demo.etaMinutes,
      };
    });
    return { routes, live: true };
  }, [q.data, q.isError]);
}
