import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";
import { Routes } from "~/shared/lib/routing/routes";
import { notifyCommunityJoin } from "~/modules/community/server/notify-community-join.server";
import { getSafeReturnTo } from "~/modules/auth/server/safe-return-to.server";
import {
  PUBLIC_COMMUNITY_COLUMNS,
  PUBLIC_EVENT_COLUMNS,
} from "~/modules/events/server/resolve-public-event.server";
import { completeEventRegistration } from "~/modules/events/server/complete-event-registration.server";
import { publicEventSlug } from "~/modules/events/utils/event-slug";

const OAUTH_PENDING_COOKIE_NAMES = [
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
];

function getCookieValue(cookieHeader: string, name: string): string | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function clearPendingCookies(headers: Headers) {
  for (const name of OAUTH_PENDING_COOKIE_NAMES) {
    headers.append(
      "Set-Cookie",
      `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
  }
}

function appendQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

function logVerify(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(`[auth/verify] ${message}`, payload);
  } else {
    console.log(`[auth/verify] ${message}`);
  }
}

function logVerifyError(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.error(`[auth/verify] ${message}`, payload);
  } else {
    console.error(`[auth/verify] ${message}`);
  }
}

type OAuthUserMetadata = {
  avatar_url?: string;
  picture?: string;
  full_name?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

function getGoogleAvatarUrlFromMetadata(
  metadata: OAuthUserMetadata | null | undefined,
): string | null {
  const raw =
    (typeof metadata?.avatar_url === "string" ? metadata.avatar_url : "") ||
    (typeof metadata?.picture === "string" ? metadata.picture : "");
  const trimmed = raw.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  if (code) {
    const cookieHeader = request.headers.get("Cookie") || "";
    const pendingCommunityId = getCookieValue(cookieHeader, "pending_community_id");
    const pendingReturnTo = getSafeReturnTo(
      getCookieValue(cookieHeader, "pending_return_to"),
    );
    const pendingEventId = getCookieValue(cookieHeader, "pending_event_id");
    const pendingEventCommunityId = getCookieValue(
      cookieHeader,
      "pending_event_community_id",
    );
    const pendingEventJoinCommunity =
      getCookieValue(cookieHeader, "pending_event_join_community") !== "false";
    const pendingEventTracking = {
      sessionId: getCookieValue(cookieHeader, "pending_event_session_id"),
      utmSource: getCookieValue(cookieHeader, "pending_event_utm_source"),
      utmMedium: getCookieValue(cookieHeader, "pending_event_utm_medium"),
      utmCampaign: getCookieValue(cookieHeader, "pending_event_utm_campaign"),
      utmContent: getCookieValue(cookieHeader, "pending_event_utm_content"),
      utmTerm: getCookieValue(cookieHeader, "pending_event_utm_term"),
      firstVisitStartedAt: getCookieValue(
        cookieHeader,
        "pending_event_first_visit_started_at",
      ),
    };

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logVerifyError("exchangeCodeForSession failed", {
        message: error.message,
      });
      return redirect("/login?error=oauth-failed", { headers });
    }

    if (data.user) {
      clearPendingCookies(headers);

      logVerify("oauth session established", {
        userId: data.user.id,
        pendingCommunityId,
        pendingReturnTo,
        pendingEventId,
      });

      const googleAvatarUrl = getGoogleAvatarUrlFromMetadata(
        data.user.user_metadata as OAuthUserMetadata | undefined,
      );

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        logVerify("profile not found, creating", { userId: data.user.id });

        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          `${data.user.user_metadata?.given_name || ""} ${data.user.user_metadata?.family_name || ""}`.trim() ||
          data.user.email?.split("@")[0] ||
          "User";

        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: fullName,
          ...(googleAvatarUrl ? { avatar_url: googleAvatarUrl } : {}),
          metadata: pendingCommunityId
            ? { referral_community_id: pendingCommunityId }
            : undefined,
        });

        if (profileError) {
          logVerifyError("profile insert failed", {
            userId: data.user.id,
            error: profileError.message,
          });
        } else {
          logVerify("profile inserted", {
            userId: data.user.id,
            fullName,
            hasAvatar: Boolean(googleAvatarUrl),
          });
        }

        if (pendingCommunityId) {
          logVerify("attempting community join (new user)", {
            userId: data.user.id,
            communityId: pendingCommunityId,
          });

          const { error: memberError } = await supabase
            .from("community_members")
            .insert({
              user_id: data.user.id,
              community_id: pendingCommunityId,
              role: "member",
            });

          if (memberError) {
            logVerifyError("community_members insert failed (new user)", {
              userId: data.user.id,
              communityId: pendingCommunityId,
              error: memberError.message,
            });
          } else {
            logVerify("community_members insert ok (new user)", {
              userId: data.user.id,
              communityId: pendingCommunityId,
            });
          }

          if (!memberError) {
            await notifyCommunityJoin({
              supabase,
              communityId: pendingCommunityId,
              memberUserId: data.user.id,
              memberEmail: data.user.email ?? null,
              memberName: fullName,
            });

            const { data: community, error: communityError } = await supabase
              .from("communities")
              .select("slug")
              .eq("id", pendingCommunityId)
              .single();

            if (communityError) {
              logVerifyError("community slug fetch failed (new user)", {
                communityId: pendingCommunityId,
                error: communityError.message,
              });
            }

            if (community) {
              const destination = pendingReturnTo ?? Routes.community.detail(community.slug);
              logVerify("redirect after join (new user)", { destination });
              return redirect(`${destination}?joined=true`, { headers });
            }

            if (!community && !communityError) {
              logVerifyError("community slug fetch returned no row (new user)", {
                communityId: pendingCommunityId,
              });
            }
          }
        }
      } else {
        if (!existingProfile.avatar_url?.trim() && googleAvatarUrl) {
          const { error: avatarError } = await supabase
            .from("profiles")
            .update({ avatar_url: googleAvatarUrl })
            .eq("id", data.user.id);

          if (avatarError) {
            logVerifyError("profile avatar update failed", {
              userId: data.user.id,
              error: avatarError.message,
            });
          } else {
            logVerify("profile avatar updated from Google", {
              userId: data.user.id,
            });
          }
        }

        if (pendingCommunityId) {
        logVerify("profile exists, checking community join", {
          userId: data.user.id,
          communityId: pendingCommunityId,
        });

        const { data: existingMember } = await supabase
          .from("community_members")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("community_id", pendingCommunityId)
          .single();

        if (!existingMember) {
          logVerify("attempting community join (existing user)", {
            userId: data.user.id,
            communityId: pendingCommunityId,
          });

          const { error: memberError } = await supabase
            .from("community_members")
            .insert({
              user_id: data.user.id,
              community_id: pendingCommunityId,
              role: "member",
            });

          if (memberError) {
            logVerifyError("community_members insert failed (existing user)", {
              userId: data.user.id,
              communityId: pendingCommunityId,
              error: memberError.message,
            });
          } else {
            logVerify("community_members insert ok (existing user)", {
              userId: data.user.id,
              communityId: pendingCommunityId,
            });
          }

          if (!memberError) {
            const { data: memberProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", data.user.id)
              .maybeSingle();

            await notifyCommunityJoin({
              supabase,
              communityId: pendingCommunityId,
              memberUserId: data.user.id,
              memberEmail: data.user.email ?? null,
              memberName:
                memberProfile?.full_name ||
                data.user.email?.split("@")[0] ||
                "A new member",
            });

            const { data: community, error: communityError } = await supabase
              .from("communities")
              .select("slug")
              .eq("id", pendingCommunityId)
              .single();

            if (communityError) {
              logVerifyError("community slug fetch failed (existing user)", {
                communityId: pendingCommunityId,
                error: communityError.message,
              });
            }

            if (community) {
              const destination = pendingReturnTo ?? Routes.community.detail(community.slug);
              logVerify("redirect after join (existing user)", { destination });
              return redirect(`${destination}?joined=true`, { headers });
            }

            if (!community && !communityError) {
              logVerifyError(
                "community slug fetch returned no row (existing user)",
                { communityId: pendingCommunityId }
              );
            }
          }
        } else {
          logVerify("already community member, skipping join", {
            userId: data.user.id,
            communityId: pendingCommunityId,
          });
        }
        } else {
        logVerify("profile exists, no pending community", {
          userId: data.user.id,
        });
      }
      }

      if (pendingEventId) {
        const [{ data: event }, { data: sourceCommunity }] = await Promise.all([
          supabase
            .from("events")
            .select(PUBLIC_EVENT_COLUMNS)
            .eq("id", pendingEventId)
            .maybeSingle(),
          pendingEventCommunityId
            ? supabase
                .from("communities")
                .select(PUBLIC_COMMUNITY_COLUMNS)
                .eq("id", pendingEventCommunityId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (!event) {
          logVerifyError("pending event not found", { eventId: pendingEventId });
          const destination = pendingReturnTo ?? Routes.hub;
          return redirect(appendQuery(destination, "register_error", "event-not-found"), {
            headers,
          });
        }

        const { data: hostCommunity } = await supabase
          .from("communities")
          .select(PUBLIC_COMMUNITY_COLUMNS)
          .eq("id", event.community_id)
          .maybeSingle();

        const eventCommunity = sourceCommunity ?? hostCommunity;
        const eventPageUrl = eventCommunity
          ? Routes.community.event(eventCommunity.slug, publicEventSlug(event))
          : (pendingReturnTo ?? Routes.hub);
        const registrationIdsToCheck = [
          event.community_id,
          pendingEventCommunityId,
        ].filter(Boolean) as string[];

        const { data: adminMembership } = registrationIdsToCheck.length
          ? await supabase
              .from("community_members")
              .select("id")
              .eq("user_id", data.user.id)
              .in("community_id", registrationIdsToCheck)
              .in("role", ["owner", "admin"])
              .maybeSingle()
          : { data: null };
        const isOwnerOrAdmin =
          Boolean(adminMembership) ||
          hostCommunity?.created_by === data.user.id ||
          sourceCommunity?.created_by === data.user.id;

        if (isOwnerOrAdmin) {
          logVerify("event oauth user is owner/admin, skipping registration", {
            userId: data.user.id,
            eventId: pendingEventId,
          });
          return redirect(eventPageUrl, { headers });
        }

        if (event.custom_questions) {
          const { data: existingRegistration } = await supabase
            .from("event_registrations")
            .select("id")
            .eq("event_id", event.id)
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (existingRegistration) {
            return redirect(appendQuery(eventPageUrl, "registered", "1"), {
              headers,
            });
          }

          const destination =
            pendingReturnTo ??
            (eventCommunity
              ? Routes.community.eventRegister(
                  eventCommunity.slug,
                  publicEventSlug(event),
                )
              : eventPageUrl);
          logVerify("event oauth requires custom questions", {
            userId: data.user.id,
            eventId: pendingEventId,
            destination,
          });
          return redirect(destination, { headers });
        }

        const registrationResult = await completeEventRegistration({
          request,
          supabase,
          user: data.user,
          event: event as import("~/shared/models/entity.types").Event,
          community: eventCommunity as import("~/shared/models/entity.types").Community | null,
          sourceCommunityId: pendingEventCommunityId || event.community_id,
          joinCommunityId: pendingEventCommunityId || event.community_id,
          joinCommunity: pendingEventJoinCommunity,
          tracking: pendingEventTracking,
          duplicateMode: "success",
        });

        if (!registrationResult.success) {
          logVerifyError("event oauth registration failed", {
            userId: data.user.id,
            eventId: pendingEventId,
            error: registrationResult.error,
          });
          const destination = pendingReturnTo ?? eventPageUrl;
          return redirect(appendQuery(destination, "register_error", "failed"), {
            headers,
          });
        }

        return redirect(appendQuery(eventPageUrl, "registered", "1"), {
          headers,
        });
      }

      const { data: community } = await supabase
        .from("communities")
        .select("slug")
        .eq("created_by", data.user.id)
        .single();

      // Prioritize explicit redirect/returnTo over default community redirect
      if (pendingReturnTo) {
        logVerify("redirect pendingReturnTo", { destination: pendingReturnTo });
        return redirect(pendingReturnTo, { headers });
      }

      if (community) {
        logVerify("redirect creator community", {
          destination: `/dashboard/${community.slug}`,
        });
        return redirect(`/dashboard/${community.slug}`, { headers });
      }

      logVerify("redirect default hub", { destination: "/hub" });
      return redirect("/hub", { headers });
    }
  }

  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (token_hash && type === "signup") {
    logVerify("verifyOtp path started", { type });

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "signup",
    });

    if (error) {
      logVerifyError("verifyOtp failed", { message: error.message });
    }

    if (!error && data.user) {
      const referralCommunityId =
        data.user.user_metadata?.pending_community_id;
      const returnTo = data.user.user_metadata?.pending_return_to as
        | string
        | undefined;

      logVerify("verifyOtp success", {
        userId: data.user.id,
        referralCommunityId,
        returnTo,
      });

      if (referralCommunityId) {
        const { error: memberError } = await supabase
          .from("community_members")
          .insert({
            user_id: data.user.id,
            community_id: referralCommunityId,
            role: "member",
          });

        if (memberError) {
          logVerifyError("community_members insert failed (verifyOtp)", {
            userId: data.user.id,
            communityId: referralCommunityId,
            error: memberError.message,
          });
        } else {
          logVerify("community_members insert ok (verifyOtp)", {
            userId: data.user.id,
            communityId: referralCommunityId,
          });
        }

        if (!memberError) {
          const { data: memberProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", data.user.id)
            .maybeSingle();

          await notifyCommunityJoin({
            supabase,
            communityId: referralCommunityId,
            memberUserId: data.user.id,
            memberEmail: data.user.email ?? null,
            memberName:
              memberProfile?.full_name ||
              data.user.email?.split("@")[0] ||
              "A new member",
          });

          const { data: community, error: communityError } = await supabase
            .from("communities")
            .select("slug")
            .eq("id", referralCommunityId)
            .single();

          if (communityError) {
            logVerifyError("community slug fetch failed (verifyOtp)", {
              communityId: referralCommunityId,
              error: communityError.message,
            });
          }

          if (community) {
            const destination = returnTo ?? Routes.community.detail(community.slug);
            logVerify("redirect after join (verifyOtp)", { destination });
            return redirect(`${destination}?joined=true`, { headers });
          }

          if (!community && !communityError) {
            logVerifyError("community slug fetch returned no row (verifyOtp)", {
              communityId: referralCommunityId,
            });
          }
        }
      }

      logVerify("redirect default hub (verifyOtp)", { destination: "/hub" });
      return redirect("/hub", { headers });
    }
  }

  logVerifyError("verification failed, redirecting to login", {
    hasCode: Boolean(url.searchParams.get("code")),
    hasTokenHash: Boolean(url.searchParams.get("token_hash")),
  });
  return redirect("/login?error=verification-failed", { headers });
}
