import type { LucideIcon } from "lucide-react";
import {
  Archive,
  FileText,
  Gavel,
  HelpCircle,
  LayoutDashboard,
  Package,
  Wallet,
} from "lucide-react";
import {
  isComplianceSection,
  isDepositsSection,
  isEvidenceSection,
} from "@/config/nav-matches";
import { routes } from "@/config/routes";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

function isDashboard(pathname: string): boolean {
  return pathname === "/";
}

function isLeaseRegistry(pathname: string): boolean {
  return (
    pathname.startsWith("/cases") &&
    !pathname.includes("/evidence") &&
    !pathname.includes("/settlement")
  );
}

export const SIDEBAR_NAV: SidebarNavItem[] = [
  {
    href: routes.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
    match: isDashboard,
  },
  {
    href: routes.casesList,
    label: "Lease Registry",
    icon: FileText,
    match: isLeaseRegistry,
  },
  {
    href: routes.evidenceHub,
    label: "Evidence Vault",
    icon: Package,
    match: isEvidenceSection,
  },
  {
    href: routes.settlementHub,
    label: "Deposit Escrow",
    icon: Wallet,
    match: isDepositsSection,
  },
  {
    href: routes.settings,
    label: "Legal Briefs",
    icon: Gavel,
    match: isComplianceSection,
  },
];

export const SIDEBAR_FOOTER_ACTIONS = [
  { label: "Support", icon: HelpCircle },
  { label: "Archive", icon: Archive },
] as const;
