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

interface EventSubscriptionEmailProps {
	eventTitle: string;
	communityName: string;
	eventDate: string;
	eventTime: string;
	eventLink: string;
	externalRegistrationUrl: string;
	externalPlatformName: string;
	recipientName: string;
	registerAccountLink: string;
	locationAddress?: string;
	onlineMeetingLink?: string;
}

export const EventSubscriptionEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	eventDate = "Saturday, January 20, 2024",
	eventTime = "2:00 PM PST",
	eventLink = "https://luhive.com/events/123",
	externalRegistrationUrl = "https://forms.gle/xxxxx",
	externalPlatformName = "Google Forms",
	recipientName = "there",
	registerAccountLink = "https://luhive.com/signup",
	locationAddress,
	onlineMeetingLink,
}: EventSubscriptionEmailProps) => (
	<Html>
		<Preview>You're subscribed for updates about {eventTitle}!</Preview>
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
							You're Subscribed!
						</Heading>
					</Section>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						Hi {recipientName},
					</Text>

					<Text className="text-base leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
						You're now subscribed to receive updates about <strong style={{ color: '#242424' }}>{eventTitle}</strong>. We'll send you reminders before the event!
					</Text>

					<Section className="rounded-lg p-6 mb-8" style={{ backgroundColor: '#F9F9F9', border: '1px solid #E6E6E6' }}>
						<Heading className="text-xl font-semibold leading-tight mb-4 mt-0" style={{ color: '#242424' }}>
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

					<Section className="border-l-4 p-4 mb-8 rounded" style={{ backgroundColor: '#FFF5EE', borderLeftColor: '#FF8040' }}>
						<Text className="text-sm leading-relaxed m-0 mb-3" style={{ color: '#6B6B6B' }}>
							<strong style={{ color: '#242424' }}>Complete your registration:</strong> This event uses {externalPlatformName} for registration. Click the button below to register on the external platform.
						</Text>
						<Button
							href={externalRegistrationUrl}
							className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
							style={{ backgroundColor: '#FF8040' }}
						>
							Register on {externalPlatformName}
						</Button>
					</Section>

					<Section className="text-center mb-8">
						<Button
							href={eventLink}
							className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
							style={{ backgroundColor: '#FF8040' }}
						>
							View Event Details
						</Button>
					</Section>

					<Section className="border-l-4 p-4 mb-8 rounded" style={{ backgroundColor: '#FFF5EE', borderLeftColor: '#FF8040' }}>
						<Text className="text-sm leading-relaxed m-0" style={{ color: '#6B6B6B' }}>
							💡 <strong style={{ color: '#242424' }}>Make it easier next time!</strong> Create a free
							Luhive account for instant one-click registration at future events.{" "}
							<Link
								href={registerAccountLink}
								className="underline"
								style={{ color: '#FF8040' }}
							>
								Sign up now
							</Link>
						</Text>
					</Section>

					<Text className="text-sm leading-relaxed text-center mb-8" style={{ color: '#6B6B6B' }}>
						We'll send you a reminder before the event!
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

export default EventSubscriptionEmail;

