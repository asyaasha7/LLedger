/** Format ISO timestamps for evidence cards and compact UI. */
export function formatShortDate(
  iso: string,
  locale: string = "en-US",
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
