import { describe, expect, it } from "vitest";
import { checkInviteAcceptance } from "./invite-validation";

describe("checkInviteAcceptance", () => {
  const future = new Date(Date.now() + 864e5).toISOString();

  it("accepts a valid pending invite with matching email", () => {
    expect(
      checkInviteAcceptance({
        inviteFound: true,
        acceptedAt: null,
        expiresAt: future,
        inviteEmail: "Tenant@Example.com",
        userEmail: "tenant@example.com",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects missing or already accepted invite", () => {
    expect(
      checkInviteAcceptance({
        inviteFound: false,
        acceptedAt: null,
        expiresAt: future,
        inviteEmail: "a@b.co",
        userEmail: "a@b.co",
      }),
    ).toEqual({ ok: false, reason: "invalid_or_used" });

    expect(
      checkInviteAcceptance({
        inviteFound: true,
        acceptedAt: new Date().toISOString(),
        expiresAt: future,
        inviteEmail: "a@b.co",
        userEmail: "a@b.co",
      }),
    ).toEqual({ ok: false, reason: "invalid_or_used" });
  });

  it("rejects expired invite", () => {
    const past = new Date(Date.now() - 864e5).toISOString();
    expect(
      checkInviteAcceptance({
        inviteFound: true,
        acceptedAt: null,
        expiresAt: past,
        inviteEmail: "a@b.co",
        userEmail: "a@b.co",
      }),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects email mismatch", () => {
    expect(
      checkInviteAcceptance({
        inviteFound: true,
        acceptedAt: null,
        expiresAt: future,
        inviteEmail: "tenant@example.com",
        userEmail: "other@example.com",
      }),
    ).toEqual({ ok: false, reason: "email_mismatch" });
  });
});
