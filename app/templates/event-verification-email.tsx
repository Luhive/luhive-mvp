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

import LuhiveLogo from "~/assets/images/LuhiveLogo.png";

interface EventVerificationEmailProps {
	eventTitle: string;
	communityName: string;
	verificationLink: string;
	recipientName: string;
	registerAccountLink: string;
}

export const EventVerificationEmail = ({
	eventTitle = "Tech Meetup 2024",
	communityName = "Tech Community",
	verificationLink = "https://luhive.com/verify?token=abc123",
	recipientName = "there",
	registerAccountLink = "https://luhive.com/signup",
}: EventVerificationEmailProps) => (
	<Html>
		<Preview>Verify your registration for {eventTitle}</Preview>
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
						Verify Your Event Registration
					</Heading>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						Hi {recipientName},
					</Text>

					<Text className="text-base leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
						Thank you for registering for <strong style={{ color: '#242424' }}>{eventTitle}</strong> hosted
						by {communityName}!
					</Text>

					<Text className="text-base leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
						Please verify your email address to complete your registration:
					</Text>

					<Section className="text-center mb-8">
						<Button
							href={verificationLink}
							className="text-white rounded-md text-base font-semibold no-underline text-center inline-block py-3.5 px-8"
							style={{ backgroundColor: '#FF8040' }}
						>
							Verify Registration
						</Button>
					</Section>

					<Section className="border-l-4 p-4 mb-8 rounded" style={{ backgroundColor: '#FFF5EE', borderLeftColor: '#FF8040' }}>
						<Text className="text-sm leading-relaxed m-0" style={{ color: '#6B6B6B' }}>
							💡 <strong style={{ color: '#242424' }}>Tip:</strong> Create a free Luhive account for
							one-click registration at future events!{" "}
							<Link
								href={registerAccountLink}
								className="underline"
								style={{ color: '#FF8040' }}
							>
								Sign up now
							</Link>
						</Text>
					</Section>

					<Text className="text-sm leading-relaxed mb-2.5" style={{ color: '#6B6B6B' }}>
						This link will expire in 24 hours.
					</Text>

					<Text className="text-sm leading-relaxed mb-8" style={{ color: '#6B6B6B' }}>
						If you didn't request this registration, you can safely ignore this
						email.
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

export default EventVerificationEmail;

