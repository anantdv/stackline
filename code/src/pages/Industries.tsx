import IndustriesHero from "@/components/industries/IndustriesHero";
import IndustryTabs from "@/components/industries/IndustryTabs";
import CaseCards from "@/components/industries/CaseCards";
import PresetMarquee from "@/components/industries/PresetMarquee";
import IndustriesCta from "@/components/industries/IndustriesCta";

export default function Industries() {
  return (
    <>
      {/* 1 — Hero: One twin. Every kind of floor. */}
      <IndustriesHero />
      {/* 2 — Industry tab panels */}
      <IndustryTabs />
      {/* 3 — Case study cards */}
      <CaseCards />
      {/* 4 — Preset strip marquee */}
      <PresetMarquee />
      {/* 5 — CTA band */}
      <IndustriesCta />
    </>
  );
}
