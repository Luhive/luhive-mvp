import { Resend } from "resend";
import type React from "react";
import { EventVerificationEmail } from "~/templates/event-verification-email";
import { EventConfirmationEmail } from "~/templates/event-confirmation-email";
import { EventStatusUpdateEmail } from "~/templates/event-status-update-email";
import { EventUpdateEmail } from "~/templates/event-update-email";
import { EventReminderEmail } from "~/templates/event-reminder-email";
import { EventRegistrationRequestEmail } from "~/templates/event-registration-request-email";
import { EventSubscriptionEmail } from "~/templates/event-subscription-email";
import { CommunityWaitlistNotification } from "~/templates/community-waitlist-notification";
import { CommunityJoinNotification } from "~/templates/community-join-notification";
import { CommunityAnnouncementEmail } from "~/templates/community-announcement-email";
import { CollaborationInviteEmail } from "~/templates/collaboration-invite-email";
import { CollaborationAcceptedEmail } from "~/templates/collaboration-accepted-email";
import { generateICS } from "~/modules/events/utils/ics-manager";

// Utility function to mask sensitive values for logging
function maskValue(value: string | undefined, showLength = true): string {
  if (!value) return "undefined";
  if (value.length <= 8) return "***";
  const prefix = value.substring(0, 4);
  const suffix = value.substring(value.length - 4);
  return showLength ? `${prefix}...${suffix} (length: ${value.length})` : `${prefix}...${suffix}`;
}

// Validate email format (basic check)
function isValidEmailFormat(email: string): boolean {
  // Check if it contains @ symbol (basic validation)
  if (!email.includes("@")) return false;

  // If formatted as "Name <email>", extract the email part
  const emailMatch = email.match(/<([^>]+)>/);
  const emailToCheck = emailMatch ? emailMatch[1] : email;

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailToCheck);
}

// Environment variable validation
interface EmailConfig {
  resendApiKey: string | undefined;
  emailSender: string | undefined;
  isValid: boolean;
  errors: string[];
}

function validateEmailConfig(): EmailConfig {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailSender = process.env.EMAIL_SENDER;
  const errors: string[] = [];
  let isValid = true;

  // Check RESEND_API_KEY
  if (!resendApiKey) {
    errors.push("RESEND_API_KEY is not set in environment variables");
    isValid = false;
  } else if (resendApiKey.trim().length === 0) {
    errors.push("RESEND_API_KEY is empty");
    isValid = false;
  }

  // Check EMAIL_SENDER format if provided
  if (emailSender) {
    const formattedEmail = getFromEmail();
    if (!isValidEmailFormat(formattedEmail)) {
      errors.push(`EMAIL_SENDER format is invalid. Got: "${emailSender}", formatted as: "${formattedEmail}". Email must contain @ symbol.`);
      isValid = false;
    }
  }

  // Log validation results
  if (!isValid) {
    console.error("❌ Email configuration validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error(`  RESEND_API_KEY: ${maskValue(resendApiKey)}`);
    console.error(`  EMAIL_SENDER: ${emailSender || "undefined"}`);
  } else {
    console.log("✅ Email configuration validated successfully");
    console.log(`  RESEND_API_KEY: ${maskValue(resendApiKey)}`);
    console.log(`  EMAIL_SENDER: ${emailSender || "using fallback"}`);
  }

  return {
    resendApiKey,
    emailSender,
    isValid,
    errors,
  };
}

// Format email sender: if EMAIL_SENDER is provided and not already formatted,
// wrap it with "Luhive <" and ">". Otherwise use the provided format or fallback.
function getFromEmail(): string {
  const emailSender = process.env.EMAIL_SENDER;
  if (!emailSender) {
    return "Luhive <events@events.luhive.com>";
  }
  // If already formatted with angle brackets, use as-is
  if (emailSender.includes("<") && emailSender.includes(">")) {
    return emailSender;
  }
  // Otherwise, format it as "Luhive <email>"
  return `Luhive <${emailSender}>`;
}

// Validate configuration on module load
const emailConfig = validateEmailConfig();

// Initialize Resend client only if API key exists
let resend: Resend | null = null;
if (emailConfig.resendApiKey) {
  try {
    resend = new Resend(emailConfig.resendApiKey);
    console.log("✅ Resend client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Resend client:", error);
  }
} else {
  console.error("❌ Resend client not initialized: RESEND_API_KEY is missing");
}

const FROM_EMAIL = getFromEmail();

/**
 * Core email sending types and helpers
 */

type BaseEmailPayload = {
  to: string | string[];
  subject: string;
  /**
   * Use either `react` (preferred) or `html` for the body, not both.
   */
  react?: React.ReactElement;
  html?: string;
  attachments?: {
    filename: string;
    content: string;
  }[];
  tags?: string[];
  /**
   * Optional contextual metadata for logging
   */
  metadata?: Record<string, unknown>;
  /**
   * Optional custom from address. Format: "Name <email@example.com>"
   * If not provided, defaults to FROM_EMAIL
   */
  from?: string;
};

type EmailSendResult = {
  to: string;
  success: boolean;
  id?: string;
  error?: {
    message: string;
    name?: string;
  };
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function sendEmailsInternal(
  payloads: BaseEmailPayload[]
): Promise<EmailSendResult[]> {
  if (payloads.length === 0) return [];

  if (!resend) {
    const errorMsg =
      "Resend client not initialized. Check RESEND_API_KEY environment variable.";
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!isValidEmailFormat(FROM_EMAIL)) {
    const errorMsg = `Invalid FROM_EMAIL format: ${FROM_EMAIL}`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const results: EmailSendResult[] = [];
  const chunks = chunkArray(payloads, 100);
  const batchStart = Date.now();

  console.log(
    `📨 Sending ${payloads.length} email(s) via unified email service in ${chunks.length} chunk(s)...`
  );

  for (const [chunkIndex, chunk] of chunks.entries()) {
    const chunkStart = Date.now();
    const isSingle = chunk.length === 1;
    console.log(
      `   Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} email(s)) - mode: ${
        isSingle ? "single" : "batch"
      }`
    );

    if (isSingle) {
      const payload = chunk[0]!;
      try {
        const toArray = Array.isArray(payload.to) ? payload.to : [payload.to];

        const { data, error } = await resend.emails.send({
          from: payload.from ?? FROM_EMAIL,
          to: toArray,
          subject: payload.subject,
          react: payload.react,
          html: payload.html,
          attachments:
            payload.attachments && payload.attachments.length > 0
              ? payload.attachments
              : undefined,
        } as any);

        if (error) {
          const errorDetails: Record<string, unknown> = {
            message: (error as any).message,
          };
          if ("name" in (error as any) && typeof (error as any).name === "string") {
            errorDetails.name = (error as any).name;
          }
          console.error("❌ Resend API error (single):", errorDetails, {
            to: payload.to,
            subject: payload.subject,
            metadata: payload.metadata,
          });
          results.push({
            to: Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
            success: false,
            error: {
              message: (error as any).message,
              name: (error as any).name,
            },
          });
        } else {
          console.log("✅ Email sent successfully (single):", {
            id: (data as any)?.id,
            to: Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
            subject: payload.subject,
            metadata: payload.metadata,
          });
          results.push({
            to: Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
            success: true,
            id: (data as any)?.id,
          });
        }
      } catch (error) {
        console.error("❌ Error sending email (single):", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          to: payload.to,
          subject: payload.subject,
          metadata: payload.metadata,
        });
        results.push({
          to: Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
          success: false,
          error: {
            message:
              error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : undefined,
          },
        });
      }
    } else {
      try {
        const batchPayload = chunk.map((payload) => ({
          from: payload.from ?? FROM_EMAIL,
          to: Array.isArray(payload.to) ? payload.to : [payload.to],
          subject: payload.subject,
          react: payload.react,
          html: payload.html,
          attachments:
            payload.attachments && payload.attachments.length > 0
              ? payload.attachments
              : undefined,
        }));

        const { data, error } = await (resend as any).batch.send(
          batchPayload
        );

        if (error) {
          const errorDetails: Record<string, unknown> = {
            message: (error as any).message,
          };
          if ("name" in (error as any) && typeof (error as any).name === "string") {
            errorDetails.name = (error as any).name;
          }
          console.error("❌ Resend batch API error:", errorDetails, {
            chunkSize: chunk.length,
          });

          for (const payload of chunk) {
            results.push({
              to: Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
              success: false,
              error: {
                message: (error as any).message,
                name: (error as any).name,
              },
            });
          }
        } else {
          const items: any[] = Array.isArray(data) ? data : [];
          console.log("✅ Batch email send succeeded:", {
            chunkSize: chunk.length,
            returned: items.length,
          });

          chunk.forEach((payload, index) => {
            const item = items[index];
            results.push({
              to: Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
              success: true,
              id: item?.id,
            });
          });
        }
      } catch (error) {
        console.error("❌ Error sending batch emails:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          chunkSize: chunk.length,
        });
        for (const payload of chunk) {
          results.push({
            to: Array.isArray(payload.to) ? payload.to.join(",") : payload.to,
            success: false,
            error: {
              message:
                error instanceof Error ? error.message : String(error),
              name: error instanceof Error ? error.name : undefined,
            },
          });
        }
      }

      const chunkEnd = Date.now();
      console.log(
        `   ⏱️ Chunk ${chunkIndex + 1}/${chunks.length} completed in ${
          (chunkEnd - chunkStart) / 1000
        }s`
      );
    }
  }

  const batchEnd = Date.now();
  console.log(
    `📨 Unified email service finished: total=${payloads.length}, success=${
      results.filter((r) => r.success).length
    }, failed=${results.filter((r) => !r.success).length
    }, durationSec=${(batchEnd - batchStart) / 1000}`
  );

  return results;
}

async function sendEmail(payload: BaseEmailPayload): Promise<EmailSendResult> {
  const [result] = await sendEmailsInternal([payload]);
  return result;
}

async function sendEmailBatch(
  payloads: BaseEmailPayload[]
): Promise<EmailSendResult[]> {
  return sendEmailsInternal(payloads);
}

/**
 * Plan-aligned helper names
 * These wrap the core helpers above to match the documented API in the plan.
 */
async function sendEmailInternal(
  payload: BaseEmailPayload
): Promise<EmailSendResult> {
  return sendEmail(payload);
}

async function sendEmailsBatch(
  payloads: BaseEmailPayload[]
): Promise<EmailSendResult[]> {
  return sendEmailBatch(payloads);
}

// Export configuration for debugging
export function getEmailConfig() {
  return {
    ...emailConfig,
    fromEmail: FROM_EMAIL,
    resendInitialized: resend !== null,
    maskedApiKey: maskValue(emailConfig.resendApiKey),
  };
}

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

interface EventScheduleUpdateEmailData {
  eventTitle: string;
  communityName: string;
  eventDate: string;
  eventTime: string;
  eventLink: string;
  recipientName: string;
  recipientEmail: string;
  locationAddress?: string;
  onlineMeetingLink?: string;
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

interface CommunityJoinNotificationData {
  communityName: string;
  communitySlug: string;
  memberName: string;
  memberEmail: string;
  ownerEmail: string;
  joinedAt: string;
}

interface SubscriptionEmailData {
  eventTitle: string;
  communityName: string;
  eventDate: string;
  eventTime: string;
  eventLink: string;
  externalRegistrationUrl: string;
  externalPlatformName: string;
  recipientName: string;
  recipientEmail: string;
  registerAccountLink: string;
  locationAddress?: string;
  onlineMeetingLink?: string;
  startTimeISO: string;
  endTimeISO: string;
}

interface CollaborationInviteEmailData {
  eventTitle: string;
  hostCommunityName: string;
  coHostCommunityName: string;
  recipientEmail: string;
  inviteLink: string;
  eventLink: string;
  invitedByName: string;
}

interface CollaborationAcceptedEmailData {
  eventTitle: string;
  hostCommunityName: string;
  coHostCommunityName: string;
  recipientEmail: string;
  eventLink: string;
}

interface NewEventNotificationEmailData {
  eventTitle: string;
  communityName: string;
  eventDate: string;
  eventTime: string;
  eventLink: string;
  recipientEmail: string;
  recipientName: string;
  locationAddress?: string;
  onlineMeetingLink?: string;
}

interface NewCollaborationEventEmailData {
  eventTitle: string;
  hostCommunityName: string;
  coHostCommunityName: string;
  eventDate: string;
  eventTime: string;
  eventLink: string;
  recipientEmail: string;
  recipientName: string;
  isNewEvent: boolean;
  locationAddress?: string;
  onlineMeetingLink?: string;
}

interface EventRegistrationNotificationEmailData {
  eventTitle: string;
  registrantName: string;
  registrantEmail: string;
  hostCommunityName: string;
  coHostCommunityNames: string[];
  eventDate: string;
  eventTime: string;
  eventLink: string;
  recipientEmail: string;
  recipientName: string;
}

interface AnnouncementNotificationEmailData {
  title: string;
  description: string;
  communityName: string;
  announcementLink: string;
  recipientEmail: string;
  recipientName?: string;
  imageUrls?: string[];
  createdAt?: string;
  communityLogo?: string;
  announcementId?: string;
  userId?: string;
  recipientUserId?: string;
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

  console.log(`📧 Attempting to send registration request email:`, {
    to: recipientEmail,
    from: FROM_EMAIL,
    subject: `Registration Request Received: ${eventTitle}`,
  });

  const result = await sendEmailInternal({
    to: recipientEmail,
    subject: `Registration Request Received: ${eventTitle}`,
    react: EventRegistrationRequestEmail({
      eventTitle,
      communityName,
      eventLink,
      recipientName,
      eventDate,
      eventTime,
    }),
    metadata: {
      template: "EventRegistrationRequestEmail",
      eventTitle,
      communityName,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send request email:", {
      to: recipientEmail,
      fromEmail: FROM_EMAIL,
      error: result.error,
    });
    throw new Error(
      `Failed to send request email: ${result.error?.message || "Unknown error"}`
    );
  }

  console.log(`✅ Registration request email sent successfully:`, {
    id: result.id,
    from: FROM_EMAIL,
    to: recipientEmail,
  });

  return { success: true, data: { id: result.id } };
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

  console.log(`📧 Attempting to send verification email:`, {
    to: recipientEmail,
    from: FROM_EMAIL,
    subject: `Verify your registration for ${eventTitle}`,
  });

  const result = await sendEmailInternal({
    to: recipientEmail,
    subject: `Verify your registration for ${eventTitle}`,
    react: EventVerificationEmail({
      eventTitle,
      communityName,
      verificationLink,
      recipientName,
      registerAccountLink,
    }),
    metadata: {
      template: "EventVerificationEmail",
      eventTitle,
      communityName,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send verification email:", {
      to: recipientEmail,
      fromEmail: FROM_EMAIL,
      error: result.error,
    });
    throw new Error(
      `Failed to send verification email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  console.log(`✅ Verification email sent successfully:`, {
    id: result.id,
    from: FROM_EMAIL,
    to: recipientEmail,
  });

  return { success: true, data: { id: result.id } };
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

  const attachments: { filename: string; content: string }[] = [];

  // Add ICS attachment if approved and dates are provided
  if (status === "approved" && startTimeISO && endTimeISO) {
    console.log(`   Generating ICS attachment...`);
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
    console.log(`   ICS attachment created`);
  }

  const subject =
    status === "approved"
      ? `Registration Approved: ${eventTitle}`
      : `Registration Update: ${eventTitle}`;

  const baseEmailAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;

  console.log(`📧 Attempting to send status update email:`, {
    to: recipientEmail,
    from: `${communityName} <${baseEmailAddress}>`,
    status,
    subject,
  });

  const result = await sendEmail({
    to: recipientEmail,
    subject,
    from: `${communityName} <${baseEmailAddress}>`,
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
    attachments,
    metadata: {
      template: "EventStatusUpdateEmail",
      eventTitle,
      communityName,
      status,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send status update email:", {
      to: recipientEmail,
      fromEmail: FROM_EMAIL,
      status,
      error: result.error,
    });
    throw new Error(
      `Failed to send status update email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  const baseEmailAddressLog = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;
  console.log(`✅ Status update email sent successfully:`, {
    id: result.id,
    from: `${communityName} <${baseEmailAddressLog}>`,
    to: recipientEmail,
    status,
    hasAttachment: attachments.length > 0,
  });

  return { success: true, data: { id: result.id } };
}

export async function sendEventScheduleUpdateEmail(
  data: EventScheduleUpdateEmailData
) {
  const {
    eventTitle,
    communityName,
    eventDate,
    eventTime,
    eventLink,
    recipientName,
    recipientEmail,
    locationAddress,
    onlineMeetingLink,
  } = data;

  const baseEmailAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;

  console.log(`📧 Attempting to send event schedule update email:`, {
    to: recipientEmail,
    from: `${communityName} <${baseEmailAddress}>`,
    subject: `Event Updated: ${eventTitle}`,
  });

  const result = await sendEmail({
    to: recipientEmail,
    subject: `Event Updated: ${eventTitle}`,
    from: `${communityName} <${baseEmailAddress}>`,
    react: EventUpdateEmail({
      eventTitle,
      communityName,
      eventDate,
      eventTime,
      eventLink,
      recipientName,
      locationAddress,
      onlineMeetingLink,
    }),
    metadata: {
      template: "EventUpdateEmail",
      eventTitle,
      communityName,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send event schedule update email:", {
      to: recipientEmail,
      fromEmail: FROM_EMAIL,
      error: result.error,
    });
    throw new Error(
      `Failed to send event schedule update email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  const baseEmailAddressLog = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;
  console.log(`✅ Event schedule update email sent successfully:`, {
    id: result.id,
    from: `${communityName} <${baseEmailAddressLog}>`,
    to: recipientEmail,
  });

  return { success: true, data: { id: result.id } };
}

export async function sendEventReminderEmail(data: {
  eventTitle: string;
  communityName: string;
  communityLogoUrl?: string | null;
  eventDate: string;
  eventTime: string;
  eventLink: string;
  recipientName: string;
  recipientEmail: string;
  message?: string;
  locationAddress?: string;
  reminderTime?: "1-hour" | "3-hours" | "1-day";
}) {
  const {
    eventTitle,
    communityName,
    communityLogoUrl,
    eventDate,
    eventTime,
    eventLink,
    recipientName,
    recipientEmail,
    message,
    locationAddress,
    reminderTime = "1-hour",
  } = data;

  const baseEmailAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;

  console.log(`📧 Attempting to send event reminder email:`, {
    to: recipientEmail,
    from: `${communityName} <${baseEmailAddress}>`,
    subject: `Reminder: ${eventTitle}`,
  });

  const result = await sendEmail({
    to: recipientEmail,
    subject: `Reminder: ${eventTitle}`,
    from: `${communityName} <${baseEmailAddress}>`,
    react: EventReminderEmail({
      eventTitle,
      communityName,
      communityLogoUrl: communityLogoUrl || null,
      eventDate,
      eventTime,
      eventLink,
      recipientName,
      locationAddress,
      reminderTime,
    }),
    metadata: {
      template: "EventReminderEmail",
      eventTitle,
      communityName,
      message,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send event reminder email:", {
      to: recipientEmail,
      fromEmail: FROM_EMAIL,
      error: result.error,
    });
    throw new Error(
      `Failed to send reminder email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  console.log(`✅ Event reminder email sent successfully:`, {
    id: result.id,
    from: FROM_EMAIL,
    to: recipientEmail,
  });

  return { success: true, data: { id: result.id } };
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

  console.log(`📧 Attempting to send confirmation email:`, {
    to: recipientEmail,
    from: FROM_EMAIL,
    subject: `You're registered for ${eventTitle}!`,
  });

  // Generate ICS file content
  console.log(`   Generating ICS attachment...`);
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
  console.log(`   ICS attachment created`);

  const result = await sendEmail({
    to: recipientEmail,
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
    attachments: [
      {
        filename: `${eventTitle.replace(/[^a-z0-9]/gi, "_")}.ics`,
        content: Buffer.from(icsContent).toString("base64"),
      },
    ],
    metadata: {
      template: "EventConfirmationEmail",
      eventTitle,
      communityName,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send confirmation email:", {
      to: recipientEmail,
      fromEmail: FROM_EMAIL,
      error: result.error,
    });
    throw new Error(
      `Failed to send confirmation email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  console.log(`✅ Confirmation email sent successfully:`, {
    id: result.id,
    from: FROM_EMAIL,
    to: recipientEmail,
    hasAttachment: true,
  });

  return { success: true, data: { id: result.id } };
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

  const recipientEmail = "luhive.startup@gmail.com";
  console.log(`📧 Attempting to send waitlist notification email:`, {
    to: recipientEmail,
    from: FROM_EMAIL,
    subject: `New Community Request: ${communityName}`,
  });

  const result = await sendEmail({
    to: recipientEmail,
    subject: `New Community Request: ${communityName}`,
    react: CommunityWaitlistNotification({
      communityName,
      userName,
      userEmail,
      website,
      description,
      submittedAt,
    }),
    metadata: {
      template: "CommunityWaitlistNotification",
      communityName,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send waitlist notification email:", {
      to: recipientEmail,
      fromEmail: FROM_EMAIL,
      communityName,
      error: result.error,
    });
    throw new Error(
      `Failed to send waitlist notification email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  console.log(`✅ Waitlist notification email sent successfully:`, {
    id: result.id,
    from: FROM_EMAIL,
    to: recipientEmail,
    communityName,
  });

  return { success: true, data: { id: result.id } };
}

export async function sendCommunityJoinNotification(
  data: CommunityJoinNotificationData
) {
  const {
    communityName,
    communitySlug,
    memberName,
    memberEmail,
    ownerEmail,
    joinedAt,
  } = data;

  const dashboardLink = `${process.env.APP_URL || "https://luhive.com"}/dashboard/${communitySlug}/members`;

  console.log(`📧 Attempting to send community join notification email:`, {
    to: ownerEmail,
    from: FROM_EMAIL,
    subject: `New member joined ${communityName}!`,
  });

  const result = await sendEmail({
    to: ownerEmail,
    subject: `New member joined ${communityName}!`,
    react: CommunityJoinNotification({
      communityName,
      communitySlug,
      memberName,
      memberEmail,
      joinedAt,
      dashboardLink,
    }),
    metadata: {
      template: "CommunityJoinNotification",
      communityName,
      memberName,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send community join notification email:", {
      to: ownerEmail,
      fromEmail: FROM_EMAIL,
      communityName,
      memberName,
      error: result.error,
    });
    throw new Error(
      `Failed to send community join notification email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  console.log(`✅ Community join notification email sent successfully:`, {
    id: result.id,
    from: FROM_EMAIL,
    to: ownerEmail,
    communityName,
    memberName,
  });

  return { success: true, data: { id: result.id } };
}

export async function sendSubscriptionConfirmationEmail(
  data: SubscriptionEmailData
) {
  const {
    eventTitle,
    communityName,
    eventDate,
    eventTime,
    eventLink,
    externalRegistrationUrl,
    externalPlatformName,
    recipientName,
    recipientEmail,
    registerAccountLink,
    locationAddress,
    onlineMeetingLink,
    startTimeISO,
    endTimeISO,
  } = data;

  console.log(`📧 Attempting to send subscription confirmation email:`, {
    to: recipientEmail,
    from: FROM_EMAIL,
    subject: `You're subscribed for updates about ${eventTitle}!`,
  });

  // Generate ICS file content
  console.log(`   Generating ICS attachment...`);
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
  console.log(`   ICS attachment created`);

  const result = await sendEmail({
    to: recipientEmail,
    subject: `You're subscribed for updates about ${eventTitle}!`,
    react: EventSubscriptionEmail({
      eventTitle,
      communityName,
      eventDate,
      eventTime,
      eventLink,
      externalRegistrationUrl,
      externalPlatformName,
      recipientName,
      registerAccountLink,
      locationAddress,
      onlineMeetingLink,
    }),
    attachments: [
      {
        filename: `${eventTitle.replace(/[^a-z0-9]/gi, "_")}.ics`,
        content: Buffer.from(icsContent).toString("base64"),
      },
    ],
    metadata: {
      template: "EventSubscriptionEmail",
      eventTitle,
      communityName,
    },
  });

  if (!result.success) {
    console.error("❌ Failed to send subscription email:", {
      to: recipientEmail,
      fromEmail: FROM_EMAIL,
      error: result.error,
    });
    throw new Error(
      `Failed to send subscription email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  console.log(`✅ Subscription confirmation email sent successfully:`, {
    id: result.id,
    from: FROM_EMAIL,
    to: recipientEmail,
    hasAttachment: true,
  });

  return { success: true, data: { id: result.id } };
}

export async function sendCollaborationInviteEmail(
  data: CollaborationInviteEmailData
) {
  const {
    eventTitle,
    hostCommunityName,
    coHostCommunityName,
    recipientEmail,
    inviteLink,
    eventLink,
    invitedByName,
  } = data;

  const baseEmailAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;

  console.log(`📧 Attempting to send collaboration invite email:`, {
    to: recipientEmail,
    from: `${hostCommunityName} <${baseEmailAddress}>`,
    subject: `Collaboration Invitation: ${eventTitle}`,
  });

  const result = await sendEmail({
    to: recipientEmail,
    subject: `Collaboration Invitation: ${eventTitle}`,
    from: `${hostCommunityName} <${baseEmailAddress}>`,
    react: CollaborationInviteEmail({
      eventTitle,
      hostCommunityName,
      coHostCommunityName,
      recipientEmail,
      inviteLink,
      eventLink,
      invitedByName,
    }),
    metadata: {
      template: "CollaborationInviteEmail",
      eventTitle,
      hostCommunityName,
      coHostCommunityName,
    },
  });

  if (!result.success) {
    const baseEmailAddressErr = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;
    console.error("❌ Failed to send collaboration invite email:", {
      to: recipientEmail,
      fromEmail: `${hostCommunityName} <${baseEmailAddressErr}>`,
      error: result.error,
    });
    throw new Error(
      `Failed to send collaboration invite email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  const baseEmailAddressLog = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;
  console.log(`✅ Collaboration invite email sent successfully:`, {
    id: result.id,
    from: `${hostCommunityName} <${baseEmailAddressLog}>`,
    to: recipientEmail,
  });

  return { success: true, data: { id: result.id } };
}

export async function sendCollaborationAcceptedEmail(
  data: CollaborationAcceptedEmailData
) {
  const {
    eventTitle,
    hostCommunityName,
    coHostCommunityName,
    recipientEmail,
    eventLink,
  } = data;

  const baseEmailAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;

  console.log(`📧 Attempting to send collaboration accepted email:`, {
    to: recipientEmail,
    from: `${hostCommunityName} <${baseEmailAddress}>`,
    subject: `Collaboration Accepted: ${eventTitle}`,
  });

  const result = await sendEmail({
    to: recipientEmail,
    subject: `Collaboration Accepted: ${eventTitle}`,
    from: `${hostCommunityName} <${baseEmailAddress}>`,
    react: CollaborationAcceptedEmail({
      eventTitle,
      hostCommunityName,
      coHostCommunityName,
      recipientEmail,
      eventLink,
    }),
    metadata: {
      template: "CollaborationAcceptedEmail",
      eventTitle,
      hostCommunityName,
      coHostCommunityName,
    },
  });

  if (!result.success) {
    const baseEmailAddressErr = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;
    console.error("❌ Failed to send collaboration accepted email:", {
      to: recipientEmail,
      fromEmail: `${hostCommunityName} <${baseEmailAddressErr}>`,
      error: result.error,
    });
    throw new Error(
      `Failed to send collaboration accepted email: ${
        result.error?.message || "Unknown error"
      }`
    );
  }

  const baseEmailAddressLog2 = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;
  console.log(`✅ Collaboration accepted email sent successfully:`, {
    id: result.id,
    from: `${hostCommunityName} <${baseEmailAddressLog2}>`,
    to: recipientEmail,
  });

  return { success: true, data: { id: result.id } };
}

/**
 * Send notification to community members about a new event created by their community.
 * Supports both single and batch sending.
 */
export async function sendNewEventNotificationEmail(
  data: NewEventNotificationEmailData | NewEventNotificationEmailData[]
) {
  const items = Array.isArray(data) ? data : [data];

  const baseEmailAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;

  const payloads: BaseEmailPayload[] = items.map(
    ({
      eventTitle,
      communityName,
      eventDate,
      eventTime,
      eventLink,
      recipientEmail,
      recipientName,
      locationAddress,
      onlineMeetingLink,
    }) => ({
      to: recipientEmail,
      subject: `New Event: ${eventTitle}`,
      from: `${communityName} <${baseEmailAddress}>`,
      html: `
        <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color:#242424; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff8040;">New Event Created!</h2>
          <p>Hi ${recipientName},</p>
          <p>A new event has been created in <strong>${communityName}</strong>:</p>
          <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${eventTitle}</h3>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${eventTime}</p>
            ${locationAddress ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${locationAddress}</p>` : ''}
            ${onlineMeetingLink ? `<p style="margin: 5px 0;"><strong>🔗 Online:</strong> <a href="${onlineMeetingLink}" style="color: #ff8040;">Join Meeting</a></p>` : ''}
          </div>
          <p><a href="${eventLink}" style="background: #ff8040; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Event Details</a></p>
          <p style="color: #6B6B6B; font-size: 12px; margin-top: 30px;">${communityName}</p>
        </div>
      `,
      metadata: {
        template: "NewEventNotificationEmail",
        eventTitle,
        communityName,
      },
    })
  );

  console.log(
    `📧 Attempting to send new event notification emails (count: ${payloads.length})`
  );

  const results = await sendEmailBatch(payloads);

  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (result.success) {
      successCount += 1;
    } else {
      errorCount += 1;
    }
  }

  if (errorCount > 0) {
    console.error(
      `❌ Some new event notification emails failed: success=${successCount}, failed=${errorCount}`
    );
  }

  return { successCount, errorCount, results };
}

export async function sendAnnouncementNotificationEmail(
  data: AnnouncementNotificationEmailData | AnnouncementNotificationEmailData[]
) {
  const items = Array.isArray(data) ? data : [data];

  const baseEmailAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;

  const payloads: BaseEmailPayload[] = items.map(
    ({
      title,
      description,
      communityName,
      announcementLink,
      recipientEmail,
      imageUrls,
      createdAt,
      communityLogo,
      announcementId,
      userId,
      recipientUserId,
    }) => ({
      to: recipientEmail,
      subject: `${title}`,
      from: `${communityName} <${baseEmailAddress}>`,
      react: CommunityAnnouncementEmail({
        title,
        description,
        communityName,
        announcementLink,
        imageUrls: imageUrls || [],
        createdAt,
        communityLogo,
        announcementId,
        userId: userId ?? recipientUserId,
      }),
      metadata: {
        template: "CommunityAnnouncementEmail",
        communityName,
        announcementId,
      },
    })
  );

  console.log(
    `📧 Attempting to send announcement notification emails (count: ${payloads.length})`
  );

  const results = await sendEmailBatch(payloads);

  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (result.success) {
      successCount += 1;
    } else {
      errorCount += 1;
    }
  }

  if (errorCount > 0) {
    console.error(
      `❌ Some announcement notification emails failed: success=${successCount}, failed=${errorCount}`
    );
  }

  return { successCount, errorCount, results };
}

/**
 * Send notification to community members when a co-host accepts collaboration on a new event
 */
export async function sendNewCollaborationEventEmail(
  data: NewCollaborationEventEmailData | NewCollaborationEventEmailData[]
) {
  const items = Array.isArray(data) ? data : [data];

  const baseEmailAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL;

  const payloads: BaseEmailPayload[] = items.map(
    ({
      eventTitle,
      hostCommunityName,
      coHostCommunityName,
      eventDate,
      eventTime,
      eventLink,
      recipientEmail,
      recipientName,
      isNewEvent,
      locationAddress,
      onlineMeetingLink,
    }) => {
      const eventType = isNewEvent ? "New Event" : "Event Update";
      return {
        to: recipientEmail,
        subject: `${eventType}: ${eventTitle} (${coHostCommunityName} joined)`,
        from: `${hostCommunityName} <${baseEmailAddress}>`,
        html: `
        <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color:#242424; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff8040;">${isNewEvent ? 'New Collaborative Event!' : 'Event Collaboration Update!'}</h2>
          <p>Hi ${recipientName},</p>
          <p><strong>${hostCommunityName}</strong> and <strong>${coHostCommunityName}</strong> are now co-hosting an event:</p>
          <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${eventTitle}</h3>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${eventTime}</p>
            <p style="margin: 5px 0;"><strong>🏠 Host:</strong> ${hostCommunityName}</p>
            <p style="margin: 5px 0;"><strong>🤝 Co-host:</strong> ${coHostCommunityName}</p>
            ${locationAddress ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${locationAddress}</p>` : ''}
            ${onlineMeetingLink ? `<p style="margin: 5px 0;"><strong>🔗 Online:</strong> <a href="${onlineMeetingLink}" style="color: #ff8040;">Join Meeting</a></p>` : ''}
          </div>
          <p><a href="${eventLink}" style="background: #ff8040; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Event Details</a></p>
          <p style="color: #6B6B6B; font-size: 12px; margin-top: 30px;">${hostCommunityName}</p>
        </div>
      `,
        metadata: {
          template: "NewCollaborationEventEmail",
          eventTitle,
          hostCommunityName,
          coHostCommunityName,
          isNewEvent,
        },
      };
    }
  );

  console.log(
    `📧 Attempting to send collaboration event emails (count: ${payloads.length})`
  );

  const results = await sendEmailBatch(payloads);

  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (result.success) {
      successCount += 1;
    } else {
      errorCount += 1;
    }
  }

  if (errorCount > 0) {
    console.error(
      `❌ Some collaboration event emails failed: success=${successCount}, failed=${errorCount}`
    );
  }

  return { successCount, errorCount, results };
}

/**
 * Send notification to host and co-host owners/admins when someone registers for their event
 */
export async function sendEventRegistrationNotificationEmail(
  data:
    | EventRegistrationNotificationEmailData
    | EventRegistrationNotificationEmailData[]
) {
  const items = Array.isArray(data) ? data : [data];

  const payloads: BaseEmailPayload[] = items.map(
    ({
      eventTitle,
      registrantName,
      registrantEmail,
      hostCommunityName,
      coHostCommunityNames,
      eventDate,
      eventTime,
      eventLink,
      recipientEmail,
      recipientName,
    }) => {
      const coHostsText =
        coHostCommunityNames.length > 0
          ? coHostCommunityNames.join(", ")
          : "none";

      return {
        to: recipientEmail,
        subject: `New Registration: ${eventTitle}`,
        html: `
        <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color:#242424; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff8040;">New Event Registration!</h2>
          <p>Hi ${recipientName},</p>
          <p>Someone has registered for <strong>${eventTitle}</strong>:</p>
          <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>👤 Name:</strong> ${registrantName}</p>
            <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${registrantEmail}</p>
            <p style="margin: 5px 0;"><strong>📅 Event Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>⏰ Event Time:</strong> ${eventTime}</p>
            <p style="margin: 5px 0;"><strong>🏠 Host:</strong> ${hostCommunityName}</p>
            <p style="margin: 5px 0;"><strong>🤝 Co-hosts:</strong> ${coHostsText}</p>
          </div>
          <p><a href="${eventLink}" style="background: #ff8040; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Event & Registrants</a></p>
          <p style="color: #6B6B6B; font-size: 12px; margin-top: 30px;">Luhive Events</p>
        </div>
      `,
        metadata: {
          template: "EventRegistrationNotificationEmail",
          eventTitle,
          hostCommunityName,
        },
      };
    }
  );

  console.log(
    `📧 Attempting to send event registration notification emails (count: ${payloads.length})`
  );

  const results = await sendEmailBatch(payloads);

  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (result.success) {
      successCount += 1;
    } else {
      errorCount += 1;
    }
  }

  if (errorCount > 0) {
    console.error(
      `❌ Some registration notification emails failed: success=${successCount}, failed=${errorCount}`
    );
  }

  return { successCount, errorCount, results };
}
