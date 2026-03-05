import { createClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { announcementId } = body;

    if (!announcementId) {
      return new Response(JSON.stringify({ error: "Missing announcementId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = createClient(request);
    const session = await client.auth.getSession();

    if (!session.data.session?.user?.id) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert view record
    const { error: insertError } = await client
      .from("announcement_views")
      .insert({
        announcement_id: announcementId,
        user_id: session.data.session.user.id,
        view_source: "web",
      });

    if (insertError) {
      console.error("Error recording announcement view:", insertError);
      return new Response(JSON.stringify({ error: "Failed to record view" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get updated view count
    const { data: viewData, error: countError } = await client
      .from("announcement_views")
      .select("id")
      .eq("announcement_id", announcementId);

    if (countError) {
      console.error("Error fetching view count:", countError);
      return new Response(JSON.stringify({ error: "Failed to fetch view count" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const viewCount = viewData?.length || 0;

    return new Response(JSON.stringify({ success: true, viewCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in track-view endpoint:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
