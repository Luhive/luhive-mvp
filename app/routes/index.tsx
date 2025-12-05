import type { Route } from './+types/index';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LandingNavbar } from '~/components/landing/LandingNavbar';
import { LandingHero } from '~/components/landing/LandingHero';
import { LandingAbout } from '~/components/landing/LandingAbout';
import { LandingFeatures } from '~/components/landing/LandingFeatures';
import { LandingContact } from '~/components/landing/LandingContact';
import { LandingFooter } from '~/components/landing/LandingFooter';
import '../lib/i18n';

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
    { property: 'og:image', content: 'https://luhive.com/LandingSS.png' },
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
    { name: 'twitter:image', content: 'https://luhive.com/LandingSS.png' },
    { name: 'twitter:creator', content: '@luhive' },
    { name: 'twitter:site', content: '@luhive' },
    { name: 'theme-color', content: '#FF8040' },
    { tagName: 'link', rel: 'canonical', href: 'https://luhive.com/' },
  ];
}

export default function Index() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Initialize Google Analytics
    if (typeof window !== 'undefined') {
      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-EM0ZMM2JPL';
      script.setAttribute('data-cfasync', 'false');
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'G-EM0ZMM2JPL');
    }
  }, []);

  useEffect(() => {
    // Initialize Microsoft Clarity
    if (typeof window !== 'undefined') {
      (function (c: any, l: any, a: any, r: any, i: any, t: any, y: any) {
        c[a] =
          c[a] ||
          function () {
            (c[a].q = c[a].q || []).push(arguments);
          };
        t = l.createElement(r);
        t.async = 1;
        t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(
        window,
        document,
        'clarity',
        'script',
        'tkds3gt0au'
      );
    }
  }, []);

  useEffect(() => {
    // Initialize Tawk.to
    if (typeof window !== 'undefined') {
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_LoadStart = new Date();
      (window as any).Tawk_API.onLoad = function () {
        (window as any).Tawk_API.minimize();
      };

      (function () {
        const s1 = document.createElement('script');
        const s0 = document.getElementsByTagName('script')[0];
        s1.async = true;
        s1.src = 'https://embed.tawk.to/6929db60c886de1982f18ed6/1jb5o1s8c';
        s1.charset = 'UTF-8';
        s1.setAttribute('crossorigin', '*');
        s0.parentNode.insertBefore(s1, s0);
      })();
    }
  }, []);

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <LandingHero />
      <LandingAbout />
      <LandingFeatures />
      <LandingContact />
      <LandingFooter />
    </div>
  );
}

