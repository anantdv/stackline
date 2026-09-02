import Hero from "@/components/home/Hero";
import TwinStory from "@/components/home/TwinStory";
import Engines from "@/components/home/Engines";
import OpsConsole from "@/components/home/OpsConsole";
import ErpnextBand from "@/components/home/ErpnextBand";
import CaseSnapshot from "@/components/home/CaseSnapshot";
import FinalCta from "@/components/home/FinalCta";
import TelemetryTicker from "@/components/TelemetryTicker";

export default function Home() {
  return (
    <>
      {/* 1 — Hero: The Living Twin */}
      <Hero />
      {/* 2 — Telemetry ticker */}
      <TelemetryTicker />
      {/* 3 — Floor plan → Digital twin (pinned story) */}
      <TwinStory />
      {/* 4 — Four engines */}
      <Engines />
      {/* 5 — Live operations console */}
      <OpsConsole />
      {/* 6 — ERPNext integration band */}
      <ErpnextBand />
      {/* 7 — Case snapshot */}
      <CaseSnapshot />
      {/* 8 — Final CTA */}
      <FinalCta />
    </>
  );
}
