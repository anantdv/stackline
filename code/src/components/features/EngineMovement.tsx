import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
} from "framer-motion";
import { Check, CheckCircle2, GripVertical, RotateCcw } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const RACK_A = ["A-01-01-01", "A-02-01-02", "A-02-01-03", "A-04-01-04"];
const RACK_B = ["B-01-01-01", "B-02-01-02", "B-03-01-03", "B-04-01-04"];
const SOURCE_BIN = "A-02-01-03";
const OCCUPIED_BIN = "B-03-01-03"; // pre-filled, not a valid target

type Phase = "idle" | "dragging" | "moving" | "done";

const FEATURES = [
  "Drag-and-drop bin transfers",
  "Multi-carton batch moves",
  "Route preview along aisles",
  "Picker task auto-created",
  "ERPNext Stock Entry posted with reference ID",
];

/* ------------------------------------------------------------------ */
/* Interactive drag-to-move demo                                       */
/* ------------------------------------------------------------------ */
function MovementDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const binRefs = useRef(new Map<string, HTMLDivElement>());
  const [phase, setPhase] = useState<Phase>("idle");
  const [destBin, setDestBin] = useState<string | null>(null);
  const [flashBin, setFlashBin] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [path, setPath] = useState<string | null>(null);
  const [pathLen, setPathLen] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragStart = useRef({ px: 0, py: 0, x: 0, y: 0 });
  const moveToken = useRef(0);

  const setBinRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) binRefs.current.set(id, el);
      else binRefs.current.delete(id);
    },
    []
  );

  /** Center of a bin relative to the demo container. */
  const binCenter = (id: string) => {
    const el = binRefs.current.get(id);
    const box = containerRef.current;
    if (!el || !box) return null;
    const r = el.getBoundingClientRect();
    const c = box.getBoundingClientRect();
    return { cx: r.left + r.width / 2 - c.left, cy: r.top + r.height / 2 - c.top };
  };

  useEffect(() => {
    if (path && pathRef.current) {
      setPathLen(pathRef.current.getTotalLength());
    }
  }, [path]);

  const finishMove = (target: string) => {
    const from = binCenter(SOURCE_BIN);
    const to = binCenter(target);
    if (!from || !to) return;
    const curX = x.get();
    const curY = y.get();
    const endX = to.cx - from.cx;
    const endY = to.cy - from.cy;
    const lift = Math.min(curY, endY) - 64;

    setPath(
      `M ${from.cx} ${from.cy} C ${from.cx} ${from.cy - 90}, ${to.cx} ${to.cy - 90}, ${to.cx} ${to.cy}`
    );
    setPhase("moving");
    const token = ++moveToken.current;

    const ease = [0.3, 0.7, 0.3, 1] as const;
    animate(x, [curX, (curX + endX) / 2, endX], { duration: 0.9, times: [0, 0.55, 1], ease: [...ease] });
    animate(y, [curY, lift, endY], { duration: 0.9, times: [0, 0.55, 1], ease: [...ease] }).then(() => {
      if (moveToken.current !== token) return; // reset during flight
      setPhase("done");
      setDestBin(target);
      setFlashBin(target);
      setShowToast(true);
      window.setTimeout(() => setFlashBin(null), 1200);
      window.setTimeout(() => setShowToast(false), 3000);
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase === "moving") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { px: e.clientX, py: e.clientY, x: x.get(), y: y.get() };
    setPhase("dragging");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "dragging") return;
    x.set(dragStart.current.x + (e.clientX - dragStart.current.px));
    y.set(dragStart.current.y + (e.clientY - dragStart.current.py));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "dragging") return;
    // Hit-test empty rack-B bins
    let best: string | null = null;
    let bestDist = Infinity;
    for (const id of RACK_B) {
      if (id === OCCUPIED_BIN) continue;
      const el = binRefs.current.get(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const inside =
        e.clientX >= r.left - 10 && e.clientX <= r.right + 10 &&
        e.clientY >= r.top - 10 && e.clientY <= r.bottom + 10;
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      if (inside && d < bestDist) {
        best = id;
        bestDist = d;
      }
    }
    if (best) {
      finishMove(best);
    } else {
      // spring back to source
      animate(x, 0, { type: "spring", stiffness: 300, damping: 28 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 28 });
      setPhase("idle");
    }
  };

  const reset = () => {
    animate(x, 0, { type: "spring", stiffness: 260, damping: 30 });
    animate(y, 0, { type: "spring", stiffness: 260, damping: 30 });
    setPhase("idle");
    setDestBin(null);
    setPath(null);
    setShowToast(false);
  };

  const binCell = (id: string, rack: "A" | "B") => {
    const isSource = id === SOURCE_BIN;
    const isOccupied = id === OCCUPIED_BIN;
    const isDest = destBin === id;
    const isTargetRack = rack === "B" && !isOccupied;
    return (
      <div
        key={id}
        ref={setBinRef(id)}
        data-bin={id}
        className={cn(
          "relative flex h-14 flex-col items-center justify-center rounded-md border transition-colors duration-300 sm:h-16",
          isSource && "border-brand/60 bg-brand-soft",
          isOccupied && "border-line bg-raised/60",
          isDest && "border-data bg-data-soft",
          !isSource && !isOccupied && !isDest && "border-line bg-surface",
          isTargetRack && phase === "dragging" && "border-dashed border-data/60"
        )}
      >
        {flashBin === id && (
          <span className="absolute inset-0 rounded-md bg-data/25 [animation:ticker-flash_1.2s_ease-out_forwards]" />
        )}
        <span className="font-mono text-[9px] tracking-[0.12em] text-ink2">{id}</span>
        {isOccupied && (
          <div className="mt-1 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-[2px] bg-[#C8A27A]/50" />
            ))}
          </div>
        )}
        {isDest && (
          <span className="absolute -top-2 right-1 rounded-sm bg-data px-1 font-mono text-[8px] font-semibold text-void">
            NEW
          </span>
        )}
        {/* carton rendered in-flow while idle at source */}
        {isSource && (phase === "idle" || phase === "dragging" || phase === "moving") && (
          <motion.div
            role="button"
            aria-label={`Drag carton from bin ${SOURCE_BIN}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ x, y, touchAction: "none" }}
            animate={{ scale: phase === "dragging" ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className={cn(
              "absolute left-1/2 top-1/2 z-20 -ml-5 -mt-3.5 flex h-7 w-10 items-center justify-center rounded-[3px] border border-[#8a6b4a] bg-[#C8A27A]",
              phase === "moving" ? "pointer-events-none" : "cursor-grab active:cursor-grabbing",
              phase === "dragging" && "shadow-glow-data"
            )}
          >
            <GripVertical className="h-3.5 w-3.5 text-[#5f4a30]" />
          </motion.div>
        )}
        {isDest && phase === "done" && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute left-1/2 top-1/2 -ml-5 -mt-3.5 flex h-7 w-10 items-center justify-center rounded-[3px] border border-[#8a6b4a] bg-[#C8A27A]"
          >
            <Check className="h-3.5 w-3.5 text-[#5f4a30]" />
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <BlueprintCard className="overflow-hidden">
      <div ref={containerRef} className="relative aspect-[16/10] w-full select-none bg-void/60 p-4 sm:p-6">
        <div className="absolute inset-0 blueprint-grid opacity-40" aria-hidden />

        {/* travel path */}
        {path && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <path
              ref={pathRef}
              d={path}
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="1.5"
              strokeDasharray={pathLen ? `${pathLen}` : "6 5"}
              strokeDashoffset={phase === "moving" ? pathLen : 0}
              style={
                phase === "moving"
                  ? { animation: "dash-draw 0.9s cubic-bezier(0.3,0.7,0.3,1) forwards" }
                  : { opacity: 0.45 }
              }
              strokeOpacity="0.8"
            />
            <style>{`@keyframes dash-draw { from { stroke-dashoffset: ${pathLen}; } to { stroke-dashoffset: 0; } }`}</style>
          </svg>
        )}

        {/* Rack A (source) */}
        <div className="relative">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            <span>Rack A · Source</span>
            <span className="text-brand">Pick face</span>
          </div>
          <div className="grid grid-cols-4 gap-2">{RACK_A.map((id) => binCell(id, "A"))}</div>
        </div>

        {/* aisle */}
        <div className="relative my-4 flex items-center gap-3 sm:my-6">
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink2">
            Aisle 02 · 3000 mm
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* Rack B (destination) */}
        <div className="relative">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            <span>Rack B · Destination</span>
            <span className={cn(phase === "dragging" ? "text-data" : "text-ink2")}>
              {phase === "dragging" ? "Drop on an empty bin" : "3 bins free"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">{RACK_B.map((id) => binCell(id, "B"))}</div>
        </div>

        {/* toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="absolute inset-x-4 bottom-4 z-30 flex items-center gap-2 rounded-lg border border-data/40 bg-surface/95 px-4 py-3 backdrop-blur-sm sm:inset-x-6"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-data" />
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink0">
                Stock entry <span className="text-data">STE-2025-0118</span> posted · {destBin}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* reset */}
        <button
          type="button"
          onClick={reset}
          className="absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-md border border-line bg-surface/80 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1 transition-colors hover:border-brand hover:text-brand sm:right-6"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>
    </BlueprintCard>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */
export default function EngineMovement() {
  return (
    <section id="engine-movement" className="scroll-mt-32 bg-page py-24 md:py-40">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-[45%_55%] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>ENGINE.01</SectionKicker>
          <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Move stock by moving it." />
          </h2>
          <p className="mt-5 max-w-[52ch] leading-relaxed text-ink1">
            Grab a carton in the twin and drop it in a new bin. Stackline
            computes the physical route, animates the move for the floor team,
            and posts a Material Transfer Stock Entry to ERPNext — one gesture,
            ledger-complete.
          </p>
          <ul className="mt-7 space-y-2.5">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: EASE }}
                className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink1"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-data" />
                {f}
              </motion.li>
            ))}
          </ul>
          <div className="mt-8 border-t border-line pt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink2">
            Median move: <span className="text-data">11 sec</span> · Zero forms
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            <span>Live demo</span>
            <span className="text-data">Drag the carton →</span>
          </div>
          <MovementDemo />
        </motion.div>
      </div>
    </section>
  );
}
