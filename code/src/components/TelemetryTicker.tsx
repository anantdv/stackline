import { cn } from "@/lib/utils";

const DEFAULT_ITEMS = [
  "BIN A-04-02-03 ▸ 82%",
  "PUTAWAY #2841 COMPLETE",
  "STOCK ENTRY STE-2025-0117 POSTED",
  "CAPACITY SCAN 1,152 BINS",
  "AUTO-ALLOCATION: 34 CARTONS ROUTED",
  "SYNC LATENCY 12MS",
  "CYCLE COUNT ZONE C ▸ 99.2% ACCURACY",
];

/** Infinite mono marquee with teal values. Pauses on hover. */
export default function TelemetryTicker({
  items = DEFAULT_ITEMS,
  className,
  duration = 28,
}: {
  items?: string[];
  className?: string;
  duration?: number;
}) {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item, i) => {
        const [label, value] = item.split("▸");
        return (
          <span
            key={`${key}-${i}`}
            className="flex items-center whitespace-nowrap font-mono text-xs tracking-[0.08em] text-ink1"
          >
            <span className="px-4">
              {label}
              {value && <span className="text-data">▸{value}</span>}
            </span>
            <span className="text-ink2">▪</span>
          </span>
        );
      })}
    </div>
  );
  return (
    <div
      className={cn(
        "group overflow-hidden border-y border-line bg-page py-5",
        className
      )}
    >
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${duration}s` }}
      >
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
