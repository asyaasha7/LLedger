export type InviteAcceptFailureReason =
  | "invalid_or_used"
  | "expired"
  | "email_mismatch";

export type InviteAcceptCheck =
  | { ok: true }
  | { ok: false; reason: InviteAcceptFailureReason };

/**
 * Pure checks for magic-link invite acceptance (used by repo + tests).
 */
export function checkInviteAcceptance(input: {
  inviteFound: boolean;
  acceptedAt: Date | string | null | undefined;
  expiresAt: Date | string;
  inviteEmail: string;
  userEmail: string;
}): InviteAcceptCheck {
  if (!input.inviteFound || input.acceptedAt) {
    return { ok: false, reason: "invalid_or_used" };
  }
  if (new Date(input.expiresAt) < new Date()) {
    return { ok: false, reason: "expired" };
  }
  const a = input.inviteEmail.trim().toLowerCase();
  const b = input.userEmail.trim().toLowerCase();
  if (a !== b) {
    return { ok: false, reason: "email_mismatch" };
  }
  return { ok: true };
}
