/** MVP: landlord vs tenant. Mediators are out of scope for v1. */
export type UserRole = "landlord" | "tenant";

export interface Participant {
  /** Stable user id (auth / DB key once integrated). */
  userId: string;
  role: UserRole;
  displayName: string;
  email?: string;
}
