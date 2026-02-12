import type { Route } from "./+types/email-debug";
import { getEmailConfig } from "~/lib/email.server";
import { sendVerificationEmail } from "~/lib/email.server";

export async function loader({ request }: Route.LoaderArgs) {
  // Only allow in development or with proper authentication
  const isDevelopment = process.env.NODE_ENV === "development";
  const url = new URL(request.url);
  const testEmail = url.searchParams.get("testEmail");
  const sendTest = url.searchParams.get("sendTest") === "true";

  // Get email configuration
  const config = getEmailConfig();

  // Prepare response data
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    configuration: {
      resendApiKeySet: !!config.resendApiKey,
      resendApiKeyMasked: config.maskedApiKey,
      emailSenderSet: !!config.emailSender,
      emailSender: config.emailSender || "undefined",
      fromEmail: config.fromEmail,
      resendInitialized: config.resendInitialized,
      isValid: config.isValid,
      errors: config.errors,
    },
  };

  // If test email is requested and sendTest is true, attempt to send
  let testResult = null;
  if (sendTest && testEmail && isDevelopment) {
    try {
      // Validate test email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        testResult = {
          success: false,
          error: `Invalid test email format: ${testEmail}`,
        };
      } else {
        await sendVerificationEmail({
          eventTitle: "Test Event - Email Debug",
          communityName: "Test Community",
          verificationLink: "https://example.com/verify?token=test",
          recipientName: "Test User",
          recipientEmail: testEmail,
          registerAccountLink: "https://example.com/signup",
        });
        testResult = {
          success: true,
          message: `Test email sent successfully to ${testEmail}`,
        };
      }
    } catch (error) {
      testResult = {
        success: false,
        error:
          error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }
  } else if (sendTest && !isDevelopment) {
    testResult = {
      success: false,
      error: "Test email sending is only allowed in development mode",
    };
  } else if (sendTest && !testEmail) {
    testResult = {
      success: false,
      error: "testEmail parameter is required when sendTest=true",
    };
  }

  return {
    ...debugInfo,
    testResult,
    instructions: {
      usage: "Visit /api/email-debug to see configuration status",
      testEmail:
        "Add ?testEmail=your@email.com&sendTest=true to send a test email (development only)",
    },
  };
}

