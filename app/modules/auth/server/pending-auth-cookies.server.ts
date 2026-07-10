export const OAUTH_PENDING_COOKIE_NAMES = [
  "pending_community_id",
  "pending_return_to",
  "pending_event_id",
  "pending_event_community_id",
  "pending_event_join_community",
  "pending_event_session_id",
  "pending_event_utm_source",
  "pending_event_utm_medium",
  "pending_event_utm_campaign",
  "pending_event_utm_content",
  "pending_event_utm_term",
  "pending_event_first_visit_started_at",
] as const;

export function clearPendingAuthCookies(headers: Headers) {
  for (const name of OAUTH_PENDING_COOKIE_NAMES) {
    headers.append(
      "Set-Cookie",
      `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
  }
}
