import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import {
  listLeaseCases,
  listLeaseCasesForUser,
} from "@/server/repos/lease-cases.repo";
import { CaseHubLinkCard } from "@/components/case/case-hub-link-card";
import { PageHeader } from "@/components/layout/page-header";

export default async function EvidenceHubPage() {
  const user = await getSessionUser();
  const cases =
    isDatabaseConfigured() && user
      ? await listLeaseCasesForUser(user.id)
      : await listLeaseCases();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Evidence vault"
        title="Select a case"
        description="Open evidence for any active lease. Everything stays organized by property and tenant."
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {cases.map((c) => (
          <CaseHubLinkCard key={c.leaseId} caseData={c} variant="evidence" />
        ))}
      </ul>
    </div>
  );
}
