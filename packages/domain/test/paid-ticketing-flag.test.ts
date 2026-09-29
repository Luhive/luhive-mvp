import { describe, expect, it } from "vitest";
import { isPaidTicketingEnabled } from "../src/v1/paid-ticketing-flag";

describe("isPaidTicketingEnabled", () => {
  it("is on only for a literal true", () => {
    expect(
      isPaidTicketingEnabled({ features: { paid_ticketing: true } }),
    ).toBe(true);
  });

  it("is off when the flag is absent", () => {
    expect(isPaidTicketingEnabled({ features: { join: true } })).toBe(false);
    expect(isPaidTicketingEnabled({ features: {} })).toBe(false);
    expect(isPaidTicketingEnabled({})).toBe(false);
  });

  it("is off when the flag is false", () => {
    expect(
      isPaidTicketingEnabled({ features: { paid_ticketing: false } }),
    ).toBe(false);
  });

  it("does not treat truthy lookalikes as on", () => {
    for (const value of ["true", 1, "yes", {}, []]) {
      expect(
        isPaidTicketingEnabled({ features: { paid_ticketing: value } }),
      ).toBe(false);
    }
  });

  it("is off for missing or malformed settings", () => {
    for (const settings of [null, undefined, "", 0, [], "features", true]) {
      expect(isPaidTicketingEnabled(settings)).toBe(false);
    }
    expect(isPaidTicketingEnabled({ features: null })).toBe(false);
    expect(isPaidTicketingEnabled({ features: [true] })).toBe(false);
    expect(isPaidTicketingEnabled({ paid_ticketing: true })).toBe(false);
  });
});
