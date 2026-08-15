export type EventInviteRegistrationType = "self" | "invited";

export interface PendingEventInvite {
  id: string;
  event_id: string;
  anonymous_name: string | null;
  anonymous_email: string | null;
  invited_by_user_id: string | null;
  verification_token: string | null;
  token_expires_at: string | null;
  registration_type: EventInviteRegistrationType;
  is_verified: boolean;
}

export interface InviteSuccessResult {
  registrationId: string;
  inviteeName: string;
  inviteeEmail: string;
  invitedByUserId: string;
  invitedByName: string | null;
  isResend: boolean;
}
