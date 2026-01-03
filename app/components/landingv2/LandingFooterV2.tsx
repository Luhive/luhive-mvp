import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AnalyticsEvents } from '~/lib/analytics';

const SOCIAL_LINKS = [
  {
    id: 'x',
    icon: '/landing/xplatfrom.svg',
    href: 'https://twitter.com/luhive_',
    label: 'X (Twitter)',
  },
  {
    id: 'linkedin',
    icon: '/landing/Linkedin.svg',
    href: 'https://www.linkedin.com/company/luhive',
    label: 'LinkedIn',
  },
  {
    id: 'telegram',
    icon: '/landing/Telegram.svg',
    href: 'https://t.me/luhive',
    label: 'Telegram',
  },
  {
    id: 'instagram',
    icon: '/landing/Instagram.svg',
    href: 'https://instagram.com/luhive',
    label: 'Instagram',
  },
];

export function LandingFooterV2() {
  const { t } = useTranslation('landing');

  return (
    <footer id="contact" className="bg-[#FFFDF5] pb-10 pt-8">
      <div className="mx-auto w-[90vw] 2xl:w-[90rem]">
        {/* Desktop: Social | Logo | CTAs | Mobile: CTAs | Social | Logo */}
        <div className="relative mb-4 flex flex-col-reverse items-center gap-10 md:gap-6 md:flex-row md:justify-between">
          {/* Desktop: Social icons on left | Mobile: Social icons in middle */}
          <div className="flex items-center gap-3 md:order-1">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-xl "
                aria-label={social.label}
                onClick={() => AnalyticsEvents.socialLinkClick(social.label)}
              >
                <img
                  src={social.icon}
                  alt={social.label}
                  className="h-12 w-12 object-contain"
                />
              </a>
            ))}
          </div>

          {/* Desktop: CTAs on right | Mobile: CTAs at top */}
          <div className="flex w-full items-center justify-center gap-3 md:order-3 md:w-auto">
            <a
              href="https://luhive.com/hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-base font-medium text-[#FF6D23] hover:text-[#E55A1A] transition-colors duration-200 group"
              onClick={() => AnalyticsEvents.discoverHubClick('Footer V2')}
            >
              <span className='text-md lg:text-lg font-medium underlines'>Discover Hub</span>
              <Globe className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div>
        </div>

        {/* Desktop: Logo in center | Mobile: Logo at bottom */}
        <div className="flex items-center mt-5 gap-3 w-full justify-center">
          <img src="/landing/LogoLuhive.svg" alt="Luhive logo" className="md:h-12 h-9 w-auto" />
          <span
            className="md:text-6xl font-bold text-4xl tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
          >
            Luhive
          </span>
        </div>

        {/* Bottom navigation */}
        <nav className="mt-6 footer-nav  flex flex-wrap items-center justify-center gap-12 text-xs font-medium text-muted-foreground sm:text-sm">
          <a href="#about" className="hover:text-foreground">
            {t('footerV2.nav.about')}
          </a>
          <a href="#services" className="hover:text-foreground">
            {t('footerV2.nav.services')}
          </a>
          <a href="#products" className="hover:text-foreground">
            {t('footerV2.nav.products')}
          </a>
          <a href="#pricing" className="hover:text-foreground">
            {t('footerV2.nav.plans')}
          </a>
          <a href="#faqs" className="hover:text-foreground">
            {t('footerV2.nav.faqs')}
          </a>
        </nav>
      </div>
    </footer>
  );
}


