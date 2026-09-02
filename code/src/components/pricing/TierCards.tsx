import { motion } from "framer-motion";
import { Check } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import { cn } from "@/lib/utils";
import { EASE, FlipDigits, TIERS, type Billing } from "@/components/pricing/shared";

const TIER_FEATURES: Record<string, string[]> = {
  pilot: [
    "3D twin + viewer",
    "Visual stock movement",
    "Bin capacity calculator",
    "ERPNext sync (v14/v15)",
    "Email support",
  ],
  scale: [
    "Everything in Pilot",
    "Auto-allocation engine",
    "Workflow studio + templates",
    "Cycle count automation",
    "Role-based zones",
    "Priority support",
  ],
  enterprise: [
    "Everything in Scale",
    "Self-hosted deployment",
    "Dedicated success engineer",
    "Custom doctype extensions",
    "SLA 99.9%",
    "On-site rollout",
  ],
};

const TIER_CTA: Record<string, { label: string; primary: boolean }> = {
  pilot: { label: "Start pilot", primary: false },
  scale: { label: "Book a live demo", primary: true },
  enterprise: { label: "Talk to us", primary: false },
};

function TierCard({
  tierId,
  billing,
  highlighted,
  index,
}: {
  tierId: keyof typeof TIERS;
  billing: Billing;
  highlighted?: boolean;
  index: number;
}) {
  const tier = TIERS[tierId];
  const price = billing === "monthly" ? tier.monthly : tier.annual;
  const cta = TIER_CTA[tierId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ delay: index * 0.12, duration: 0.8, ease: EASE }}
      className={cn(highlighted && "lg:scale-[1.04] lg:hover:scale-[1.04]")}
    >
      <BlueprintCard
        className={cn(
          "relative flex h-full flex-col overflow-visible p-8",
          highlighted &&
            "border-brand shadow-glow hover:-translate-y-0.5 hover:border-brand"
        )}
      >
        {highlighted && (
          <motion.span
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 + 0.3, duration: 0.4, ease: EASE }}
            className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-page"
          >
            Most deployed
          </motion.span>
        )}

        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
          {tier.name}
        </span>

        <div className="mt-4 flex items-baseline gap-2">
          {price !== null ? (
            <>
              <span className="font-display text-[52px] font-semibold leading-none tracking-tight text-ink0">
                <FlipDigits text={`$${price}`} />
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink2">
                /mo
              </span>
            </>
          ) : (
            <span className="font-display text-[52px] font-semibold leading-none tracking-tight text-ink0">
              CUSTOM
            </span>
          )}
        </div>

        <p className="mt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-ink2">
          {tier.meta}
        </p>

        <ul className="mt-8 flex flex-1 flex-col gap-3">
          {TIER_FEATURES[tierId].map((f, i) => (
            <motion.li
              key={f}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ delay: index * 0.12 + 0.25 + i * 0.04, duration: 0.4, ease: EASE }}
              className="flex items-start gap-3 text-sm text-ink1"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-data" strokeWidth={2.5} />
              {f}
            </motion.li>
          ))}
        </ul>

        <div className="mt-8">
          {cta.primary ? (
            <PrimaryButton to="/contact" className="w-full">
              {cta.label}
            </PrimaryButton>
          ) : (
            <GhostButton to="/contact" className="w-full">
              {cta.label}
            </GhostButton>
          )}
        </div>
      </BlueprintCard>
    </motion.div>
  );
}

export default function TierCards({ billing }: { billing: Billing }) {
  return (
    <section className="bg-page px-6 py-24 md:py-[140px]">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          <TierCard tierId="pilot" billing={billing} index={0} />
          <TierCard tierId="scale" billing={billing} highlighted index={1} />
          <TierCard tierId="enterprise" billing={billing} index={2} />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink2"
        >
          All plans: no middleware fees · cancel monthly · your data stays on your Frappe site
        </motion.p>
      </div>
    </section>
  );
}
