import {
  isComplianceSection,
  isDepositsSection,
  isEvidenceSection,
  isPortfolioSection,
} from "@/config/nav-matches";
import { routes } from "@/config/routes";

export type TopBarTab = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

export const TOP_BAR_TABS: TopBarTab[] = [
  {
    href: routes.dashboard,
    label: "Portfolio",
    match: isPortfolioSection,
  },
  {
    href: routes.evidenceHub,
    label: "Evidence",
    match: isEvidenceSection,
  },
  {
    href: routes.settlementHub,
    label: "Deposits",
    match: isDepositsSection,
  },
  {
    href: routes.settings,
    label: "Compliance",
    match: isComplianceSection,
  },
];
