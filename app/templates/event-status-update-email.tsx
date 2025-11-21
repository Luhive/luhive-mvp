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
}: EventStatusUpdateEmailProps) => {
	const isApproved = status === "approved";
	const title = isApproved ? "Registration Approved!" : "Registration Status Update";
	const previewText = isApproved 
		? `Your registration for ${eventTitle} has been approved!` 
		: `Update regarding your registration for ${eventTitle}`;

	return (
		<Html>
			<Preview>{previewText}</Preview>
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
								{title}
							</Heading>
						</Section>

						<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
							Hi {recipientName},
						</Text>

						{isApproved ? (
							<Text className="text-base leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
								Good news! Your registration request for <strong style={{ color: '#242424' }}>{eventTitle}</strong> has been approved by the organizer.
							</Text>
						) : (
							<Text className="text-base leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
								We're writing to let you know that your registration request for <strong style={{ color: '#242424' }}>{eventTitle}</strong> was not approved at this time.
							</Text>
						)}

						{isApproved && (
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
                                            <Link
                                                href={onlineMeetingLink}
                                                className="underline"
                                                style={{ color: '#FF8040' }}
                                            >
                                                Join Meeting
                                            </Link>
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
						)}

                        {isApproved && (
                            <Section className="text-center mb-8">
                                <Button
                                    href={eventLink}
                                    className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
                                    style={{ backgroundColor: '#FF8040' }}
                                >
                                    View Event Details
                                </Button>
                            </Section>
                        )}

                        {!isApproved && (
                             <Section className="text-center mb-8">
                                <Button
                                    href={eventLink}
                                    className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
                                    style={{ backgroundColor: '#6B6B6B' }}
                                >
                                    View Event Page
                                </Button>
                            </Section>
                        )}

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

export default EventStatusUpdateEmail;

