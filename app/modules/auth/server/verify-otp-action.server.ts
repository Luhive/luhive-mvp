import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import { sendCommunityJoinNotification } from "~/shared/lib/email.server";

dayjs.extend(utc);
dayjs.extend(timezone);

const OTP_LENGTH = 6;

function getSafeReturnTo(returnTo: string | null): string | null {
  if (!returnTo) {
    return null;
  }

  return returnTo.startsWith("/") ? returnTo : null;
}

function withJoinedQuery(path: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}joined=true`;
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();

  const intent = (formData.get("intent") as string) || "verify";
  const isModal = formData.get("_modal") === "true";
  const email = (formData.get("email") as string | null)?.trim() || "";
  const communityId = (formData.get("communityId") as string | null)?.trim() || null;
  const returnTo = getSafeReturnTo(
    ((formData.get("returnTo") as string | null) || "").trim() || null
  );

  if (!email) {
    return Response.json(
      { success: false, error: "Email is required." },
      { headers, status: 400 }
    );
  }

  if (intent === "resend") {
    if (isModal) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) {
        return Response.json(
          { success: false, error: error.message },
          { headers, status: 400 }
        );
      }
      return Response.json({ success: true, message: "A new code was sent." }, { headers });
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { headers, status: 400 }
      );
    }

    return Response.json({ success: true, message: "A new code was sent." }, { headers });
  }

  const token = ((formData.get("token") as string | null) || "")
    .trim()
    .replace(/\s/g, "");

  if (!/^\d+$/.test(token) || token.length !== OTP_LENGTH) {
    return Response.json(
      { success: false, error: "Enter a valid 6-digit code." },
      { headers, status: 400 }
    );
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.user) {
    const message = (error?.message || "").toLowerCase();
    const isExpired = message.includes("expired");
    const isTooManyAttempts =
      message.includes("too many") || message.includes("over_email_send_rate_limit");

    return Response.json(
      {
        success: false,
        error: isTooManyAttempts
          ? "Too many attempts. Please request a new code."
          : isExpired
            ? "This code has expired. Request a new one."
            : "Invalid verification code.",
        code: isTooManyAttempts ? "too-many-attempts" : isExpired ? "expired" : "invalid",
      },
      { headers, status: 400 }
    );
  }

  const skipCommunity = formData.get("joinCommunity") === "false";
  const referralCommunityId = skipCommunity
    ? null
    : (communityId ||
        (data.user.user_metadata?.pending_community_id as string | undefined) ||
        null);
  const metadataReturnTo = getSafeReturnTo(
    (data.user.user_metadata?.pending_return_to as string | undefined) || null
  );
  const resolvedReturnTo = returnTo || metadataReturnTo;
  let joined = false;
  let communitySlug: string | null = null;

  // Event RSVP flow: create profile if name/surname provided and none exists
  const name = (formData.get("name") as string | null)?.trim();
  const surname = (formData.get("surname") as string | null)?.trim();
  if (name && surname) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!existingProfile) {
      const fullName = `${name} ${surname}`.trim();
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
      });
    }
  }

  // Event RSVP flow: register for event if eventId provided
  const eventId = (formData.get("eventId") as string | null)?.trim();
  let registeredEvent = false;
  let registeredEventCommunityId: string | null = null;
  if (eventId) {
    const customAnswersStr = formData.get("customAnswers") as string | null;
    let customAnswers: Record<string, unknown> | null = null;
    if (customAnswersStr) {
      try {
        customAnswers = JSON.parse(customAnswersStr) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, community_id, title, start_time, timezone, custom_questions, is_approve_required")
      .eq("id", eventId)
      .single();

    if (event) {
      if (event.custom_questions) {
        const { validateCustomAnswers } = await import(
          "~/modules/events/utils/custom-questions"
        );
        const validation = validateCustomAnswers(
          (customAnswers || {}) as import("~/modules/events/model/event.types").CustomAnswerJson,
          event.custom_questions as unknown as import("~/modules/events/model/event.types").CustomQuestionJson
        );
        if (!validation.valid) {
          return Response.json(
            { success: false, error: "Please fill in all required fields." },
            { headers, status: 400 }
          );
        }
      }

      const approvalStatus = event.is_approve_required ? "pending" : "approved";
      const { error: regError } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: data.user.id,
        rsvp_status: "going",
        is_verified: true,
        approval_status: approvalStatus,
        custom_answers: customAnswers as import("~/shared/models/database.types").Json | undefined,
        registration_source_community_id: event.community_id,
      });

      if (!regError) {
        registeredEvent = true;
        registeredEventCommunityId = event.community_id as string;

        // Notify host and co-host community admins about new registration
        try {
          const { data: hostCommunity } = await supabase
            .from("communities")
            .select("name, slug")
            .eq("id", event.community_id)
            .single();

          const { data: collaborations } = await supabase
            .from("event_collaborations")
            .select("community_id, community:communities(name)")
            .eq("event_id", eventId)
            .eq("status", "accepted")
            .neq("role", "host");

          const coHostCommunityNames = collaborations
            ?.map((c: { community?: { name?: string } | { name?: string }[] }) =>
              Array.isArray((c as any).community)
                ? (c as any).community[0]?.name
                : (c as any).community?.name
            )
            .filter(Boolean) as string[] | [];

          const fullName = name && surname ? `${name} ${surname}`.trim() : null;
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", data.user.id)
            .maybeSingle();

          const registrantName =
            fullName || profile?.full_name || data.user.email?.split("@")[0] || "Someone";
          const tz = (event.timezone as string) ?? "UTC";
          const eventDate = dayjs(event.start_time).tz(tz);
          const origin = new URL(request.url).origin;
          const eventLink = `${origin}/c/${hostCommunity?.slug ?? "unknown"}/events/${eventId}`;

          await fetch(`${origin}/api/events/collaboration-notification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "registration-notification",
              eventId,
              hostCommunityId: event.community_id,
              hostCommunityName: hostCommunity?.name ?? "Community",
              coHostCommunityNames,
              eventTitle: (event.title as string) ?? "Event",
              registrantName,
              registrantEmail: data.user.email ?? "",
              eventDate: eventDate.format("dddd, MMMM D, YYYY"),
              eventTime: eventDate.format("h:mm A z"),
              eventLink,
            }),
          });
        } catch (notifyError) {
          console.error("Failed to trigger registration notification:", notifyError);
        }
      }
    }
  }

  if (referralCommunityId) {
    const { data: existingMember } = await supabase
      .from("community_members")
      .select("id")
      .eq("user_id", data.user.id)
      .eq("community_id", referralCommunityId)
      .single();

    if (!existingMember) {
      await supabase.from("community_members").insert({
        user_id: data.user.id,
        community_id: referralCommunityId,
        role: "member",
      });

      // Skip community join notification when the join was driven by an event
      // registration for the same community — admins already got the event email.
      const skipCommunityNotify =
        registeredEvent && registeredEventCommunityId === referralCommunityId;

      // Notify community owner/admins about new member
      if (!skipCommunityNotify) try {
        const { data: communityData } = await supabase
          .from("communities")
          .select("name, slug")
          .eq("id", referralCommunityId)
          .single();

        if (communityData) {
          const { data: memberProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", data.user.id)
            .maybeSingle();

          const serviceClient = createServiceRoleClient();
          const { data: admins } = await serviceClient
            .from("community_members")
            .select("user_id")
            .eq("community_id", referralCommunityId)
            .in("role", ["owner", "admin"]);

          const adminIds = admins?.map((a) => a.user_id).filter((id): id is string => !!id) ?? [];
          const memberName =
            memberProfile?.full_name ||
            (name && surname ? `${name} ${surname}`.trim() : null) ||
            data.user.email?.split("@")[0] ||
            "A new member";

          for (const adminId of adminIds) {
            try {
              const { data: adminData } =
                await serviceClient.auth.admin.getUserById(adminId);
              if (adminData?.user?.email) {
                await sendCommunityJoinNotification({
                  communityName: communityData.name,
                  communitySlug: communityData.slug,
                  memberName,
                  memberEmail: data.user.email ?? "unknown",
                  ownerEmail: adminData.user.email,
                  joinedAt: new Date().toLocaleString(),
                });
                await new Promise((resolve) => setTimeout(resolve, 600));
              }
            } catch (emailError) {
              console.error(
                "Failed to send community join notification to admin:",
                adminId,
                emailError
              );
              await new Promise((resolve) => setTimeout(resolve, 600));
            }
          }
        }
      } catch (emailError) {
        console.error("Error sending community join notification:", emailError);
      }
    }

    const { data: community } = await supabase
      .from("communities")
      .select("slug")
      .eq("id", referralCommunityId)
      .single();

    if (community) {
      joined = true;
      communitySlug = community.slug;

      if (isModal) {
        return Response.json(
          { success: true, joined, communitySlug, registeredEvent },
          { headers }
        );
      }

      const destination = resolvedReturnTo ?? `/c/${community.slug}`;
      return redirect(withJoinedQuery(destination), { headers });
    }
  }

  if (isModal) {
    return Response.json(
      { success: true, joined, communitySlug, registeredEvent },
      { headers }
    );
  }

  if (resolvedReturnTo) {
    return redirect(resolvedReturnTo, { headers });
  }

  const { data: ownedCommunity } = await supabase
    .from("communities")
    .select("slug")
    .eq("created_by", data.user.id)
    .single();

  if (ownedCommunity) {
    return redirect(`/c/${ownedCommunity.slug}`, { headers });
  }

  return redirect("/hub", { headers });
}
