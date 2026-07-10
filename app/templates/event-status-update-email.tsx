import { Img, Link, Section, Text } from "@react-email/components";
import * as React from "react";
import {
	CtaButton,
	DetailsCard,
	Divider,
	EmailLayout,
	EmailTitle,
	Eyebrow,
	FinePrint,
	Paragraph,
	SectionLabel,
	emailColors,
	type DetailRowData,
} from "./components/email-layout";

interface EventStatusUpdateEmailProps {
	eventTitle: string;
	communityName: string;
	eventLink: string;
	recipientName: string;
	status: "approved" | "rejected";
	eventDate?: string;
	eventTime?: string;
	locationAddress?: string;
	onlineMeetingLink?: string;
	hasQrCode?: boolean;
}

export const EventStatusUpdateEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	eventLink = "https://luhive.com/events/123",
	recipientName = "there",
	status = "approved",
	eventDate,
	eventTime,
	locationAddress,
	onlineMeetingLink,
	hasQrCode = false,
}: EventStatusUpdateEmailProps) => {
	const isApproved = status === "approved";

	if (!isApproved) {
		return (
			<EmailLayout
				preview={`An update on your registration for ${eventTitle}`}
			>
				<Eyebrow>Registration update</Eyebrow>
				<EmailTitle>{eventTitle}</EmailTitle>
				<Divider />
				<Paragraph>
					Hi {recipientName}, unfortunately {communityName} couldn't approve
					your registration for{" "}
					<strong style={{ color: emailColors.heading }}>{eventTitle}</strong>{" "}
					this time. Spots are often limited — keep an eye on their upcoming
					events.
				</Paragraph>
				<CtaButton href={eventLink}>View event →</CtaButton>
			</EmailLayout>
		);
	}

	const rows: DetailRowData[] = [];
	if (eventDate) rows.push({ label: "Date", value: eventDate });
	if (eventTime) rows.push({ label: "Time", value: eventTime });
	if (locationAddress) rows.push({ label: "Location", value: locationAddress });
	if (onlineMeetingLink)
		rows.push({
			label: "Online",
			value: (
				<Link
					href={onlineMeetingLink}
					style={{ color: emailColors.accent, textDecoration: "underline" }}
				>
					Join meeting
				</Link>
			),
		});
	rows.push({ label: "Host", value: communityName });

	return (
		<EmailLayout preview={`You're in — ${eventTitle}`}>
			<Eyebrow>Registration confirmed</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName}, {communityName} approved your registration for{" "}
				<strong style={{ color: emailColors.heading }}>{eventTitle}</strong>.
				A calendar invite is attached — see you there.
			</Paragraph>
			<SectionLabel>Event details</SectionLabel>
			<DetailsCard rows={rows} />
			{hasQrCode && (
				<Section style={{ marginBottom: "32px" }}>
					<SectionLabel>Check-in</SectionLabel>
					<Text
						style={{
							margin: "0 0 16px 0",
							fontSize: "14px",
							color: emailColors.body,
							lineHeight: 1.7,
						}}
					>
						Show this QR code at the door. It's also attached to this email.
					</Text>
					<Img
						src="cid:event-qr"
						width="180"
						height="180"
						alt="Your check-in QR code"
						style={{
							display: "block",
							border: `1px solid ${emailColors.cardBorder}`,
							borderRadius: "8px",
						}}
					/>
				</Section>
			)}
			<CtaButton href={eventLink}>View event →</CtaButton>
		</EmailLayout>
	);
};

export default EventStatusUpdateEmail;
