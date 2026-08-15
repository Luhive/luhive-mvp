/**
 * Error handling utilities for consistent user-facing error messages.
 */

/**
 * Sanitizes duplicate key / unique constraint errors from Supabase
 * into user-friendly messages.
 */
export function sanitizeDuplicateError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = String((error as { message: string }).message);
    if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
      return "You have already registered for this event.";
    }
  }
  return "Something went wrong. Please try again.";
}
