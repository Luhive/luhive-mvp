import { Resend } from "resend";
import { EventVerificationEmail } from "~/templates/event-verification-email";
import { EventConfirmationEmail } from "~/templates/event-confirmation-email";
import { EventStatusUpdateEmail } from "~/templates/event-status-update-email";
import { EventRegistrationRequestEmail } from "~/templates/event-registration-request-email";
import { CommunityWaitlistNotification } from "~/templates/community-waitlist-notification";
import { generateICS } from "~/lib/icsManager";

const resend = new Resend(process.env.RESEND_API_KEY);

interface VerificationEmailData {
  eventTitle: string;
  communityName: string;
  verificationLink: string;
  recipientName: string;
  recipientEmail: string;
  registerAccountLink: string;
}

interface ConfirmationEmailData {
  eventTitle: string;
  communityName: string;
  eventDate: string;
  eventTime: string;
  eventLink: string;
  recipientName: string;
  recipientEmail: string;
  registerAccountLink: string;
  locationAddress?: string;
  onlineMeetingLink?: string;
  startTimeISO: string;
  endTimeISO: string;
}

interface StatusUpdateEmailData {
  eventTitle: string;
  communityName: string;
  eventLink: string;
  recipientName: string;
  recipientEmail: string;
  status: "approved" | "rejected";
  eventDate?: string;
  eventTime?: string;
  locationAddress?: string;
  onlineMeetingLink?: string;
  startTimeISO?: string;
  endTimeISO?: string;
}

interface RegistrationRequestEmailData {
  eventTitle: string;
  communityName: string;
  eventLink: string;
  recipientName: string;
  recipientEmail: string;
  eventDate?: string;
  eventTime?: string;
}

interface CommunityWaitlistNotificationData {
  communityName: string;
  userName: string;
  userEmail: string;
  website?: string | null;
  description?: string | null;
  submittedAt: string;
}

export async function sendRegistrationRequestEmail(
  data: RegistrationRequestEmailData
) {
  const {
    eventTitle,
    communityName,
    eventLink,
    recipientName,
    recipientEmail,
    eventDate,
    eventTime,
  } = data;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: "Luhive <events@updates.luhive.com>",
      to: [recipientEmail],
      subject: `Registration Request Received: ${eventTitle}`,
      react: EventRegistrationRequestEmail({
        eventTitle,
        communityName,
        eventLink,
        recipientName,
        eventDate,
        eventTime,
      }),
    });

    if (error) {
      console.error("Error sending request email:", error);
      throw new Error(`Failed to send request email: ${error.message}`);
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending request email:", error);
    throw error;
  }
}

export async function sendVerificationEmail(data: VerificationEmailData) {
  const {
    eventTitle,
    communityName,
    verificationLink,
    recipientName,
    recipientEmail,
    registerAccountLink,
  } = data;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: "Luhive <events@updates.luhive.com>",
      to: [recipientEmail],
      subject: `Verify your registration for ${eventTitle}`,
      react: EventVerificationEmail({
        eventTitle,
        communityName,
        verificationLink,
        recipientName,
        registerAccountLink,
      }),
    });

    if (error) {
      console.error("Error sending verification email:", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

export async function sendEventStatusUpdateEmail(data: StatusUpdateEmailData) {
  const {
    eventTitle,
    communityName,
    eventLink,
    recipientName,
    recipientEmail,
    status,
    eventDate,
    eventTime,
    locationAddress,
    onlineMeetingLink,
    startTimeISO,
    endTimeISO,
  } = data;

  try {
    const attachments = [];

    // Add ICS attachment if approved and dates are provided
    if (status === "approved" && startTimeISO && endTimeISO) {
      const icsContent = generateICS({
        title: eventTitle,
        description: `${eventTitle}\n\nHosted by: ${communityName}\n\nView event details: ${eventLink}`,
        location: locationAddress || onlineMeetingLink || "Online Event",
        startTime: startTimeISO,
        endTime: endTimeISO,
        url: eventLink,
        organizerName: communityName,
        organizerEmail: "events@luhive.com",
      });

      attachments.push({
        filename: `${eventTitle.replace(/[^a-z0-9]/gi, "_")}.ics`,
        content: Buffer.from(icsContent).toString("base64"),
      });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "Luhive <events@updates.luhive.com>",
      to: [recipientEmail],
      subject:
        status === "approved"
          ? `Registration Approved: ${eventTitle}`
          : `Registration Update: ${eventTitle}`,
      react: EventStatusUpdateEmail({
        eventTitle,
        communityName,
        eventLink,
        recipientName,
        status,
        eventDate,
        eventTime,
        locationAddress,
        onlineMeetingLink,
      }),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) {
      console.error("Error sending status update email:", error);
      throw new Error(`Failed to send status update email: ${error.message}`);
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending status update email:", error);
    throw error;
  }
}

export async function sendRegistrationConfirmationEmail(
  data: ConfirmationEmailData
) {
  const {
    eventTitle,
    communityName,
    eventDate,
    eventTime,
    eventLink,
    recipientName,
    recipientEmail,
    registerAccountLink,
    locationAddress,
    onlineMeetingLink,
    startTimeISO,
    endTimeISO,
  } = data;

  try {
    // Generate ICS file content
    const icsContent = generateICS({
      title: eventTitle,
      description: `${eventTitle}\n\nHosted by: ${communityName}\n\nView event details: ${eventLink}`,
      location: locationAddress || onlineMeetingLink || "Online Event",
      startTime: startTimeISO,
      endTime: endTimeISO,
      url: eventLink,
      organizerName: communityName,
      organizerEmail: "events@luhive.com",
    });

    const { data: emailData, error } = await resend.emails.send({
      from: "Luhive <events@updates.luhive.com>",
      to: [recipientEmail],
      subject: `You're registered for ${eventTitle}!`,
      react: EventConfirmationEmail({
        eventTitle,
        communityName,
        eventDate,
        eventTime,
        eventLink,
        recipientName,
        registerAccountLink,
        locationAddress,
        onlineMeetingLink,
      }),
      // Add ICS calendar attachment
      attachments: [
        {
          filename: `${eventTitle.replace(/[^a-z0-9]/gi, "_")}.ics`,
          content: Buffer.from(icsContent).toString("base64"),
        },
      ],
    });

    if (error) {
      console.error("Error sending confirmation email:", error);
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw error;
  }
}

export async function sendCommunityWaitlistNotification(
  data: CommunityWaitlistNotificationData
) {
  const {
    communityName,
    userName,
    userEmail,
    website,
    description,
    submittedAt,
  } = data;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: "Luhive <events@updates.luhive.com>",
      to: ["luhive.startup@gmail.com"],
      subject: `New Community Request: ${communityName}`,
      react: CommunityWaitlistNotification({
        communityName,
        userName,
        userEmail,
        website,
        description,
        submittedAt,
      }),
    });

    if (error) {
      console.error("Error sending waitlist notification email:", error);
      throw new Error(
        `Failed to send waitlist notification email: ${error.message}`
      );
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending waitlist notification email:", error);
    throw error;
  }
}