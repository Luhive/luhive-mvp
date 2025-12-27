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

interface CommunityJoinNotificationProps {
	communityName: string;
	communitySlug: string;
	memberName: string;
	memberEmail: string;
	joinedAt: string;
	dashboardLink: string;
}

export const CommunityJoinNotification = ({
	communityName = "Tech Community",
	communitySlug = "tech-community",
	memberName = "John Doe",
	memberEmail = "user@example.com",
	joinedAt = new Date().toLocaleString(),
	dashboardLink = "https://luhive.com/dashboard",
}: CommunityJoinNotificationProps) => (
	<Html>
		<Preview>New member joined {communityName}!</Preview>
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
							New Member Joined! 🎉
						</Heading>
					</Section>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						Great news! Someone just joined your community:
					</Text>

					<Section className="rounded-lg p-6 mb-8" style={{ backgroundColor: '#F9F9F9', border: '1px solid #E6E6E6' }}>
						<Heading className="text-xl font-semibold leading-tight mb-4 mt-0" style={{ color: '#242424' }}>
							Member Details
						</Heading>

						<Section className="mb-3">
							<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
								🏷️ Community
							</Text>
							<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
								{communityName}
							</Text>
						</Section>

						<Section className="mb-3">
							<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
								👤 New Member
							</Text>
							<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
								{memberName}
							</Text>
						</Section>

						<Section className="mb-3">
							<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
								📧 Email
							</Text>
							<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
								{memberEmail}
							</Text>
						</Section>

						<Section className="mb-0">
							<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
								📅 Joined At
							</Text>
							<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
								{joinedAt}
							</Text>
						</Section>
					</Section>

					<Section className="text-center mb-8">
						<Button
							href={dashboardLink}
							className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
							style={{ backgroundColor: '#FF8040' }}
						>
							View Community Members
						</Button>
					</Section>

					<Section className="border-l-4 p-4 mb-8 rounded" style={{ backgroundColor: '#FFF5EE', borderLeftColor: '#FF8040' }}>
						<Text className="text-sm leading-relaxed m-0" style={{ color: '#6B6B6B' }}>
							💡 <strong style={{ color: '#242424' }}>Tip:</strong> Engage with new members early to make them feel welcome! Consider sending them a personalized message or highlighting upcoming events.
						</Text>
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

export default CommunityJoinNotification;

