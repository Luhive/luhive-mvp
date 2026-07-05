import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "~/shared/models/database.types";
import type { PendingEventInvite } from "~/modules/events/model/invite.types";

type DbClient = SupabaseClient<Database>;

const INVITE_SELECT =
  "id, event_id, anonymous_name, anonymous_email, invited_by_user_id, verification_token, token_expires_at, registration_type, is_verified";

export interface CreateInviteInput {
  eventId: string;
  inviteeName: string;
  inviteeEmail: string;
  invitedByUserId: string;
  verificationToken: string;
  tokenExpiresAt: string;
  registrationSourceCommunityId: string;
}

export interface FinalizeInviteInput {
  verificationToken: string;
  userId: string;
  approvalStatus: "pending" | "approved" | "rejected";
  checkinToken: string | null;
  customAnswers?: Json | null;
}

export async function createInvite(
  client: DbClient,
  input: CreateInviteInput,
) {
  return client
    .from("event_registrations")
    .insert({
      event_id: input.eventId,
      invited_by_user_id: input.invitedByUserId,
      registration_type: "invited",
      anonymous_name: input.inviteeName,
      anonymous_email: input.inviteeEmail.toLowerCase(),
      verification_token: input.verificationToken,
      token_expires_at: input.tokenExpiresAt,
      registration_source_community_id: input.registrationSourceCommunityId,
      is_verified: false,
      rsvp_status: "going",
      user_id: null,
    })
    .select("id")
    .single();
}

export async function getInviteByToken(client: DbClient, token: string) {
  const { data, error } = await client
    .from("event_registrations")
    .select(INVITE_SELECT)
    .eq("verification_token", token)
    .eq("registration_type", "invited")
    .eq("is_verified", false)
    .maybeSingle();

  return { data: data as PendingEventInvite | null, error };
}

export async function getPendingInviteByEmail(
  client: DbClient,
  eventId: string,
  email: string,
) {
  const { data, error } = await client
    .from("event_registrations")
    .select(INVITE_SELECT)
    .eq("event_id", eventId)
    .eq("anonymous_email", email.toLowerCase())
    .eq("registration_type", "invited")
    .eq("is_verified", false)
    .maybeSingle();

  return { data: data as PendingEventInvite | null, error };
}

export async function refreshInviteToken(
  client: DbClient,
  inviteId: string,
  verificationToken: string,
  tokenExpiresAt: string,
  inviteeName: string,
) {
  return client
    .from("event_registrations")
    .update({
      verification_token: verificationToken,
      token_expires_at: tokenExpiresAt,
      anonymous_name: inviteeName,
    })
    .eq("id", inviteId)
    .eq("registration_type", "invited")
    .eq("is_verified", false);
}

export async function finalizeInvite(client: DbClient, input: FinalizeInviteInput) {
  return client
    .from("event_registrations")
    .update({
      user_id: input.userId,
      is_verified: true,
      rsvp_status: "going",
      approval_status: input.approvalStatus,
      checkin_token: input.checkinToken,
      custom_answers: input.customAnswers ?? null,
      verification_token: null,
      token_expires_at: null,
    })
    .eq("verification_token", input.verificationToken)
    .eq("registration_type", "invited")
    .eq("is_verified", false)
    .select("id")
    .maybeSingle();
}

export async function hasVerifiedRegistrationForEmail(
  client: DbClient,
  eventId: string,
  email: string,
) {
  const normalizedEmail = email.toLowerCase();

  const { data: anonymousRegistration } = await client
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("anonymous_email", normalizedEmail)
    .eq("is_verified", true)
    .maybeSingle();

  return !!anonymousRegistration;
}

export async function hasVerifiedRegistrationForUser(
  client: DbClient,
  eventId: string,
  userId: string,
) {
  const { data: registration } = await client
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("is_verified", true)
    .maybeSingle();

  return !!registration;
}

export async function canUserInviteToEvent(
  client: DbClient,
  eventId: string,
  communityId: string,
  userId: string,
) {
  const { data: membership } = await client
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membership?.role === "owner" || membership?.role === "admin") {
    return true;
  }

  const { data: registration } = await client
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("is_verified", true)
    .eq("rsvp_status", "going")
    .eq("approval_status", "approved")
    .maybeSingle();

  return !!registration;
}

export async function isInviterOrganizer(
  client: DbClient,
  communityId: string,
  inviterUserId: string | null,
) {
  if (!inviterUserId) {
    return false;
  }

  const { data: membership } = await client
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", inviterUserId)
    .maybeSingle();

  return membership?.role === "owner" || membership?.role === "admin";
}

export function isInviteTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) {
    return false;
  }

  const expiresAt = new Date(tokenExpiresAt);
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now();
}

export const INVITE_TOKEN_TTL_DAYS = 7;

export function getInviteTokenExpiresAt(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TOKEN_TTL_DAYS);
  return expiresAt.toISOString();
}
