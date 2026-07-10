import {
	Body,
	Column,
	Container,
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
	"'Inter', Helvetica, Arial, -apple-system, 'Segoe UI', sans-serif";

export const emailColors = {
	heading: "#242424",
	accent: "#FF8040",
	body: "#6B6B6B",
	subtle: "#8A8A8A",
	faint: "#C0C0C0",
	divider: "#E6E6E6",
	cardBorder: "#E6E6E6",
};

const LOGO_URL = "https://luhive.com/LuhiveLogo.png";

interface EmailLayoutProps {
	preview: string;
	children: React.ReactNode;
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => (
	<Html lang="en">
		<Head />
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
						<Column style={{ width: "26px", verticalAlign: "middle" }}>
							<Img
								src={LOGO_URL}
								alt="Luhive"
								width="18"
								height="18"
								style={{
									display: "block",
									width: "18px",
									height: "18px",
									borderRadius: "4px",
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
								© {new Date().getFullYear()}{" "}
								<span style={{ color: emailColors.subtle, fontWeight: 500 }}>
									Luhive
								</span>{" "}
								·{" "}
								<Link
									href="https://luhive.com"
									style={{
										color: emailColors.heading,
										textDecoration: "none",
									}}
								>
									luhive.com
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
			color: emailColors.heading,
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
			padding: "24px 28px",
			marginBottom: "32px",
		}}
	>
		{rows.map((row, index) => (
			<Row key={row.label}>
				<Column
					style={{
						width: "90px",
						verticalAlign: "top",
						paddingBottom: index === rows.length - 1 ? 0 : "16px",
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
						paddingBottom: index === rows.length - 1 ? 0 : "16px",
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
				padding: "14px 32px",
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
