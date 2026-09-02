import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Primary CTA: safety orange, light-sweep hover, translateY lift. */
export function PrimaryButton({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg",
        "bg-brand px-6 py-[13px] font-display text-[15px] font-semibold text-onbrand",
        "transition-all duration-300 hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-500 group-hover/btn:left-[120%] group-hover/btn:opacity-100"
      />
      {children}
    </Link>
  );
}

/** Ghost CTA: hairline border, accent on hover. */
export function GhostButton({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px]",
        "font-display text-[15px] font-semibold text-ink0 transition-colors duration-300",
        "hover:border-brand hover:text-brand",
        className
      )}
    >
      {children}
    </Link>
  );
}

/** Mono link: JetBrains Mono uppercase + arrow that slides on hover. */
export function MonoLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group/link inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-ink1",
        "transition-colors duration-300 hover:text-brand",
        className
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
    </Link>
  );
}
