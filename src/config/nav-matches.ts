/**
 * Single place for “which app section is active?” logic (sidebar + top bar).
 */

export function isPortfolioSection(pathname: string): boolean {
  return (
    pathname === "/" ||
    (pathname.startsWith("/cases") &&
      !pathname.includes("/evidence") &&
      !pathname.includes("/settlement"))
  );
}

export function isEvidenceSection(pathname: string): boolean {
  return pathname.startsWith("/evidence") || pathname.includes("/evidence");
}

export function isDepositsSection(pathname: string): boolean {
  return pathname.includes("/settlement");
}

export function isComplianceSection(pathname: string): boolean {
  return pathname.startsWith("/settings");
}
