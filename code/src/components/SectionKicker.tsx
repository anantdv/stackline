import { cn } from "@/lib/utils";

/** `// SECTION.NAME` mono label with 32px hairline to the left. */
export default function SectionKicker({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-8 bg-linestrong" aria-hidden />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
        <span className="text-brand">{"//"}</span> {children}
      </span>
    </div>
  );
}
