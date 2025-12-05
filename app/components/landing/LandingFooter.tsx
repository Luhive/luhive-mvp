import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import logo from '/landing/LogoLuhive.svg';

export function LandingFooter() {
  const { t } = useTranslation('landing');

  return (
    <footer className="bg-foreground text-white pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* footer-content: grid 2fr 1fr, gap 64px, mb 64px */}
        <div className="flex justify-between gap-16 mb-16">
          {/* footer-brand */}
          <div>
            {/* logo: mb-4 */}
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src={logo}
                alt="Luhive Logo"
                className="h-8 w-auto brightness-0 invert"
              />
              <span 
                className="text-[28px] font-bold text-white tracking-[-0.5px]"
                style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
              >
                Luhive
              </span>
            </Link>
            {/* footer-tagline: 18px, 600, primary, margin 16px 0 8px */}
            <p className="text-lg font-semibold text-primary mt-4 mb-2">
              {t('footer.tagline')}
            </p>
            {/* footer-description: white/60, 15px, mb-4 */}
            <p className="text-[15px] text-white/60 mb-4">
              {t('footer.description')}
            </p>
          </div>

          {/* footer-links: grid 2 cols, gap 32px */}
          <div className="flex justify-between gap-25">
            {/* footer-column */}
            <div>
              {/* h4: 14px, 700, uppercase, tracking 1px, mb-4, white/50 */}
              <h4 className="text-sm font-bold uppercase tracking-[1px] mb-4 text-white/50">
                {t('footer.product')}
              </h4>
              {/* a: block, white/80, 15px, mb-3, hover:primary, hover:translateX(4px) */}
              <a
                href="#features"
                className="block text-[15px] text-white/80 no-underline mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('nav.features')}
              </a>
              <a
                href="#about"
                className="block text-[15px] text-white/80 no-underline mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('nav.about')}
              </a>
              <a
                href="#contact"
                className="block text-[15px] text-white/80 no-underline mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('nav.contact')}
              </a>
            </div>

            {/* footer-column */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[1px] mb-4 text-white/50">
                {t('footer.connect')}
              </h4>
              <a
                href="mailto:hi@luhive.com"
                className="block text-[15px] text-white/80 no-underline mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
              >
                {t('footer.email')}
              </a>
              <a
                href="https://linkedin.com/company/luhive"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[15px] text-white/80 no-underline mb-3 transition-all duration-200 hover:text-primary hover:translate-x-1"
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
        >
          <img
            src="https://startupfa.me/badges/featured/dark-small-rounded.webp"
            alt="Luhive - Featured on Startup Fame"
            width={240}
            height={37}
          />
        </a>

        {/* footer-bottom: pt-8, border-t white/10, text-center, white/50, 14px */}
        <div className="pt-8 mt-2  border-t border-white/10 text-center text-white/50 text-sm">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
