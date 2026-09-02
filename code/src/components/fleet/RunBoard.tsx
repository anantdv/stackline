import { useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import DocBadge from "@/components/gate/DocBadge";
import { useRouteBoard } from "@/components/fleet/useFleetData";
import type { FleetRoute } from "@/components/fleet/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Tab = "outward" | "inward" | "backhaul";

const TABS: { id: Tab; label: string }[] = [
  { id: "outward", label: "OUTWARD DISPATCH" },
  { id: "inward", label: "INWARD PICKUPS" },
  { id: "backhaul", label: "BACKHAUL" },
];

function statusChip(r: FleetRoute) {
  const label =
    r.status === "active"
      ? `EN ROUTE ${r.stopsDone}/${r.stops.length}`
      : r.status.toUpperCase();
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
        r.status === "active" && "border-data/50 text-data animate-pulse",
        r.status === "planned" && "border-line text-ink2",
        r.status === "completed" && "border-brand/50 text-brand"
      )}
    >
      {label}
    </span>
  );
}

function OutwardRow({ r, i }: { r: FleetRoute; i: number }) {
  const done = r.status === "completed";
  return (
    <motion.tr
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
      className="border-b border-line/60 last:border-0"
    >
      <td className="py-3 pr-4 font-mono text-[12px] font-semibold tracking-[0.06em] text-ink0">{r.routeNo}</td>
      <td className="py-3 pr-4 font-mono text-[11px] tracking-[0.06em] text-ink1">{r.vehicleCode}</td>
      <td className="py-3 pr-4 font-mono text-[11px] text-ink1 font-tnum">{r.stops.length}</td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1.5">
          {r.docRefs.map((d) => {
            const isEwb = d.startsWith("EWB");
            const expired = d === "EWB 2841 9901 1187";
            return (
              <DocBadge
                key={d}
                code={isEwb ? "EWB" : d.startsWith("INV") ? "INV" : "GP"}
                tone={expired ? "expired" : "valid"}
                detail={d.replace(/^EWB /, "").replace(/^INV\//, "INV/")}
                to={isEwb ? "/dispatch" : undefined}
              />
            );
          })}
        </div>
      </td>
      <td className="py-3 pr-4">{statusChip(r)}</td>
      <td className="py-3">
        {done ? (
          <span className="rounded border border-data/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-data">
            POD ✓ SIG+PHOTO
          </span>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink2">POD PENDING</span>
        )}
      </td>
    </motion.tr>
  );
}

function InwardCard({ r, i }: { r: FleetRoute; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
      className="rounded-xl border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold tracking-[0.06em] text-ink0">
          {r.routeNo} <span className="text-ink2">· {r.vehicleCode}</span>
        </span>
        {statusChip(r)}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink1 sm:grid-cols-2">
        <span>SUPPLIER · <span className="text-ink0">{r.supplier ?? "—"}</span></span>
        <span>ASN · <span className="text-data">{r.asn ?? "—"}</span></span>
        <span>PICKUP WINDOW · <span className="text-ink0">{r.pickupWindow ?? "—"}</span></span>
        <span>EXPECTED AT GATE · <span className="text-warn">GATE 1 IN</span></span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link to="/3pl-portal" className="rounded border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink1 transition-colors hover:border-brand hover:text-brand">
          ASN FROM /3PL-PORTAL →
        </Link>
        <Link to="/gate" className="rounded border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink1 transition-colors hover:border-brand hover:text-brand">
          GATE-IN FLOW →
        </Link>
        <Link to="/warehouse-3d" className="rounded border border-data/40 bg-data-soft px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-data transition-colors hover:border-brand hover:text-brand">
          {r.binsReserved ?? 0} BINS RESERVED →
        </Link>
      </div>
    </motion.div>
  );
}

export default function RunBoard() {
  const { routes } = useRouteBoard();
  const [tab, setTab] = useState<Tab>("outward");
  const rows = routes.filter((r) => r.direction === tab);

  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>BOTH.DIRECTIONS</SectionKicker>
        <h2 className="mt-6 max-w-[760px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          Deliveries out. Pickups in. One plan.
        </h2>

        <div data-tour="run-board" className="mt-12">
          {/* segmented tabs */}
          <div className="inline-flex overflow-hidden rounded-lg border border-line">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200",
                  tab === t.id ? "bg-brand text-onbrand" : "bg-surface text-ink2 hover:text-ink1"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-6"
            >
              {tab === "outward" && (
                <div className="overflow-x-auto rounded-xl border border-line bg-surface px-4">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                      <tr className="border-b border-line font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
                        <th className="py-3 pr-4 text-left font-medium">TRIP</th>
                        <th className="py-3 pr-4 text-left font-medium">VEHICLE</th>
                        <th className="py-3 pr-4 text-left font-medium">STOPS</th>
                        <th className="py-3 pr-4 text-left font-medium">DOC REFS</th>
                        <th className="py-3 pr-4 text-left font-medium">STATUS</th>
                        <th className="py-3 text-left font-medium">POD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <OutwardRow key={r.routeNo} r={r} i={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "inward" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {rows.map((r, i) => (
                    <InwardCard key={r.routeNo} r={r} i={i} />
                  ))}
                </div>
              )}
              {tab === "backhaul" && (
                <div className="grid grid-cols-1 gap-4">
                  {rows.map((r, i) => (
                    <motion.div
                      key={r.routeNo}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                      className="rounded-xl border border-line bg-surface p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[12px] font-semibold tracking-[0.06em] text-ink0">
                          {r.routeNo} <span className="text-ink2">· {r.vehicleCode}</span>
                        </span>
                        <span className="rounded-md border border-warn/50 bg-warn/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-warn">
                          BACKHAUL · RETURN LEG FILLED
                        </span>
                      </div>
                      {/* backhaul arc: last delivery stop → first pickup */}
                      <svg viewBox="0 0 640 90" className="mt-3 h-20 w-full">
                        <rect x="30" y="52" width="10" height="10" className="fill-brand" />
                        <text x="46" y="61" className="fill-ink1 font-mono" fontSize="10" letterSpacing="1">
                          LAST DROP · BADLAPUR
                        </text>
                        <motion.path
                          d="M 180 58 Q 320 6 470 58"
                          fill="none"
                          className="stroke-data"
                          strokeWidth="1.5"
                          strokeDasharray="5 5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: EASE }}
                        />
                        <circle cx="480" cy="57" r="6" className="fill-data/30 stroke-data" strokeWidth="1.5" />
                        <text x="494" y="61" className="fill-data font-mono" fontSize="10" letterSpacing="1">
                          PICKUP · KONARK POLYMERS ({r.pickupWindow})
                        </text>
                      </svg>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink2">
                        {r.asn} · {r.binsReserved} BINS RESERVED · {r.totalKm} KM DETOUR ONLY
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
            SAME VEHICLES, BACKHAUL-AWARE: INWARD PICKUPS FILL EMPTY RETURN LEGS.
          </p>
        </div>
      </div>
    </section>
  );
}
