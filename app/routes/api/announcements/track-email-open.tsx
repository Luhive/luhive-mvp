import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { ActionFunctionArgs } from "react-router";

type ResendTag = { name?: string; value?: string };

type ResendWebhookPayload = {
  type?: string;
  created_at?: string;
  data?: {
    email?: string;
    to?: string | string[];
    recipient?: string;
    message_id?: string;
    email_id?: string;
    metadata?: {
      announcementId?: string;
      announcement_id?: string;
    };
    tags?: ResendTag[];
  };
};

function getRecipientEmail(payload: ResendWebhookPayload): string | null {
  const data = payload.data;
  if (!data) return null;

  if (typeof data.email === "string" && data.email.length > 0) return data.email;
  if (typeof data.recipient === "string" && data.recipient.length > 0) return data.recipient;
  if (Array.isArray(data.to) && data.to.length > 0) return data.to[0] || null;
  if (typeof data.to === "string" && data.to.length > 0) return data.to;
  return null;
}

function getAnnouncementId(payload: ResendWebhookPayload): string | null {
  const metadataId = payload.data?.metadata?.announcementId || payload.data?.metadata?.announcement_id;
  if (metadataId) return metadataId;

  const tags = payload.data?.tags || [];
  const tagMatch = tags.find((tag) => tag?.name === "announcement_id");
  return tagMatch?.value || null;
}

async function findUserIdByEmail(serviceClient: any, email: string): Promise<string | null> {
  const perPage = 200;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Error fetching users page:", page, error);
      return null;
    }

    const users = data?.users || [];
    const matched = users.find((user: any) => (user?.email || "").toLowerCase() === email.toLowerCase());
    if (matched?.id) return matched.id;

    if (users.length < perPage) break;
  }

  return null;
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

    const email = getRecipientEmail(body);
    const messageId = body.data?.message_id || body.data?.email_id;
    const announcementId = getAnnouncementId(body);

    if (!email || !messageId) {
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

    console.log(`[Email Tracking] Processing email opened:`, {
      email,
      messageId,
      announcementId,
      timestamp: new Date().toISOString(),
    });

    const userId = await findUserIdByEmail(serviceClient, email);
    if (!userId) {
      console.warn(`[Email Tracking] User not found for email: ${email}`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[Email Tracking] Found user: ${userId} for email: ${email}`);

    const { data: existingView, error: existingError } = await serviceClient
      .from("announcement_views")
      .select("id")
      .eq("announcement_id", announcementId)
      .eq("user_id", userId)
      .eq("view_source", "email")
      .limit(1);

    if (existingError) {
      console.error(`[Email Tracking] Error checking existing view:`, existingError);
    }

    if (existingView && existingView.length > 0) {
      console.log(`[Email Tracking] View already recorded for this user`);
      return new Response(JSON.stringify({ received: true, recorded: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a view record with announcement ID
    console.log(`[Email Tracking] Attempting to insert view record:`, {
      announcement_id: announcementId,
      user_id: userId,
      view_source: "email",
    });

    const { data: insertedData, error: insertError } = await serviceClient
      .from("announcement_views")
      .insert({
        announcement_id: announcementId,
        user_id: userId,
        view_source: "email",
      })
      .select();

    if (insertError) {
      console.error(`[Email Tracking] RLS/Insert Error:`, {
        message: insertError.message,
        code: (insertError as any).code,
        details: (insertError as any).details,
        hint: (insertError as any).hint,
      });
      // Still return 200 to acknowledge webhook receipt
      return new Response(
        JSON.stringify({
          received: true,
          error: "Failed to record view",
          details: insertError.message,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Email Tracking] ✅ Successfully tracked email open:`, {
      announcementId,
      userId,
      insertedData,
    });

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
