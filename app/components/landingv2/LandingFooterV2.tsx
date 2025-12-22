import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import logo from '/landing/LogoLuhive.svg';
import xPlatform from '/landing/xplatfrom.svg';
import linkedin from '/landing/Linkedin.svg';
import telegram from '/landing/Telegram.svg';
import instagram from '/landing/Instagram.svg';

const SOCIAL_LINKS = [
  {
    id: 'x',
    icon: xPlatform,
    href: 'https://twitter.com/luhive_',
    label: 'X (Twitter)',
  },
  {
    id: 'linkedin',
    icon: linkedin,
    href: 'https://www.linkedin.com/company/luhive',
    label: 'LinkedIn',
  },
  {
    id: 'telegram',
    icon: telegram,
    href: 'https://t.me/luhive',
    label: 'Telegram',
  },
  {
    id: 'instagram',
    icon: instagram,
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
        <div className="relative mb-4 flex flex-col-reverse items-center gap-6 md:flex-row md:justify-between">
          {/* Desktop: Social icons on left | Mobile: Social icons in middle */}
          <div className="flex items-center gap-2 md:order-1">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl "
                aria-label={social.label}
              >
                <img
                  src={social.icon}
                  alt={social.label}
                  className="h-8 w-8 object-contain"
                />
              </a>
            ))}
          </div>

          {/* Desktop: CTAs on right | Mobile: CTAs at top */}
          <div className="flex w-full items-center justify-center gap-3 md:order-3 md:w-auto">
            <Button
              className="h-[3.1rem] md:h-9 rounded-full bg-[#ff7a1a] px-5 text-xs font-semibold text-white shadow-sm hover:rounded-md hover:bg-[#FF7A1A]"
              asChild
            >
              <a
                href="https://tally.so/r/NpDVoG"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('about.startYourCommunity')}
              </a>
            </Button>
            <Button
              variant="link"
              className="h-[3.1rem] md:h-9 px-5 text-xs font-semibold text-[#ff7a1a] hover:text-[#E55A1A]"
              asChild
            >
              <Link to="/hub">
                Discover Hub
              </Link>
            </Button>
          </div>
        </div>

        {/* Desktop: Logo in center | Mobile: Logo at bottom */}
        <div className="flex items-center mt-5 gap-3 w-full justify-center">
          <img src={logo} alt="Luhive logo" className="md:h-12 h-9 w-auto" />
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


