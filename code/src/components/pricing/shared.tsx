import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Digit-roll flip: each character flips vertically (0.3s) when it changes.
 * Used for prices, bin counts and mono readouts.
 */
export function FlipDigits({
  text,
  className,
  charClassName,
}: {
  text: string;
  className?: string;
  charClassName?: string;
}) {
  return (
    <span className={cn("inline-flex overflow-hidden font-tnum", className)} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={`${i}-${ch === " " ? "sp" : ch}`} className="relative inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={ch}
              initial={{ y: "70%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-70%", opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE, delay: i * 0.02 }}
              className={cn("inline-block", ch === " " && "w-[0.3em]", charClassName)}
            >
              {ch === " " ? "\u00A0" : ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

export type Billing = "monthly" | "annual";

/** MONTHLY / ANNUAL segmented pill toggle with sliding indicator. */
export function BillingToggle({
  billing,
  onChange,
  className,
}: {
  billing: Billing;
  onChange: (b: Billing) => void;
  className?: string;
}) {
  const options: { id: Billing; label: string }[] = [
    { id: "monthly", label: "MONTHLY" },
    { id: "annual", label: "ANNUAL (-20%)" },
  ];
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-linestrong bg-surface p-1",
        className
      )}
      role="tablist"
      aria-label="Billing period"
    >
      {options.map((opt) => {
        const active = billing === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
              active ? "text-page" : "text-ink1 hover:text-ink0"
            )}
          >
            {active && (
              <motion.span
                layoutId="billing-pill"
                className="absolute inset-0 rounded-full bg-brand"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const TIERS = {
  pilot: {
    id: "pilot" as const,
    name: "PILOT",
    monthly: 349,
    annual: 279,
    meta: "1 WAREHOUSE · UP TO 2,000 BINS · 5 USERS",
    headroom: 2000,
  },
  scale: {
    id: "scale" as const,
    name: "SCALE",
    monthly: 899,
    annual: 719,
    meta: "3 WAREHOUSES · UP TO 15,000 BINS · 25 USERS",
    headroom: 15000,
  },
  enterprise: {
    id: "enterprise" as const,
    name: "ENTERPRISE",
    monthly: null,
    annual: null,
    meta: "UNLIMITED WAREHOUSES · UNLIMITED BINS · SSO/SAML",
    headroom: Infinity,
  },
};

export type TierId = keyof typeof TIERS;

export function tierForBins(bins: number): TierId {
  if (bins <= TIERS.pilot.headroom) return "pilot";
  if (bins <= TIERS.scale.headroom) return "scale";
  return "enterprise";
}

export function formatBins(n: number): string {
  return n.toLocaleString("en-US");
}
