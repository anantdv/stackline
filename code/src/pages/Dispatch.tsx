import { useState } from "react";
import DispatchHero from "@/components/dispatch/DispatchHero";
import MethodRules from "@/components/dispatch/MethodRules";
import DispatchLine from "@/components/dispatch/DispatchLine";
import ValidityWall from "@/components/dispatch/ValidityWall";
import InvoiceChain from "@/components/dispatch/InvoiceChain";
import RulesTable from "@/components/dispatch/RulesTable";
import DispatchCta from "@/components/dispatch/DispatchCta";
import DocPreviewDrawer from "@/components/dispatch/DocPreviewDrawer";
import type { DemoDoc } from "@/components/dispatch/data";

/**
 * /dispatch — Invoicing & statutory compliance (dispatch.md).
 * Story leg 3: load plan (/transport) → docs & invoice (here) → gate (/gate).
 */
export default function Dispatch() {
  const [preview, setPreview] = useState<DemoDoc | null>(null);
  return (
    <>
      <DispatchHero />
      <MethodRules onOpenDoc={setPreview} />
      <DispatchLine onOpenDoc={setPreview} />
      <ValidityWall onOpenDoc={setPreview} />
      <InvoiceChain />
      <RulesTable />
      <DispatchCta />
      <DocPreviewDrawer doc={preview} onClose={() => setPreview(null)} />
    </>
  );
}
