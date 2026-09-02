import { TwinConfigProvider } from "@/components/warehouse/twin-config";
import ErrorBoundary from "@/components/ErrorBoundary";
import WarehouseHero from "@/components/warehouse/HeroSection";
import PipelineSection from "@/components/warehouse/PipelineSection";
import WarehouseViewer from "@/components/warehouse/viewer/WarehouseViewer";
import ConfiguratorSection from "@/components/warehouse/ConfiguratorSection";
import CapacityCalculator from "@/components/warehouse/CapacityCalculator";
import LabelsSection from "@/components/warehouse/LabelsSection";
import WarehouseCta from "@/components/warehouse/WarehouseCta";
import TelemetryTicker from "@/components/TelemetryTicker";

/**
 * /warehouse-3d — Digital-twin converter product page:
 * floor-plan import → parametric racks & bins, interactive 3D viewer
 * (orbit / walk / heatmap / x-ray / explode), live capacity calculator.
 */
export default function Warehouse3D() {
  return (
    <TwinConfigProvider>
      {/* 1 — Hero: single bay assembling in a loop */}
      <ErrorBoundary fallbackLabel="3D scene">
        <WarehouseHero />
      </ErrorBoundary>
      {/* 2 — Conversion pipeline */}
      <PipelineSection />
      {/* 3 — Interactive 3D viewer (centerpiece) */}
      <ErrorBoundary fallbackLabel="3D viewer">
        <WarehouseViewer />
      </ErrorBoundary>
      {/* 4 — Parametric rack & bin configurator */}
      <ErrorBoundary fallbackLabel="Twin configurator">
        <ConfiguratorSection />
      </ErrorBoundary>
      {/* 5 — Capacity calculator demo */}
      <CapacityCalculator />
      {/* Telemetry strip */}
      <TelemetryTicker />
      {/* 6 — Labels & hardware */}
      <LabelsSection />
      {/* 7 — CTA band */}
      <WarehouseCta />
    </TwinConfigProvider>
  );
}
