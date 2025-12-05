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
    <section className="min-h-screen flex items-center justify-center text-center pt-[120px] pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-[800px] mx-auto animate-fade-in-up">
          <h1 className="text-[72px] md:text-[56px] sm:text-[50px] font-extrabold leading-[1.1] mb-6 tracking-[-2px]">
            {t('hero.title')}
            <br />
            <span 
              className="bg-clip-text text-transparent animate-gradient-flow"
              style={{
                background: 'linear-gradient(90deg, #FF8040 0%, #E66020 25%, #FF6B9D 50%, #FF8040 75%, #E66020 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('hero.titleHighlight')}
            </span>
          </h1>
          <p className="text-xl md:text-lg text-muted-foreground mb-10 leading-relaxed max-w-[600px] mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button
              size="lg"
              className="h-[52px] min-w-[120px] px-8 text-base"
              asChild
            >
              <Link
                to="/hub"
                prefetch="intent"
                onClick={() => handleCTAClick('Discover Communities - Hero')}
              >
                {t('hero.ctaDiscover')}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-[52px] min-w-[120px] px-8 text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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
          <p className="text-base text-muted-foreground/60">
            <span className="text-primary font-semibold">{t('hero.tagline')}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
