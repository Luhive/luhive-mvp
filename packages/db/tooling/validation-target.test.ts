import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveValidationUrl } from "./validation-target";

const PRODUCTION = "postgresql://postgres.aaaaaaaaaaaaaaaa:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";
const VALIDATION = "postgresql://postgres.bbbbbbbbbbbbbbbb:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";

describe("resolveValidationUrl", () => {
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.VALIDATION_DATABASE_URL;
    delete process.env.PRODUCTION_DATABASE_URL;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("returns the validation target when it is a different project", () => {
    process.env.PRODUCTION_DATABASE_URL = PRODUCTION;
    process.env.VALIDATION_DATABASE_URL = VALIDATION;

    expect(resolveValidationUrl()).toBe(VALIDATION);
  });

  it("refuses an unset target rather than falling back", () => {
    process.env.PRODUCTION_DATABASE_URL = PRODUCTION;

    expect(() => resolveValidationUrl()).toThrow(
      /VALIDATION_DATABASE_URL is not set/,
    );
  });

  it("refuses a target identical to production", () => {
    process.env.PRODUCTION_DATABASE_URL = PRODUCTION;
    process.env.VALIDATION_DATABASE_URL = PRODUCTION;

    expect(() => resolveValidationUrl()).toThrow(/Refusing to migrate production/);
  });

  it("refuses the production project even when the URL differs", () => {
    process.env.PRODUCTION_DATABASE_URL = PRODUCTION;
    // Same project ref reached through the direct connection instead.
    process.env.VALIDATION_DATABASE_URL =
      "postgresql://postgres:pw@db.aaaaaaaaaaaaaaaa.supabase.co:5432/postgres";

    expect(() => resolveValidationUrl()).toThrow(/Refusing to migrate production/);
  });
});
