import {
	sendRegistrationConfirmationEmail,
	sendRegistrationRequestEmail,
} from "~/shared/lib/email.server";

export type SendRegistrationAttendeeEmailInput = {
	approvalStatus: string;
	recipientEmail: string;
	recipientName: string;
	eventTitle: string;
	communityName: string;
	eventDate: string;
	eventTime: string;
	eventLink: string;
	registerAccountLink: string;
	startTimeISO: string;
	endTimeISO: string;
	locationAddress?: string;
	locationMapUrl?: string;
	onlineMeetingLink?: string;
	checkinToken?: string | null;
};

export async function sendRegistrationAttendeeEmail(
	input: SendRegistrationAttendeeEmailInput,
) {
	const {
		approvalStatus,
		recipientEmail,
		recipientName,
		eventTitle,
		communityName,
		eventDate,
		eventTime,
		eventLink,
		registerAccountLink,
		startTimeISO,
		endTimeISO,
		locationAddress,
		locationMapUrl,
		onlineMeetingLink,
		checkinToken,
	} = input;

	if (approvalStatus === "pending") {
		await sendRegistrationRequestEmail({
			eventTitle,
			communityName,
			eventLink,
			recipientName,
			recipientEmail,
			eventDate,
			eventTime,
		});
		return;
	}

	await sendRegistrationConfirmationEmail({
		eventTitle,
		communityName,
		eventDate,
		eventTime,
		eventLink,
		recipientName,
		recipientEmail,
		registerAccountLink,
		locationAddress,
		locationMapUrl,
		onlineMeetingLink,
		startTimeISO,
		endTimeISO,
		checkinToken: checkinToken ?? null,
	});
}
