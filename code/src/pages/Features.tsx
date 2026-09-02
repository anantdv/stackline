import FeaturesHero from "@/components/features/FeaturesHero";
import EngineAnchorNav from "@/components/features/EngineAnchorNav";
import EngineMovement from "@/components/features/EngineMovement";
import EngineCapacity from "@/components/features/EngineCapacity";
import EngineAllocation from "@/components/features/EngineAllocation";
import EngineWorkflow from "@/components/features/EngineWorkflow";
import BeforeAfter from "@/components/features/BeforeAfter";
import FeaturesCta from "@/components/features/FeaturesCta";

export default function Features() {
  return (
    <>
      {/* 1 — Hero */}
      <FeaturesHero />
      {/* Sticky engine anchor-nav (pins under navbar through §2–§5) */}
      <div>
        <EngineAnchorNav />
        {/* 2 — Engine 01 · Visual Stock Movement */}
        <EngineMovement />
        {/* 3 — Engine 02 · Bin Capacity Calculator */}
        <EngineCapacity />
        {/* 4 — Engine 03 · Auto-Allocation Engine */}
        <EngineAllocation />
        {/* 5 — Engine 04 · Workflow Orchestration */}
        <EngineWorkflow />
      </div>
      {/* 6 — Before / After */}
      <BeforeAfter />
      {/* 7 — CTA band */}
      <FeaturesCta />
    </>
  );
}
