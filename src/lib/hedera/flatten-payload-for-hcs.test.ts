import { describe, expect, it } from "vitest";
import { flattenPayloadForHcs } from "./flatten-payload-for-hcs";

describe("flattenPayloadForHcs", () => {
  it("keeps primitives and drops nested objects", () => {
    expect(
      flattenPayloadForHcs({
        a: 1,
        b: "x",
        c: null,
        d: { nested: true },
      }),
    ).toEqual({ a: 1, b: "x", c: null });
  });

  it("returns empty for non-objects", () => {
    expect(flattenPayloadForHcs(null)).toEqual({});
    expect(flattenPayloadForHcs([])).toEqual({});
  });
});
