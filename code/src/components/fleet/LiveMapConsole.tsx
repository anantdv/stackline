import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";
import { Minus, Plus, X } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import DocBadge from "@/components/gate/DocBadge";
import FleetMap from "@/components/fleet/FleetMap";
import { useLiveVehicles, useRouteBoard } from "@/components/fleet/useFleetData";
import type { FleetVehicle } from "@/components/fleet/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Vehicle drawer (right, 360px, spring per v1 Drawer recipe). */
function VehicleDrawer({ v, onClose }: { v: FleetVehicle; onClose: () => void }) {
  return (
    <motion.aside
      key={v.id}
      data-tour="vehicle-drawer"
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="absolute bottom-0 right-0 top-0 z-20 w-[min(88%,360px)] overflow-y-auto border-l border-linestrong bg-raised/95 p-5 backdrop-blur"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[13px] font-semibold tracking-[0.08em] text-ink0">
            {v.regNo}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
            {v.code} · {v.trip ?? "NO ACTIVE TRIP"}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close vehicle drawer" className="text-ink2 hover:text-ink0">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {(
          [
            ["DRIVER", `${v.driver} · ☎ ${v.phone}`],
            ["SPEED", `${v.speedKmh} KM/H`],
            ["LOAD", `${v.loadPct}% VOL`],
            ["STATE", v.state.toUpperCase()],
          ] as const
        ).map(([k, val]) => (
          <div key={k} className="rounded-lg border border-line bg-page/60 px-3 py-2">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">{k}</div>
            <div className="mt-0.5 font-mono text-[11px] tracking-[0.04em] text-ink0">{val}</div>
          </div>
        ))}
      </div>

      {v.loadPlan && (
        <Link
          to="/transport"
          className="mt-3 block rounded-lg border border-data/40 bg-data-soft px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-data transition-colors hover:border-brand hover:text-brand"
        >
          LOAD PLAN {v.loadPlan} → /TRANSPORT
        </Link>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {v.ewb && (
          <DocBadge
            code="EWB"
            tone={v.ewb.status}
            detail={
              v.ewb.status === "valid"
                ? `VALID ${v.ewb.hoursLeft}H`
                : v.ewb.status === "expiring"
                  ? `${v.ewb.hoursLeft}H LEFT`
                  : "EXPIRED"
            }
            pulse={v.ewb.status === "expired"}
          />
        )}
        {v.trip && <DocBadge code="GATE PASS" tone="valid" detail={v.trip === "TRIP-0417" ? "GP-2844 ✓" : "GP ✓"} />}
      </div>

      {v.nextStop && (
        <div className="mt-4 rounded-lg border border-line bg-page/60 px-3 py-2.5">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">NEXT STOP</div>
          <div className="mt-1 font-mono text-[11px] tracking-[0.06em] text-ink0">
            {v.nextStop}
            {v.etaMin != null && (
              <span className="text-data"> · ETA {Math.floor(v.etaMin / 60) > 0 ? "" : ""}{v.etaMin}M</span>
            )}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">GPS PINGS · LAST 5</div>
        <ul className="mt-1.5 flex flex-col gap-1">
          {v.pings.map((p, i) => (
            <li key={i} className="flex items-center gap-2 font-mono text-[10px] tracking-[0.08em] text-ink1">
              <span className={cn("h-1 w-1 rounded-full", i === v.pings.length - 1 ? "bg-data animate-pulse-dot" : "bg-ink2")} />
              {p} · {v.speedKmh} KM/H
            </li>
          ))}
        </ul>
      </div>
    </motion.aside>
  );
}

export default function LiveMapConsole() {
  const { vehicles, live } = useLiveVehicles();
  const { routes } = useRouteBoard();
  const [selected, setSelected] = useState<FleetVehicle | null>(null);
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState({ routes: true, geofences: true, trails: true });
  const [depotFilter, setDepotFilter] = useState<string | null>(null);

  const mapRoutes = useMemo(
    () => routes.map((r) => ({ stops: r.stops, direction: r.direction })),
    [routes]
  );

  const shown = useMemo(() => {
    if (!depotFilter) return vehicles;
    if (depotFilter === "PNQ-NORTH") return vehicles.filter((v) => v.lat < 19.1);
    return vehicles.filter((v) => v.lat >= 19.1 || v.state !== "idle");
  }, [vehicles, depotFilter]);

  const toggle = (k: keyof typeof layers) => setLayers((s) => ({ ...s, [k]: !s[k] }));

  return (
    <section id="fleet-map" className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>LIVE.MAP</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          Dispatch, on glass.
        </h2>

        <motion.div
          data-tour="live-map"
          initial={{ opacity: 0, y: 40, rotateX: 4 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="group relative mt-12 overflow-hidden rounded-xl border border-line bg-surface transition-colors duration-300 hover:border-linestrong"
        >
          <span aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 h-[14px] w-[14px] border-l border-t border-brand" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 z-10 h-[14px] w-[14px] border-b border-r border-brand" />

          {/* controls bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <div className="flex gap-1.5">
              {(
                [
                  ["routes", "ROUTES"],
                  ["geofences", "GEOFENCES"],
                  ["trails", "TRAILS"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(k)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200",
                    layers[k] ? "border-data/60 bg-data-soft text-data" : "border-line text-ink2 hover:text-ink1"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {["MUM-BHIWANDI", "PNQ-NORTH"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepotFilter(depotFilter === d ? null : d)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200",
                    depotFilter === d ? "border-brand bg-brand-soft text-brand" : "border-line text-ink2 hover:text-ink1"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <button type="button" onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))} aria-label="Zoom out" className="rounded-md border border-line p-1.5 text-ink1 hover:border-linestrong hover:text-ink0">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.min(2.4, z + 0.15))} aria-label="Zoom in" className="rounded-md border border-line p-1.5 text-ink1 hover:border-linestrong hover:text-ink0">
                <Plus className="h-3.5 w-3.5" />
              </button>
              <span className="ml-2 rounded border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
                {live ? "● GPS LIVE 3S" : "● DEMO GPS 1.2S"}
              </span>
            </div>
          </div>

          <div className="flex">
            {/* left rail — run list */}
            <div className="hidden w-[260px] shrink-0 flex-col gap-2 border-r border-line p-3 lg:flex">
              <span className="px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
                ACTIVE RUNS
              </span>
              {routes
                .filter((r) => r.status !== "completed")
                .map((r, i) => {
                  const pct = Math.round((r.stopsDone / Math.max(1, r.stops.length)) * 100);
                  return (
                    <motion.button
                      key={r.routeNo}
                      type="button"
                      onClick={() => {
                        const v = vehicles.find((x) => x.code === r.vehicleCode);
                        if (v) setSelected(v);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
                      className="rounded-lg border border-line bg-page/50 px-3 py-2.5 text-left transition-colors duration-200 hover:border-linestrong"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.06em]">
                        <span className="font-semibold text-ink0">{r.routeNo}</span>
                        <span className={cn("text-[9px] uppercase tracking-[0.1em]",
                          r.direction === "outward" && "text-brand",
                          r.direction === "inward" && "text-data",
                          r.direction === "backhaul" && "text-warn"
                        )}>
                          {r.direction}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink2">
                        {r.vehicleCode} · {r.stops.length} {r.direction === "inward" ? "PICKUPS" : "STOPS"} · ETA {Math.floor(r.etaMinutes / 60)}H{String(r.etaMinutes % 60).padStart(2, "0")}M
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
                        <motion.div
                          className="h-full rounded-full bg-data"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, ease: EASE }}
                        />
                      </div>
                    </motion.button>
                  );
                })}
            </div>

            {/* map */}
            <div className="relative aspect-[16/10] flex-1 sm:aspect-[16/9]">
              <FleetMap
                vehicles={shown}
                routes={mapRoutes}
                demo={!live}
                zoom={zoom}
                showRoutes={layers.routes}
                showGeofences={layers.geofences}
                showTrails={layers.trails}
                onVehicleClick={(v) => setSelected(v)}
              />
              <AnimatePresence>
                {selected && <VehicleDrawer v={selected} onClose={() => setSelected(null)} />}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
          CLICK A CHEVRON → VEHICLE DRAWER · TEAL = OPTIMIZED PATH · DASHED GRAY = ACTUAL TRAIL
        </p>
      </div>
    </section>
  );
}
