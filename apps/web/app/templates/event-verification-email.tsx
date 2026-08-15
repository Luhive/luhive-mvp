import * as React from "react";
import {
	CtaButton,
	Divider,
	EmailLayout,
	EmailTitle,
	Eyebrow,
	FinePrint,
	Paragraph,
	emailColors,
} from "./components/email-layout";

interface EventVerificationEmailProps {
	eventTitle: string;
	communityName: string;
	verificationLink: string;
	recipientName: string;
	registerAccountLink: string;
}

export const EventVerificationEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	verificationLink = "https://luhive.com/verify?token=abc123",
	recipientName = "there",
}: EventVerificationEmailProps) => (
	<EmailLayout preview={`Confirm your registration for ${eventTitle}`}>
		<Eyebrow>Confirm your registration</Eyebrow>
		<EmailTitle>{eventTitle}</EmailTitle>
		<Divider />
		<Paragraph>
			Hi {recipientName}, thanks for registering for{" "}
			<strong style={{ color: emailColors.heading }}>{eventTitle}</strong>,
			hosted by {communityName}. Confirm your email address to complete your
			registration.
		</Paragraph>
		<CtaButton href={verificationLink}>Confirm registration →</CtaButton>
		<FinePrint>This link expires in 24 hours.</FinePrint>
		<FinePrint>
			If you didn't register for this event, you can safely ignore this email.
		</FinePrint>
	</EmailLayout>
);

export default EventVerificationEmail;
