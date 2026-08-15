import type { Database } from "~/shared/models/database.types";

/**
 * Canonical shared base entities from database.
 * Modules should import these directly; extend only when needed.
 */

/** Event row from database */
export type Event = Database["public"]["Tables"]["events"]["Row"];

/** Community row from database */
export type Community = Database["public"]["Tables"]["communities"]["Row"];

/** Profile row from database */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Event registration row from database */
export type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"];

/** Community member row from database */
export type CommunityMember = Database["public"]["Tables"]["community_members"]["Row"];

/** Event status enum */
export type EventStatus = Database["public"]["Enums"]["event_status"];

/** Event type enum */
export type EventType = Database["public"]["Enums"]["event_type"];

/** RSVP status enum */
export type RSVPStatus = Database["public"]["Enums"]["rsvp_status"];

/** Event approval status enum */
export type EventApprovalStatus = Database["public"]["Enums"]["event_approval_statuses"];
