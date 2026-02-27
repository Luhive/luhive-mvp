import type { ActionFunctionArgs } from "react-router";
import { createClient, createServiceRoleClient } from "~/shared/lib/supabase/server";
import { sendEventScheduleUpdateEmail } from "~/shared/lib/email.server";
import { getCoHostCommunities } from "~/modules/events/data/collaborations-repo.server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== "POST") {
		return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
	}

	const { supabase } = createClient(request);
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	let body: any;
	try {
		body = await request.json();
	} catch {
		return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const { eventId } = body as { eventId?: string };
	if (!eventId) {
		return Response.json({ success: false, error: "Missing required field: eventId" }, { status: 400 });
	}

	try {
		const serviceClient = createServiceRoleClient();
		const { data: event, error: eventError } = await serviceClient
			.from("events")
			.select("*, community_id")
			.eq("id", eventId)
			.single();
		if (eventError || !event) {
			return Response.json({ success: false, error: "Event not found" }, { status: 404 });
		}

		// Check if user's community is the host (only host can update)
		const { data: collaboration } = await serviceClient
			.from("event_collaborations")
			.select("role")
			.eq("event_id", eventId)
			.eq("community_id", event.community_id)
			.eq("role", "host")
			.eq("status", "accepted")
			.single();

		if (!collaboration) {
			return Response.json({ success: false, error: "Only host community can update event details" }, { status: 403 });
		}

		// Verify user is owner/admin of host community
		const { data: membership, error: membershipError } = await serviceClient
			.from("community_members")
			.select("role")
			.eq("community_id", event.community_id)
			.eq("user_id", user.id)
			.single();
		if (membershipError || !membership || !["owner", "admin"].includes((membership as any).role || "")) {
			// Also check if user is the community creator
			const { data: community } = await serviceClient
				.from("communities")
				.select("created_by")
				.eq("id", event.community_id)
				.single();
			if (!community || community.created_by !== user.id) {
				return Response.json({ success: false, error: "You do not have permission to manage this event" }, { status: 403 });
			}
		}

		const { data: community, error: communityError } = await serviceClient
			.from("communities")
			.select("slug, name")
			.eq("id", event.community_id)
			.single();
		if (communityError || !community) {
			return Response.json({ success: false, error: "Community not found" }, { status: 404 });
		}

		const url = new URL(request.url);
		const eventLink = `${url.origin}/c/${community.slug}/events/${eventId}`;
		const eventDateTime = dayjs(event.start_time).tz(event.timezone);
		const eventDateFormatted = eventDateTime.format("dddd, MMMM D, YYYY");
		const eventTimeFormatted = eventDateTime.format("h:mm A z");

		const { data: registrations, error: regError } = await serviceClient
			.from("event_registrations")
			.select(`
        id,
        user_id,
        anonymous_name,
        anonymous_email,
        is_verified,
        rsvp_status,
        approval_status,
        profiles ( full_name )
      `)
			.eq("event_id", eventId)
			.eq("is_verified", true)
			.eq("rsvp_status", "going")
			.eq("approval_status", "approved");

		if (regError) {
			return Response.json({ success: false, error: "Failed to fetch registrations" }, { status: 500 });
		}

		for (const reg of registrations || []) {
			let recipientEmail: string | null = reg.anonymous_email || null;
			let recipientName: string = reg.anonymous_name || (reg as any).profiles?.full_name || "there";

			if (!recipientEmail && reg.user_id) {
				const { data: userResult, error: userError } = await serviceClient.auth.admin.getUserById(reg.user_id);
				if (!userError && userResult?.user?.email) {
					recipientEmail = userResult.user.email;
					recipientName = (reg as any).profiles?.full_name || recipientName || "there";
				}
			}
			if (!recipientEmail) continue;

			await sendEventScheduleUpdateEmail({
				eventTitle: event.title,
				communityName: community.name,
				eventDate: eventDateFormatted,
				eventTime: eventTimeFormatted,
				eventLink,
				recipientName,
				recipientEmail,
				locationAddress: event.location_address || undefined,
				onlineMeetingLink: event.online_meeting_link || undefined,
			});
		}

        // notify co-host community owners/admins as well
        const { communities: coHosts, error: coHostsError } = await getCoHostCommunities(serviceClient, eventId);
        if (!coHostsError && coHosts.length > 0) {
          // gather unique user emails of owners/admins for each co-host community
          const notifiedEmails = new Set<string>();

          for (const collab of coHosts) {
            const communityId = collab.community.id;
            // fetch community owner/admin members
            const { data: members } = await serviceClient
              .from("community_members")
              .select("user_id, profiles(full_name)")
              .eq("community_id", communityId)
              .in("role", ["owner", "admin"]);

            // also include community creator if not already in list
            const { data: communityInfo } = await serviceClient
              .from("communities")
              .select("created_by")
              .eq("id", communityId)
              .single();

            const userIds = new Set<string>();
            if (members) {
              for (const m of members as any[]) {
                if (m.user_id) userIds.add(m.user_id);
              }
            }
            if (communityInfo?.created_by) {
              userIds.add(communityInfo.created_by);
            }

            for (const userId of userIds) {
              const { data: userResult, error: userError } = await serviceClient.auth.admin.getUserById(userId);
              if (userError || !userResult?.user?.email) continue;
              const email = userResult.user.email;
              if (notifiedEmails.has(email)) continue;
              notifiedEmails.add(email);

              const recipientName =
                members?.find((m: any) => m.user_id === userId)?.profiles?.full_name ||
                "there";

              await sendEventScheduleUpdateEmail({
                eventTitle: event.title,
                communityName: community.name,
                eventDate: eventDateFormatted,
                eventTime: eventTimeFormatted,
                eventLink,
                recipientName,
                recipientEmail: email,
                locationAddress: event.location_address || undefined,
                onlineMeetingLink: event.online_meeting_link || undefined,
              });
            }
          }
        }

        return Response.json({ success: true });
    } catch (error: any) {
        console.error("Error in api/events/schedule-update:", error);
        return Response.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
    }
}
