import { notFound } from "next/navigation";
import { getLeaseCaseForRequest } from "@/server/lease-case-view";
import { getSessionUser } from "@/server/auth/session";
import { getMembershipRole } from "@/server/repos/case-memberships.repo";
import { listEvidenceForCase } from "@/server/repos/evidence.repo";
import { isDatabaseConfigured } from "@/server/db/client";
import { EvidenceReviewActions } from "@/components/case/evidence-review-actions";
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
  const sample = evidenceRows[0];

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
    <div className="grid min-h-[60vh] gap-4 lg:grid-cols-2">
      <div className="flex flex-col border border-outline-variant/15 bg-surface-low p-4 lg:p-6">
        <div className="flex flex-1 items-center justify-center bg-surface-highest/50">
          <p className="text-sm text-ink-muted">Image / PDF / video preview</p>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 w-20 shrink-0 bg-surface-highest ring-2 ring-transparent first:ring-accent-ledger"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="border border-outline-variant/15 bg-surface-card p-6">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Type</dt>
              <dd className="font-headline font-medium text-ink">
                {sample?.evidenceType.replaceAll("_", " ") ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Submitted by</dt>
              <dd className="font-headline font-medium text-ink">
                {sample?.submitterRole === "landlord"
                  ? c.landlord.displayName
                  : c.tenant.displayName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Content hash</dt>
              <dd className="max-w-[14rem] truncate font-mono text-xs text-ink">
                {sample?.fileHash ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Encrypted storage</dt>
              <dd className="max-w-[14rem] truncate font-mono text-xs text-ink-muted">
                {sample?.encryptedStorageRef ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Room</dt>
              <dd className="font-headline font-medium text-ink">
                {sample?.roomTag ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Review status</dt>
              <dd className="font-headline font-medium text-ink">
                {sample?.reviewStatus ?? "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-6 border-t border-outline-variant/15 pt-6">
            <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
              Description
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              {sample?.description ??
                "Select an evidence item from the library to review."}
            </p>
          </div>
          <div className="mt-6 border-t border-outline-variant/15 pt-6">
            <EvidenceReviewActions
              leaseId={caseId}
              items={evidenceRows}
              canReview={canReview}
            />
          </div>
        </div>

        <WireSection
          title="Linked context"
          hint="Related records (wireframe)"
          className="border-none bg-surface-low"
        >
          <ul className="text-sm text-ink-secondary">
            <li>· Related invoice #1042</li>
            <li>· Linked move-in checklist</li>
            <li>· AI: change severity medium</li>
          </ul>
        </WireSection>
      </div>
    </div>
  );
}
