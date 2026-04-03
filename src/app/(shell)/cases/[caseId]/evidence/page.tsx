import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { getLeaseCaseForRequest } from "@/server/lease-case-view";
import { isDatabaseConfigured } from "@/server/db/client";
import {
  listLeaseCases,
  listLeaseCasesForUser,
} from "@/server/repos/lease-cases.repo";
import { countDisputedEvidenceGlobally, listEvidenceForCase } from "@/server/repos/evidence.repo";
import { EvidenceVaultTrustTimeline } from "@/components/case/evidence-vault-trust-timeline";
import { EmptyState } from "@/components/wireframe/empty-state";
import { routes } from "@/config/routes";

export default async function EvidenceLibraryPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const c = await getLeaseCaseForRequest(caseId);
  if (!c) notFound();

  const items = await listEvidenceForCase(caseId);
  const user = await getSessionUser();
  const allCases =
    isDatabaseConfigured() && user
      ? await listLeaseCasesForUser(user.id)
      : await listLeaseCases();
  const portfolioTotalDepositsCents = allCases.reduce(
    (s, x) => s + x.depositCents,
    0,
  );
  const globalDisputedCount = await countDisputedEvidenceGlobally();

  if (items.length === 0) {
    return (
      <EmptyState
        headline="No evidence submitted"
        text="Upload move-in photos or documents to begin the trust timeline"
        ctaLabel="Submit evidence"
        ctaHref={routes.case(caseId).evidenceUpload}
      />
    );
  }

  return (
    <EvidenceVaultTrustTimeline
      caseId={caseId}
      ledgerRef={c.leaseRef}
      propertyRef={c.propertyRef}
      depositCents={c.depositCents}
      landlordDisplayName={c.landlord.displayName}
      tenantDisplayName={c.tenant.displayName}
      items={items}
      uploadHref={routes.case(caseId).evidenceUpload}
      portfolioTotalDepositsCents={portfolioTotalDepositsCents}
      activeLeaseCount={allCases.length}
      globalDisputedCount={globalDisputedCount}
    />
  );
}
