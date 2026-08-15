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

export const emailFont =
	"'IBM Plex Sans', Helvetica, Arial, -apple-system, 'Segoe UI', sans-serif";

export const emailColors = {
	heading: "#111111",
	accent: "#F97316",
	body: "#444444",
	subtle: "#999999",
	faint: "#c0c0c0",
	divider: "#e9e9e9",
	cardBorder: "#e9e9e9",
};

const WORD_LOGO_URL =
	"https://ncgqtxfchavfugucdnnh.supabase.co/storage/v1/object/public/Luhive-Assets/LuhiveWordLogoEmail.png";

interface EmailLayoutProps {
	preview: string;
	unsubscribeUrl?: string;
	children: React.ReactNode;
}

export const EmailLayout = ({
	preview,
	unsubscribeUrl,
	children,
}: EmailLayoutProps) => (
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
		<Preview>{preview}</Preview>
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
				{children}

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
								You received this email via{" "}
								<span style={{ color: "#aaaaaa", fontWeight: 500 }}>
									Luhive
								</span>{" "}
								·{" "}
								<Link
									href={unsubscribeUrl ?? "https://luhive.com"}
									style={{
										color: emailColors.accent,
										textDecoration: "none",
									}}
								>
									{unsubscribeUrl ? "Manage notifications" : "luhive.com"}
								</Link>
							</Text>
						</Column>
					</Row>
				</Section>
			</Container>
		</Body>
	</Html>
);

export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
	<Text
		style={{
			margin: "0 0 10px 0",
			fontSize: "11px",
			fontWeight: 600,
			color: emailColors.accent,
			letterSpacing: "1px",
			textTransform: "uppercase",
		}}
	>
		{children}
	</Text>
);

export const EmailTitle = ({ children }: { children: React.ReactNode }) => (
	<Heading
		as="h1"
		style={{
			margin: "0 0 14px 0",
			fontSize: "28px",
			fontWeight: 700,
			color: emailColors.heading,
			letterSpacing: "-0.6px",
			lineHeight: 1.2,
		}}
	>
		{children}
	</Heading>
);

export const Paragraph = ({ children }: { children: React.ReactNode }) => (
	<Text
		style={{
			margin: "0 0 28px 0",
			fontSize: "15px",
			color: emailColors.body,
			lineHeight: 1.8,
		}}
	>
		{children}
	</Text>
);

export const FinePrint = ({ children }: { children: React.ReactNode }) => (
	<Text
		style={{
			margin: "0 0 8px 0",
			fontSize: "13px",
			color: emailColors.subtle,
			lineHeight: 1.7,
		}}
	>
		{children}
	</Text>
);

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
	<Text
		style={{
			margin: "0 0 16px 0",
			fontSize: "11px",
			fontWeight: 600,
			color: emailColors.heading,
			letterSpacing: "0.8px",
			textTransform: "uppercase",
		}}
	>
		{children}
	</Text>
);

export interface DetailRowData {
	label: string;
	value: React.ReactNode;
}

export const DetailsCard = ({ rows }: { rows: DetailRowData[] }) => (
	<Section
		style={{
			border: `1px solid ${emailColors.cardBorder}`,
			borderRadius: "8px",
			padding: "22px 24px",
			marginBottom: "32px",
		}}
	>
		{rows.map((row, index) => (
			<Row key={row.label}>
				<Column
					style={{
						width: "100px",
						verticalAlign: "top",
						paddingBottom: index === rows.length - 1 ? 0 : "14px",
					}}
				>
					<Text
						style={{
							margin: 0,
							fontSize: "13px",
							fontWeight: 600,
							color: emailColors.heading,
						}}
					>
						{row.label}
					</Text>
				</Column>
				<Column
					style={{
						verticalAlign: "top",
						paddingBottom: index === rows.length - 1 ? 0 : "14px",
					}}
				>
					<Text
						style={{
							margin: 0,
							fontSize: "14px",
							color: emailColors.body,
							lineHeight: 1.6,
						}}
					>
						{row.value}
					</Text>
				</Column>
			</Row>
		))}
	</Section>
);

export const CtaButton = ({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) => (
	<Section style={{ marginBottom: "8px" }}>
		<Link
			href={href}
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
			{children}
		</Link>
	</Section>
);

export const Divider = () => (
	<Hr style={{ borderColor: emailColors.divider, margin: "0 0 32px 0" }} />
);
