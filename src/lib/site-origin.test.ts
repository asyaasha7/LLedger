import { describe, expect, it, afterEach } from "vitest";
import { getSiteOrigin } from "./site-origin";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_URL;
});

describe("getSiteOrigin", () => {
  it("uses request origin for localhost when SITE_URL unset", () => {
    const r = new Request("http://localhost:3000/api/x");
    expect(getSiteOrigin(r)).toBe("http://localhost:3000");
  });

  it("uses NEXT_PUBLIC_SITE_URL on localhost when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com";
    const r = new Request("http://localhost:3000/api/x");
    expect(getSiteOrigin(r)).toBe("https://app.example.com");
  });

  it("on Vercel host, prefers VERCEL_URL when SITE_URL is localhost", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.VERCEL_URL = "my-app-abc.vercel.app";
    const r = new Request("https://my-app-abc.vercel.app/api/x");
    expect(getSiteOrigin(r)).toBe("https://my-app-abc.vercel.app");
  });

  it("on Vercel host, uses explicit production URL when not local", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://ledger.example.com";
    process.env.VERCEL_URL = "my-app-abc.vercel.app";
    const r = new Request("https://my-app-abc.vercel.app/api/x");
    expect(getSiteOrigin(r)).toBe("https://ledger.example.com");
  });
});
