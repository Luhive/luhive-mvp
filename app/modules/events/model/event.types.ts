export type RegistrationType = "native" | "external" | "both";

export type ExternalPlatform =
  | "google_forms"
  | "microsoft_forms"
  | "luma"
  | "eventbrite"
  | "other";

export interface PhoneQuestionConfig {
  enabled: boolean;
  required: boolean;
}

export interface CustomQuestion {
  id: string; // UUID
  label: string;
  required: boolean;
  order: number;
}

export interface CustomQuestionJson {
  phone: PhoneQuestionConfig;
  custom: CustomQuestion[];
}

export interface CustomAnswerJson {
  phone?: string; // E.164 format: +994501234567
  [questionId: string]: string | undefined; // Dynamic keys for custom questions
}

// Type aliases for convenience
export type CustomQuestionsConfig = CustomQuestionJson;
export type CustomAnswers = CustomAnswerJson;
