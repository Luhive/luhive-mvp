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

interface CollaborationAcceptedEmailProps {
	eventTitle: string;
	hostCommunityName: string;
	coHostCommunityName: string;
	recipientEmail: string;
	eventLink: string;
}

export const CollaborationAcceptedEmail = ({
	eventTitle = "Tech Meetup 2024",
	hostCommunityName = "Tech Community",
	coHostCommunityName = "Partner Community",
	recipientEmail = "recipient@example.com",
	eventLink = "https://luhive.com/c/community/events/123",
}: CollaborationAcceptedEmailProps) => (
	<Html>
		<Preview>{coHostCommunityName} accepted your collaboration invitation for {eventTitle}</Preview>
		<Tailwind>
			<Head />
			<Body className="bg-white" style={{ fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
				<Container className="mx-auto py-5 pb-12 px-4 max-w-[600px]">
					<Section className="text-center mb-6">
						<Img
							src="https://luhive.com/LuhiveLogo.png"
							alt="Luhive"
							width="48"
							height="46"
						/>
					</Section>

					<Heading className="text-2xl font-semibold leading-tight mb-5 mt-0" style={{ color: '#242424' }}>
						Collaboration Accepted!
					</Heading>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						Great news!
					</Text>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						<strong style={{ color: '#242424' }}>{coHostCommunityName}</strong> has accepted your invitation to collaborate on organizing:
					</Text>

					<Section className="border-l-4 p-4 mb-8 rounded" style={{ backgroundColor: '#FFF5EE', borderLeftColor: '#FF8040' }}>
						<Text className="text-lg font-semibold leading-relaxed m-0 mb-2" style={{ color: '#242424' }}>
							{eventTitle}
						</Text>
						<Link
							href={eventLink}
							className="text-sm underline"
							style={{ color: '#FF8040' }}
						>
							View event details
						</Link>
					</Section>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						The event is now visible on both community pages, and both communities can view event statistics on their dashboards.
					</Text>

					<Section className="text-center mb-8">
						<Button
							href={eventLink}
							className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
							style={{ backgroundColor: '#FF8040' }}
						>
							View Event
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

export default CollaborationAcceptedEmail;
