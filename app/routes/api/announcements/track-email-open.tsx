import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email: string;
    message_id: string;
    metadata?: {
      announcementId?: string;
    };
  };
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: ResendWebhookPayload = await request.json();

    // Only handle email.opened events
    if (body.type !== "email.opened") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, message_id, metadata } = body.data;
    const announcementId = metadata?.announcementId;

    if (!email || !message_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!announcementId) {
      console.warn(`Email opened but no announcement ID in metadata for email: ${email}`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const serviceClient = createServiceRoleClient();

    // Get user by email
    const { data: userData, error: userError } = await (serviceClient.auth.admin as any).listUsers();

    if (userError || !userData) {
      console.error("Error fetching users:", userError);
      return new Response(JSON.stringify({ error: "Failed to find user" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = userData.users.find((u: any) => u.email === email);

    if (!user) {
      console.warn(`User not found for email: ${email}`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a view record with announcement ID
    const { error: insertError } = await serviceClient
      .from("announcement_views")
      .insert({
        announcement_id: announcementId,
        user_id: user.id,
        view_source: "email",
      });

    if (insertError) {
      console.error("Error recording email open view:", insertError);
      // Still return 200 to acknowledge webhook receipt
      return new Response(JSON.stringify({ received: true, error: "Failed to record view" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Email open tracked for announcement: ${announcementId}, user: ${user.id}`);

    return new Response(JSON.stringify({ received: true, recorded: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in track-email-open webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
