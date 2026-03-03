import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface CommunityAnnouncementEmailProps {
  title: string;
  description: string;
  communityName: string;
  announcementLink: string;
  recipientName: string;
  imageUrls?: string[];
}

export const CommunityAnnouncementEmail = ({
  title = "Community Announcement",
  description = "We have an important update for you.",
  communityName = "Luhive Community",
  announcementLink = "https://luhive.com",
  recipientName = "there",
  imageUrls = [],
}: CommunityAnnouncementEmailProps) => (
  <Html>
    <Preview>{title}</Preview>
    <Tailwind>
      <Head />
      <Body className="bg-white" style={{ fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Container className="mx-auto py-5 pb-12 px-4 max-w-[600px]">
          <Section className="text-center mb-8">
            <Img
              src="https://luhive.com/LuhiveLogo.png"
              alt="Luhive"
              width="48"
              height="46"
              className="mx-auto mb-6"
            />
            <Heading className="text-[28px] font-semibold leading-tight mb-2.5 mt-0" style={{ color: '#242424' }}>
              📣 New Announcement
            </Heading>
          </Section>

          <Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
            Hi {recipientName},
          </Text>

          <Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
            {communityName} shared a new announcement for members:
          </Text>

          <Section className="rounded-lg p-6 mb-8" style={{ backgroundColor: '#F9F9F9', border: '1px solid #E6E6E6' }}>
            <Heading className="text-xl font-semibold leading-tight mb-4 mt-0" style={{ color: '#242424' }}>
              {title}
            </Heading>
            <Text className="text-sm leading-relaxed m-0 whitespace-pre-wrap" style={{ color: '#6B6B6B' }}>
              {description}
            </Text>
          </Section>

          {imageUrls.length > 0 && (
            <Section className="mb-8">
              {imageUrls.map((url, index) => (
                <Img
                  key={`${url}-${index}`}
                  src={url}
                  alt={`Announcement image ${index + 1}`}
                  width="560"
                  className="rounded-md mb-3"
                />
              ))}
            </Section>
          )}

          <Section className="text-center mb-8">
            <Button
              href={announcementLink}
              className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
              style={{ backgroundColor: '#FF8040' }}
            >
              View Community
            </Button>
          </Section>

          <Text className="text-sm leading-relaxed text-center mb-8" style={{ color: '#6B6B6B' }}>
            You’re receiving this email because you are a member of {communityName}.
          </Text>

          <Hr className="my-8" style={{ borderColor: '#E6E6E6' }} />

          <Text className="text-xs text-center m-0" style={{ color: '#6B6B6B' }}>
            © {new Date().getFullYear()} Luhive. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default CommunityAnnouncementEmail;
