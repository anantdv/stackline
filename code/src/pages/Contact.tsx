import ContactHero from "@/components/contact/ContactHero";
import ProcessSteps from "@/components/contact/ProcessSteps";
import MiniFaq from "@/components/contact/MiniFaq";
import FinalStrip from "@/components/contact/FinalStrip";

export default function Contact() {
  return (
    <>
      {/* 1 — Hero + demo form split */}
      <ContactHero />
      {/* 2 — What happens next */}
      <ProcessSteps />
      {/* 3 — Mini FAQ */}
      <MiniFaq />
      {/* 4 — Final email strip */}
      <FinalStrip />
    </>
  );
}
