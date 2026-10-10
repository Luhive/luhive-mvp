import { analytics } from "~/shared/lib/analytics/analytics";
import { isInAppBrowser } from "~/shared/lib/is-in-app-browser";
import { getEventTrackingContext } from "~/modules/events/utils/event-session-tracker";

// sessionId matches event_visits.session_id and
// event_registrations.registration_session_id, so client steps can be joined
// to server facts.
function trackRegistrationStep(eventName: string, eventId: string) {
  if (typeof window === "undefined") return;

  const context = getEventTrackingContext(eventId);
  analytics.track(eventName, {
    eventId,
    sessionId: context.sessionId,
    utmSource: context.utmSource,
    browser: isInAppBrowser(navigator.userAgent) ? "in_app" : "browser",
  });
}

export const trackFormViewed = (eventId: string) =>
  trackRegistrationStep("registration_form_viewed", eventId);

export const trackGoogleClicked = (eventId: string) =>
  trackRegistrationStep("registration_google_clicked", eventId);

export const trackOpenInBrowserClicked = (eventId: string) =>
  trackRegistrationStep("registration_open_in_browser_clicked", eventId);

export const trackFormSubmitted = (eventId: string) =>
  trackRegistrationStep("registration_form_submitted", eventId);

export const trackOtpViewed = (eventId: string) =>
  trackRegistrationStep("registration_otp_viewed", eventId);

export const trackCompleted = (eventId: string) =>
  trackRegistrationStep("registration_completed", eventId);
