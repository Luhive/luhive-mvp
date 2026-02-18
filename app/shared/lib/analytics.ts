import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = 'G-EM0ZMM2JPL';

let isInitialized = false;

// Check if we're in production mode
const isProduction = () => {
  if (typeof window === 'undefined') return false;
  return import.meta.env.PROD;
};

export const initGA = () => {
  if (typeof window === "undefined" || isInitialized) return;

  // Only initialize in production
  if (!isProduction()) {
    console.log("[Analytics] Skipping GA initialization in development mode");
    return;
  }

  ReactGA.initialize(GA_MEASUREMENT_ID, {
    gaOptions: {
      send_page_view: false, // We'll control page views manually
    },
  });
  isInitialized = true;
  console.log("[Analytics] Google Analytics initialized");
};

export const trackPageView = (path?: string) => {
  if (!isProduction()) return;
  if (!isInitialized) initGA();
  if (!isInitialized) return; // Still not initialized (shouldn't happen in prod)

  ReactGA.send({ hitType: "pageview", page: path || window.location.pathname });
};

// Event Categories
export const EventCategory = {
  CTA: "CTA",
  Navigation: "Navigation",
  Engagement: "Engagement",
  Social: "Social",
} as const;

// Typed event tracking function
export const trackEvent = (
  action: string,
  category: keyof typeof EventCategory,
  label?: string,
  value?: number
) => {
  if (!isProduction()) return;
  if (!isInitialized) initGA();
  if (!isInitialized) return; // Still not initialized (shouldn't happen in prod)

  ReactGA.event({
    action,
    category: EventCategory[category],
    label,
    value,
  });
};

// Pre-defined events for consistency
export const AnalyticsEvents = {
  // CTA clicks
  startCommunityClick: (location: string) =>
    trackEvent('click', 'CTA', `Start Your Community - ${location}`),

  discoverHubClick: (location: string) =>
    trackEvent('click', 'CTA', `Discover Hub - ${location}`),

  bookDemoClick: (location: string) =>
    trackEvent('click', 'CTA', `Book Demo - ${location}`),

  // Navigation events
  navLinkClick: (linkName: string) => trackEvent('click', 'Navigation', linkName),

  // Social clicks
  socialLinkClick: (platform: string) => trackEvent('click', 'Social', platform),

  // Engagement
  scrollToSection: (sectionName: string) =>
    trackEvent('scroll', 'Engagement', sectionName),
};
