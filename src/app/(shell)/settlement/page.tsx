import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import {
  listLeaseCases,
  listLeaseCasesForUser,
} from "@/server/repos/lease-cases.repo";
import { CaseHubLinkCard } from "@/components/case/case-hub-link-card";
import { PageHeader } from "@/components/layout/page-header";

export default async function SettlementHubPage() {
  const user = await getSessionUser();
  const cases =
    isDatabaseConfigured() && user
      ? await listLeaseCasesForUser(user.id)
      : await listLeaseCases();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Deposit escrow"
        description="Choose a case to review deposit, deductions, and refund."
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {cases.map((c) => (
          <CaseHubLinkCard key={c.leaseId} caseData={c} variant="settlement" />
        ))}
      </ul>
    </div>
  );
}
