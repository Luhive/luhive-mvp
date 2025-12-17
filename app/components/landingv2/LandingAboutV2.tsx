import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';

export function LandingAboutV2() {
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
    <section
      id="about"
      className="bg-[#fff6e6] pb-15 pt-24 sm:pb-8 sm:pt-28"
    >
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <div className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
          <span>{t('about.badge')}</span>
        </div>

        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-[40px] md:leading-tight">
          {t('hero.title')}
          <br />
          <span className="text-foreground">
            {t('hero.titleHighlight')}
          </span>
        </h2>

        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t('hero.subtitle')} {t('hero.subtitle')}
        </p>

        <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <Button
            variant="outline"
            size="lg"
            className="h-11 rounded-full border-[#FF7A1A] px-8 text-sm font-semibold text-[#FF7A1A] hover:bg-[#FF7A1A] hover:text-white sm:h-12 sm:px-10"
            asChild
          >
            <Link
              to="/create-community"
              onClick={() => handleCTAClick('Create Community - About V2')}
            >
              {t('hero.ctaCreate')}
            </Link>
          </Button>

          <Button
            size="lg"
            className="h-11 rounded-full bg-[#FF7A1A] px-8 text-sm font-semibold text-white shadow-sm hover:bg-[#ff8e3a] sm:h-12 sm:px-10"
            asChild
          >
            <Link
              to="/signup"
              onClick={() => handleCTAClick('Try for free - About V2')}
            >
              {t('navV2.tryForFree')}
            </Link>
          </Button>
        </div>

        <div className="mx-auto mt-4 max-w-5xl">
          <div className="relative overflow-hidden rounded-[32px] bg-[#FF7A1A]">
            <video
              className="h-[260px] w-full object-cover sm:h-[320px] md:h-[360px]"
              src="/landing/luhiveLandingVideo.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              disablePictureInPicture
              controlsList="nodownload nofullscreen noplaybackrate noremoteplayback"
              aria-label="Luhive product preview"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


