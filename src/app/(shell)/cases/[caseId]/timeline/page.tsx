import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { getLeaseCaseById } from "@/server/repos/lease-cases.repo";
import { listUiTimelineEventsForLease } from "@/server/repos/timeline.repo";
import { CaseTimelineList } from "@/components/case/case-timeline-list";
import { EmptyState } from "@/components/wireframe/empty-state";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const c = await getLeaseCaseById(caseId);
  if (!c) notFound();

  const events = await listUiTimelineEventsForLease(caseId);

  if (events.length === 0) {
    return (
      <EmptyState
        headline="Timeline will appear here"
        text="Events are added as the case progresses"
        ctaLabel="Back to case"
        ctaHref={routes.case(caseId).overview}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-16">
      <header className="text-center sm:text-left">
        <span className="mb-4 block font-headline text-[10px] uppercase tracking-[0.3em] text-accent-ledger">
          Ledger · {c.leaseRef}
        </span>
        <h1 className="font-headline text-5xl font-black uppercase leading-[0.9] tracking-tighter text-ink sm:text-7xl">
          Trust
          <br />
          <span className="text-accent-ledger">timeline</span>
          <span className="text-ink">.</span>
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-secondary">
          Ordered record of evidence, reviews, and settlement actions — readable
          at a glance.
        </p>
      </header>

      <CaseTimelineList events={events} />
    </div>
  );
}
