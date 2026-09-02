import { type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";

/**
 * Login gate for operational pages — access is account-based, not demo.
 * Unauthenticated visitors get a sign-in prompt with a return path;
 * while the session check runs, a minimal loading panel is shown.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink2">
          Checking session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const back = encodeURIComponent(location.pathname + location.search);
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
            Restricted area
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold text-ink0">
            Sign in to continue
          </h2>
          <p className="mt-2 text-[13px] text-ink2">
            This console works on live warehouse data. Sign in with your
            account to access it.
          </p>
          <Link
            to={`${LOGIN_PATH}?next=${back}`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand px-6 py-[12px] font-display text-[15px] font-semibold text-page transition-colors hover:bg-brand-hover"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
