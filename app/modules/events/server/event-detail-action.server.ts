import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { createClient } from "~/shared/lib/supabase/server";
import { sendSubscriptionConfirmationEmail } from "~/shared/lib/email.server";
import { getExternalPlatformName } from "~/modules/events/utils/external-platform";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import { sanitizeDuplicateError } from "~/modules/events/utils/sanitize-error";
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { getIpLocation } from "~/shared/lib/ip-location.server";
import { getUserAgent } from "~/modules/community/utils/user-agent";
import { normalizeUtmSource } from "~/modules/events/utils/utm-source";

dayjs.extend(utc);
dayjs.extend(timezone);

function getTimeToRegisterSeconds(startedAt: string | null): number | null {
  if (!startedAt) {
    return null;
  }

  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - started.getTime()) / 1000));
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "track_visit") {
    try {
      const eventId = (formData.get("eventId") as string | null)?.trim() || "";
      const communityId =
        (formData.get("communityId") as string | null)?.trim() || "";
      const sessionId = (formData.get("sessionId") as string | null)?.trim() || "";
      const clientIp = (formData.get("clientIp") as string | null)?.trim() || null;
      const clientCountry =
        (formData.get("clientCountry") as string | null)?.trim() || null;
      const clientCity = (formData.get("clientCity") as string | null)?.trim() || null;
      const clientRegion =
        (formData.get("clientRegion") as string | null)?.trim() || null;
      const clientTimezone =
        (formData.get("clientTimezone") as string | null)?.trim() || null;

      if (!eventId || !communityId || !sessionId) {
        return { success: false, error: "Missing tracking fields" };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const location = await getIpLocation(request, clientIp);
      const mergedLocation = {
        ...location,
        country: clientCountry || location.country,
        city: clientCity || location.city,
        region: clientRegion || location.region,
        timezone: clientTimezone || location.timezone,
      };
      const ua = getUserAgent(request);

      console.log("[event_visits] client", {
        ipOverride: clientIp,
        geoOverride: {
          country: clientCountry,
          city: clientCity,
          region: clientRegion,
          timezone: clientTimezone,
        },
        ip: location.ip,
        country: mergedLocation.country,
        city: mergedLocation.city,
        region: mergedLocation.region,
        timezone: mergedLocation.timezone,
      });

      const { error: visitInsertError } = await (supabase as any).from("event_visits").insert({
        event_id: eventId,
        community_id: communityId,
        session_id: sessionId,
        user_id: user?.id || null,
        utm_source: normalizeUtmSource(formData.get("utmSource") as string | null),
        utm_medium: (formData.get("utmMedium") as string | null) || null,
        utm_campaign: (formData.get("utmCampaign") as string | null) || null,
        utm_content: (formData.get("utmContent") as string | null) || null,
        utm_term: (formData.get("utmTerm") as string | null) || null,
        referrer_url: (formData.get("referrerUrl") as string | null) || null,
        referrer_domain: (formData.get("referrerDomain") as string | null) || null,
        ip: location.ip,
        country: mergedLocation.country,
        city: mergedLocation.city,
        region: mergedLocation.region,
        timezone: mergedLocation.timezone,
        device_type: ua.device.type || null,
        browser: ua.browser.name || null,
        os: ua.os.name || null,
        is_mobile: ua.device.isMobile || false,
      });

      if (visitInsertError) {
        console.error("Failed to insert event visit:", visitInsertError);
        return { success: false, error: "Failed to track visit" };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to track event visit:", error);
      return { success: false };
    }
  }

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

    // Get community ID from slug to track registration source
    let registrationSourceCommunityId = community.id;
    if (slug && slug !== community.slug) {
      // User is subscribing from a co-host community page
      const { data: sourceCommunity } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", slug)
        .single();
      if (sourceCommunity) {
        registrationSourceCommunityId = sourceCommunity.id;
      }
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
        registration_source_community_id: registrationSourceCommunityId,
        registration_ip: (await getIpLocation(request)).ip,
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

    // Notify host and co-host community admins about new subscription
    try {
      const hostCommunityName = community.name;
      const { data: collaborations } = await supabase
        .from("event_collaborations")
        .select("community_id, community:communities(name)")
        .eq("event_id", eventId)
        .eq("status", "accepted")
        .neq("role", "host");

      const coHostCommunityNames = collaborations
        ?.map((c: any) => c.community?.name)
        .filter(Boolean) as string[] || [];

      await fetch(`${new URL(request.url).origin}/api/events/collaboration-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "registration-notification",
          eventId,
          hostCommunityId: event.community_id,
          hostCommunityName,
          coHostCommunityNames,
          eventTitle: event.title,
          registrantName: name || email?.split("@")[0] || "Someone",
          registrantEmail: email,
          eventDate: eventDate.format("dddd, MMMM D, YYYY"),
          eventTime: eventDate.format("h:mm A z"),
          eventLink,
        }),
      });
    } catch (notifyError) {
      console.error("Failed to trigger registration notification:", notifyError);
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
    const checkinToken =
      approvalStatus === "approved" ? crypto.randomUUID() : null;

    const eventSessionId =
      (formData.get("eventSessionId") as string | null)?.trim() || null;
    const eventFirstVisitStartedAt =
      (formData.get("eventFirstVisitStartedAt") as string | null)?.trim() || null;

    const registrationLocation = await getIpLocation(request);

    let registrationSessionId: string | null = eventSessionId;
    let registrationIp: string | null = registrationLocation.ip;
    let registrationCountry: string | null = registrationLocation.country;
    let registrationCity: string | null = registrationLocation.city;
    let timeToRegisterSeconds: number | null = getTimeToRegisterSeconds(
      eventFirstVisitStartedAt,
    );
    let utmSource = normalizeUtmSource(formData.get("eventUtmSource") as string | null);
    let utmMedium = (formData.get("eventUtmMedium") as string | null) || null;
    let utmCampaign = (formData.get("eventUtmCampaign") as string | null) || null;
    let utmContent = (formData.get("eventUtmContent") as string | null) || null;
    let utmTerm = (formData.get("eventUtmTerm") as string | null) || null;

    let firstVisitQuery = (supabase as any)
      .from("event_visits")
      .select(
        "visited_at, session_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, ip, country, city",
      )
      .eq("event_id", eventId)
      .order("visited_at", { ascending: true })
      .limit(1);

    if (eventSessionId) {
      firstVisitQuery = firstVisitQuery.eq("session_id", eventSessionId);
    } else {
      firstVisitQuery = firstVisitQuery.eq("user_id", user.id);
    }

    const { data: firstVisitRows } = await firstVisitQuery;
    const firstVisit = firstVisitRows?.[0] ?? null;

    if (firstVisit) {
      registrationSessionId = registrationSessionId || firstVisit.session_id || null;
      registrationIp = registrationIp || firstVisit.ip || null;
      registrationCountry = firstVisit.country || null;
      registrationCity = firstVisit.city || null;
      utmSource = normalizeUtmSource(firstVisit.utm_source || utmSource);
      utmMedium = firstVisit.utm_medium || utmMedium;
      utmCampaign = firstVisit.utm_campaign || utmCampaign;
      utmContent = firstVisit.utm_content || utmContent;
      utmTerm = firstVisit.utm_term || utmTerm;

      const visitedAt = new Date(firstVisit.visited_at);
      const now = new Date();
      if (!Number.isNaN(visitedAt.getTime())) {
        timeToRegisterSeconds = Math.max(
          0,
          Math.floor((now.getTime() - visitedAt.getTime()) / 1000),
        );
      }
    }

    // Get community ID from slug to track registration source
    let registrationSourceCommunityId = community.id;
    if (slug && slug !== community.slug) {
      // User is registering from a co-host community page
      const { data: sourceCommunity } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", slug)
        .single();
      if (sourceCommunity) {
        registrationSourceCommunityId = sourceCommunity.id;
      }
    }

    const { error: registerError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: user.id,
        rsvp_status: "going",
        is_verified: true,
        approval_status: approvalStatus,
        custom_answers: customAnswers,
        registration_source_community_id: registrationSourceCommunityId,
        checkin_token: checkinToken,
        registration_session_id: registrationSessionId,
        registration_ip: registrationIp,
        registration_country: registrationCountry,
        registration_city: registrationCity,
        time_to_register_seconds: timeToRegisterSeconds,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
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
    const origin = new URL(request.url).origin;

    try {
      await fetch(`${origin}/api/events/registration-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalStatus,
          recipientEmail: user.email || "",
          recipientName: profile?.full_name || "there",
          eventTitle: event.title,
          communityName: community.name,
          eventDate: eventDate.format("dddd, MMMM D, YYYY"),
          eventTime: eventDate.format("h:mm A z"),
          eventLink,
          registerAccountLink: `${origin}/signup`,
          startTimeISO: event.start_time,
          endTimeISO: event.end_time || event.start_time,
          locationAddress: event.location_address || undefined,
          onlineMeetingLink: event.online_meeting_link || undefined,
          checkinToken,
        }),
      });
    } catch (error) {
      console.error("Failed to trigger registration confirmation email:", error);
    }

    if (approvalStatus === "pending") {
      return {
        success: true,
        message: "Registration request sent! Waiting for approval.",
      };
    }

    // Notify host and co-host community admins about new registration
    try {
      // Get host community name
      const hostCommunityName = community.name;

      // Get co-host community names
      const { data: collaborations } = await supabase
        .from("event_collaborations")
        .select("community_id, community:communities(name)")
        .eq("event_id", eventId)
        .eq("status", "accepted")
        .neq("role", "host");

      const coHostCommunityNames = collaborations
        ?.map((c: any) => c.community?.name)
        .filter(Boolean) as string[] || [];

      await fetch(`${new URL(request.url).origin}/api/events/collaboration-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "registration-notification",
          eventId,
          hostCommunityId: event.community_id,
          hostCommunityName,
          coHostCommunityNames,
          eventTitle: event.title,
          registrantName: profile?.full_name || user.email?.split("@")[0] || "Someone",
          registrantEmail: user.email || "",
          eventDate: eventDate.format("dddd, MMMM D, YYYY"),
          eventTime: eventDate.format("h:mm A z"),
          eventLink,
        }),
      });
    } catch (notifyError) {
      console.error("Failed to trigger registration notification:", notifyError);
      // Don't fail the registration if notification fails
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

    // Get community ID from slug to track registration source
    let registrationSourceCommunityId = community.id;
    if (slug && slug !== community.slug) {
      // User is subscribing from a co-host community page
      const { data: sourceCommunity } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", slug)
        .single();
      if (sourceCommunity) {
        registrationSourceCommunityId = sourceCommunity.id;
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
        registration_source_community_id: registrationSourceCommunityId,
        registration_ip: (await getIpLocation(request)).ip,
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

    // Notify host and co-host community admins about new subscription
    try {
      const hostCommunityName = community.name;
      const { data: collaborations } = await supabase
        .from("event_collaborations")
        .select("community_id, community:communities(name)")
        .eq("event_id", eventId)
        .eq("status", "accepted")
        .neq("role", "host");

      const coHostCommunityNames = collaborations
        ?.map((c: any) => c.community?.name)
        .filter(Boolean) as string[] || [];

      await fetch(`${new URL(request.url).origin}/api/events/collaboration-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "registration-notification",
          eventId,
          hostCommunityId: event.community_id,
          hostCommunityName,
          coHostCommunityNames,
          eventTitle: event.title,
          registrantName: profile?.full_name || user.email?.split("@")[0] || "Someone",
          registrantEmail: user.email || "",
          eventDate: eventDate.format("dddd, MMMM D, YYYY"),
          eventTime: eventDate.format("h:mm A z"),
          eventLink,
        }),
      });
    } catch (notifyError) {
      console.error("Failed to trigger registration notification:", notifyError);
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
