/**
 * Shared integration types for extensible provider pattern.
 * Each provider (Google Forms, Tally, Notion) implements this interface.
 */

export interface IntegrationProvider {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface Integration {
  id: string;
  providerId: string;
  name: string;
  connected: boolean;
  metadata?: Record<string, unknown>;
}

export interface IntegrationFormData {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  [key: string]: unknown;
}
