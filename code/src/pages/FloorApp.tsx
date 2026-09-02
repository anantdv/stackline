import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListTodo,
  ScanLine,
  PackageSearch,
  CircleCheck,
  CloudOff,
  RefreshCw,
  UserRound,
  ArrowLeft,
  Camera,
  CameraOff,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";

/**
 * /floor-app — installable PWA floor-management app (Android/iOS).
 * Mobile-first, always-dark control-room UI. Tasks / Scan / Bins tabs.
 * Authenticated users run live floor operations; mutations queue offline.
 */

type Tab = "tasks" | "scan" | "bins";

type QueuedOp = {
  id: string;
  kind: "completeMovement" | "recordScan";
  payload: Record<string, unknown>;
  label: string;
  at: number;
};

const QUEUE_KEY = "stackline-floor-queue";

function loadQueue(): QueuedOp[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function FloorApp() {
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("tasks");
  const [queue, setQueue] = useState<QueuedOp[]>(loadQueue);
  const [online, setOnline] = useState(navigator.onLine);
  const utils = trpc.useUtils();

  const enqueue = useCallback((op: Omit<QueuedOp, "id" | "at">) => {
    setQueue((q) => {
      const next = [...q, { ...op, id: crypto.randomUUID(), at: Date.now() }];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeMut = trpc.wms.movements.updateStatus.useMutation({
    onSuccess: () => utils.wms.movements.list.invalidate(),
  });

  // Flush the offline queue when connectivity returns
  useEffect(() => {
    const onOnline = async () => {
      setOnline(true);
      const pending = loadQueue();
      const remaining: QueuedOp[] = [];
      for (const op of pending) {
        try {
          if (op.kind === "completeMovement") {
            await completeMut.mutateAsync(
              op.payload as { id: number; status: "completed" },
            );
          }
        } catch {
          remaining.push(op);
        }
      }
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      setQueue(remaining);
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (navigator.onLine && pendingCount(loadQueue()) > 0) void onOnline();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      data-theme="dark"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-void text-ink0"
    >
      {/* App bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-void/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/mobile-app" aria-label="Back">
              <ArrowLeft className="h-5 w-5 text-ink1" />
            </Link>
            <span className="font-display text-base font-semibold tracking-tight">
              STACKLINE <span className="text-brand">FLOOR</span>
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em]">
            {online ? (
              <span className="flex items-center gap-1 text-data">
                <span className="h-1.5 w-1.5 rounded-full bg-data animate-pulse-dot" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-warn">
                <CloudOff className="h-3 w-3" /> Offline
              </span>
            )}
            {user ? (
              <span className="flex items-center gap-1 text-ink1">
                <UserRound className="h-3 w-3" />
                {user.role}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {/* Offline queue banner */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-warn/30 bg-warn/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-warn"
          >
            {queue.length} op{queue.length > 1 ? "s" : ""} queued — posts when
            back online
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth gate for live ops */}
      {!isLoading && !user && (
        <div className="mx-4 mt-4 rounded-xl border border-brand/40 bg-brand-soft p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
            // SIGN IN FOR LIVE OPS
          </div>
          <p className="mt-2 text-sm text-ink1">
            You can browse in demo mode. Sign in to complete tasks against the
            live warehouse and sync with ERPNext.
          </p>
          <Link
            to={LOGIN_PATH}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-display text-sm font-semibold text-onbrand"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        {tab === "tasks" && (
          <TasksTab
            canWrite={!!user}
            onComplete={(id, label) => {
              if (!online) {
                enqueue({
                  kind: "completeMovement",
                  payload: { id, status: "completed" },
                  label,
                });
                return;
              }
              completeMut.mutate({ id, status: "completed" });
            }}
          />
        )}
        {tab === "scan" && <ScanTab />}
        {tab === "bins" && <BinsTab />}
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-line bg-void/95 backdrop-blur-md">
        <div className="grid grid-cols-3">
          {(
            [
              { id: "tasks", icon: ListTodo, label: "Tasks" },
              { id: "scan", icon: ScanLine, label: "Scan" },
              { id: "bins", icon: PackageSearch, label: "Bins" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                tab === t.id ? "text-brand" : "text-ink2",
              )}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function pendingCount(q: QueuedOp[]) {
  return q.length;
}

/* ------------------------------------------------------------------ */

function TasksTab({
  canWrite,
  onComplete,
}: {
  canWrite: boolean;
  onComplete: (id: number, label: string) => void;
}) {
  const tasks = trpc.wms.movements.list.useQuery(
    { status: "pending", limit: 50 },
    { retry: 1, refetchInterval: 15000 },
  );

  const rows = tasks.data ?? [];

  return (
    <section data-tour="floor-tasks">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink1">
          // OPEN.TASKS
        </span>
        <button
          type="button"
          onClick={() => tasks.refetch()}
          className="text-ink2"
          aria-label="Refresh tasks"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      {tasks.isLoading ? (
        <p className="py-12 text-center font-mono text-xs uppercase tracking-[0.14em] text-ink2">
          Syncing tasks…
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <CircleCheck className="mx-auto h-8 w-8 text-data" />
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-ink1">
            Queue clear — nothing pending
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
                  {m.type}
                </span>
                <span className="font-mono text-[10px] text-ink2">
                  #{m.id}
                </span>
              </div>
              <div className="mt-1 font-display text-base font-semibold text-ink0">
                {m.item?.name ?? `Item #${m.itemId}`} × {m.qty}
              </div>
              <div className="mt-1 font-mono text-[10px] text-ink2">
                {m.fromBinId ? `BIN #${m.fromBinId}` : "DOCK"} →{" "}
                {m.toBinId ? `BIN #${m.toBinId}` : "DOCK"}
                {m.reference ? ` · REF ${m.reference}` : ""}
              </div>
              <button
                type="button"
                disabled={!canWrite}
                onClick={() =>
                  onComplete(m.id, `${m.type} #${m.id}`)
                }
                className={cn(
                  "mt-3 w-full rounded-lg py-2.5 font-display text-sm font-semibold transition-colors",
                  canWrite
                    ? "bg-data text-void hover:opacity-90"
                    : "cursor-not-allowed border border-line text-ink2",
                )}
              >
                {canWrite ? "COMPLETE TASK" : "SIGN IN TO COMPLETE"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function ScanTab() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hit, setHit] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const Detector = (
          window as unknown as {
            BarcodeDetector?: new (o: {
              formats: string[];
            }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
          }
        ).BarcodeDetector;
        if (Detector) {
          const detector = new Detector({
            formats: ["qr_code", "code_128", "ean_13"],
          });
          const tick = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                setHit(codes[0].rawValue);
                setActive(false);
                return;
              }
            } catch {
              /* keep scanning */
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      } catch {
        setError("Camera unavailable — use manual entry below.");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  const code = hit ?? manual;

  return (
    <section data-tour="floor-scan">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink1">
        // SCAN.BIN.OR.CARTON
      </span>
      <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface">
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn(
            "h-full w-full object-cover",
            active ? "opacity-100" : "opacity-0",
          )}
        />
        {active && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-8 top-1/2 h-px bg-data/80 shadow-[0_0_12px_2px_rgba(45,212,191,0.6)] animate-scanline" />
            <div className="absolute left-6 top-6 h-6 w-6 border-l-2 border-t-2 border-brand" />
            <div className="absolute right-6 top-6 h-6 w-6 border-r-2 border-t-2 border-brand" />
            <div className="absolute bottom-6 left-6 h-6 w-6 border-b-2 border-l-2 border-brand" />
            <div className="absolute bottom-6 right-6 h-6 w-6 border-b-2 border-r-2 border-brand" />
          </div>
        )}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {error ? (
              <>
                <CameraOff className="h-8 w-8 text-ink2" />
                <p className="px-6 text-center text-xs text-ink1">{error}</p>
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 text-ink2" />
                <p className="text-xs text-ink1">
                  Point at a bin QR or carton barcode
                </p>
              </>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setHit(null);
          setActive((v) => !v);
        }}
        className="mt-3 w-full rounded-lg bg-brand py-3 font-display text-sm font-semibold text-onbrand"
      >
        {active ? "STOP CAMERA" : "START CAMERA SCAN"}
      </button>

      <div className="mt-4">
        <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
          Manual entry
        </label>
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value.toUpperCase())}
          placeholder="A-04-02-03"
          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm text-ink0 placeholder:text-ink2 focus:border-brand focus:outline-none"
        />
      </div>

      {code && <BinResult code={code} />}
    </section>
  );
}

function BinResult({ code }: { code: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border border-data/40 bg-data-soft p-4"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-data">
        ✓ SCANNED
      </div>
      <div className="mt-1 font-mono text-lg font-semibold text-ink0">
        {code}
      </div>
      <p className="mt-1 text-xs text-ink1">
        Bin identified. Open it in the Bins tab for contents and capacity.
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

function BinsTab() {
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<number | null>(null);
  const contents = trpc.wms.stock.binContents.useQuery(
    { binId: lookup ?? 0 },
    { enabled: lookup !== null, retry: 1 },
  );

  return (
    <section data-tour="floor-bins">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink1">
        // BIN.LOOKUP
      </span>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="BIN ID — A-04-02-03"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm text-ink0 placeholder:text-ink2 focus:border-brand focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setLookup(1)}
          className="rounded-lg bg-brand px-4 font-display text-sm font-semibold text-onbrand"
        >
          FIND
        </button>
      </div>
      {lookup !== null && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          {contents.isLoading ? (
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink2">
              Reading bin…
            </p>
          ) : contents.isError ? (
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-warn">
              Live bin data unavailable — check connection
            </p>
          ) : (
            <pre className="overflow-x-auto font-mono text-[11px] text-ink1">
              {JSON.stringify(contents.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
