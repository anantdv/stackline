import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton } from "@/components/Buttons";

/** Placeholder page used for routes implemented by page agents. */
export default function PageStub({
  kicker,
  title,
  blurb,
}: {
  kicker: string;
  title: string;
  blurb: string;
}) {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center bg-page px-6 py-24 text-center blueprint-grid">
      <SectionKicker className="justify-center">{kicker}</SectionKicker>
      <h1 className="mt-6 max-w-[720px] font-display text-4xl font-semibold tracking-[-0.02em] text-ink0 md:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-[520px] text-base leading-[1.65] text-ink1 md:text-lg">
        {blurb}
      </p>
      <div className="mt-9">
        <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
      </div>
    </section>
  );
}
