import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Font,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
  Row,
  Column,
  Track,
} from "@react-email/components";
import * as React from "react";


interface CommunityAnnouncementEmailProps {
  title: string;
  description: string;
  communityName: string;
  announcementLink: string;
  imageUrls?: string[];
  createdAt?: string;
  communityLogo?: string;
}

export const CommunityAnnouncementEmail = ({
  title = "New Game Community!",
  description = `What do you want to announce? What do you want to announce? What do you want to announce?

What do you want to announce? What do you want to announce? What do you want to announce?`,
  communityName = "Luhive",
  announcementLink = "https://luhive.com",
  imageUrls = [
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
  ],
  createdAt = new Date().toISOString(),
  communityLogo = "https://luhive.com/LuhiveLogo.png",
}: CommunityAnnouncementEmailProps) => {
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Html>
      <Head>
  <Font
    fontFamily="Manrope"
    fallbackFontFamily="Arial"
    webFont={{
      url: "https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggexSg.woff2",
      format: "woff2",
    }}
    fontWeight={400}
    fontStyle="normal"
  />
</Head>
      <Preview>{title}</Preview>

      <Tailwind>
        <Body
          className="bg-white"
          style={{ fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          <Container className="max-w-[600px] mx-auto px-6 py-8">

            {/* TITLE */}
            <Section className="mb-6">
              <Heading
                className="font-manrope font-semibold text-[38px] leading-[100%] tracking-[-0.03em] m-0"
                style={{ color: "#242424" }}
              >
                {title}
              </Heading>
            </Section>

            {/* COMMUNITY + DATE */}
            <Section className="mb-6">
              <Row>
                <Column align="left">
                  <Row>
                    <Column style={{width:"30px"}}>
                      <Img
                        src={communityLogo}
                        style={{objectFit: "cover", width:"22px", height:"22px" }}
                      />
                    </Column>

                    <Column>
                      <Text
                        className="font-semibold text-[14px] leading-[150%] tracking-[0] align-middle"
                      >
                        {communityName}
                      </Text>
                    </Column>
                  </Row>
                </Column>

                <Column align="right">
                  <Text
                    className="text-xs m-0"
                    style={{ color: "#9B9B9B" }}
                  >
                    {formattedDate}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* IMAGE */}
            {imageUrls?.length > 0 && (
              <Section className="mb-6 text-center">
                <Img
                  src={imageUrls[0]}
                  width="340"
                  height="200"
                  alt="Announcement image"
                  className="rounded-[12px]"
                  style={{
                    width: "340px",
                    height: "200px",
                    borderRadius: "12px",
                    objectFit: "cover",
                    margin: "0 auto",
                    display: "block",
                  }}
                />
              </Section>
            )}

            {/* DESCRIPTION */}
            <Section className="mb-8">
              <Text
                className="font-manrope text-[15px] leading-[150%] m-0"
                style={{
                  color: "#6B6B6B",
                  whiteSpace: "pre-line",
                }}
              >
                {description}
              </Text>
            </Section>

            {/* BUTTON */}
            <Section className="mb-10">
              <Button
                href={announcementLink}
                className="font-manrope font-semibold text-sm text-white"
                style={{
                  backgroundColor: "#FF6A2A",
                  padding: "14px 26px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                See {communityName}
              </Button>
            </Section>

            <Hr style={{ borderColor: "#E8E8E8", margin: "24px 0" }} />

            {/* FOOTER */}
            <Section className="text-center mt-6">

              <Text
                className="text-xs mb-4"
                style={{ color: "#9B9B9B" }}
              >
                Create your community on
              </Text>

              <Img
                src="https://luhive.com/LuhiveLogo.png"
                alt="Luhive"
                width="28"
                style={{
                  margin: "0 auto 12px auto",
                  display: "block",
                }}
              />

              <Text
                className="text-xs m-0"
                style={{ color: "#9B9B9B" }}
              >
                © {new Date().getFullYear()} Luhive. All rights reserved.
              </Text>

            </Section>

          </Container>
          <Track url={announcementLink} />
        </Body>
      </Tailwind>
    </Html>
  );
};

export default CommunityAnnouncementEmail;