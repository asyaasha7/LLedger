import { notFound } from "next/navigation";
import { getLeaseCaseForRequest } from "@/server/lease-case-view";
import { getSessionUser } from "@/server/auth/session";
import { getMembershipRole } from "@/server/repos/case-memberships.repo";
import { listEvidenceForCase } from "@/server/repos/evidence.repo";
import { isDatabaseConfigured } from "@/server/db/client";
import { EvidenceReviewWorkspace } from "@/components/case/evidence-review-workspace";
import { WireSection } from "@/components/wireframe/wire-section";

export default async function EvidenceReviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const c = await getLeaseCaseForRequest(caseId);
  if (!c) notFound();

  const evidenceRows = await listEvidenceForCase(caseId);

  const user =
    isDatabaseConfigured() ? await getSessionUser() : null;
  const membershipRole =
    user && isDatabaseConfigured()
      ? await getMembershipRole(caseId, user.id)
      : null;
  const canReview =
    membershipRole === "landlord" || membershipRole === "tenant"
      ? evidenceRows.some(
          (e) =>
            e.reviewStatus === "SUBMITTED" &&
            e.submitterRole !== membershipRole,
        )
      : false;

  return (
    <EvidenceReviewWorkspace
      leaseId={caseId}
      items={evidenceRows}
      canReview={canReview}
      landlordDisplayName={c.landlord.displayName}
      tenantDisplayName={c.tenant.displayName}
      linkedContext={
        <WireSection
          title="Linked context"
          hint="Related records (wireframe)"
          className="border-none bg-surface-low"
        >
          <ul className="text-sm text-ink-secondary">
            <li>· Vendor receipts linked from evidence titles and hashes</li>
            <li>· Move-in baseline set cross-checks disputed items</li>
            <li>· Optional: export bundle for small-claims packet</li>
          </ul>
        </WireSection>
      }
    />
  );
}
