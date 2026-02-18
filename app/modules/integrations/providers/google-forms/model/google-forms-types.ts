/**
 * Shared types for Google Forms (client-safe, no server imports).
 */

export type QuestionType =
	| "multiple_choice"
	| "checkbox"
	| "dropdown"
	| "short_text"
	| "paragraph"
	| "scale"
	| "date"
	| "time"
	| "file_upload"
	| "grid"
	| "unknown";

export interface ParsedQuestion {
	itemId: string;
	title: string;
	questionId: string;
	required: boolean;
	type: QuestionType;
	choices?: string[];
	low?: number;
	high?: number;
	lowLabel?: string;
	highLabel?: string;
}

export interface ParsedAnswer {
	questionTitle: string;
	value: string | string[] | null;
}

export interface ParsedResponse {
	responseId: string;
	createTime: string;
	lastSubmittedTime: string;
	answers: Record<string, ParsedAnswer>;
}

export interface FormDetailLoaderData {
	formId: string;
	formTitle: string;
	formDescription?: string;
	responderUri?: string;
	questions: ParsedQuestion[];
	responses: ParsedResponse[];
	totalResponses: number;
	error?: string;
	communitySlug: string;
}
