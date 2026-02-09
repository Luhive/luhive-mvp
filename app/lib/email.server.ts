import { Resend } from "resend";
import { EventVerificationEmail } from "~/templates/event-verification-email";
import { EventConfirmationEmail } from "~/templates/event-confirmation-email";
import { EventStatusUpdateEmail } from "~/templates/event-status-update-email";
import { EventUpdateEmail } from "~/templates/event-update-email";
import { EventRegistrationRequestEmail } from "~/templates/event-registration-request-email";
import { EventSubscriptionEmail } from "~/templates/event-subscription-email";
import { CommunityWaitlistNotification } from "~/templates/community-waitlist-notification";
import { CommunityJoinNotification } from "~/templates/community-join-notification";
import { generateICS } from "~/lib/icsManager";

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

  // Runtime validation
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

  console.log(`📧 Attempting to send registration request email:`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   From: ${FROM_EMAIL}`);
  console.log(`   Subject: Registration Request Received: ${eventTitle}`);

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
      const errorDetails: Record<string, unknown> = {
        message: error.message,
      };
      if ("name" in error && typeof error.name === "string") {
        errorDetails.name = error.name;
      }
      console.error("❌ Resend API error:", errorDetails);
      throw new Error(`Failed to send request email: ${error.message}`);
    }

    console.log(`✅ Registration request email sent successfully:`, {
      id: emailData?.id,
      from: FROM_EMAIL,
      to: recipientEmail,
    });

    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Error sending request email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail,
      fromEmail: FROM_EMAIL,
    });
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

  // Runtime validation
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

  console.log(`📧 Attempting to send verification email:`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   From: ${FROM_EMAIL}`);
  console.log(`   Subject: Verify your registration for ${eventTitle}`);

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
      const errorDetails: Record<string, unknown> = {
        message: error.message,
      };
      if ("name" in error && typeof error.name === "string") {
        errorDetails.name = error.name;
      }
      console.error("❌ Resend API error:", errorDetails);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    console.log(`✅ Verification email sent successfully:`, {
      id: emailData?.id,
      from: FROM_EMAIL,
      to: recipientEmail,
    });

    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Error sending verification email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail,
      fromEmail: FROM_EMAIL,
    });
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

  // Runtime validation
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

  console.log(`📧 Attempting to send status update email:`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   From: ${FROM_EMAIL}`);
  console.log(`   Status: ${status}`);

  try {
    const attachments = [];

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
    console.log(`   Subject: ${subject}`);

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject,
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
      const errorDetails: Record<string, unknown> = {
        message: error.message,
      };
      if ("name" in error && typeof error.name === "string") {
        errorDetails.name = error.name;
      }
      console.error("❌ Resend API error:", errorDetails);
      throw new Error(`Failed to send status update email: ${error.message}`);
    }

    console.log(`✅ Status update email sent successfully:`, {
      id: emailData?.id,
      from: FROM_EMAIL,
      to: recipientEmail,
      status,
      hasAttachment: attachments.length > 0,
    });

    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Error sending status update email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail,
      fromEmail: FROM_EMAIL,
      status,
    });
    throw error;
  }
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

  console.log(`📧 Attempting to send event schedule update email:`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   From: ${FROM_EMAIL}`);

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: `Event Updated: ${eventTitle}`,
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
    });

    if (error) {
      const errorDetails: Record<string, unknown> = {
        message: error.message,
      };
      if ("name" in error && typeof error.name === "string") {
        errorDetails.name = error.name;
      }
      console.error("❌ Resend API error:", errorDetails);
      throw new Error(`Failed to send event schedule update email: ${error.message}`);
    }

    console.log(`✅ Event schedule update email sent successfully:`, {
      id: emailData?.id,
      from: FROM_EMAIL,
      to: recipientEmail,
    });

    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Error sending event schedule update email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail,
      fromEmail: FROM_EMAIL,
    });
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

  // Runtime validation
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

  console.log(`📧 Attempting to send confirmation email:`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   From: ${FROM_EMAIL}`);
  console.log(`   Subject: You're registered for ${eventTitle}!`);

  try {
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

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
      const errorDetails: Record<string, unknown> = {
        message: error.message,
      };
      if ("name" in error && typeof error.name === "string") {
        errorDetails.name = error.name;
      }
      console.error("❌ Resend API error:", errorDetails);
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }

    console.log(`✅ Confirmation email sent successfully:`, {
      id: emailData?.id,
      from: FROM_EMAIL,
      to: recipientEmail,
      hasAttachment: true,
    });

    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Error sending confirmation email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail,
      fromEmail: FROM_EMAIL,
    });
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

  // Runtime validation
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

  const recipientEmail = "luhive.startup@gmail.com";
  console.log(`📧 Attempting to send waitlist notification email:`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   From: ${FROM_EMAIL}`);
  console.log(`   Subject: New Community Request: ${communityName}`);

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
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
      const errorDetails: Record<string, unknown> = {
        message: error.message,
      };
      if ("name" in error && typeof error.name === "string") {
        errorDetails.name = error.name;
      }
      console.error("❌ Resend API error:", errorDetails);
      throw new Error(
        `Failed to send waitlist notification email: ${error.message}`
      );
    }

    console.log(`✅ Waitlist notification email sent successfully:`, {
      id: emailData?.id,
      from: FROM_EMAIL,
      to: recipientEmail,
      communityName,
    });

    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Error sending waitlist notification email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail,
      fromEmail: FROM_EMAIL,
      communityName,
    });
    throw error;
  }
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

  // Runtime validation
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

  const dashboardLink = `${process.env.APP_URL || "https://luhive.com"}/dashboard/${communitySlug}/members`;

  console.log(`📧 Attempting to send community join notification email:`);
  console.log(`   To: ${ownerEmail}`);
  console.log(`   From: ${FROM_EMAIL}`);
  console.log(`   Subject: New member joined ${communityName}!`);

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ownerEmail],
      subject: `New member joined ${communityName}!`,
      react: CommunityJoinNotification({
        communityName,
        communitySlug,
        memberName,
        memberEmail,
        joinedAt,
        dashboardLink,
      }),
    });

    if (error) {
      const errorDetails: Record<string, unknown> = {
        message: error.message,
      };
      if ("name" in error && typeof error.name === "string") {
        errorDetails.name = error.name;
      }
      console.error("❌ Resend API error:", errorDetails);
      throw new Error(
        `Failed to send community join notification email: ${error.message}`
      );
    }

    console.log(`✅ Community join notification email sent successfully:`, {
      id: emailData?.id,
      from: FROM_EMAIL,
      to: ownerEmail,
      communityName,
      memberName,
    });

    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Error sending community join notification email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ownerEmail,
      fromEmail: FROM_EMAIL,
      communityName,
    });
    throw error;
  }
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

  // Runtime validation
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

  console.log(`📧 Attempting to send subscription confirmation email:`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   From: ${FROM_EMAIL}`);
  console.log(`   Subject: You're subscribed for updates about ${eventTitle}!`);

  try {
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

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
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
      // Add ICS calendar attachment
      attachments: [
        {
          filename: `${eventTitle.replace(/[^a-z0-9]/gi, "_")}.ics`,
          content: Buffer.from(icsContent).toString("base64"),
        },
      ],
    });

    if (error) {
      const errorDetails: Record<string, unknown> = {
        message: error.message,
      };
      if ("name" in error && typeof error.name === "string") {
        errorDetails.name = error.name;
      }
      console.error("❌ Resend API error:", errorDetails);
      throw new Error(`Failed to send subscription email: ${error.message}`);
    }

    console.log(`✅ Subscription confirmation email sent successfully:`, {
      id: emailData?.id,
      from: FROM_EMAIL,
      to: recipientEmail,
      hasAttachment: true,
    });

    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Error sending subscription confirmation email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      recipientEmail,
      fromEmail: FROM_EMAIL,
    });
    throw error;
  }
}