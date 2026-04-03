/**
 * Central route builders — avoids duplicated template strings and typos.
 */
export const routes = {
  dashboard: "/",
  casesList: "/cases",
  newCase: "/cases/new",
  evidenceHub: "/evidence",
  settlementHub: "/settlement",
  timelineHub: "/timeline",
  settings: "/settings",
  case: (caseId: string) => ({
    overview: `/cases/${caseId}`,
    evidence: `/cases/${caseId}/evidence`,
    evidenceUpload: `/cases/${caseId}/evidence/upload`,
    evidenceReview: `/cases/${caseId}/evidence/review`,
    timeline: `/cases/${caseId}/timeline`,
    settlement: `/cases/${caseId}/settlement`,
  }),
} as const;
