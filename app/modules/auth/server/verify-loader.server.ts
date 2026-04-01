import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";

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

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  if (code) {
    const cookieHeader = request.headers.get("Cookie") || "";
    const pendingCommunityIdMatch = cookieHeader.match(
      /pending_community_id=([^;]+)/
    );
    const pendingCommunityId = pendingCommunityIdMatch
      ? pendingCommunityIdMatch[1]
      : null;
    const pendingReturnToMatch = cookieHeader.match(
      /pending_return_to=([^;]+)/
    );
    const pendingReturnTo = pendingReturnToMatch
      ? decodeURIComponent(pendingReturnToMatch[1])
      : null;

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logVerifyError("exchangeCodeForSession failed", {
        message: error.message,
      });
      return redirect("/login?error=oauth-failed", { headers });
    }

    if (data.user) {
      if (pendingCommunityId) {
        headers.append(
          "Set-Cookie",
          `pending_community_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
        );
      }
      if (pendingReturnTo) {
        headers.append(
          "Set-Cookie",
          `pending_return_to=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
        );
      }

      logVerify("oauth session established", {
        userId: data.user.id,
        pendingCommunityId,
        pendingReturnTo,
      });

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
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
          logVerify("profile inserted", { userId: data.user.id, fullName });
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
              const destination = pendingReturnTo ?? `/c/${community.slug}`;
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
      } else if (pendingCommunityId) {
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
              const destination = pendingReturnTo ?? `/c/${community.slug}`;
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
          destination: `/c/${community.slug}`,
        });
        return redirect(`/c/${community.slug}`, { headers });
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
            const destination = returnTo ?? `/c/${community.slug}`;
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
