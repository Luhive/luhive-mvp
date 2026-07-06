export const currentUserKey = ["current-user"] as const;

export const eventRegistrationRootKey = ["event-registration"] as const;

export const eventRegistrationKey = (eventId: string) =>
	[...eventRegistrationRootKey, eventId] as const;
