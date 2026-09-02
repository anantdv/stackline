import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import PhoneFrame, { PhoneTabBar } from "@/components/mobile/PhoneFrame";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Continuous (not once) viewport visibility — demos loop only when visible. */
function useInViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, active };
}

/* ---------------- 1. Camera barcode scan ---------------- */

const BarcodeScreen = memo(function BarcodeScreen({ active }: { active: boolean }) {
  // cycle: scan → lock → sheet
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setPhase((p) => ((p + 1) % 3) as 0 | 1 | 2), 2200);
    return () => window.clearInterval(t);
  }, [active]);

  return (
    <div className="relative flex flex-1 flex-col px-4 pb-2 pt-3">
      {/* viewfinder */}
      <div className="relative h-[300px] overflow-hidden rounded-xl border border-line bg-void">
        {/* carton + barcode */}
        <div className="absolute left-1/2 top-1/2 h-[120px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#C8A27A]/90 p-2">
          <div className="flex h-10 items-end gap-[2px] bg-white px-2 py-1">
            {Array.from({ length: 22 }, (_, i) => (
              <span key={i} className="bg-black" style={{ width: i % 3 === 0 ? 3 : 1.5, height: "100%" }} />
            ))}
          </div>
          <div className="mt-1 font-mono text-[8px] tracking-[0.2em] text-black/70">SKU-0417</div>
        </div>
        {/* scanline */}
        {active && phase === 0 && (
          <motion.div
            className="absolute left-2 right-2 h-[2px] rounded-full bg-brand shadow-glow"
            animate={{ y: [10, 280, 10] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* corner brackets lock */}
        <motion.div
          animate={phase >= 1 ? { scale: 0.92, opacity: 1 } : { scale: 1.05, opacity: 0.5 }}
          transition={{ duration: 0.3 }}
          className="absolute left-1/2 top-1/2 h-[140px] w-[170px] -translate-x-1/2 -translate-y-1/2"
        >
          {[
            "left-0 top-0 border-l-2 border-t-2",
            "right-0 top-0 border-r-2 border-t-2",
            "bottom-0 left-0 border-b-2 border-l-2",
            "bottom-0 right-0 border-b-2 border-r-2",
          ].map((pos) => (
            <span
              key={pos}
              className={cn("absolute h-5 w-5", pos, phase >= 1 ? "border-data" : "border-brand")}
            />
          ))}
        </motion.div>
        {/* green flash on lock */}
        <AnimatePresence>
          {phase === 1 && (
            <motion.div
              initial={{ opacity: 0.55 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-data/40"
            />
          )}
        </AnimatePresence>
        <span className="absolute left-2 top-2 font-mono text-[7px] uppercase tracking-[0.16em] text-ink2">
          {phase === 0 ? "SCANNING…" : phase === 1 ? "LOCKED ✓" : "DECODED"}
        </span>
      </div>
      {/* result bottom sheet */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="absolute inset-x-4 bottom-10 rounded-xl border border-data/40 bg-raised p-3"
          >
            <div className="font-mono text-[9px] tracking-[0.1em] text-data">SKU-0417 WIRELESS SCANNER</div>
            <div className="mt-1 font-mono text-[8px] tracking-[0.14em] text-ink2">PICK 2 OF 12 · BIN A-04-02-03</div>
          </motion.div>
        )}
      </AnimatePresence>
      <PhoneTabBar active="SCAN" />
    </div>
  );
});

/* ---------------- 2. QR bin label ---------------- */

function QrGlyph({ className }: { className?: string }) {
  // deterministic pseudo-QR
  const cells: boolean[] = [];
  let seed = 42;
  for (let i = 0; i < 100; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    cells.push(seed % 3 !== 0);
  }
  return (
    <svg viewBox="0 0 10 10" className={className} aria-hidden>
      <rect width="10" height="10" fill="white" />
      {cells.map((on, i) =>
        on ? <rect key={i} x={i % 10} y={Math.floor(i / 10)} width="0.9" height="0.9" fill="black" /> : null
      )}
      <rect x="0.5" y="0.5" width="2.4" height="2.4" fill="none" stroke="black" strokeWidth="0.7" />
      <rect x="7" y="0.5" width="2.4" height="2.4" fill="none" stroke="black" strokeWidth="0.7" />
      <rect x="0.5" y="7" width="2.4" height="2.4" fill="none" stroke="black" strokeWidth="0.7" />
    </svg>
  );
}

const QrScreen = memo(function QrScreen({ active }: { active: boolean }) {
  const [cardOpen, setCardOpen] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setCardOpen((v) => !v), 3000);
    return () => window.clearInterval(t);
  }, [active]);

  return (
    <div className="relative flex flex-1 flex-col px-4 pb-2 pt-3">
      {/* rack beam with QR */}
      <div className="relative h-[300px] overflow-hidden rounded-xl border border-line bg-void">
        <div className="absolute inset-x-4 top-10 h-3 rounded-sm bg-brand/80" />
        <div className="absolute inset-x-4 top-32 h-3 rounded-sm bg-brand/60" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-line bg-white/5 p-2">
          <QrGlyph className="h-16 w-16" />
        </div>
        {active && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-md border-2"
            animate={{ borderColor: ["var(--accent)", "var(--data)"], scale: [1.1, 1] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2.4, repeatType: "reverse" }}
          />
        )}
        <span className="absolute left-2 top-2 font-mono text-[7px] uppercase tracking-[0.16em] text-ink2">
          {cardOpen ? "BIN CARD OPEN" : "AIM AT BIN LABEL"}
        </span>
      </div>
      {/* bin card */}
      <AnimatePresence>
        {cardOpen && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-x-4 bottom-10 rounded-xl border border-linestrong bg-raised p-3"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-ink0">A-04-02-03</span>
              <span className="font-mono text-[9px] text-warn">82%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-page">
              <div className="h-full w-[82%] rounded-full bg-warn" />
            </div>
            <div className="mt-1 font-mono text-[8px] tracking-[0.12em] text-ink2">14/17 CARTONS</div>
            <div className="mt-2 flex gap-1.5">
              {["PUTAWAY", "MOVE", "COUNT"].map((a) => (
                <span key={a} className="flex-1 rounded-md border border-line px-1 py-1 text-center font-mono text-[7px] tracking-[0.12em] text-ink1">
                  {a}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PhoneTabBar active="SCAN" />
    </div>
  );
});

/* ---------------- 3. NFC tap ---------------- */

const NfcScreen = memo(function NfcScreen({ active }: { active: boolean }) {
  const [verified, setVerified] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setVerified((v) => !v), 1600);
    return () => window.clearInterval(t);
  }, [active]);

  return (
    <div className="relative flex flex-1 flex-col px-4 pb-2 pt-3">
      <div className="relative flex h-[300px] items-center justify-center overflow-hidden rounded-xl border border-line bg-void">
        {/* NFC tag glyph */}
        <div
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-xl border transition-colors duration-300",
            verified ? "border-data bg-data-soft" : "border-linestrong bg-raised"
          )}
        >
          <span className="font-mono text-[8px] tracking-[0.12em] text-ink2">NFC</span>
          {/* expanding rings */}
          {active && !verified &&
            [0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute inset-0 rounded-xl border border-data animate-[ripple_1.6s_ease-out_infinite]"
                style={{ animationDelay: `${i * 0.5}s` }}
                aria-hidden
              />
            ))}
        </div>
        <span className="absolute left-2 top-2 font-mono text-[7px] uppercase tracking-[0.16em] text-ink2">
          {verified ? "CONTACT ✓" : "HOLD NEAR TAG"}
        </span>
      </div>
      {/* task card checks off */}
      <div
        className={cn(
          "absolute inset-x-4 bottom-10 flex items-center gap-2 rounded-xl border p-3 transition-colors duration-500",
          verified ? "border-data/50 bg-data-soft" : "border-line bg-raised"
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300",
            verified ? "bg-data text-void" : "border border-linestrong text-transparent"
          )}
        >
          <Check className="h-3 w-3" />
        </span>
        <span className="font-mono text-[9px] tracking-[0.1em] text-ink0">
          {verified ? "✓ PALLET PAL-2211 VERIFIED" : "PALLET PAL-2211 · TAP TO VERIFY"}
        </span>
      </div>
      <PhoneTabBar active="TASKS" />
    </div>
  );
});

/* ---------------- triptych ---------------- */

const DEMOS = [
  {
    key: "camera",
    tour: "mobile-scan",
    title: "CAMERA BARCODE",
    caption:
      "Native MLKit/Vision scanning — 1D/2D barcodes at arm's length, no dedicated hardware required.",
    Screen: BarcodeScreen,
  },
  {
    key: "qr",
    tour: "mobile-qr",
    title: "QR BIN LABELS",
    caption:
      "Every bin label printed from Stackline opens its live card. Wrong aisle? The map walks you there.",
    Screen: QrScreen,
  },
  {
    key: "nfc",
    tour: "mobile-nfc",
    title: "NFC TAP",
    caption:
      "Tap-to-verify on NFC-tagged pallets, totes and doors — no camera aim, gloves-friendly.",
    Screen: NfcScreen,
  },
];

function DemoColumn({ demo, index }: { demo: (typeof DEMOS)[number]; index: number }) {
  const { ref, active } = useInViewport<HTMLDivElement>();
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: EASE }}
      className="flex flex-col items-center"
    >
      <motion.div
        data-tour={demo.tour}
        animate={{ y: hover ? -8 : 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
      >
        <PhoneFrame width={280} height={570}>
          <demo.Screen active={active} />
        </PhoneFrame>
      </motion.div>
      <div className="mt-6 max-w-[280px] text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">{demo.title}</span>
        <p className="mt-2 text-sm leading-[1.6] text-ink1">{demo.caption}</p>
      </div>
    </motion.div>
  );
}

export default function SenseTriptych() {
  return (
    <section className="bg-page px-6 py-24 md:py-40">
      <div className="mx-auto max-w-[1280px]">
        <SectionKicker>SENSES</SectionKicker>
        <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[52px] md:leading-[1.02]">
          <SplitWords text="Point. Tap. Done." />
        </h2>
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-6">
          {DEMOS.map((d, i) => (
            <DemoColumn key={d.key} demo={d} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
