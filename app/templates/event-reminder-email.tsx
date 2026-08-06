import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
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

interface EventReminderEmailProps {
	eventTitle: string;
	communityName: string;
	communityLogoUrl?: string | null;
	eventDate: string;
	eventTime: string;
	eventLink: string;
	recipientName: string;
	locationAddress?: string;
	locationMapUrl?: string;
	reminderTime: "1-hour" | "3-hours" | "5-hours" | "1-day" | "3-days" | "5-days";
}

const getReminderText = (reminderTime: string): string => {
	switch (reminderTime) {
		case "1-hour":
			return "in 1 hour";
		case "3-hours":
			return "in 3 hours";
		case "5-hours":
			return "in 5 hours";
		case "1-day":
			return "in 1 day";
		case "3-days":
			return "in 3 days";
		case "5-days":
			return "in 5 days";
		default:
			return "soon";
	}
};

export const EventReminderEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	communityLogoUrl,
	eventDate = "Thursday, February 26, 2026",
	eventTime = "3:27 PM",
	eventLink = "#",
	recipientName = "there",
	locationAddress,
	locationMapUrl,
	reminderTime = "1-hour",
}: EventReminderEmailProps) => {
	const reminderText = getReminderText(reminderTime);

	const rows: DetailRowData[] = [
		{ label: "Date", value: eventDate },
		{ label: "Time", value: eventTime },
	];
	if (locationAddress)
		rows.push({
			label: "Location",
			value: locationMapUrl ? (
				<>
					{locationAddress}{" "}
					<Link
						href={locationMapUrl}
						style={{ color: emailColors.accent, textDecoration: "underline" }}
					>
						Map
					</Link>
				</>
			) : (
				locationAddress
			),
		});
	rows.push({ label: "Host", value: communityName });

	return (
		<EmailLayout preview={`${eventTitle} starts ${reminderText}`}>
			<Section style={{ marginBottom: "28px" }}>
				<Row>
					{communityLogoUrl && (
						<Column style={{ width: "34px", verticalAlign: "middle" }}>
							<Img
								src={communityLogoUrl}
								alt={communityName}
								width="26"
								height="26"
								style={{
									display: "block",
									borderRadius: "50%",
									objectFit: "cover",
								}}
							/>
						</Column>
					)}
					<Column style={{ verticalAlign: "middle" }}>
						<Text
							style={{
								margin: 0,
								fontSize: "14px",
								fontWeight: 600,
								color: emailColors.heading,
							}}
						>
							{communityName}
						</Text>
					</Column>
				</Row>
			</Section>
			<Eyebrow>Starting {reminderText}</Eyebrow>
			<EmailTitle>{eventTitle}</EmailTitle>
			<Divider />
			<Paragraph>
				Hi {recipientName}, this is a reminder that{" "}
				<strong style={{ color: emailColors.heading }}>{eventTitle}</strong>{" "}
				starts {reminderText}.
			</Paragraph>
			<SectionLabel>Event details</SectionLabel>
			<DetailsCard rows={rows} />
			<CtaButton href={eventLink}>View event →</CtaButton>
			<FinePrint>See you there.</FinePrint>
		</EmailLayout>
	);
};

export default EventReminderEmail;
