import crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { createClient } from "~/shared/lib/supabase/server";
import {
  sendVerificationEmail,
  sendRegistrationConfirmationEmail,
  sendRegistrationRequestEmail,
  sendSubscriptionConfirmationEmail,
} from "~/shared/lib/email.server";
import { getExternalPlatformName } from "~/modules/events/utils/external-platform";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import { sanitizeDuplicateError } from "~/modules/events/utils/sanitize-error";
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function action({ request, params }: ActionFunctionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const slug = (params as { slug?: string }).slug;
  const eventId = (params as { eventId?: string }).eventId;
  if (!eventId || !slug) {
    return { success: false, error: "Event ID and slug required" };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    console.error("Error fetching event:", eventError);
    return { success: false, error: "Event not found" };
  }

  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("*")
    .eq("id", event.community_id)
    .single();

  if (communityError || !community) {
    console.error("Community not found for event:", eventId, communityError);
    return { success: false, error: "Community not found" };
  }

  if (intent === "anonymous-custom-questions") {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const customAnswersStr = formData.get("custom_answers") as string;

    if (!name || !email) {
      return { success: false, error: "Name and email are required" };
    }

    let customAnswers = null;
    if (customAnswersStr) {
      try {
        customAnswers = JSON.parse(customAnswersStr);
      } catch (e) {
        console.error("Error parsing custom_answers:", e);
      }
    }

    if (event.custom_questions) {
      const { validateCustomAnswers } = await import(
        "~/modules/events/utils/custom-questions"
      );
      const validation = validateCustomAnswers(
        customAnswers || {},
        event.custom_questions as any
      );
      if (!validation.valid) {
        return {
          success: false,
          error: "Please fill in all required fields",
          validationErrors: validation.errors,
        };
      }
    }

    const { data: existingRegistration } = await supabase
      .from("event_registrations")
      .select("id, is_verified")
      .eq("event_id", eventId)
      .eq("anonymous_email", email)
      .maybeSingle();

    if (existingRegistration?.is_verified) {
      return {
        success: false,
        error: "This email is already registered for this event",
      };
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const approvalStatus = event.is_approve_required ? "pending" : "approved";

    const { error: registerError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        anonymous_name: name,
        anonymous_email: email,
        rsvp_status: "going",
        is_verified: false,
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        approval_status: approvalStatus,
        custom_answers: customAnswers,
      });

    if (registerError) {
      const duplicateError = sanitizeDuplicateError(registerError, {
        email,
        isVerified: existingRegistration?.is_verified,
      });
      if (duplicateError) {
        return { success: false, error: duplicateError };
      }
      console.error("Error creating registration:", registerError);
      return {
        success: false,
        error: "Failed to create registration. Please try again.",
      };
    }

    const verificationLink = `${new URL(request.url).origin}/c/${slug}/events/${eventId}/verify?token=${verificationToken}`;
    const registerAccountLink = `${new URL(request.url).origin}/signup`;

    try {
      await sendVerificationEmail({
        eventTitle: event.title,
        communityName: community.name,
        verificationLink,
        recipientName: name,
        recipientEmail: email,
        registerAccountLink,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }

    return redirect(
      `/c/${slug}/events/${eventId}/verification-sent?email=${encodeURIComponent(email)}`
    );
  }

  if (intent === "anonymous-register") {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name || !email) {
      return { success: false, error: "Name and email are required" };
    }

    const hasCustomQuestions =
      event.custom_questions &&
      (
        (event.custom_questions as { phone?: { enabled?: boolean } })
          .phone?.enabled ||
        ((event.custom_questions as { custom?: unknown[] }).custom?.length ?? 0) > 0
      );

    if (hasCustomQuestions) {
      return {
        success: true,
        needsCustomQuestions: true,
        anonymousName: name,
        anonymousEmail: email,
      };
    }

    const { data: existingRegistration, error: existingRegistrationError } =
      await supabase
        .from("event_registrations")
        .select("id, is_verified")
        .eq("event_id", eventId)
        .eq("anonymous_email", email)
        .maybeSingle();

    if (
      existingRegistrationError &&
      existingRegistrationError.code !== "PGRST116"
    ) {
      console.error("Error checking registration:", existingRegistrationError);
      return {
        success: false,
        error: "Failed to check existing registration",
      };
    }

    if (existingRegistration) {
      if (existingRegistration.is_verified) {
        return {
          success: false,
          error: "This email is already registered for this event",
        };
      } else {
        return {
          success: false,
          error: "A verification email has already been sent to this address",
        };
      }
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const approvalStatus = event.is_approve_required ? "pending" : "approved";

    const { error: registerError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        anonymous_name: name,
        anonymous_email: email,
        rsvp_status: "going",
        is_verified: false,
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        approval_status: approvalStatus,
      });

    if (registerError) {
      const duplicateError = sanitizeDuplicateError(registerError, {
        email,
        isVerified: existingRegistration?.is_verified,
      });
      if (duplicateError) {
        return { success: false, error: duplicateError };
      }
      console.error("Error creating registration:", registerError);
      return {
        success: false,
        error: "Failed to create registration. Please try again.",
      };
    }

    const verificationLink = `${new URL(request.url).origin}/c/${slug}/events/${eventId}/verify?token=${verificationToken}`;
    const registerAccountLink = `${new URL(request.url).origin}/signup`;

    try {
      await sendVerificationEmail({
        eventTitle: event.title,
        communityName: community.name,
        verificationLink,
        recipientName: name,
        recipientEmail: email,
        registerAccountLink,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }

    const submissionSource = formData.get("_source");
    if (submissionSource === "sidebar") {
      return { success: true, verificationSent: true, email };
    }

    return redirect(
      `/c/${slug}/events/${eventId}/verification-sent?email=${encodeURIComponent(email)}`
    );
  }

  if (intent === "anonymous-subscribe") {
    if (event.registration_type !== "external") {
      return {
        success: false,
        error: "Subscribe is only available for external events",
      };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name || !email) {
      return { success: false, error: "Name and email are required" };
    }

    const { data: existingRegistration, error: existingRegistrationError } =
      await supabase
        .from("event_registrations")
        .select("id, is_verified")
        .eq("event_id", eventId)
        .eq("anonymous_email", email)
        .maybeSingle();

    if (
      existingRegistrationError &&
      existingRegistrationError.code !== "PGRST116"
    ) {
      console.error("Error checking subscription:", existingRegistrationError);
      return {
        success: false,
        error: "Failed to check existing subscription",
      };
    }

    if (existingRegistration) {
      return {
        success: false,
        error: "This email is already subscribed to this event",
      };
    }

    const { error: subscribeError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        anonymous_name: name,
        anonymous_email: email,
        rsvp_status: "going",
        is_verified: true,
        approval_status: "approved",
      });

    if (subscribeError) {
      const duplicateError = sanitizeDuplicateError(subscribeError, {
        email,
        isVerified: true,
      });
      if (duplicateError) {
        return { success: false, error: duplicateError };
      }
      console.error("Error creating subscription:", subscribeError);
      return {
        success: false,
        error: "Failed to subscribe. Please try again.",
      };
    }

    const eventDate = dayjs(event.start_time).tz(event.timezone);
    const eventLink = `${new URL(request.url).origin}/c/${slug}/events/${eventId}`;
    const registerAccountLink = `${new URL(request.url).origin}/signup`;

    try {
      const externalPlatformName = getExternalPlatformName(
        (event.external_platform as ExternalPlatform) || "other"
      );

      await sendSubscriptionConfirmationEmail({
        eventTitle: event.title,
        communityName: community.name,
        eventDate: eventDate.format("dddd, MMMM D, YYYY"),
        eventTime: eventDate.format("h:mm A z"),
        eventLink,
        externalRegistrationUrl: event.external_registration_url || "",
        externalPlatformName,
        recipientName: name,
        recipientEmail: email,
        registerAccountLink,
        locationAddress: event.location_address || undefined,
        onlineMeetingLink: event.online_meeting_link || undefined,
        startTimeISO: event.start_time,
        endTimeISO: event.end_time || event.start_time,
      });
    } catch (error) {
      console.error("Failed to send subscription confirmation email:", error);
    }

    return {
      success: true,
      message: "Successfully subscribed for event updates!",
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Please login to register for this event",
    };
  }

  if (intent === "register") {
    const { data: existingRegistration } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (existingRegistration) {
      return {
        success: false,
        error: "You are already registered for this event",
      };
    }

    if (user.email) {
      const { data: existingAnonymousRegistration } = await supabase
        .from("event_registrations")
        .select("id, is_verified")
        .eq("event_id", eventId)
        .eq("anonymous_email", user.email)
        .maybeSingle();

      if (existingAnonymousRegistration) {
        return {
          success: false,
          error: "This email is already registered for this event",
        };
      }
    }

    let customAnswers = null;
    const customAnswersStr = formData.get("custom_answers") as string;
    if (customAnswersStr) {
      try {
        customAnswers = JSON.parse(customAnswersStr);
      } catch (e) {
        console.error("Error parsing custom_answers:", e);
      }
    }

    if (event.custom_questions && customAnswers) {
      const { validateCustomAnswers } = await import(
        "~/modules/events/utils/custom-questions"
      );
      const validation = validateCustomAnswers(
        customAnswers,
        event.custom_questions as any
      );
      if (!validation.valid) {
        return {
          success: false,
          error: "Please fill in all required fields",
          validationErrors: validation.errors,
        };
      }
    }

    const approvalStatus = event.is_approve_required ? "pending" : "approved";

    const { error: registerError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: user.id,
        rsvp_status: "going",
        is_verified: true,
        approval_status: approvalStatus,
        custom_answers: customAnswers,
      });

    if (registerError) {
      const duplicateError = sanitizeDuplicateError(registerError, {
        email: user.email || undefined,
      });
      if (duplicateError) {
        return { success: false, error: duplicateError };
      }
      console.error("Error creating registration:", registerError);
      return {
        success: false,
        error: "Failed to create registration. Please try again.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const eventDate = dayjs(event.start_time).tz(event.timezone);
    const eventLink = `${new URL(request.url).origin}/c/${slug}/events/${eventId}`;

    if (approvalStatus === "pending") {
      try {
        await sendRegistrationRequestEmail({
          eventTitle: event.title,
          communityName: community.name,
          eventLink,
          recipientName: profile?.full_name || "there",
          recipientEmail: user.email || "",
          eventDate: eventDate.format("dddd, MMMM D, YYYY"),
          eventTime: eventDate.format("h:mm A z"),
        });
      } catch (error) {
        console.error("Failed to send request email:", error);
      }
      return {
        success: true,
        message: "Registration request sent! Waiting for approval.",
      };
    }

    const registerAccountLink = `${new URL(request.url).origin}/signup`;

    try {
      await sendRegistrationConfirmationEmail({
        eventTitle: event.title,
        communityName: community.name,
        eventDate: eventDate.format("dddd, MMMM D, YYYY"),
        eventTime: eventDate.format("h:mm A z"),
        eventLink,
        recipientName: profile?.full_name || "there",
        recipientEmail: user.email || "",
        registerAccountLink,
        locationAddress: event.location_address || undefined,
        onlineMeetingLink: event.online_meeting_link || undefined,
        startTimeISO: event.start_time,
        endTimeISO: event.end_time || event.start_time,
      });
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }

    return {
      success: true,
      message: "Successfully registered for the event!",
    };
  }

  if (intent === "subscribe") {
    if (event.registration_type !== "external") {
      return {
        success: false,
        error: "Subscribe is only available for external events",
      };
    }

    const { data: existingRegistration } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (existingRegistration) {
      return {
        success: false,
        error: "You are already subscribed to this event",
      };
    }

    if (user.email) {
      const { data: existingAnonymousRegistration } = await supabase
        .from("event_registrations")
        .select("id, is_verified")
        .eq("event_id", eventId)
        .eq("anonymous_email", user.email)
        .maybeSingle();

      if (existingAnonymousRegistration) {
        return {
          success: false,
          error: "This email is already subscribed to this event",
        };
      }
    }

    const { error: subscribeError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: user.id,
        rsvp_status: "going",
        is_verified: true,
        approval_status: "approved",
      });

    if (subscribeError) {
      const duplicateError = sanitizeDuplicateError(subscribeError, {
        email: user.email || undefined,
      });
      if (duplicateError) {
        return { success: false, error: duplicateError };
      }
      console.error("Error creating subscription:", subscribeError);
      return {
        success: false,
        error: "Failed to subscribe. Please try again.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const eventDate = dayjs(event.start_time).tz(event.timezone);
    const eventLink = `${new URL(request.url).origin}/c/${slug}/events/${eventId}`;
    const registerAccountLink = `${new URL(request.url).origin}/signup`;

    try {
      const externalPlatformName = getExternalPlatformName(
        (event.external_platform as ExternalPlatform) || "other"
      );

      await sendSubscriptionConfirmationEmail({
        eventTitle: event.title,
        communityName: community.name,
        eventDate: eventDate.format("dddd, MMMM D, YYYY"),
        eventTime: eventDate.format("h:mm A z"),
        eventLink,
        externalRegistrationUrl: event.external_registration_url || "",
        externalPlatformName,
        recipientName: profile?.full_name || "there",
        recipientEmail: user.email || "",
        registerAccountLink,
        locationAddress: event.location_address || undefined,
        onlineMeetingLink: event.online_meeting_link || undefined,
        startTimeISO: event.start_time,
        endTimeISO: event.end_time || event.start_time,
      });
    } catch (error) {
      console.error("Failed to send subscription email:", error);
    }

    return {
      success: true,
      message: "Successfully subscribed for event updates!",
    };
  }

  if (intent === "unregister" || intent === "unsubscribe") {
    const { error: unregisterError } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (unregisterError) {
      return { success: false, error: unregisterError.message };
    }

    const message =
      event.registration_type === "external"
        ? "Unsubscribed from event updates"
        : "Registration cancelled";

    return { success: true, message };
  }

  return { success: false, error: "Invalid action" };
}
