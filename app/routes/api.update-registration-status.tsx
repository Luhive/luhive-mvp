import { createClient } from "~/lib/supabase.server";
import type { Route } from "./+types/api.update-registration-status";
import { sendEventStatusUpdateEmail } from "~/lib/email.server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return { success: false, error: "Method not allowed" };
  }

  const { supabase } = createClient(request);
  
  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const formData = await request.formData();
  const registrationId = formData.get("registrationId") as string;
  const eventId = formData.get("eventId") as string;
  const status = formData.get("status") as "approved" | "rejected";

  if (!registrationId || !eventId || !status) {
    return { success: false, error: "Missing required fields" };
  }

  if (!["approved", "rejected"].includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    // 1. Get event and community to verify permissions
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*, community_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return { success: false, error: "Event not found" };
    }

    // 2. Check if user is admin/owner of the community
    const { data: membership, error: membershipError } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", event.community_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership || !["owner", "admin"].includes(membership.role || "")) {
      return { success: false, error: "You do not have permission to manage this event" };
    }

    // 3. Update registration status
    const { error: updateError } = await supabase
      .from("event_registrations")
      .update({ approval_status: status })
      .eq("id", registrationId)
      .eq("event_id", eventId); // Extra safety check

    if (updateError) {
      console.error("Error updating registration:", updateError);
      return { success: false, error: "Failed to update status" };
    }

    // 4. Fetch registration details (including user/profile info) for email
    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .select(`
        id,
        anonymous_name,
        anonymous_email,
        user_id,
        profiles (
          full_name,
          id
        )
      `)
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      console.error("Error fetching registration details:", regError);
      // Status updated but failed to fetch details for email
      return { success: true, message: "Status updated, but failed to send email (details not found)" };
    }

    // 5. Get user email if not anonymous
    let recipientEmail = registration.anonymous_email;
    let recipientName = registration.anonymous_name;

    if (registration.user_id) {
      // Need to fetch email from auth.users which is not accessible directly via client usually,
      // but we are on server. However, supabase-js client usually doesn't give access to auth.users table directly.
      // We rely on what we have.
      // Wait, we can't get user email easily if we are not that user or using service role.
      // But we have profiles table. Does it have email? No.
      // In `api.attenders-emails.tsx` we used a trick or fetched it differently?
      // Let's check `api.attenders-list.tsx` or similar.
      // Ah, earlier in `attenders-table.tsx` search result, I saw `api.attenders-emails.tsx` usage.
      
      // Use service role client to fetch user email if needed?
      // Or maybe we just use what we have.
      // For now, if we can't get email easily for authenticated user, we might skip email or use a workaround.
      // BUT, we want to notify them.
      
      // The `AttendersTable` fetches emails via a separate API.
      // Here we are in an API route. We can use `supabase.auth.admin.getUserById` if we had service role.
      // But `createClient(request)` uses the user's token.
      
      // Actually, the admin should be able to see the email of attendees?
      // If I look at `app/components/events/attenders-table.tsx`, it fetches emails.
      
      // Let's try to get the email.
      // If we are the admin, maybe we can assume we can get it?
      // Wait, `event_registrations` doesn't store user email for auth users.
    }

    // To send email to an authenticated user, we need their email.
    // Since we are in a trusted server environment (action), we could potentialy use a service role client ONLY for fetching the email of the target user to send notification.
    // Is it safe? We are sending email TO them, not exposing it to the client.
    
    // Let's import `createServiceRoleClient`.
    
    if (!recipientEmail && registration.user_id) {
       const { createServiceRoleClient } = await import("~/lib/supabase.server");
       const adminSupabase = createServiceRoleClient();
       const { data: targetUser, error: userError } = await adminSupabase.auth.admin.getUserById(registration.user_id);
       
       if (!userError && targetUser?.user) {
         recipientEmail = targetUser.user.email!;
         recipientName = registration.profiles?.full_name || recipientName || "there";
       }
    }

    if (recipientEmail) {
        // Fetch community details
        const { data: community } = await supabase
          .from("communities")
          .select("name")
          .eq("id", event.community_id)
          .single();
          
        const eventDate = dayjs(event.start_time).tz(event.timezone);
        const url = new URL(request.url);
        const eventLink = `${url.origin}/c/${event.slug || 'community'}/events/${eventId}`; // approximate link if slug missing in event, but event has community_id

        // We need community slug for the link.
        // Fetch community slug as well.
        const { data: communityData } = await supabase
            .from("communities")
            .select("slug, name")
            .eq("id", event.community_id)
            .single();
            
        const finalEventLink = communityData ? `${url.origin}/c/${communityData.slug}/events/${eventId}` : eventLink;

        await sendEventStatusUpdateEmail({
            eventTitle: event.title,
            communityName: communityData?.name || "Community",
            eventLink: finalEventLink,
            recipientName: recipientName || "there",
            recipientEmail,
            status,
            eventDate: eventDate.format("dddd, MMMM D, YYYY"),
            eventTime: eventDate.format("h:mm A z"),
            locationAddress: event.location_address || undefined,
            onlineMeetingLink: event.online_meeting_link || undefined,
            startTimeISO: event.start_time,
            endTimeISO: event.end_time || event.start_time,
        });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in update-registration-status:", error);
    return { success: false, error: error.message || "Internal server error" };
  }
}

