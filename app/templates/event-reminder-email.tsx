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
	eventDate: string;
	eventTime: string;
	eventLink: string;
	recipientName: string;
	locationAddress?: string;
	onlineMeetingLink?: string;
	customMessage?: string | null;
	reminderTime: '1-hour' | '3-hours' | '1-day';
}

const getReminderText = (reminderTime: string): string => {
	switch (reminderTime) {
		case '1-hour':
			return '1 hour from now';
		case '3-hours':
			return '3 hours from now';
		case '1-day':
			return 'tomorrow';
		default:
			return 'soon';
	}
};

export const EventReminderEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	eventDate = "Saturday, January 20, 2024",
	eventTime = "2:00 PM PST",
	eventLink = "https://luhive.com/events/123",
	recipientName = "there",
	locationAddress,
	onlineMeetingLink,
	customMessage = null,
	reminderTime = '1-hour',
}: EventReminderEmailProps) => {
	const reminderText = getReminderText(reminderTime);

	// Replace variables in custom message
	const formatMessage = (msg: string | null | undefined): string => {
		if (!msg) return '';
		return msg
			.replace(/{participantName}/g, recipientName)
			.replace(/{eventTitle}/g, eventTitle)
			.replace(/{eventDateTime}/g, `${eventDate} at ${eventTime}`)
			.replace(/{eventLocation}/g, locationAddress || (onlineMeetingLink ? 'Online' : 'TBA'))
			.replace(/{communityName}/g, communityName);
	};

	const messageContent = customMessage ? formatMessage(customMessage) : null;

	return (
		<Html>
			<Preview>{eventTitle} is happening {reminderText}!</Preview>
			<Tailwind>
				<Head />
				<Body
					className="bg-white"
					style={{ fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
				>
					<Container className="mx-auto py-5 pb-12 px-4 max-w-[600px]">
						<Section className="text-center mb-8">
							<Img
								src="https://luhive.com/LuhiveLogo.png"
								alt="Luhive"
								width="48"
								height="46"
								className="mx-auto mb-6"
							/>
							<Heading
								className="text-[28px] font-semibold leading-tight mb-2.5 mt-0"
								style={{ color: '#242424' }}
							>
								Reminder: Your Event is Coming Up!
							</Heading>
						</Section>

						<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
							Hi {recipientName},
						</Text>

						{messageContent ? (
							<>
								<Section
									className="rounded-lg p-6 mb-8 whitespace-pre-wrap leading-relaxed"
									style={{ backgroundColor: '#F9F9F9', border: '1px solid #E6E6E6', color: '#6B6B6B' }}
								>
									<Text className="text-base m-0" style={{ color: '#6B6B6B', whiteSpace: 'pre-wrap' }}>
										{messageContent}
									</Text>
								</Section>
							</>
						) : (
							<>
								<Text className="text-base leading-relaxed mb-2" style={{ color: '#6B6B6B' }}>
									<strong style={{ color: '#242424' }}>{eventTitle}</strong> is happening {reminderText}!
								</Text>

								<Text className="text-base leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
									Don't miss it! Here are the details:
								</Text>
							</>
						)}

						<Section
							className="rounded-lg p-6 mb-8"
							style={{ backgroundColor: '#F9F9F9', border: '1px solid #E6E6E6' }}
						>
							<Heading
								className="text-xl font-semibold leading-tight mb-4 mt-0"
								style={{ color: '#242424' }}
							>
								Event Details
							</Heading>

							<Section className="mb-3">
								<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
									📅 Date & Time
								</Text>
								<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
									{eventDate} at {eventTime}
								</Text>
							</Section>

							{locationAddress && (
								<Section className="mb-3">
									<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
										📍 Location
									</Text>
									<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
										{locationAddress}
									</Text>
								</Section>
							)}

							{onlineMeetingLink && (
								<Section className="mb-3">
									<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
										💻 Online Meeting
									</Text>
									<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
										<Link href={onlineMeetingLink} style={{ color: '#007AFF' }}>
											Join here
										</Link>
									</Text>
								</Section>
							)}

							<Section className="mb-3">
								<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
									👥 Organized by
								</Text>
								<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
									{communityName}
								</Text>
							</Section>
						</Section>

						<Section className="text-center mb-8">
							<Button
								href={eventLink}
								className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg"
								style={{
									backgroundColor: '#007AFF',
									color: 'white',
									textDecoration: 'none',
									borderRadius: '8px',
									padding: '12px 24px',
									display: 'inline-block',
									fontWeight: '600',
								}}
							>
								View Event Details
							</Button>
						</Section>

						<Hr className="my-6" style={{ borderColor: '#E6E6E6' }} />

						<Text
							className="text-xs text-center"
							style={{ color: '#999999' }}
						>
							This is a reminder for {eventTitle}.{' '}
							<Link
								href={eventLink}
								style={{ color: '#007AFF', textDecoration: 'none' }}
							>
								View event
							</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default EventReminderEmail;
