import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { announcementId, sessionId } = body;

    if (!announcementId) {
      return new Response(JSON.stringify({ error: "Missing announcementId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { supabase, headers } = createClient(request);
    const serviceClient = createServiceRoleClient() as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id && !sessionId) {
      headers.set("Content-Type", "application/json");
      return new Response(JSON.stringify({ error: "Missing sessionId for anonymous view" }), {
        status: 400,
        headers,
      });
    }

    const existingQuery = serviceClient
      .from("announcement_views")
      .select("id")
      .eq("announcement_id", announcementId)
      .eq("view_source", "web")
      .limit(1);

    const { data: existingView, error: existingError } = user?.id
      ? await existingQuery.eq("user_id", user.id)
      : await existingQuery.is("user_id", null).eq("session_id", sessionId);

    if (existingError) {
      console.error("Error checking existing announcement view:", existingError);
      headers.set("Content-Type", "application/json");
      return new Response(JSON.stringify({ error: "Failed to check existing view" }), {
        status: 500,
        headers,
      });
    }

    if (!existingView || existingView.length === 0) {
      const { error: insertError } = await serviceClient
        .from("announcement_views")
        .insert({
          announcement_id: announcementId,
          user_id: user?.id ?? null,
          session_id: user?.id ? null : sessionId,
          view_source: "web",
        });

      if (insertError) {
        console.error("Error recording announcement view:", insertError);
        headers.set("Content-Type", "application/json");
        return new Response(JSON.stringify({ error: "Failed to record view" }), {
          status: 500,
          headers,
        });
      }
    }

    // Get updated view count
    const { count: viewCount, error: countError } = await serviceClient
      .from("announcement_views")
      .select("id", { count: "exact", head: true })
      .eq("announcement_id", announcementId);

    if (countError) {
      console.error("Error fetching view count:", countError);
      headers.set("Content-Type", "application/json");
      return new Response(JSON.stringify({ error: "Failed to fetch view count" }), {
        status: 500,
        headers,
      });
    }

    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ success: true, viewCount: viewCount || 0 }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error in track-view endpoint:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
