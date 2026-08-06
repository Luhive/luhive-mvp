import {
	Body,
	Column,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from "@react-email/components";
import * as React from "react";
import { emailColors, emailFont } from "./components/email-layout";

const WORD_LOGO_URL =
	"https://ncgqtxfchavfugucdnnh.supabase.co/storage/v1/object/public/Luhive-Assets/LuhiveWordLogoEmail.png";

interface CommunityAnnouncementEmailProps {
	title: string;
	description: string;
	communityName: string;
	announcementLink: string;
	imageUrls?: string[];
	createdAt?: string;
	communityLogo?: string;
	announcementId?: string;
	userId?: string;
	unsubscribeUrl?: string;
}

export const CommunityAnnouncementEmail = ({
	title = "New Game Community!",
	description = "What do you want to announce?",
	communityName = "Luhive",
	announcementLink = "https://luhive.com",
	imageUrls = [],
	createdAt = new Date().toISOString(),
	communityLogo = "https://luhive.com/LuhiveLogo.png",
	announcementId,
	userId,
	unsubscribeUrl,
}: CommunityAnnouncementEmailProps) => {
	const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Html lang="en">
			<Head>
				<Font
					fontFamily="IBM Plex Sans"
					fallbackFontFamily={["Helvetica", "Arial"]}
					webFont={{
						url: "https://fonts.gstatic.com/s/ibmplexsans/v22/zYXgKVElMYYaJe8bpLHnCwDKtdbUFI5NadY.woff2",
						format: "woff2",
					}}
					fontWeight={400}
					fontStyle="normal"
				/>
			</Head>
			<Preview>{title}</Preview>
			<Body
				style={{
					margin: 0,
					padding: 0,
					backgroundColor: "#ffffff",
					fontFamily: emailFont,
				}}
			>
				<Container
					style={{
						width: "100%",
						maxWidth: "560px",
						margin: "0 auto",
						padding: "48px 20px 64px",
					}}
				>
					<Heading
						as="h1"
						style={{
							margin: "0 0 18px 0",
							fontSize: "32px",
							fontWeight: 700,
							color: emailColors.heading,
							letterSpacing: "-0.6px",
							lineHeight: 1.2,
						}}
					>
						{title}
					</Heading>

					<Section style={{ marginBottom: "24px" }}>
						<Row>
							<Column style={{ verticalAlign: "middle" }}>
								<Row>
									<Column style={{ width: "30px", verticalAlign: "middle" }}>
										<Img
											src={communityLogo}
											alt={communityName}
											width="22"
											height="22"
											style={{
												display: "block",
												objectFit: "cover",
												borderRadius: "4px",
											}}
										/>
									</Column>
									<Column style={{ verticalAlign: "middle" }}>
										<Text
											style={{
												margin: 0,
												fontSize: "14px",
												fontWeight: 600,
												color: emailColors.heading,
											}}
										>
											{communityName}
										</Text>
									</Column>
								</Row>
							</Column>
							<Column align="right" style={{ verticalAlign: "middle" }}>
								<Text
									style={{
										margin: 0,
										fontSize: "12px",
										color: emailColors.subtle,
									}}
								>
									{formattedDate}
								</Text>
							</Column>
						</Row>
					</Section>

					{imageUrls && imageUrls.length > 0 && (
						<Section style={{ marginBottom: "24px" }}>
							<Img
								src={imageUrls[0]}
								alt="Announcement image"
								width="560"
								style={{
									display: "block",
									width: "100%",
									height: "auto",
									borderRadius: "6px",
									border: `1px solid ${emailColors.cardBorder}`,
								}}
							/>
						</Section>
					)}

					<Section style={{ marginBottom: "32px" }}>
						<Text
							style={{
								margin: 0,
								fontSize: "15px",
								color: emailColors.body,
								lineHeight: 1.8,
								whiteSpace: "pre-line",
							}}
						>
							{description}
						</Text>
					</Section>

					<Section style={{ marginBottom: "8px" }}>
						<Link
							href={announcementLink}
							style={{
								display: "inline-block",
								padding: "12px 20px",
								backgroundColor: emailColors.accent,
								borderRadius: "8px",
								fontSize: "15px",
								fontWeight: 600,
								color: "#ffffff",
								textDecoration: "none",
								letterSpacing: "-0.1px",
							}}
						>
							See {communityName} →
						</Link>
					</Section>

					<Section style={{ paddingTop: "44px" }}>
						<Hr
							style={{
								borderColor: emailColors.divider,
								margin: "0 0 20px 0",
							}}
						/>
						<Row>
							<Column style={{ verticalAlign: "middle" }}>
								<Img
									src={WORD_LOGO_URL}
									alt="Luhive"
									height="16"
									style={{
										display: "block",
										height: "16px",
										width: "auto",
									}}
								/>
							</Column>
							<Column align="right" style={{ verticalAlign: "middle" }}>
								<Text
									style={{
										margin: 0,
										fontSize: "11px",
										color: emailColors.faint,
										lineHeight: 1.7,
									}}
								>
									You're a member of{" "}
									<span style={{ color: "#aaaaaa", fontWeight: 500 }}>
										{communityName}
									</span>
									{unsubscribeUrl ? (
										<>
											{" "}
											·{" "}
											<Link
												href={unsubscribeUrl}
												style={{
													color: emailColors.accent,
													textDecoration: "none",
												}}
											>
												Unsubscribe
											</Link>
										</>
									) : (
										<>
											{" "}
											·{" "}
											<Link
												href="https://luhive.com"
												style={{
													color: emailColors.accent,
													textDecoration: "none",
												}}
											>
												luhive.com
											</Link>
										</>
									)}
								</Text>
							</Column>
						</Row>
					</Section>
				</Container>

				{announcementId && userId && (
					<Img
						src={`https://luhive.com/api/announcements/track-email-open?announcementId=${announcementId}&userId=${userId}`}
						alt=""
						width="1"
						height="1"
						style={{ display: "none" }}
					/>
				)}
			</Body>
		</Html>
	);
};

export default CommunityAnnouncementEmail;
