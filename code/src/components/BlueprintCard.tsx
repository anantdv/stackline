import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Brackets() {
  const base =
    "pointer-events-none absolute h-[14px] w-[14px] border-brand transition-colors duration-300 group-hover:border-brand-hover";
  return (
    <>
      <span className={cn(base, "left-0 top-0 border-l border-t")} aria-hidden />
      <span className={cn(base, "right-0 top-0 border-r border-t opacity-40")} aria-hidden />
      <span className={cn(base, "bottom-0 left-0 border-b border-l opacity-40")} aria-hidden />
      <span className={cn(base, "bottom-0 right-0 border-b border-r")} aria-hidden />
    </>
  );
}

/**
 * Technical-drawing card: surface fill, hairline border, 12px radius and
 * orange corner brackets. Lifts on hover.
 */
export default function BlueprintCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "blueprint-card group relative rounded-xl border border-line bg-surface transition-all duration-300",
        "hover:-translate-y-1 hover:border-linestrong",
        className
      )}
    >
      <Brackets />
      {children}
    </div>
  );
}
