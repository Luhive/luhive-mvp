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

interface EventInviteEmailProps {
	eventTitle: string;
	communityName: string;
	recipientName: string;
	recipientEmail: string;
	inviteLink: string;
	eventLink: string;
	invitedByName: string;
	eventDate: string;
	eventTime: string;
}

export const EventInviteEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	recipientName = "Guest",
	recipientEmail = "guest@example.com",
	inviteLink = "https://luhive.com/c/community/event/invite/accept?token=123",
	eventLink = "https://luhive.com/c/community/event",
	invitedByName = "Community Member",
	eventDate = "Friday, January 1, 2026",
	eventTime = "6:00 PM UTC",
}: EventInviteEmailProps) => (
	<Html>
		<Preview>
			{invitedByName} invited you to {eventTitle}
		</Preview>
		<Tailwind>
			<Head />
			<Body
				className="bg-white"
				style={{
					fontFamily:
						'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				}}
			>
				<Container className="mx-auto py-5 pb-12 px-4 max-w-[600px]">
					<Section className="text-center mb-6">
						<Img
							src="https://luhive.com/LuhiveLogo.png"
							alt="Luhive"
							width="48"
							height="46"
						/>
					</Section>

					<Heading
						className="text-2xl font-semibold leading-tight mb-5 mt-0"
						style={{ color: "#242424" }}
					>
						You're invited!
					</Heading>

					<Text className="text-base leading-relaxed mb-5" style={{ color: "#6B6B6B" }}>
						Hi {recipientName},
					</Text>

					<Text className="text-base leading-relaxed mb-5" style={{ color: "#6B6B6B" }}>
						<strong style={{ color: "#242424" }}>{invitedByName}</strong> invited you to
						join an event hosted by{" "}
						<strong style={{ color: "#242424" }}>{communityName}</strong>.
					</Text>

					<Section
						className="border-l-4 p-4 mb-8 rounded"
						style={{ backgroundColor: "#FFF5EE", borderLeftColor: "#FF8040" }}
					>
						<Text
							className="text-lg font-semibold leading-relaxed m-0 mb-2"
							style={{ color: "#242424" }}
						>
							{eventTitle}
						</Text>
						<Text className="text-sm leading-relaxed m-0 mb-2" style={{ color: "#6B6B6B" }}>
							{eventDate} at {eventTime}
						</Text>
						<Link href={eventLink} className="text-sm underline" style={{ color: "#FF8040" }}>
							View event details
						</Link>
					</Section>

					<Section className="text-center mb-8">
						<Button
							href={inviteLink}
							className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
							style={{ backgroundColor: "#FF8040" }}
						>
							Accept Invitation
						</Button>
					</Section>

					<Text className="text-sm leading-relaxed mb-8" style={{ color: "#6B6B6B" }}>
						Or copy and paste this link into your browser:{" "}
						<Link href={inviteLink} className="underline break-all" style={{ color: "#FF8040" }}>
							{inviteLink}
						</Link>
					</Text>

					<Text className="text-xs leading-relaxed mb-8" style={{ color: "#6B6B6B" }}>
						This invitation was sent to {recipientEmail}.
					</Text>

					<Hr className="my-8" style={{ borderColor: "#E6E6E6" }} />

					<Text className="text-xs text-center m-0" style={{ color: "#6B6B6B" }}>
						© {new Date().getFullYear()} Luhive. All rights reserved.
					</Text>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default EventInviteEmail;
