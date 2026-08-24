import { supabaseProjectRef } from "./supabase-project-ref";

/**
 * The only connection string this package is allowed to write to.
 *
 * Migrations must never reach production, so `DATABASE_URL` is deliberately
 * not consulted: the write target has to be named explicitly.
 */
export function resolveValidationUrl(): string {
  const validation = process.env.VALIDATION_DATABASE_URL;
  if (!validation) {
    throw new Error(
      "VALIDATION_DATABASE_URL is not set. Migrations only run against the disposable validation project.",
    );
  }

  const production = process.env.PRODUCTION_DATABASE_URL;
  if (production) {
    assertNotProduction(validation, production);
  }

  return validation;
}

function assertNotProduction(validation: string, production: string): void {
  if (validation.trim() === production.trim()) {
    throw new Error(
      "VALIDATION_DATABASE_URL equals PRODUCTION_DATABASE_URL. Refusing to migrate production.",
    );
  }

  const validationRef = supabaseProjectRef(validation);
  const productionRef = supabaseProjectRef(production);
  if (validationRef && productionRef && validationRef === productionRef) {
    throw new Error(
      `VALIDATION_DATABASE_URL points at the production project (${productionRef}). Refusing to migrate production.`,
    );
  }
}
