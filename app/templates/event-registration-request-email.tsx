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

interface EventRegistrationRequestEmailProps {
	eventTitle: string;
	communityName: string;
	eventLink: string;
	recipientName: string;
	eventDate?: string;
	eventTime?: string;
}

export const EventRegistrationRequestEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	eventLink = "https://luhive.com/events/123",
	recipientName = "there",
	eventDate,
	eventTime,
}: EventRegistrationRequestEmailProps) => {
	return (
		<Html>
			<Preview>Registration Request Received: {eventTitle}</Preview>
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
								Request Received
							</Heading>
						</Section>

						<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
							Hi {recipientName},
						</Text>

						<Text className="text-base leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
							We've received your request to join <strong style={{ color: '#242424' }}>{eventTitle}</strong>. The organizer will review your registration shortly.
						</Text>

						<Section className="rounded-lg p-6 mb-8" style={{ backgroundColor: '#F9F9F9', border: '1px solid #E6E6E6' }}>
							<Heading className="text-xl font-semibold leading-tight mb-4 mt-0" style={{ color: '#242424' }}>
								Event Details
							</Heading>

							{eventDate && eventTime && (
								<Section className="mb-3">
									<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
										📅 Date & Time
									</Text>
									<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
										{eventDate} at {eventTime}
									</Text>
								</Section>
							)}

							<Section className="mb-0">
								<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
									👥 Hosted by
								</Text>
								<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>{communityName}</Text>
							</Section>
						</Section>

						<Text className="text-base leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
							You will receive another email once your registration has been approved or if there are any updates.
						</Text>

						<Section className="text-center mb-8">
							<Button
								href={eventLink}
								className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
								style={{ backgroundColor: '#FF8040' }}
							>
								View Event Page
							</Button>
						</Section>

						<Hr className="my-8" style={{ borderColor: '#E6E6E6' }} />

						<Text className="text-xs text-center m-0" style={{ color: '#6B6B6B' }}>
							© {new Date().getFullYear()} Luhive. All rights reserved.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default EventRegistrationRequestEmail;

