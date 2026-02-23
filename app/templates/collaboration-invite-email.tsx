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

interface CollaborationInviteEmailProps {
	eventTitle: string;
	hostCommunityName: string;
	coHostCommunityName: string;
	recipientEmail: string;
	inviteLink: string;
	eventLink: string;
	invitedByName: string;
}

export const CollaborationInviteEmail = ({
	eventTitle = "Tech Meetup 2024",
	hostCommunityName = "Tech Community",
	coHostCommunityName = "Your Community",
	recipientEmail = "recipient@example.com",
	inviteLink = "https://luhive.com/c/community/collaboration-invite/123",
	eventLink = "https://luhive.com/c/community/events/123",
	invitedByName = "Community Owner",
}: CollaborationInviteEmailProps) => (
	<Html>
		<Preview>{hostCommunityName} invited {coHostCommunityName} to collaborate on {eventTitle}</Preview>
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
						Collaboration Invitation
					</Heading>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						Hello,
					</Text>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						<strong style={{ color: '#242424' }}>{hostCommunityName}</strong> has invited <strong style={{ color: '#242424' }}>{coHostCommunityName}</strong> to collaborate on organizing the event:
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
						As a co-host, your community will be able to:
					</Text>

					<Section className="mb-8">
						<ul className="list-none pl-0 m-0" style={{ color: '#6B6B6B' }}>
							<li className="mb-2">✓ See the event on your community page</li>
							<li className="mb-2">✓ View event statistics on your dashboard</li>
							<li className="mb-2">✓ Track participants who register through your community</li>
						</ul>
					</Section>

					<Text className="text-base leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
						Invited by: <strong style={{ color: '#242424' }}>{invitedByName}</strong>
					</Text>

					<Section className="text-center mb-8">
						<Button
							href={inviteLink}
							className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
							style={{ backgroundColor: '#FF8040' }}
						>
							Accept Collaboration
						</Button>
					</Section>

					<Text className="text-sm leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
						Or copy and paste this link into your browser:{" "}
						<Link
							href={inviteLink}
							className="underline break-all"
							style={{ color: '#FF8040' }}
						>
							{inviteLink}
						</Link>
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

export default CollaborationInviteEmail;
