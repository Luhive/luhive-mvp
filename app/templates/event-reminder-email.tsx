import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EventReminderEmailProps {
  eventTitle: string;
  communityName: string;
  communityLogoUrl?: string | null; // from Supabase
  eventDate: string;
  eventTime: string;
  eventLink: string;
  recipientName: string;
  locationAddress?: string;
  reminderTime: "1-hour" | "3-hours" | "1-day";
}

const getReminderText = (reminderTime: string): string => {
  switch (reminderTime) {
    case "1-hour":
      return "in 1 hour";
    case "3-hours":
      return "in 3 hours";
    case "1-day":
      return "in 1 day";
    default:
      return "soon";
  }
};

export const EventReminderEmail = ({
  communityName = "Luhive",
  communityLogoUrl = null,
  eventDate = "Thursday, February 26, 2026",
  eventTime = "3:27 PM",
  eventLink = "#",
  recipientName = "Ziiiko",
  locationAddress = "Test",
  reminderTime = "1-hour",
}: EventReminderEmailProps) => {
  const reminderText = getReminderText(reminderTime);

  const ICON_BASE = "https://luhive.com/email-icons";

  return (
    <Html>
      <Preview>Your Event is Coming Up!</Preview>

      <Tailwind>
        <Head />
        <Body
          style={{
            backgroundColor: "#F6F4F1",
            fontFamily:
              'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <Container className="max-w-[600px] mx-auto px-6 py-10">

            {/* Logo + Community Name */}
            <Section className="mb-8">
              <table width="100%" cellPadding="0" cellSpacing="0">
                <tr>
                  <td style={{ verticalAlign: "middle" }}>
                    <table cellPadding="0" cellSpacing="0">
                      <tr>
                        {communityLogoUrl && (
                          <td style={{ paddingRight: "12px" }}>
                            <Img
                              src={communityLogoUrl}
                              alt={communityName}
                              width="40"
                              height="40"
                              style={{
                                borderRadius: "8px",
                                objectFit: "cover",
                              }}
                            />
                          </td>
                        )}
                        <td style={{ verticalAlign: "middle" }}>
                          <Text
                            style={{
                              margin: "0",
                              fontSize: "20px",
                              fontWeight: "600",
                              color: "#1A1A1A",
                            }}
                          >
                            {communityName}
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Heading */}
            <Heading
              className="m-0 text-[32px] font-semibold leading-tight"
              style={{ color: "#1A1A1A" }}
            >
              Your Event is
            </Heading>

            <Heading
              className="mt-0 mb-6 text-[32px] font-semibold leading-tight"
              style={{ color: "#8E8E8E" }}
            >
              Coming Up!
            </Heading>

            {/* Description */}
            <Text
              className="text-base mb-8 leading-relaxed"
              style={{ color: "#6B6B6B" }}
            >
              Hi {recipientName}, we want to tell you that you will have an event{" "}
              <strong style={{ color: "#1A1A1A" }}>{reminderText}</strong>. Are you ready to attend?
            </Text>

            {/* Event Card */}
            <Section
              className="rounded-xl p-6 mb-10"
              style={{
                backgroundColor: "#F6F4F1",
                border: "1px solid #E5E5E5",
              }}
            >
              <table width="100%" cellPadding="0" cellSpacing="0">

                {/* Date */}
                <tr>
                  <td width="32" style={{ verticalAlign: "top" }}>
                    <Img
                      src={`${ICON_BASE}/calendar.png`}
                      width="20"
                      height="20"
                      alt="calendar"
                    />
                  </td>
                  <td>
                    <Text
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1A1A1A",
                      }}
                    >
                      {eventDate}
                    </Text>
                    <Text
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#6B6B6B",
                      }}
                    >
                      {eventTime}
                    </Text>
                  </td>
                </tr>

                {/* Spacing */}
                <tr><td height="16" colSpan={2}></td></tr>

                {/* Location */}
                <tr>
                  <td width="32" style={{ verticalAlign: "top" }}>
                    <Img
                      src={`${ICON_BASE}/location.png`}
                      width="20"
                      height="20"
                      alt="location"
                    />
                  </td>
                  <td>
                    <Text
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1A1A1A",
                      }}
                    >
                      Location
                    </Text>
                    <Text
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#6B6B6B",
                      }}
                    >
                      {locationAddress}
                    </Text>
                  </td>
                </tr>

                <tr><td height="16" colSpan={2}></td></tr>

                {/* Organizer */}
                <tr>
                  <td width="32" style={{ verticalAlign: "top" }}>
                    <Img
                      src={`${ICON_BASE}/people.png`}
                      width="20"
                      height="20"
                      alt="organizer"
                    />
                  </td>
                  <td>
                    <Text
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1A1A1A",
                      }}
                    >
                      Organised by
                    </Text>
                    <Text
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#6B6B6B",
                      }}
                    >
                      {communityName}
                    </Text>
                  </td>
                </tr>

              </table>
            </Section>

            {/* Button */}
            <Button
              href={eventLink}
              style={{
                backgroundColor: "#FF6A00",
                color: "#FFFFFF",
                padding: "14px 28px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              View Event Details
            </Button>

            <Hr style={{ margin: "40px 0", borderColor: "#E5E5E5" }} />

            {/* Footer */}
            <Section>
              <table width="100%" cellPadding="0" cellSpacing="0">
                <tr>
                  <td align="left">
                    <Text
                      style={{
                        fontSize: "13px",
                        color: "#9A9A9A",
                        margin: "0",
                      }}
                    >
                      Create your community on
                    </Text>
                    <Text
                      style={{
                        fontSize: "22px",
                        fontWeight: "600",
                        color: "#6B6B6B",
                        margin: "0",
                      }}
                    >
                      Luhive
                    </Text>
                  </td>

                  <td className="flex" align="right" style={{ verticalAlign: "middle" }}>
                    <Link href="mailto:support@luhive.com">
                      <Img
                        src={`${ICON_BASE}/mail.png`}
                        width="18"
                        height="18"
                        alt="email"
                        style={{ marginLeft: "14px", opacity: 0.6 }}
                      />
                    </Link>

                    <Link href="https://x.com/luhive">
                      <Img
                        src={`${ICON_BASE}/x.png`}
                        width="18"
                        height="18"
                        alt="x"
                        style={{ marginLeft: "14px", opacity: 0.6 }}
                      />
                    </Link>

                    <Link href="https://linkedin.com/company/luhive">
                      <Img
                        src={`${ICON_BASE}/linkedin.png`}
                        width="18"
                        height="18"
                        alt="linkedin"
                        style={{ marginLeft: "14px", opacity: 0.6 }}
                      />
                    </Link>
                  </td>
                </tr>
              </table>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EventReminderEmail;