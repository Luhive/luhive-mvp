/**
 * Sanitizes Supabase errors to return user-friendly messages for duplicate/unique constraint violations
 */
export function sanitizeDuplicateError(
  error: { code?: string; message?: string; details?: string } | null,
  context?: { email?: string; isVerified?: boolean }
): string | null {
  if (!error) return null;

  const isUniqueViolation = error.code === "23505";
  const errorMessage = error.message?.toLowerCase() || "";
  const isDuplicateMessage =
    errorMessage.includes("duplicate") ||
    errorMessage.includes("unique constraint") ||
    errorMessage.includes("already exists");

  if (isUniqueViolation || isDuplicateMessage) {
    if (context?.email) {
      if (context.isVerified !== undefined) {
        return context.isVerified
          ? "This email is already registered for this event"
          : "A verification email has already been sent to this address";
      }
      return "This email is already registered for this event";
    }
    return "This email is already registered for this event";
  }

  return null;
}
