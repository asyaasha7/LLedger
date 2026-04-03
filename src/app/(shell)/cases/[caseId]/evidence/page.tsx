import { notFound } from "next/navigation";
import { getLeaseCaseById, listLeaseCases } from "@/server/repos/lease-cases.repo";
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
  const c = await getLeaseCaseById(caseId);
  if (!c) notFound();

  const items = await listEvidenceForCase(caseId);
  const allCases = await listLeaseCases();
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
