import { listLeaseCases } from "@/server/repos/lease-cases.repo";
import { CaseHubLinkCard } from "@/components/case/case-hub-link-card";
import { PageHeader } from "@/components/layout/page-header";

export default async function TimelineHubPage() {
  const cases = await listLeaseCases();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Case timelines"
        description="Open the full trust trail for any lease."
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {cases.map((c) => (
          <CaseHubLinkCard key={c.leaseId} caseData={c} variant="timeline" />
        ))}
      </ul>
    </div>
  );
}
