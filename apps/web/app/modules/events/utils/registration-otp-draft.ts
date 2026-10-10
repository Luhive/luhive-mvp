import type { CustomAnswerJson } from "~/modules/events/model/event.types";

const DRAFT_KEY_PREFIX = "luhive_event_registration_otp";
const DRAFT_MAX_AGE_MS = 30 * 60 * 1000;

type RegistrationOtpDraft = {
  email: string;
  fullName: string;
  userExists: boolean;
  customAnswers: CustomAnswerJson | null;
  savedAt: number;
};

function draftKey(eventId: string) {
  return `${DRAFT_KEY_PREFIX}_${eventId}`;
}

/**
 * Keeps the OTP step alive across in-app browser reloads, which happen when a
 * visitor switches to their mail app to read the code.
 */
export function saveRegistrationOtpDraft(
  eventId: string,
  draft: Omit<RegistrationOtpDraft, "savedAt">,
) {
  try {
    sessionStorage.setItem(
      draftKey(eventId),
      JSON.stringify({ ...draft, savedAt: Date.now() }),
    );
  } catch {
    // Storage can be unavailable in private modes; the flow still works without it.
  }
}

export function findRegistrationOtpDraft(
  eventId: string,
): RegistrationOtpDraft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(eventId));
    if (!raw) return null;

    const draft = JSON.parse(raw) as Partial<RegistrationOtpDraft>;
    const isExpired =
      typeof draft.savedAt !== "number" ||
      Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS;
    if (isExpired || typeof draft.email !== "string" || !draft.email) {
      sessionStorage.removeItem(draftKey(eventId));
      return null;
    }

    return {
      email: draft.email,
      fullName: typeof draft.fullName === "string" ? draft.fullName : "",
      userExists: draft.userExists === true,
      customAnswers: draft.customAnswers ?? null,
      savedAt: draft.savedAt as number,
    };
  } catch {
    return null;
  }
}

export function clearRegistrationOtpDraft(eventId: string) {
  try {
    sessionStorage.removeItem(draftKey(eventId));
  } catch {
    // See saveRegistrationOtpDraft.
  }
}
