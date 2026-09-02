import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import MetricStat from "@/components/MetricStat";
import DocBadge from "@/components/gate/DocBadge";
import type { GateToast } from "@/components/gate/GateToasts";
import {
  DEMO_ARRIVALS,
  DEMO_BOARD,
  fmtClock,
  waitTone,
  type GateBoardData,
  type GateVehicle,
} from "@/components/gate/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const WAREHOUSE_ID = 1;

type ServerPass = {
  id: number;
  passNo: string;
  vehicleId: number;
  direction: string;
  driverName: string;
  purpose: string;
  status: string;
  docRef: string | null;
  /** present on lane items only */
  waitMinutes?: number;
  vehicle?: { regNo: string } | null;
};

function adaptPass(p: ServerPass): GateVehicle {
  const ewbRef = p.docRef && /ewb/i.test(p.docRef) ? p.docRef : null;
  return {
    id: p.id,
    passNo: p.passNo,
    plate: p.vehicle?.regNo ?? (p.purpose || `VEH-${String(p.vehicleId).padStart(2, "0")}`),
    driver: p.driverName.toUpperCase(),
    direction: p.direction === "out" ? "out" : "in",
    ref: p.docRef ?? "WALK-IN",
    dock: null,
    staging: p.status === "in-yard" ? "Y-—" : null,
    waitMin: p.waitMinutes ?? 0,
    status: (p.status as GateVehicle["status"]) ?? "scheduled",
    ewbNo: ewbRef,
    ewbStatus: ewbRef ? "valid" : null,
    ewbHoursLeft: ewbRef ? 20 : null,
  };
}

function LaneRow({
  v,
  flash,
  onGateOut,
  gatingOut,
}: {
  v: GateVehicle;
  flash?: boolean;
  onGateOut?: (v: GateVehicle) => void;
  gatingOut?: boolean;
}) {
  const tone = waitTone(v.waitMin);
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 18 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn(
        "rounded-lg border border-line bg-page/50 px-3 py-2.5",
        flash && "border-data/60 shadow-glow-data"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold tracking-[0.06em] text-ink0">
          {v.plate}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
          {v.passNo}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink1">
        <span className="text-data">{v.ref}</span>
        {v.dock && <span>· DOCK {v.dock}</span>}
        {v.staging && <span>· STAGING {v.staging}</span>}
        {v.status === "at-gate" && (
          <span className="rounded border border-brand/60 bg-brand-soft px-1.5 py-px text-[9px] text-brand">
            AT BOOTH
          </span>
        )}
      </div>
      {v.direction === "out" && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {v.ewbStatus && (
            <DocBadge
              code="EWB"
              tone={v.ewbStatus}
              detail={
                v.ewbStatus === "valid"
                  ? `VALID ${v.ewbHoursLeft}H`
                  : v.ewbStatus === "expiring"
                    ? `${v.ewbHoursLeft}H LEFT`
                    : "EXPIRED"
              }
              pulse={v.ewbStatus === "expired"}
            />
          )}
          {onGateOut && (
            <button
              type="button"
              disabled={gatingOut}
              onClick={() => onGateOut(v)}
              className="ml-auto rounded border border-linestrong px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink1 transition-colors duration-200 hover:border-brand hover:text-brand disabled:opacity-40"
            >
              {gatingOut ? "…" : "Gate out →"}
            </button>
          )}
        </div>
      )}
      {/* wait bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
          <motion.div
            className={cn(
              "h-full rounded-full",
              tone === "data" && "bg-data",
              tone === "warn" && "bg-warn",
              tone === "crit" && "bg-crit"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (v.waitMin / 45) * 100)}%` }}
            transition={{ duration: 0.8, ease: EASE }}
          />
        </div>
        <span
          className={cn(
            "font-mono text-[9px] tracking-[0.1em]",
            tone === "data" && "text-data",
            tone === "warn" && "text-warn",
            tone === "crit" && "text-crit"
          )}
        >
          WAIT {String(v.waitMin).padStart(2, "0")}M
        </span>
      </div>
    </motion.li>
  );
}

function Lane({
  title,
  edge,
  children,
  count,
}: {
  title: string;
  edge: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-h-[280px] flex-col border-t-2 px-4 py-4", edge)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="animate-pulse-dot font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink0">
          {title}
        </span>
        <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink2">
          {count}
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-2">{children}</ul>
    </div>
  );
}

export default function OpsBoard({
  pushToast,
}: {
  pushToast: (t: Omit<GateToast, "id">) => void;
}) {
  const utils = trpc.useUtils();
  const boardQ = trpc.gate.board.useQuery(
    { warehouseId: WAREHOUSE_ID },
    { retry: 1, refetchInterval: 9000, refetchOnWindowFocus: false }
  );

  const [clock, setClock] = useState(() => fmtClock(new Date()));
  useEffect(() => {
    const t = window.setInterval(() => setClock(fmtClock(new Date())), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Live data if reachable + non-empty; otherwise baked demo board.
  const [localBoard, setLocalBoard] = useState<GateBoardData | null>(null);
  const board: GateBoardData = useMemo(() => {
    if (localBoard) return localBoard;
    const d = boardQ.data;
    if (
      boardQ.isError ||
      !d ||
      d.inLane.length + d.yard.length + d.outLane.length + d.completedToday.length === 0
    ) {
      return DEMO_BOARD;
    }
    return {
      inLane: d.inLane.map(adaptPass),
      yard: d.yard.map(adaptPass),
      outLane: d.outLane.map(adaptPass),
      completedToday: d.completedToday.map(adaptPass),
    };
  }, [boardQ.data, boardQ.isError, localBoard]);

  const live = !boardQ.isError && !!boardQ.data && !localBoard &&
    boardQ.data.inLane.length + boardQ.data.yard.length + boardQ.data.outLane.length > 0;

  // Demo stream: a new arrival slides into the IN lane every ~9s.
  const [streamIdx, setStreamIdx] = useState(0);
  const [streamed, setStreamed] = useState<GateVehicle[]>([]);
  const streamedRef = useRef(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      setStreamed((prev) => {
        const next = DEMO_ARRIVALS[streamedRef.current % DEMO_ARRIVALS.length];
        streamedRef.current += 1;
        const stamped = { ...next, id: next.id + streamedRef.current * 10 };
        return [stamped, ...prev].slice(0, 3);
      });
      setStreamIdx((v) => v + 1);
    }, 9000);
    return () => window.clearInterval(t);
  }, []);

  const inLane = useMemo(
    () => [...streamed, ...board.inLane].slice(0, 6),
    [streamed, board.inLane]
  );

  /* ---------------- mutations ---------------- */

  const updateStatus = trpc.gate.updatePassStatus.useMutation({
    onSuccess: () => {
      void utils.gate.board.invalidate();
    },
  });
  const schedulePass = trpc.gate.schedulePass.useMutation({
    onSuccess: (pass) => {
      void utils.gate.board.invalidate();
      pushToast({
        tone: "ok",
        title: "PASS SCHEDULED",
        body: `${pass?.passNo ?? "GP-NEW"} pre-registered. Booth will verify the appointment QR on arrival.`,
      });
    },
  });

  const [gatingOutId, setGatingOutId] = useState<number | null>(null);

  function gateOut(v: GateVehicle) {
    setGatingOutId(v.id);
    updateStatus.mutate(
      { id: v.id, status: "completed" },
      {
        onSettled: () => setGatingOutId(null),
        onSuccess: () =>
          pushToast({
            tone: "ok",
            title: `GATE OUT ✓ ${v.passNo}`,
            body: `${v.plate} cleared the booth. Docs verified, event stamped to the audit log.`,
          }),
        onError: (err) => {
          // Server blocks gate-out when the linked EWB is expired — surface it.
          if (/EWB/i.test(err.message)) {
            pushToast({ tone: "crit", title: "COMPLIANCE.HOLD — GATE-OUT BLOCKED", body: err.message });
          } else if (v.ewbStatus === "expired") {
            // Offline demo: reproduce the server-side hold for the expired-EWB pass.
            pushToast({
              tone: "crit",
              title: "COMPLIANCE.HOLD — GATE-OUT BLOCKED",
              body: `Cannot gate out: EWB ${v.ewbNo} is expired. Regenerate the e-way bill before dispatch. Dispatch has been alerted.`,
            });
          } else {
            // Offline demo: complete locally.
            setLocalBoard({
              ...board,
              outLane: board.outLane.filter((p) => p.id !== v.id),
              completedToday: [{ ...v, status: "completed" }, ...board.completedToday],
            });
            pushToast({
              tone: "info",
              title: `DEMO MODE — ${v.passNo} GATED OUT`,
              body: "ERPNext unreachable; the pass was completed locally for this demo.",
            });
          }
        },
      }
    );
  }

  /* ---------------- pre-register mini form ---------------- */

  const [formOpen, setFormOpen] = useState(false);
  const [fPlate, setFPlate] = useState("");
  const [fDriver, setFDriver] = useState("");
  const [fDir, setFDir] = useState<"in" | "out">("in");
  const [fDoc, setFDoc] = useState("");

  function submitPass(e: React.FormEvent) {
    e.preventDefault();
    if (!fPlate.trim() || !fDriver.trim()) return;
    const input = {
      warehouseId: WAREHOUSE_ID,
      vehicleId: 1,
      direction: fDir,
      driverName: fDriver.trim(),
      purpose: fPlate.trim().toUpperCase(),
      docRef: fDoc.trim() || null,
    };
    schedulePass.mutate(input, {
      onError: () => {
        // Offline demo: append locally.
        const local: GateVehicle = {
          id: 9000 + Math.floor(Math.random() * 900),
          passNo: `GP-${2850 + streamed.length}`,
          plate: input.purpose,
          driver: input.driverName.toUpperCase(),
          direction: fDir,
          ref: input.docRef ?? "WALK-IN",
          dock: null,
          staging: null,
          waitMin: 0,
          status: "scheduled",
          ewbNo: null,
          ewbStatus: null,
          ewbHoursLeft: null,
        };
        setLocalBoard({
          ...board,
          inLane: fDir === "in" ? [local, ...board.inLane] : board.inLane,
          outLane: fDir === "out" ? [local, ...board.outLane] : board.outLane,
        });
        pushToast({
          tone: "info",
          title: `DEMO MODE — ${local.passNo} SCHEDULED`,
          body: "ERPNext unreachable; the appointment was added to the local board.",
        });
      },
    });
    setFormOpen(false);
    setFPlate("");
    setFDriver("");
    setFDoc("");
  }

  const [gateChip, setGateChip] = useState("GATE 2 OUT");

  return (
    <section id="gate-ops" className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>OPS.BOARD</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          In, out, and everything waiting.
        </h2>

        <motion.div
          data-tour="ops-board"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="group relative mt-12 overflow-hidden rounded-xl border border-line bg-surface transition-colors duration-300 hover:border-linestrong"
        >
          <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-[14px] w-[14px] border-l border-t border-brand" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[14px] w-[14px] border-b border-r border-brand" />

          {/* top bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="flex gap-1.5">
              {["GATE 1 IN", "GATE 2 OUT", "GATE 3 BOTH"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGateChip(g)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200",
                    gateChip === g
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line text-ink2 hover:border-linestrong hover:text-ink1"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <span className="ml-auto font-mono text-[12px] tracking-[0.1em] text-data font-tnum">
              {clock}
            </span>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-data" />
              BOOTH-01 ONLINE
            </span>
            <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
              {live ? "● LIVE" : "● DEMO"}
            </span>
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-linestrong px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink1 transition-colors duration-200 hover:border-brand hover:text-brand"
            >
              <Plus className="h-3 w-3" /> Pre-register
            </button>
          </div>

          {/* pre-register form */}
          <AnimatePresence initial={false}>
            {formOpen && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                onSubmit={submitPass}
                className="overflow-hidden border-b border-line bg-page/40"
              >
                <div className="flex flex-wrap items-end gap-3 px-4 py-3">
                  {(
                    [
                      ["VEHICLE PLATE", fPlate, setFPlate, "GJ-01-AB-4421"],
                      ["DRIVER", fDriver, setFDriver, "R. PATIL"],
                      ["DOC REF (OPTIONAL)", fDoc, setFDoc, "ASN-0128 / INV/2025/0120"],
                    ] as const
                  ).map(([label, val, set, ph]) => (
                    <label key={label} className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
                        {label}
                      </span>
                      <input
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        placeholder={ph}
                        className="w-44 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[12px] text-ink0 placeholder:text-ink2/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </label>
                  ))}
                  <div className="flex gap-1.5">
                    {(["in", "out"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFDir(d)}
                        className={cn(
                          "rounded-md border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em]",
                          fDir === d
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-line text-ink2"
                        )}
                      >
                        {d === "in" ? "▸ IN" : "OUT ▸"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={schedulePass.isPending}
                    className="rounded-lg bg-brand px-4 py-2 font-display text-[13px] font-semibold text-onbrand transition-colors hover:bg-brand-hover disabled:opacity-50"
                  >
                    {schedulePass.isPending ? "Scheduling…" : "Schedule pass"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* lanes */}
          <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            <Lane title="IN LANE" edge="border-data" count={inLane.length}>
              <AnimatePresence initial={false}>
                {inLane.map((v, i) => (
                  <LaneRow key={`${v.id}-${v.passNo}`} v={v} flash={i === 0 && v.status === "at-gate"} />
                ))}
              </AnimatePresence>
            </Lane>
            <Lane title="YARD / QUEUE" edge="border-warn" count={board.yard.length}>
              <AnimatePresence initial={false}>
                {board.yard.map((v) => (
                  <LaneRow key={v.id} v={v} />
                ))}
              </AnimatePresence>
            </Lane>
            <Lane title="OUT LANE" edge="border-brand" count={board.outLane.length}>
              <AnimatePresence initial={false}>
                {board.outLane.map((v) => (
                  <LaneRow
                    key={v.id}
                    v={v}
                    onGateOut={gateOut}
                    gatingOut={gatingOutId === v.id}
                  />
                ))}
              </AnimatePresence>
            </Lane>
          </div>

          {/* bottom strip */}
          <div className="grid grid-cols-1 gap-6 border-t border-line px-6 py-6 sm:grid-cols-3">
            <MetricStat value={38} caption="MIN AVG TURNAROUND" suffix=" MIN" />
            <MetricStat value={board.yard.length + 9} caption="VEHICLES IN YARD" />
            <MetricStat value={6} caption="/ 8 DOCKS BUSY" suffix="/8" />
          </div>
        </motion.div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
          {streamIdx >= 0 && "STREAM: NEW ARRIVALS FLASH INTO THE IN LANE · "}
          COMPLETED TODAY: {board.completedToday.length + 41}
        </p>
      </div>
    </section>
  );
}
