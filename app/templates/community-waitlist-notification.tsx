import {
	Body,
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

interface CommunityWaitlistNotificationProps {
	communityName: string;
	userName: string;
	userEmail: string;
	website?: string | null;
	description?: string | null;
	submittedAt: string;
}

export const CommunityWaitlistNotification = ({
	communityName = "Tech Community",
	userName = "John Doe",
	userEmail = "user@example.com",
	website = null,
	description = null,
	submittedAt = new Date().toLocaleString(),
}: CommunityWaitlistNotificationProps) => (
	<Html>
		<Preview>New community request: {communityName}</Preview>
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
							New Community Request
						</Heading>
					</Section>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						A new community has been submitted to the waitlist:
					</Text>

					<Section className="rounded-lg p-6 mb-8" style={{ backgroundColor: '#F9F9F9', border: '1px solid #E6E6E6' }}>
						<Heading className="text-xl font-semibold leading-tight mb-4 mt-0" style={{ color: '#242424' }}>
							Community Details
						</Heading>

						<Section className="mb-3">
							<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
								🏷️ Community Name
							</Text>
							<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
								{communityName}
							</Text>
						</Section>

						<Section className="mb-3">
							<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
								👤 Submitted By
							</Text>
							<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
								{userName} ({userEmail})
							</Text>
						</Section>

						{website && (
							<Section className="mb-3">
								<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
									🔗 Website/Social Links
								</Text>
								<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
									<Link
										href={website}
										className="underline"
										style={{ color: '#FF8040' }}
									>
										{website}
									</Link>
								</Text>
							</Section>
						)}

						{description && (
							<Section className="mb-3">
								<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
									📝 Description
								</Text>
								<Text className="text-sm m-0 whitespace-pre-wrap" style={{ color: '#6B6B6B' }}>
									{description}
								</Text>
							</Section>
						)}

						<Section className="mb-0">
							<Text className="text-sm font-semibold mb-1 mt-0" style={{ color: '#242424' }}>
								📅 Submitted At
							</Text>
							<Text className="text-sm m-0" style={{ color: '#6B6B6B' }}>
								{submittedAt}
							</Text>
						</Section>
					</Section>

					<Section className="border-l-4 p-4 mb-8 rounded" style={{ backgroundColor: '#FFF5EE', borderLeftColor: '#FF8040' }}>
						<Text className="text-sm leading-relaxed m-0" style={{ color: '#6B6B6B' }}>
							💡 <strong style={{ color: '#242424' }}>Next Steps:</strong> Review this community request and create it manually if approved. The user has been notified that their request is pending review.
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

export default CommunityWaitlistNotification;

