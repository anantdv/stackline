import ErpnextHero from "@/components/erpnext/ErpnextHero";
import SyncStory from "@/components/erpnext/SyncStory";
import DoctypeMap from "@/components/erpnext/DoctypeMap";
import SetupSteps from "@/components/erpnext/SetupSteps";
import ConnectionPanel from "@/components/erpnext/ConnectionPanel";
import SecurityGrid from "@/components/erpnext/SecurityGrid";
import ErpnextCta from "@/components/erpnext/ErpnextCta";

export default function Erpnext() {
  return (
    <>
      {/* 1 — Hero: Not an integration. A mirror. */}
      <ErpnextHero />
      {/* 2 — How the sync works (pinned MODEL / MOVE / VERIFY) */}
      <SyncStory />
      {/* 3 — Doctype mapping table */}
      <DoctypeMap />
      {/* 4 — Setup in four steps */}
      <SetupSteps />
      {/* 5 — Live connection panel (tRPC) */}
      <ConnectionPanel />
      {/* 6 — Security & governance */}
      <SecurityGrid />
      {/* 7 — CTA band */}
      <ErpnextCta />
    </>
  );
}
