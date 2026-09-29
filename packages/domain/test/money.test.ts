import { describe, expect, it } from "vitest";
import {
  MAX_TICKET_PRICE_MINOR,
  formatMoney,
  isValidTicketPriceMinor,
  majorToMinorUnits,
  minorToMajorUnits,
  parsePriceInputToMinor,
} from "../src/v1/money";

describe("majorToMinorUnits", () => {
  it("converts whole and fractional amounts", () => {
    expect(majorToMinorUnits(25)).toBe(2500);
    expect(majorToMinorUnits(25.0)).toBe(2500);
    expect(majorToMinorUnits(12.9)).toBe(1290);
    expect(majorToMinorUnits(0.05)).toBe(5);
    expect(majorToMinorUnits(100)).toBe(10000);
  });

  it("survives floating point noise", () => {
    expect(majorToMinorUnits(0.1 + 0.2)).toBe(30);
    expect(majorToMinorUnits(1.15)).toBe(115);
    expect(majorToMinorUnits(4.35)).toBe(435);
    expect(majorToMinorUnits(8.2)).toBe(820);
  });

  it("rejects amounts that are not exact minor units", () => {
    expect(majorToMinorUnits(1.005)).toBeNull();
    expect(majorToMinorUnits(10.999)).toBeNull();
  });

  it("rejects negative and non-finite amounts", () => {
    expect(majorToMinorUnits(-1)).toBeNull();
    expect(majorToMinorUnits(Number.NaN)).toBeNull();
    expect(majorToMinorUnits(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("keeps zero distinct from invalid", () => {
    expect(majorToMinorUnits(0)).toBe(0);
  });
});

describe("minorToMajorUnits", () => {
  it("converts back", () => {
    expect(minorToMajorUnits(2500)).toBe(25);
    expect(minorToMajorUnits(5)).toBe(0.05);
  });

  it("round-trips every minor amount up to the maximum price", () => {
    for (let minor = 1; minor <= 20_000; minor += 1) {
      expect(majorToMinorUnits(minorToMajorUnits(minor))).toBe(minor);
    }
  });
});

describe("parsePriceInputToMinor", () => {
  it("accepts common ways of typing a price", () => {
    expect(parsePriceInputToMinor("12")).toBe(1200);
    expect(parsePriceInputToMinor("12.5")).toBe(1250);
    expect(parsePriceInputToMinor("12,50")).toBe(1250);
    expect(parsePriceInputToMinor(" 0.05 ")).toBe(5);
  });

  it("rejects everything else", () => {
    for (const input of ["", " ", "abc", "-5", "1.234", "1e3", "1.", ".5", "1,2,3", "12 AZN"]) {
      expect(parsePriceInputToMinor(input)).toBeNull();
    }
  });
});

describe("isValidTicketPriceMinor", () => {
  it("accepts positive integers up to the maximum", () => {
    expect(isValidTicketPriceMinor(1)).toBe(true);
    expect(isValidTicketPriceMinor(MAX_TICKET_PRICE_MINOR)).toBe(true);
  });

  it("rejects zero, negatives, fractions and oversized prices", () => {
    expect(isValidTicketPriceMinor(0)).toBe(false);
    expect(isValidTicketPriceMinor(-100)).toBe(false);
    expect(isValidTicketPriceMinor(10.5)).toBe(false);
    expect(isValidTicketPriceMinor(MAX_TICKET_PRICE_MINOR + 1)).toBe(false);
    expect(isValidTicketPriceMinor(Number.NaN)).toBe(false);
  });
});

describe("formatMoney", () => {
  it("formats minor units as currency", () => {
    expect(formatMoney(2500, "AZN", "en-US")).toMatch(/25\.00/);
    expect(formatMoney(5, "AZN", "en-US")).toMatch(/0\.05/);
    expect(formatMoney(1290, "AZN", "en-US")).toMatch(/12\.90/);
  });

  it("includes the currency", () => {
    expect(formatMoney(2500, "AZN", "en-US")).toMatch(/AZN|₼/);
  });

  it("defaults to the Azerbaijani locale", () => {
    expect(formatMoney(2500, "AZN")).toMatch(/25/);
  });
});
