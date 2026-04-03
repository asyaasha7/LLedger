import Link from "next/link";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { getLeaseCaseForRequest } from "@/server/lease-case-view";
import { EvidenceUploadForm } from "@/components/case/evidence-upload-form";

export default async function EvidenceUploadPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const c = await getLeaseCaseForRequest(caseId);
  if (!c) notFound();

  const evidenceListHref = routes.case(caseId).evidence;

  return (
    <div className="space-y-10">
      <div>
        <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ledger">
          Evidence vault · {c.leaseRef}
        </span>
        <h1 className="mt-2 font-headline text-3xl font-black uppercase tracking-tighter text-ink">
          Upload evidence
        </h1>
        <p className="mt-3 text-sm text-ink-secondary">
          Add move-in, move-out, or supporting documentation. Each submission
          appears on the trust timeline with proof metadata only.
        </p>
      </div>

      <div className="border border-outline-variant/15 bg-surface-card p-6 sm:p-10">
        <EvidenceUploadForm
          leaseId={caseId}
          evidenceListHref={evidenceListHref}
        />
      </div>

      <aside className="border border-outline-variant/15 bg-surface-low px-8 py-10">
        <p className="font-headline text-[10px] font-bold uppercase tracking-[0.25em] text-accent-ledger">
          Trust timeline
        </p>
        <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ink-secondary">
          After submit, this filing joins the vertical ledger for{" "}
          <span className="text-ink">{c.propertyRef}</span> — alternating
          editorial rows, anchored hashes, and disputed items highlighted in
          pink like the vault view.
        </p>
        <Link
          href={evidenceListHref}
          className="mt-6 inline-flex font-headline text-[10px] font-bold uppercase tracking-widest text-accent-ledger hover:underline"
        >
          View trust timeline →
        </Link>
      </aside>
    </div>
  );
}
