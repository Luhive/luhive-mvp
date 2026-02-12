import type { Route } from './+types/index';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import "../../lib/i18n";
import { LandingNavbar } from "~/components/landing/landing-navbar";
import { LandingAbout } from "~/components/landing/landing-about";
import { LandingPartners } from "~/components/landing/landing-partners";
import { LandingFeatures } from "~/components/landing/landing-features";
import { LandingPricing } from "~/components/landing/landing-pricing";
import { LandingFAQ } from "~/components/landing/landing-faq";
import { LandingFooter } from "~/components/landing/landing-footer";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: 'Luhive | All-in-One Community Management Platform' },
    {
      name: 'description',
      content:
        'Luhive brings your community together in one powerful platform. Unified event management, centralized communication, and smart feedback systems for verified communities. Starting in Azerbaijan, scaling globally.',
    },
    {
      name: 'keywords',
      content:
        'community management, event management platform, community engagement, verified communities, Azerbaijan community platform, community software, event organization, community communication',
    },
    { name: 'author', content: 'Luhive' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://luhive.com/' },
    { property: 'og:title', content: 'Luhive' },
    {
      property: 'og:description',
      content:
        'One platform for engaged communities. Unified event management, centralized communication, and smart feedback systems. Build communities that matter.',
    },
    { property: 'og:image', content: 'https://luhive.com/ogimage.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:site_name', content: 'Luhive' },
    { property: 'og:locale', content: 'en_US' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:url', content: 'https://luhive.com/' },
    { name: 'twitter:title', content: 'Luhive' },
    {
      name: 'twitter:description',
      content:
        'One platform for engaged communities. Unified event management, centralized communication, and smart feedback systems.',
    },
    { name: 'twitter:image', content: 'https://luhive.com/ogimage.png' },
    { name: 'twitter:creator', content: '@luhive' },
    { name: 'twitter:site', content: '@luhive' },
    { name: 'theme-color', content: '#FF8040' },
    { tagName: 'link', rel: 'canonical', href: 'https://luhive.com/' },
  ];
}

export default function Index() {
  const { i18n } = useTranslation();

  // Analytics & Third-party integrations
  // Google Analytics is now initialized in root.tsx via react-ga4 SDK
  //useMicrosoftClarity('tkds3gt0au');

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* <LandingNavbar /> */}
      <LandingNavbar />
      {/* <LandingHero /> */}
      <LandingAbout />
      {/* <LandingAbout /> */}
      <LandingPartners />
      {/* <LandingFeatures /> */}
      <LandingFeatures />
      {/* <LandingContact /> */}
      <LandingPricing />
      {/* <LandingBlogsV2 /> */}
      <LandingFAQ />
      {/* <LandingFooter /> */}
      <LandingFooter />
    </div>
  );
}

