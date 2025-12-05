import * as Sentry from "@sentry/react-router";

// ============================================
// User Context
// ============================================

/**
 * Set the current user context for Sentry.
 * Call this after successful authentication.
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}) {
  Sentry.setUser(user);
}

/**
 * Clear the user context (call on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

// ============================================
// Error Capturing
// ============================================

/**
 * Capture an error with additional context
 */
export function captureError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  extra?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

// ============================================
// Supabase-Specific Helpers
// ============================================

interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Capture a Supabase error with proper context and tags
 */
export function captureSupabaseError(
  error: SupabaseError,
  context: {
    operation: string; // e.g., "fetch_communities", "update_profile"
    table?: string; // e.g., "communities", "profiles"
    userId?: string;
    additionalData?: Record<string, unknown>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag("error_type", "supabase");
    scope.setTag("operation", context.operation);

    if (context.table) {
      scope.setTag("table", context.table);
    }

    if (error.code) {
      scope.setTag("supabase_error_code", error.code);
    }

    scope.setExtras({
      supabase_message: error.message,
      supabase_details: error.details,
      supabase_hint: error.hint,
      user_id: context.userId,
      ...context.additionalData,
    });

    Sentry.captureException(new Error(`Supabase: ${error.message}`));
  });
}

// ============================================
// Breadcrumbs
// ============================================

/**
 * Add a breadcrumb for tracking user actions/flow
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
  });
}

/**
 * Add a navigation breadcrumb
 */
export function addNavigationBreadcrumb(from: string, to: string) {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Navigated from ${from} to ${to}`,
    data: { from, to },
    level: "info",
  });
}

/**
 * Add a user action breadcrumb
 */
export function addActionBreadcrumb(
  action: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: "user_action",
    message: action,
    data,
    level: "info",
  });
}

// ============================================
// Tags & Context
// ============================================

/**
 * Set a global tag (persists across all events)
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Set multiple global tags
 */
export function setTags(tags: Record<string, string>) {
  Sentry.setTags(tags);
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown) {
  Sentry.setExtra(key, value);
}

/**
 * Set the current community context (useful for multi-tenant apps)
 */
export function setCommunityContext(community: {
  id: string;
  slug: string;
  name?: string;
}) {
  Sentry.setTag("community_id", community.id);
  Sentry.setTag("community_slug", community.slug);
  if (community.name) {
    Sentry.setExtra("community_name", community.name);
  }
}

// ============================================
// Performance Monitoring
// ============================================

type SpanAttributes = Record<string, string | number | boolean | undefined>;

/**
 * Start a custom span for performance tracking
 * Returns a function to end the span
 */
export function startSpan(
  name: string,
  op: string,
  data?: SpanAttributes
): () => void {
  const span = Sentry.startInactiveSpan({
    name,
    op,
    attributes: data,
  });

  return () => {
    span?.end();
  };
}

/**
 * Wrap an async function with performance tracking
 */
export async function withSpan<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
  data?: SpanAttributes
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op,
      attributes: data,
    },
    async () => {
      return await fn();
    }
  );
}

// ============================================
// Utility Types & Re-exports
// ============================================

export type { SeverityLevel } from "@sentry/react-router";

// Re-export commonly used Sentry functions for convenience
export {
  withScope,
  captureException,
  getCurrentScope,
} from "@sentry/react-router";
