import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Orbit,
  Hand,
  Footprints,
  Layers,
  Maximize2,
  Minimize2,
  UnfoldVertical,
  FoldVertical,
} from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { trpc } from "@/providers/trpc";
import { useTwinConfig } from "@/components/warehouse/twin-config";
import {
  adaptLiveLayout,
  buildCustomLayout,
  buildDemoLayout,
  type FullLayout,
  type ViewerBin,
} from "@/components/warehouse/data";
import BinDrawer from "@/components/warehouse/viewer/BinDrawer";
import type { DisplayMode, NavMode } from "@/components/warehouse/viewer/ViewerScene";
import { cn } from "@/lib/utils";

const ViewerScene = lazy(
  () => import("@/components/warehouse/viewer/ViewerScene")
);

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Orbit;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        aria-label={label}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200",
          active
            ? "border-brand bg-brand text-page shadow-glow"
            : "border-line bg-raised/90 text-ink1 hover:border-linestrong hover:text-ink0"
        )}
      >
        <Icon className="h-[17px] w-[17px]" />
      </button>
      <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded border border-linestrong bg-void px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

const MODES: Array<{ id: DisplayMode; label: string }> = [
  { id: "solid", label: "SOLID" },
  { id: "wireframe", label: "WIREFRAME" },
  { id: "heatmap", label: "HEATMAP" },
  { id: "xray", label: "X-RAY" },
];

function ViewerFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_45%,#151b23_0%,#07090C_70%)]">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink2">
        Initializing twin renderer…
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function WarehouseViewer() {
  const { config, source, setSource, generation } = useTwinConfig();

  // Live data with graceful fallback to the baked-in demo dataset
  const warehousesQ = trpc.wms.warehouses.list.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const warehouseId = warehousesQ.data?.[0]?.id ?? 1;
  const layoutQ = trpc.wms.layout.getFullLayout.useQuery(
    { warehouseId },
    { retry: 1, refetchOnWindowFocus: false }
  );
  const utilQ = trpc.wms.stock.warehouseUtilization.useQuery(
    { warehouseId },
    { retry: 1, refetchOnWindowFocus: false }
  );

  const demoLayout = useMemo(buildDemoLayout, []);
  const liveLayout = useMemo(() => {
    const data = layoutQ.data as FullLayout | null | undefined;
    return data && data.racks.length > 0 ? adaptLiveLayout(data) : null;
  }, [layoutQ.data]);
  const customLayout = useMemo(
    () => buildCustomLayout(config),
    [config, generation]
  );

  const maindc = liveLayout ?? demoLayout;
  const layout = source === "custom" ? customLayout : maindc;
  const live = layout.live;

  const [mode, setMode] = useState<DisplayMode>("solid");
  const [navMode, setNavMode] = useState<NavMode>("orbit");
  const [showCartons, setShowCartons] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [selected, setSelected] = useState<ViewerBin | null>(null);

  // Fullscreen handling
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void cardRef.current?.requestFullscreen?.();
  };

  // Close drawer when the dataset switches
  useEffect(() => setSelected(null), [source, generation]);

  const stats = useMemo(() => {
    if (source === "maindc" && utilQ.data) {
      return {
        bins: utilQ.data.bins,
        used: utilQ.data.usedBins,
        cartons: utilQ.data.totalCartons,
      };
    }
    return {
      bins: layout.bins.length,
      used: layout.usedBins,
      cartons: layout.totalCartons,
    };
  }, [source, utilQ.data, layout]);

  const sceneKey = `${layout.code}-${layout.rows}x${layout.bays}x${layout.levels}-${generation}`;

  return (
    <section id="viewer" className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>LIVE.VIEWER</SectionKicker>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Orbit it. Explode it. X-ray it." />
          </h2>
          <p className="max-w-[420px] text-sm leading-[1.65] text-ink1 md:text-base">
            Every bin is a live, clickable object. Click any cell to inspect
            contents, capacity and ERPNext state.
          </p>
        </div>

        {/* Viewer card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mt-12"
        >
          <div
            ref={cardRef}
            className="overflow-hidden rounded-xl border border-line bg-void"
          >
            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSource("maindc")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                    source === "maindc"
                      ? "border-brand/60 bg-brand-soft text-ink0"
                      : "border-line text-ink2 hover:text-ink1"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      liveLayout ? "bg-data animate-pulse-dot" : "bg-warn"
                    )}
                  />
                  {maindc.code}
                  <span className="text-[9px] text-ink2">
                    {liveLayout ? "LIVE" : "DEMO"}
                  </span>
                </button>
                <button
                  onClick={() => setSource("custom")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                    source === "custom"
                      ? "border-brand/60 bg-brand-soft text-ink0"
                      : "border-line text-ink2 hover:text-ink1"
                  )}
                >
                  CUSTOM TWIN
                  <span className="text-[9px] text-ink2">
                    {config.rows}×{config.bays}×{config.levels}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-5 font-mono text-[11px] tracking-[0.1em] text-ink2">
                <span>
                  BINS <span className="text-ink0 font-tnum">{stats.bins.toLocaleString()}</span>
                </span>
                <span>
                  USED{" "}
                  <span className="text-data font-tnum">
                    {stats.bins ? Math.round((stats.used / stats.bins) * 100) : 0}%
                  </span>
                </span>
                <span className="hidden sm:inline">
                  CARTONS <span className="text-ink0 font-tnum">{stats.cartons.toLocaleString()}</span>
                </span>
              </div>
            </div>

            {/* Canvas region */}
            <div className="relative aspect-[16/9] min-h-[420px]">
              <Suspense fallback={<ViewerFallback />}>
                <ViewerScene
                  key={sceneKey}
                  layout={layout}
                  mode={mode}
                  navMode={navMode}
                  showCartons={showCartons}
                  showLabels={showLabels}
                  exploded={exploded}
                  selectedCode={selected?.code ?? null}
                  onSelect={(b) => setSelected(b)}
                />
              </Suspense>

              {/* Left toolbar */}
              <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
                <ToolButton
                  icon={Orbit}
                  label="Orbit"
                  active={navMode === "orbit"}
                  onClick={() => setNavMode("orbit")}
                />
                <ToolButton
                  icon={Hand}
                  label="Pan"
                  active={navMode === "pan"}
                  onClick={() => setNavMode("pan")}
                />
                <ToolButton
                  icon={Footprints}
                  label="Walk (WASD)"
                  active={navMode === "walk"}
                  onClick={() => setNavMode("walk")}
                />
                <div className="mx-auto h-px w-6 bg-linestrong" />
                <ToolButton
                  icon={exploded ? FoldVertical : UnfoldVertical}
                  label={exploded ? "Collapse" : "Explode"}
                  active={exploded}
                  onClick={() => setExploded((v) => !v)}
                />
                <div className="relative">
                  <ToolButton
                    icon={Layers}
                    label="Layers"
                    active={layersOpen || !showCartons || showLabels}
                    onClick={() => setLayersOpen((v) => !v)}
                  />
                  {layersOpen && (
                    <div className="absolute left-[calc(100%+10px)] top-0 z-30 w-48 rounded-lg border border-linestrong bg-raised p-2 shadow-2xl">
                      {[
                        { label: "CARTONS", value: showCartons, set: () => setShowCartons((v) => !v) },
                        { label: "BIN LABELS", value: showLabels, set: () => setShowLabels((v) => !v) },
                        {
                          label: "HEATMAP",
                          value: mode === "heatmap",
                          set: () => setMode((m) => (m === "heatmap" ? "solid" : "heatmap")),
                        },
                      ].map((row) => (
                        <button
                          key={row.label}
                          onClick={row.set}
                          className="flex w-full items-center justify-between rounded-md px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1 transition-colors hover:bg-surface hover:text-ink0"
                        >
                          {row.label}
                          <span
                            className={cn(
                              "h-3.5 w-7 rounded-full border transition-colors",
                              row.value ? "border-data bg-data/30" : "border-linestrong bg-void"
                            )}
                          >
                            <span
                              className={cn(
                                "block h-2.5 w-2.5 translate-y-[1px] rounded-full transition-all",
                                row.value ? "translate-x-[15px] bg-data" : "translate-x-[3px] bg-ink2"
                              )}
                            />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mx-auto h-px w-6 bg-linestrong" />
                <ToolButton
                  icon={isFullscreen ? Minimize2 : Maximize2}
                  label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  onClick={toggleFullscreen}
                />
              </div>

              {/* Walk-mode hint */}
              {navMode === "walk" && (
                <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-lg border border-data/40 bg-void/85 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-data">
                  WASD move · drag look · shift sprint
                </div>
              )}

              {/* Bottom mode bar */}
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 rounded-lg border border-linestrong bg-raised/90 p-1 backdrop-blur">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "rounded-md px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-all duration-200",
                      mode === m.id
                        ? "bg-brand text-page"
                        : "text-ink2 hover:text-ink0"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Bin detail drawer */}
              <BinDrawer
                bin={selected}
                live={live}
                onClose={() => setSelected(null)}
              />
            </div>

            {/* Footer strip */}
            <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
              <span>
                {layout.name} · {layout.rows} ROWS × {layout.bays} BAYS ×{" "}
                {layout.levels} LEVELS
              </span>
              <span className="hidden md:inline">
                {layoutQ.isError || warehousesQ.isError
                  ? "API UNREACHABLE — DEMO DATASET"
                  : liveLayout
                    ? "ERPNEXT SYNCED"
                    : "CONNECTING…"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
