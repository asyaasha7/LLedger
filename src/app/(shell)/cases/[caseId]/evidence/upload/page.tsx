import Link from "next/link";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { getLeaseCaseById } from "@/server/repos/lease-cases.repo";
import { Button } from "@/components/ui/button";
import {
  formInputClassName,
  formTextareaClassName,
} from "@/components/ui/form-styles";

export default async function EvidenceUploadPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const c = await getLeaseCaseById(caseId);
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

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="border border-outline-variant/15 bg-surface-low p-8 text-center lg:col-span-3 lg:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border border-outline-variant/30 text-ink-muted">
            ↑
          </div>
          <p className="mt-4 font-headline text-sm font-bold text-ink">
            Drag files here or browse
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            JPG, PNG, PDF, HEIC up to 25 MB each
          </p>
          <p className="mt-6 text-xs leading-relaxed text-ink-secondary">
            Stored privately. Only proof metadata is recorded securely.
          </p>
          <div className="mt-6 space-y-2 border border-outline-variant/20 bg-surface-card p-4 text-left text-xs text-ink-secondary">
            <p className="font-headline font-bold text-ink">Selected (wireframe)</p>
            <div className="flex items-center justify-between gap-2 border border-outline-variant/20 bg-surface-low px-3 py-2">
              <span className="truncate">kitchen-wide.jpg</span>
              <button type="button" className="text-accent-magenta">
                Remove
              </button>
            </div>
          </div>
        </div>

        <div className="border border-outline-variant/15 bg-surface-card p-6 lg:col-span-2 lg:p-8">
          <h2 className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
            Details
          </h2>
          <form className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">Evidence type</label>
                <select className={formInputClassName}>
                <option>Move-in</option>
                <option>Move-out</option>
                <option>Damage</option>
                <option>Receipt</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Room / category</label>
                <input
                  className={formInputClassName}
                  placeholder="e.g. Kitchen"
                />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Short description</label>
                <input
                  className={formInputClassName}
                  placeholder="One line summary"
                />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Optional notes</label>
              <textarea rows={3} className={formTextareaClassName} />
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/15 pt-4 sm:flex-row sm:justify-between">
                <Link
                  href={evidenceListHref}
                  className="inline-flex h-11 w-full items-center justify-center border border-outline-variant/40 font-headline text-[10px] font-bold uppercase tracking-widest text-ink hover:border-ink sm:w-auto sm:min-w-[7rem]"
                >
                Cancel
              </Link>
              <Button type="button" variant="primary" className="w-full sm:w-auto">
                Submit evidence
              </Button>
            </div>
          </form>
        </div>
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
