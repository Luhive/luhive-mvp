import type { Enums, Tables } from "@luhive/db/supabase";

/**
 * Canonical shared base entities from database.
 * Modules should import these directly; extend only when needed.
 *
 * Derived from Supabase's `Row` / `Enums` shape because this app reads through
 * supabase-js: timestamps arrive as ISO strings, not `Date`. Future Node
 * consumers querying over `pg` should use `Selectable<...>` from `@luhive/db`.
 */
export type Event = Tables<"events">;

export type Community = Tables<"communities">;

export type Profile = Tables<"profiles">;

export type EventRegistration = Tables<"event_registrations">;

export type CommunityMember = Tables<"community_members">;

export type EventStatus = Enums<"event_status">;

export type EventType = Enums<"event_type">;

export type ReminderTime = Enums<"reminder_time">;

export type RSVPStatus = Enums<"rsvp_status">;

export type EventApprovalStatus = Enums<"event_approval_statuses">;
