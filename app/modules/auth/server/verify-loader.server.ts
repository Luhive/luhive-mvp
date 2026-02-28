import { redirect } from "react-router";
import { createClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";

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
      /pending_return_to=([^;]+)/,
    );
    const pendingReturnTo = pendingReturnToMatch
      ? decodeURIComponent(pendingReturnToMatch[1])
      : null;

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
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
          `pending_return_to=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
        );
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          `${data.user.user_metadata?.given_name || ""} ${data.user.user_metadata?.family_name || ""}`.trim() ||
          data.user.email?.split("@")[0] ||
          "User";

        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: fullName,
          metadata: pendingCommunityId
            ? { referral_community_id: pendingCommunityId }
            : undefined,
        });

        if (pendingCommunityId) {
          await supabase.from("community_members").insert({
            user_id: data.user.id,
            community_id: pendingCommunityId,
            role: "member",
          });

          return redirect(`${pendingReturnTo ?? "/hub"}?joined=true`, {
            headers,
          });
        }
      } else if (pendingCommunityId) {
        const { data: existingMember } = await supabase
          .from("community_members")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("community_id", pendingCommunityId)
          .single();

        if (!existingMember) {
          const { error: memberError } = await supabase
            .from("community_members")
            .insert({
              user_id: data.user.id,
              community_id: pendingCommunityId,
              role: "member",
            });

          if (!memberError) {
            return redirect(`${pendingReturnTo ?? "/hub"}?joined=true`, {
              headers,
            });
          }
        }
      }

      const { data: community } = await supabase
        .from("communities")
        .select("slug")
        .eq("created_by", data.user.id)
        .single();

      if (community) {
        return redirect(`/c/${community.slug}`, { headers });
      }

      return redirect("/hub", { headers });
    }
  }

  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (token_hash && type === "signup") {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "signup",
    });

    if (!error && data.user) {
      const referralCommunityId =
        data.user.user_metadata?.pending_community_id;
      const returnTo = data.user.user_metadata?.pending_return_to as
        | string
        | undefined;

      if (referralCommunityId) {
        await supabase.from("community_members").insert({
          user_id: data.user.id,
          community_id: referralCommunityId,
          role: "member",
        });

        return redirect(`${returnTo ?? "/hub"}?joined=true`, { headers });
      }

      return redirect("/hub", { headers });
    }
  }

  return redirect("/login?error=verification-failed", { headers });
}
