import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Global error boundary — a render crash anywhere in the tree must never
 * leave the user staring at a white page. Shows the error, offers reload.
 * Also usable around individual widgets (e.g. the WebGL viewer) via the
 * `fallbackLabel` prop so a 3D failure doesn't take the whole page down.
 */
interface Props {
  children: ReactNode;
  /** Short label shown in the fallback, e.g. "3D viewer". */
  fallbackLabel?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const label = this.props.fallbackLabel;
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-crit/40 bg-crit/5 p-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-crit">
            {label ? `${label} failed to render` : "Something went wrong"}
          </div>
          <p className="mt-3 break-words text-[13px] text-ink1">
            {error.message || "Unexpected error"}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink1 transition-colors hover:border-brand hover:text-ink0"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-brand px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-page transition-colors hover:bg-brand-hover"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
