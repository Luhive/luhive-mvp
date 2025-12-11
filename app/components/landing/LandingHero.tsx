import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';

export function LandingHero() {
  const { t } = useTranslation('landing');

  const handleCTAClick = (label: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'CTA',
        event_label: label,
      });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center text-center pt-4 lg:pt-32 pb-16 md:pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl lg:max-w-4xl mx-auto animate-fade-in-up">
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            {t('hero.title')}
            <br />
            <span className="gradient-text animate-gradient-flow">
              {t('hero.titleHighlight')}
            </span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-8 md:mb-10 leading-relaxed max-w-xl lg:max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button
              size="lg"
              className="h-12 md:h-14 min-w-28 md:min-w-32 px-6 md:px-8 text-base"
              asChild
            >
              <a
                href="/hub"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCTAClick('Discover Communities - Hero')}
              >
                {t('hero.ctaDiscover')}
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 md:h-14 min-w-28 md:min-w-32 px-6 md:px-8 text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <Link
                to="/create-community"
                onClick={() => handleCTAClick('Create Your Community - Hero')}
              >
                {t('hero.ctaCreate')}
              </Link>
            </Button>
          </div>
          <p className="text-sm md:text-base text-muted-foreground/60">
            <span className="text-primary font-semibold">{t('hero.tagline')}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
