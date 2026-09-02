import { motion } from "framer-motion";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ROW_A = [
  "EURO-PALLET 800×1200",
  "SHELF 400×600",
  "FEFO",
  "ABC-VELOCITY",
  "WAVE-PICK",
  "CROSS-DOCK",
  "COLD 2–8°C",
  "HAZMAT-SEG",
  "KITTING",
  "CYCLE-COUNT-W",
];

const ROW_B = [
  "MIN/MAX FACES",
  "BATCH-LOCK",
  "CATCH-WEIGHT",
  "LINE-SIDE STAGING",
  "CLIENT SEGREGATION",
  "ALLERGEN ZONE",
  "SAME-DAY CUTOFF",
  "BACKFLUSH",
  "QUARANTINE",
  "BIN 400×300",
];

function MarqueeRow({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span
          key={`${key}-${i}`}
          className="mx-2 whitespace-nowrap rounded-lg border border-line bg-surface px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-ink1"
        >
          {item}
        </span>
      ))}
    </div>
  );
  return (
    <div
      className={cn(
        "flex w-max animate-marquee group-hover:[animation-play-state:paused]",
        reverse && "[animation-direction:reverse]",
      )}
      style={{ animationDuration: "30s" }}
    >
      {row("a")}
      {row("b")}
    </div>
  );
}

export default function PresetMarquee() {
  return (
    <section className="overflow-hidden bg-page py-20 md:py-24">
      <div className="mx-auto max-w-[1280px] px-6 text-center">
        <h3 className="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-ink0 md:text-3xl">
          <SplitWords text="Every preset is a starting point." />
        </h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
          className="mx-auto mt-4 max-w-[620px] text-[15px] leading-[1.65] text-ink1"
        >
          Mix rack profiles, allocation rules and workflow templates across
          zones — pharma FEFO in one aisle, bulk pallets in the next.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ delay: 0.25, duration: 0.8 }}
        className="group mt-12 space-y-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <MarqueeRow items={ROW_A} />
        <MarqueeRow items={ROW_B} reverse />
      </motion.div>
    </section>
  );
}
