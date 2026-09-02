import { useCallback, useState } from "react";
import WorkflowHero from "@/components/workflow/WorkflowHero";
import NodePalette from "@/components/workflow/NodePalette";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import PinnedWalkthrough from "@/components/workflow/PinnedWalkthrough";
import TemplateLibrary from "@/components/workflow/TemplateLibrary";
import SlaEscalation from "@/components/workflow/SlaEscalation";
import WorkflowCta from "@/components/workflow/WorkflowCta";
import {
  TEMPLATES,
  instantiateTemplate,
  type BuilderGraph,
  type WorkflowTemplate,
} from "@/components/workflow/builder-data";

export default function Workflow() {
  const [graph, setGraph] = useState<BuilderGraph>(() =>
    instantiateTemplate(TEMPLATES[0])
  );

  const useTemplate = useCallback((t: WorkflowTemplate) => {
    setGraph(instantiateTemplate(t));
    document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      {/* 1 — Hero */}
      <WorkflowHero />
      {/* 2 — Node palette (builder anatomy) */}
      <NodePalette />
      {/* 3 — Interactive builder canvas */}
      <WorkflowBuilder graph={graph} onChange={setGraph} />
      {/* 4 — Pinned walkthrough: Purchase Receipt → Putaway */}
      <PinnedWalkthrough />
      {/* 5 — Template library */}
      <TemplateLibrary onUseTemplate={useTemplate} />
      {/* 6 — SLA, roles & escalation */}
      <SlaEscalation />
      {/* 7 — CTA band */}
      <WorkflowCta />
    </>
  );
}
