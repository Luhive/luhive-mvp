import { Resend } from "resend";
import { EventVerificationEmail } from "~/templates/event-verification-email";
import { EventConfirmationEmail } from "~/templates/event-confirmation-email";

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
  } = data;

  try {
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

