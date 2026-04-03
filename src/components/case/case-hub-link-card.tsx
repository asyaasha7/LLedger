import Link from "next/link";
import type { LeaseCase } from "@/domain";
import { routes } from "@/config/routes";

type HubVariant = "evidence" | "settlement" | "timeline";

const COPY: Record<
  HubVariant,
  { href: (id: string) => string; cta: string }
> = {
  evidence: {
    href: (id) => routes.case(id).evidence,
    cta: "Open evidence →",
  },
  settlement: {
    href: (id) => routes.case(id).settlement,
    cta: "Open settlement →",
  },
  timeline: {
    href: (id) => routes.case(id).timeline,
    cta: "View timeline →",
  },
};

export function CaseHubLinkCard({
  caseData,
  variant,
}: {
  caseData: LeaseCase;
  variant: HubVariant;
}) {
  const { href, cta } = COPY[variant];
  return (
    <li className="border border-outline-variant/15 bg-surface-low">
      <Link
        href={href(caseData.leaseId)}
        className="block p-8 transition-colors hover:bg-surface-card"
      >
        <p className="font-headline text-lg font-bold text-ink">
          {caseData.propertyRef} · {caseData.leaseRef}
        </p>
        <p className="mt-2 font-headline text-xs uppercase tracking-widest text-accent-ledger">
          {cta}
        </p>
      </Link>
    </li>
  );
}
