import React from 'react';
import type { ExternalPlatform } from '~/models/event.types';
import { FileText, Globe } from 'lucide-react';
import GoogleFormsLogo from '~/assets/images/Google_Forms.png';
import MicrosoftFormsLogo from '~/assets/images/Microsoft_Forms.png';

/**
 * Detect the external platform from a registration URL
 */
export function detectExternalPlatform(url: string): ExternalPlatform {
  if (!url) return 'other';
  
  const lowerUrl = url.toLowerCase();
  
  // Google Forms
  if (lowerUrl.includes('forms.gle') || lowerUrl.includes('forms.google.com') || lowerUrl.includes('docs.google.com/forms')) {
    return 'google_forms';
  }
  
  // Microsoft Forms
  if (lowerUrl.includes('forms.office.com') || lowerUrl.includes('forms.microsoft.com')) {
    return 'microsoft_forms';
  }
  
  // Luma
  if (lowerUrl.includes('lu.ma')) {
    return 'luma';
  }
  
  // Eventbrite
  if (lowerUrl.includes('eventbrite.com') || lowerUrl.includes('eventbrite.co')) {
    return 'eventbrite';
  }
  
  return 'other';
}

/**
 * Get display name for an external platform
 */
export function getExternalPlatformName(platform: ExternalPlatform): string {
  const platformNames: Record<ExternalPlatform, string> = {
    google_forms: 'Google Forms',
    microsoft_forms: 'Microsoft Forms',
    luma: 'Luma',
    eventbrite: 'Eventbrite',
    other: 'External Form',
  };
  
  return platformNames[platform] || 'External Form';
}

/**
 * Get the icon component for an external platform
 * Returns a component that can be used with className
 */
export function getExternalPlatformIcon(platform: ExternalPlatform): React.ComponentType<{ className?: string }> {
  switch (platform) {
    case 'google_forms':
      return function GoogleFormsIcon({ className = "h-4 w-4" }: { className?: string }) {
        return React.createElement('img', {
          src: GoogleFormsLogo,
          alt: 'Google Forms',
          className: className,
        });
      };
    case 'microsoft_forms':
      return function MicrosoftFormsIcon({ className = "h-4 w-4" }: { className?: string }) {
        return React.createElement('img', {
          src: MicrosoftFormsLogo,
          alt: 'Microsoft Forms',
          className: className,
        });
      };
    case 'luma':
    case 'eventbrite':
      return Globe;
    default:
      return FileText;
  }
}

/**
 * Get CSS color class for platform branding
 * Uses primary color from design tokens
 */
export function getExternalPlatformColor(platform: ExternalPlatform): string {
  // Use primary color for all platforms to stay within design system
  return 'text-primary';
}

/**
 * Get background color class for platform branding
 * Uses primary color from design tokens
 */
export function getExternalPlatformBgColor(platform: ExternalPlatform): string {
  // Use primary color for all platforms to stay within design system
  return 'bg-primary/5';
}

/**
 * Validate that a URL is a valid external registration URL
 */
export function isValidExternalUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Platform options for dropdown selection
 */
export const externalPlatformOptions: { value: ExternalPlatform; label: string }[] = [
  { value: 'google_forms', label: 'Google Forms' },
  { value: 'microsoft_forms', label: 'Microsoft Forms' },
  { value: 'luma', label: 'Luma' },
  { value: 'eventbrite', label: 'Eventbrite' },
  { value: 'other', label: 'Other' },
];

