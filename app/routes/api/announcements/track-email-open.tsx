import { createServiceRoleClient } from "~/shared/lib/supabase/server";
import type { LoaderFunctionArgs } from "react-router";

/**
 * Email tracking pixel endpoint
 * Receives announcementId and userId as query parameters and records the email view
 * Returns a 1x1 transparent GIF pixel
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const announcementId = url.searchParams.get("announcementId");
    const userId = url.searchParams.get("userId");

    if (!announcementId || !userId) {
      console.warn(`[Email Tracking] Missing required parameters:`, {
        announcementId,
        userId,
        timestamp: new Date().toISOString(),
      });
      // Return pixel anyway (don't fail user experience)
      return createPixelResponse();
    }

    const serviceClient = createServiceRoleClient();

    console.log(`[Email Tracking] Processing email open:`, {
      announcementId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Check for duplicate view
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
      return createPixelResponse();
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
    } else {
      console.log(`[Email Tracking] ✅ Successfully tracked email open:`, {
        announcementId,
        userId,
        insertedData,
      });
    }

    return createPixelResponse();
  } catch (error) {
    console.error("Error in track-email-open:", error);
    // Return pixel anyway (don't fail user experience)
    return createPixelResponse();
  }
}

/**
 * Returns a 1x1 transparent GIF pixel with no-cache headers
 */
function createPixelResponse(): Response {
  // 1x1 transparent GIF in base64
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new Response(pixel, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
