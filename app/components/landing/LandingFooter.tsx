import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import logo from '/landing/LogoLuhive.svg';

export function LandingFooter() {
  const { t } = useTranslation('landing');

  return (
    <footer className="bg-foreground text-white pt-12 md:pt-16 lg:pt-20 pb-6 md:pb-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* footer-content */}
        <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-12 lg:gap-16 mb-12 md:mb-16">
          {/* footer-brand */}
          <div className="flex-1">
            {/* logo */}
            <Link to="/" className="flex items-center gap-2 md:gap-3 mb-4">
              <img
                src={logo}
                alt="Luhive Logo"
                className="h-7 md:h-8 w-auto brightness-0 invert"
              />
              <span 
                className="text-2xl md:text-3xl font-bold text-white tracking-tight"
                style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
              >
                Luhive
              </span>
            </Link>
            {/* footer-tagline */}
            <p className="text-base md:text-lg font-semibold text-primary mt-4 mb-2">
              {t('footer.tagline')}
            </p>
            {/* footer-description */}
            <p className="text-sm md:text-base text-white/60 mb-4">
              {t('footer.description')}
            </p>
          </div>

          {/* footer-links */}
          <div className="flex flex-wrap gap-12 md:gap-16 lg:gap-20">
            {/* footer-column */}
            <div>
              <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider mb-3 md:mb-4 text-white/50">
                {t('footer.product')}
              </h4>
              <a
                href="#features"
                className="block text-sm md:text-base text-white/80 no-underline mb-2.5 md:mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('nav.features')}
              </a>
              <a
                href="#about"
                className="block text-sm md:text-base text-white/80 no-underline mb-2.5 md:mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('nav.about')}
              </a>
              <a
                href="#contact"
                className="block text-sm md:text-base text-white/80 no-underline mb-2.5 md:mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('nav.contact')}
              </a>
            </div>

            {/* footer-column */}
            <div>
              <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider mb-3 md:mb-4 text-white/50">
                {t('footer.connect')}
              </h4>
              <a
                href="mailto:hi@luhive.com"
                className="block text-sm md:text-base text-white/80 no-underline mb-2.5 md:mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('footer.email')}
              </a>
              <a
                href="https://linkedin.com/company/luhive"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm md:text-base text-white/80 no-underline mb-2.5 md:mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('footer.linkedin')}
              </a>
            </div>
          </div>
        </div>

        {/* Startup Fame Badge */}
        <a
          href="https://startupfa.me/s/luhive?utm_source=luhive.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <img
            src="https://startupfa.me/badges/featured/dark-small-rounded.webp"
            alt="Luhive - Featured on Startup Fame"
            className="w-48 md:w-60 h-auto"
          />
        </a>

        {/* footer-bottom */}
        <div className="pt-6 md:pt-8 mt-2 border-t border-white/10 text-center text-white/50 text-xs md:text-sm">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
