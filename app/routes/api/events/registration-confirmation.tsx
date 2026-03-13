import type { ActionFunctionArgs } from "react-router";
import {
  sendRegistrationConfirmationEmail,
  sendRegistrationRequestEmail,
} from "~/shared/lib/email.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      approvalStatus,
      recipientEmail,
      recipientName,
      eventTitle,
      communityName,
      eventDate,
      eventTime,
      eventLink,
      registerAccountLink,
      startTimeISO,
      endTimeISO,
      locationAddress,
      onlineMeetingLink,
      checkinToken,
    } = body;

    if (
      !recipientEmail ||
      !recipientName ||
      !eventTitle ||
      !communityName ||
      !eventDate ||
      !eventTime ||
      !eventLink
    ) {
      return new Response("Missing required fields", { status: 400 });
    }

    if (approvalStatus === "pending") {
      await sendRegistrationRequestEmail({
        eventTitle,
        communityName,
        eventLink,
        recipientName,
        recipientEmail,
        eventDate,
        eventTime,
      });
    } else {
      if (!registerAccountLink || !startTimeISO || !endTimeISO) {
        return new Response(
          "registerAccountLink, startTimeISO and endTimeISO required for approved status",
          { status: 400 }
        );
      }
      await sendRegistrationConfirmationEmail({
        eventTitle,
        communityName,
        eventDate,
        eventTime,
        eventLink,
        recipientName,
        recipientEmail,
        registerAccountLink,
        locationAddress: locationAddress ?? undefined,
        onlineMeetingLink: onlineMeetingLink ?? undefined,
        startTimeISO,
        endTimeISO,
        checkinToken: checkinToken ?? null,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in registration-confirmation API:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
