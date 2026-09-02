import { useState } from "react";
import PricingHero from "@/components/pricing/PricingHero";
import TierCards from "@/components/pricing/TierCards";
import PriceCalculator from "@/components/pricing/PriceCalculator";
import ComparisonTable from "@/components/pricing/ComparisonTable";
import PricingFaq from "@/components/pricing/PricingFaq";
import PricingCta from "@/components/pricing/PricingCta";
import type { Billing } from "@/components/pricing/shared";

export default function Pricing() {
  // One shared billing state drives the hero toggle, tier cards and calculator.
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <>
      {/* 1 — Hero + billing toggle */}
      <PricingHero billing={billing} onBillingChange={setBilling} />
      {/* 2 — Tier cards */}
      <TierCards billing={billing} />
      {/* 3 — Signature bin-count calculator */}
      <PriceCalculator billing={billing} />
      {/* 4 — Feature comparison table */}
      <ComparisonTable />
      {/* 5 — FAQ */}
      <PricingFaq />
      {/* 6 — CTA band */}
      <PricingCta />
    </>
  );
}
