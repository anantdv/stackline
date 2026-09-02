import PortalHero from "@/components/portal/PortalHero";
import CustomerDashboard from "@/components/portal/CustomerDashboard";
import RaiseOrderFlow from "@/components/portal/RaiseOrderFlow";
import BrandingEngine from "@/components/portal/BrandingEngine";
import SlaBilling from "@/components/portal/SlaBilling";
import RolesSecurity from "@/components/portal/RolesSecurity";
import PortalCta from "@/components/portal/PortalCta";

/**
 * /3pl-portal — tenant-isolated, white-labelled customer portal mock
 * (portal3pl.md). Live tRPC tenant data with baked demo fallbacks.
 */
export default function Portal3pl() {
  return (
    <>
      {/* 1 — Hero: two sides of the same warehouse */}
      <PortalHero />
      {/* 2 — Customer dashboard centerpiece mock */}
      <div id="portal-customer-view">
        <CustomerDashboard />
      </div>
      {/* 3 — Raise an order / ASN interactive flow */}
      <RaiseOrderFlow />
      {/* 4 — White-label branding engine */}
      <BrandingEngine />
      {/* 5 — SLA gauges + billing */}
      <SlaBilling />
      {/* 6 — Roles & security */}
      <RolesSecurity />
      {/* 7 — CTA */}
      <PortalCta />
    </>
  );
}
