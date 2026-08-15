/**
 * Google Forms server-side data access and API client.
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

// OAuth2 scopes required for Google Forms API
export const GOOGLE_FORMS_SCOPES = [
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];

/**
 * Create OAuth2 client with the configured credentials
 */
export function createOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_FORMS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_FORMS_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_FORMS_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google Forms OAuth credentials. Please set GOOGLE_FORMS_CLIENT_ID and GOOGLE_FORMS_CLIENT_SECRET');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate authentication URL for user consent
 */
export function getAuthUrl(oauth2Client: OAuth2Client, state?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_FORMS_SCOPES,
    prompt: 'consent',
    state: state
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(oauth2Client: OAuth2Client, code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Set credentials on OAuth2 client
 */
export function setCredentials(oauth2Client: OAuth2Client, tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}) {
  oauth2Client.setCredentials(tokens);
}

/**
 * Check if client has valid credentials
 */
export function isAuthenticated(oauth2Client: OAuth2Client): boolean {
  const credentials = oauth2Client.credentials;
  return !!(credentials && credentials.access_token);
}

/**
 * Get authenticated Google Forms API client
 */
export function getFormsClient(oauth2Client: OAuth2Client) {
  return google.forms({ version: 'v1', auth: oauth2Client });
}

/**
 * Get authenticated Google Drive API client (for listing forms)
 */
export function getDriveClient(oauth2Client: OAuth2Client) {
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// ============ Forms API Functions ============

/**
 * List all Google Forms owned by the user
 */
export async function listForms(oauth2Client: OAuth2Client) {
  const drive = getDriveClient(oauth2Client);

  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.form'",
    fields: 'files(id, name, createdTime, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: 100
  });

  return response.data.files || [];
}

/**
 * Get form details including questions
 */
export async function getForm(oauth2Client: OAuth2Client, formId: string) {
  const forms = getFormsClient(oauth2Client);

  const response = await forms.forms.get({
    formId: formId
  });

  return response.data;
}

/**
 * Get all responses for a form
 */
export async function getFormResponses(oauth2Client: OAuth2Client, formId: string) {
  const forms = getFormsClient(oauth2Client);

  const response = await forms.forms.responses.list({
    formId: formId
  });

  return response.data.responses || [];
}

/**
 * Get a single response by ID
 */
export async function getFormResponse(oauth2Client: OAuth2Client, formId: string, responseId: string) {
  const forms = getFormsClient(oauth2Client);

  const response = await forms.forms.responses.get({
    formId: formId,
    responseId: responseId
  });

  return response.data;
}

// ============ Question Parsing ============

export type { QuestionType, ParsedQuestion } from "~/modules/integrations/providers/google-forms/model/google-forms-types";
import type { ParsedQuestion, QuestionType } from "~/modules/integrations/providers/google-forms/model/google-forms-types";

/**
 * Parse form structure to extract questions
 */
export function parseFormQuestions(formData: any): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  if (!formData.items) {
    return questions;
  }

  for (const item of formData.items) {
    if (!item.questionItem) continue;

    const question = item.questionItem.question;
    const questionData: ParsedQuestion = {
      itemId: item.itemId,
      title: item.title || 'Untitled Question',
      questionId: question.questionId,
      required: question.required || false,
      type: getQuestionType(question)
    };

    // Extract choices for multiple choice questions
    if (question.choiceQuestion) {
      questionData.choices = question.choiceQuestion.options?.map((opt: any) => opt.value) || [];
    }

    // Extract scale info for scale questions
    if (question.scaleQuestion) {
      questionData.low = question.scaleQuestion.low;
      questionData.high = question.scaleQuestion.high;
      questionData.lowLabel = question.scaleQuestion.lowLabel;
      questionData.highLabel = question.scaleQuestion.highLabel;
    }

    questions.push(questionData);
  }

  return questions;
}

/**
 * Determine question type from question object
 */
function getQuestionType(question: any): QuestionType {
  if (question.choiceQuestion) {
    const type = question.choiceQuestion.type;
    if (type === 'RADIO') return 'multiple_choice';
    if (type === 'CHECKBOX') return 'checkbox';
    if (type === 'DROP_DOWN') return 'dropdown';
  }
  if (question.textQuestion) {
    return question.textQuestion.paragraph ? 'paragraph' : 'short_text';
  }
  if (question.scaleQuestion) return 'scale';
  if (question.dateQuestion) return 'date';
  if (question.timeQuestion) return 'time';
  if (question.fileUploadQuestion) return 'file_upload';
  if (question.rowQuestion) return 'grid';

  return 'unknown';
}

// ============ Response Parsing ============

export type { ParsedAnswer, ParsedResponse } from "~/modules/integrations/providers/google-forms/model/google-forms-types";
import type { ParsedResponse } from "~/modules/integrations/providers/google-forms/model/google-forms-types";

/**
 * Parse responses into a more usable format
 */
export function parseResponses(responses: any[], questions: ParsedQuestion[]): ParsedResponse[] {
  return responses.map(response => {
    const parsedResponse: ParsedResponse = {
      responseId: response.responseId,
      createTime: response.createTime,
      lastSubmittedTime: response.lastSubmittedTime,
      answers: {}
    };

    if (response.answers) {
      for (const [questionId, answer] of Object.entries(response.answers) as [string, any][]) {
        const question = questions.find(q => q.questionId === questionId);
        const questionTitle = question?.title || questionId;

        // Extract answer value based on type
        let value: string | string[] | null = null;
        if (answer.textAnswers) {
          value = answer.textAnswers.answers?.map((a: any) => a.value) || [];
          if (Array.isArray(value) && value.length === 1) value = value[0];
        }

        parsedResponse.answers[questionId] = {
          questionTitle,
          value
        };
      }
    }

    return parsedResponse;
  });
}

// ============ Token Types ============

export interface GoogleFormsToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expiry_date: string | null;
  scope: string | null;
  created_at: string;
  updated_at: string;
}
