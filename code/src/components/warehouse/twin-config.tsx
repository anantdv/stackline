import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_TWIN_CONFIG,
  type TwinConfig,
} from "@/components/warehouse/data";

export type ViewerSource = "maindc" | "custom";

interface TwinConfigState {
  config: TwinConfig;
  setConfig: (patch: Partial<TwinConfig>) => void;
  source: ViewerSource;
  /** Apply config, switch the viewer to the custom twin and scroll to it. */
  generateCustomTwin: (cfg?: TwinConfig) => void;
  setSource: (s: ViewerSource) => void;
  /** Bumps every time a custom twin is (re)generated — forces scene remount. */
  generation: number;
}

const Ctx = createContext<TwinConfigState | null>(null);

export function TwinConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<TwinConfig>(DEFAULT_TWIN_CONFIG);
  const [source, setSource] = useState<ViewerSource>("maindc");
  const [generation, setGeneration] = useState(0);

  const setConfig = useCallback((patch: Partial<TwinConfig>) => {
    setConfigState((c) => ({ ...c, ...patch }));
  }, []);

  const generateCustomTwin = useCallback((cfg?: TwinConfig) => {
    if (cfg) setConfigState(cfg);
    setSource("custom");
    setGeneration((g) => g + 1);
    // Let state flush, then bring the viewer into view
    requestAnimationFrame(() => {
      document
        .getElementById("viewer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const value = useMemo(
    () => ({ config, setConfig, source, setSource, generateCustomTwin, generation }),
    [config, setConfig, source, generateCustomTwin, generation]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTwinConfig(): TwinConfigState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTwinConfig must be used inside TwinConfigProvider");
  return v;
}
