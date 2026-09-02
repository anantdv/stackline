import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  ChevronDown,
  CircleDollarSign,
  Container,
  DoorOpen,
  Factory,
  Layers,
  Link2,
  Menu,
  Network,
  Radar,
  ScanLine,
  Smartphone,
  Truck,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AuthSlot from "@/components/AuthSlot";
import { GuideNavButton } from "@/components/guide/GuideTrigger";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; desc: string; icon: LucideIcon };
type NavGroup = { label: string; tourKey?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Platform",
    tourKey: "nav-platform",
    items: [
      { to: "/warehouse-3d", label: "Warehouse 3D", desc: "DIGITAL-TWIN CONVERTER", icon: Boxes },
      { to: "/features", label: "Features", desc: "FOUR CORE ENGINES", icon: Layers },
      { to: "/workflow", label: "Workflow", desc: "VISUAL PROCESS BUILDER", icon: Workflow },
    ],
  },
  {
    label: "Network",
    tourKey: "nav-network",
    items: [
      { to: "/network", label: "Multi-Location Network", desc: "SITES · ZONES · TRANSFERS", icon: Network },
      { to: "/valuation", label: "Asset Valuation", desc: "ERP-PRICED STOCK VALUE", icon: CircleDollarSign },
    ],
  },
  {
    label: "Operations",
    tourKey: "nav-operations",
    items: [
      { to: "/dispatch", label: "Dispatch & Compliance", desc: "EWB · B/L · AWB · INVOICING", icon: Truck },
      { to: "/gate", label: "Gate Management", desc: "VEHICLE IN/OUT · GATE PASS", icon: DoorOpen },
      { to: "/scanning-bay", label: "Scanning Bay", desc: "X-RAY · DIMS · WEIGH", icon: ScanLine },
      { to: "/transport", label: "Load Planning", desc: "TRUCK/CONTAINER PACKING", icon: Container },
      { to: "/fleet", label: "Fleet & GPS", desc: "LIVE TRACKING · ROUTES", icon: Radar },
    ],
  },
  {
    label: "Solutions",
    tourKey: "nav-solutions",
    items: [
      { to: "/erpnext", label: "ERPNext", desc: "NATIVE DOCTYPE SYNC", icon: Link2 },
      { to: "/industries", label: "Industries", desc: "FIVE READY PRESETS", icon: Factory },
      { to: "/3pl-portal", label: "3PL Portal", desc: "CUSTOMER-FACING VIEW", icon: Users },
      { to: "/mobile-app", label: "Mobile App", desc: "FLOOR APP · QR/NFC", icon: Smartphone },
    ],
  },
];

function StatusPill() {
  return (
    <span
      data-tour="nav-status"
      className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1 min-[1300px]:inline-flex"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-data animate-pulse-dot" />
      ERPNext <span className="text-data">Synced</span>
    </span>
  );
}

/** Desktop hover dropdown with 120ms intent delay (design-delta §2). */
function NavDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const location = useLocation();
  const groupActive = group.items.some((i) => i.to === location.pathname);

  const enter = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), 120);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 120);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
      data-tour={group.tourKey}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex items-center gap-1 text-sm transition-colors duration-200",
          groupActive ? "text-ink0" : "text-ink1 hover:text-ink0"
        )}
      >
        {group.label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
        <span
          className={cn(
            "absolute -bottom-1 left-0 h-px bg-brand transition-all duration-300",
            open ? "w-full" : "w-0 group-hover:w-full"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4"
          >
            <div className="relative min-w-[280px] rounded-xl border border-linestrong bg-raised p-2 shadow-2xl">
              {/* corner brackets */}
              <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-[14px] w-[14px] border-l border-t border-brand" />
              <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[14px] w-[14px] border-b border-r border-brand" />
              {group.items.map((item) => {
                const active = item.to === location.pathname;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group/item relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200",
                      "hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand",
                      active && "bg-surface"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-brand" />
                    )}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink2 transition-colors duration-200 group-hover/item:border-brand group-hover/item:text-brand">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-ink0">{item.label}</span>
                      <span className="truncate font-mono text-[10px] tracking-[0.12em] text-ink2">
                        {item.desc}
                      </span>
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Mobile overlay: accordion groups, staggered links. */
function MobileMenu({ onClose }: { onClose: () => void }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-void/95 px-8 pb-10 pt-24 backdrop-blur-xl min-[1100px]:hidden"
    >
      <nav className="flex flex-col gap-1">
        {NAV_GROUPS.map((g, gi) => {
          const isOpen = expanded === g.label;
          return (
            <motion.div
              key={g.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * gi, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="border-b border-line"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : g.label)}
                className="flex w-full items-center justify-between py-3 font-display text-2xl font-semibold tracking-tight text-ink0"
              >
                {g.label}
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-ink2 transition-transform duration-200",
                    isOpen && "rotate-180 text-brand"
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-1 pb-4 pl-2">
                      {g.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 py-1.5 text-base",
                            item.to === location.pathname
                              ? "text-brand"
                              : "text-ink1"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                          <span className="font-mono text-[9px] tracking-[0.12em] text-ink2">
                            {item.desc}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="block border-b border-line py-3 font-display text-2xl font-semibold tracking-tight text-ink0"
          >
            Dashboard
          </NavLink>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <NavLink
            to="/pricing"
            onClick={onClose}
            className="block py-3 font-display text-2xl font-semibold tracking-tight text-ink0"
          >
            Pricing
          </NavLink>
        </motion.div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mt-8 flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <GuideNavButton className="flex-1 justify-center" />
        </div>
        <div className="flex justify-center">
          <AuthSlot onNavigate={onClose} />
        </div>
        <Link
          to="/contact"
          onClick={onClose}
          className="rounded-lg bg-brand px-6 py-3 text-center font-display font-semibold text-onbrand"
        >
          Book a demo
        </Link>
        <span className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1">
          <span className="h-1.5 w-1.5 rounded-full bg-data animate-pulse-dot" />
          ERPNext Synced
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-line backdrop-blur-[14px] transition-all duration-300",
          scrolled ? "bg-page/90" : "bg-[var(--nav-bg)]"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 transition-all duration-300",
            scrolled ? "h-16" : "h-[72px]"
          )}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-tour="nav-logo">
            <img src="/logo.svg" alt="Stackline" className="h-7 w-7" />
            <span className="font-display text-[17px] font-semibold tracking-[0.02em] text-ink0">
              STACKLINE
            </span>
            <sup className="font-mono text-[9px] tracking-[0.18em] text-ink2">
              WMS·3D
            </sup>
          </Link>

          {/* Center: grouped dropdown IA (desktop ≥1100px) */}
          <nav className="hidden items-center gap-6 min-[1100px]:flex">
            {NAV_GROUPS.map((g) => (
              <NavDropdown key={g.label} group={g} />
            ))}
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  "group relative text-sm transition-colors duration-200",
                  isActive ? "text-ink0" : "text-ink1 hover:text-ink0"
                )
              }
            >
              Dashboard
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand transition-all duration-300 group-hover:w-full" />
            </NavLink>
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                cn(
                  "group relative text-sm transition-colors duration-200",
                  isActive ? "text-ink0" : "text-ink1 hover:text-ink0"
                )
              }
            >
              Pricing
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand transition-all duration-300 group-hover:w-full" />
            </NavLink>
          </nav>

          {/* Right cluster: ThemeToggle · Guide · status · Sign in · Book demo */}
          <div className="hidden items-center gap-3 min-[1100px]:flex">
            <ThemeToggle />
            <span data-tour="nav-guide">
              <GuideNavButton />
            </span>
            <StatusPill />
            <AuthSlot />
            <Link
              to="/contact"
              data-tour="nav-demo"
              className="rounded-lg bg-brand px-4 py-2 font-display text-sm font-semibold text-onbrand transition-all duration-300 hover:-translate-y-px hover:bg-brand-hover"
            >
              Book a demo
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink0 min-[1100px]:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {open && <MobileMenu onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
