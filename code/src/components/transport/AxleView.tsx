import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, GripVertical } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Section 4 — weight distribution & axle view with draggable CoG demo. */
export default function AxleView() {
  const [cartonX, setCartonX] = useState(0.35); // 0 = rear … 1 = front (cab)
  const [overload, setOverload] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Over-limit demo loop: every 8s flash crit + shake, then resolve.
  useEffect(() => {
    const id = window.setInterval(() => {
      setOverload(true);
      window.setTimeout(() => setOverload(false), 1300);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  // Simple two-axle balance: cargo mass distributes by CoG position.
  // Steer axle at front (pos 0.9), drive at rear (pos 0.15) of the deck.
  const cargoT = 6.3;
  const cog = 0.15 + (1 - cartonX) * 0.75; // cartonX 1 (front) → cog near steer
  const steerT = 2.1 + cargoT * cog + (overload ? 3.4 : 0);
  const driveT = 3.8 + cargoT * (1 - cog) - (overload ? 2.2 : 0);
  const steerPct = (steerT / 6) * 100;
  const drivePct = (driveT / 19) * 100;

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const f = (e.clientX - rect.left) / rect.width;
    setCartonX(Math.min(1, Math.max(0, f)));
  }, []);

  const Bar = ({ label, limit, value, pct, over }: { label: string; limit: string; value: string; pct: number; over: boolean }) => (
    <div className={cn(over && "[animation:axle-shake_0.3s_linear_4]")}>
      <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.12em]">
        <span className="text-ink2">{label}</span>
        <span className={cn("font-tnum", over ? "text-crit" : "text-data")}>
          {limit} / {value} {over ? "✕ OVER" : "✓"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-raised">
        <motion.div
          className={cn("h-full rounded-full", over ? "bg-crit" : "bg-data")}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.3, ease: EASE }}
        />
      </div>
    </div>
  );

  return (
    <section data-tour="axle-view" className="bg-page py-[140px]">
      <style>{`@keyframes axle-shake { 0%,100% { transform: translateX(0);} 25% { transform: translateX(-3px);} 75% { transform: translateX(3px);} }`}</style>
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 lg:grid-cols-[55%_45%]">
        <div>
          <BlueprintCard className="p-6">
            <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
              <span>TRK-07 · 32FT MXL · SIDE ELEVATION</span>
              <span className={cn(overload ? "text-crit" : "text-data")}>{overload ? "OVERLOAD DEMO" : "AXLE-LEGAL ✓"}</span>
            </div>

            {/* truck diagram */}
            <div className="relative">
              <svg viewBox="0 0 460 150" className="w-full text-ink1" aria-hidden>
                {/* deck */}
                <rect x="90" y="30" width="340" height="70" fill="none" stroke="currentColor" strokeWidth="1.4" />
                {/* load silhouette */}
                <path d="M100 92 V52 h60 V38 h80 v14 h70 v40 Z" fill="var(--data-soft)" stroke="var(--data)" strokeWidth="1" strokeDasharray="4 3" />
                {/* cab */}
                <path d="M90 100 V44 h-30 l-16 26 v30 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
                {/* ground */}
                <line x1="0" y1="126" x2="460" y2="126" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                {/* wheels: steer (front), drive (rear) */}
                {[52, 150, 178].map((x) => (
                  <circle key={x} cx={x} cy="112" r="13" fill="none" stroke="currentColor" strokeWidth="1.4" />
                ))}
                {/* axle markers */}
                <line x1="52" y1="99" x2="52" y2="100" stroke="var(--accent)" strokeWidth="3" />
                <line x1="164" y1="99" x2="164" y2="100" stroke="var(--accent)" strokeWidth="3" />
                <text x="40" y="142" fill="currentColor" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="2">STEER</text>
                <text x="146" y="142" fill="currentColor" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="2">DRIVE</text>
              </svg>

              {/* CoG crosshair floats over the load, lerps on drag */}
              <motion.div
                className="pointer-events-none absolute top-[30px] flex flex-col items-center"
                animate={{ left: `${8 + (1 - cartonX) * 62 + 14}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ marginLeft: -14 }}
                aria-hidden
              >
                <Crosshair className={cn("h-7 w-7", overload ? "text-crit" : "text-brand")} />
                <span className="mt-1 rounded bg-surface px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-ink2 border border-line">
                  CoG {((1 - cartonX) * 100).toFixed(0)}%
                </span>
              </motion.div>

              {/* draggable demo carton on the deck */}
              <div
                ref={trackRef}
                className="absolute left-[19%] right-[6%] top-[58px] h-[36px] touch-none"
                onPointerMove={onPointerMove}
                onPointerUp={() => (dragging.current = false)}
                onPointerLeave={() => (dragging.current = false)}
              >
                <div
                  role="slider"
                  aria-label="Drag demo pallet along the deck"
                  aria-valuenow={Math.round(cartonX * 100)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") setCartonX((x) => Math.max(0, x - 0.05));
                    if (e.key === "ArrowRight") setCartonX((x) => Math.min(1, x + 0.05));
                  }}
                  onPointerDown={(e) => {
                    dragging.current = true;
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  }}
                  className="absolute flex h-9 w-11 cursor-grab items-center justify-center rounded-[3px] border border-[#8a6b4a]/60 bg-[#C8A27A] shadow active:cursor-grabbing"
                  style={{ left: `calc(${cartonX * 100}% - 22px)`, transition: dragging.current ? "none" : "left 0.2s ease" }}
                >
                  <GripVertical className="h-4 w-4 text-[#5c4426]" />
                </div>
              </div>
            </div>

            {/* axle gauges */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Bar label="STEER" limit="6T" value={`${steerT.toFixed(1)}T`} pct={steerPct} over={steerPct > 100} />
              <Bar label="DRIVE" limit="19T" value={`${driveT.toFixed(1)}T`} pct={drivePct} over={drivePct > 100} />
            </div>
          </BlueprintCard>
        </div>

        <div>
          <SectionKicker className="mb-4">ROAD.LEGAL</SectionKicker>
          <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
            <SplitWords text="Balanced loads don't get fined." />
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink1">
            Stackline solves placement against axle limits, not just volume. Drag a
            pallet and watch the crosshair move — that's what your loader's
            instinct used to guess.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "PER-AXLE LEGAL TABLES PER VEHICLE",
              "OVERLOAD HARD-BLOCK AT PLAN TIME",
              "LIVE CoG ENVELOPE DISPLAY",
            ].map((b) => (
              <li key={b} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink1">
                <span className="h-1.5 w-1.5 rounded-full bg-data" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
