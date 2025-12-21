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
      className="bg-[#F6F4F1] pb-15 pt-24 sm:pb-8 sm:pt-28"
    >
      <div className="mx-auto w-[90vw] 3xl:w-[60rem] text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
          <span>{t('about.badge')}</span>
        </div>

        <h2 className="mb-4 text-4xl font-extrabold trcking-tight text-foreground md:text-7xl md:leading-tight">
          {t('hero.title')}
          <br />
          <span className="text-foreground">
            {t('hero.titleHighlight')}  <span className="mb-4 text-4xl font-extrabold tracking-tight text-[#FF6D23] md:text-7xl md:leading-tight">
          {t('about.communities')}
        </span>
          </span>
        </h2>

        

        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t('hero.subtitle')} {t('hero.subtitle')}
        </p>

        <div className='flex flex-col-reverse md:flex-col gap-5 mt:gap-0'>
        <div className="mb-10 md:mt-0 flex flex-row items-center justify-center gap-4 md:gap-2">
          <Button
            variant="outline"
            size="lg"
            className="hidden md:flex h-11 rounded-full bg-transparent hover:bg-transparent hover:rounded-md border-[#FF7A1A] px-8 text-sm font-semibold text-[#FF7A1A]  sm:h-12 sm:px-10"
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
            className="h-[3.1rem] rounded-full bg-[#FF7A1A] px-8 text-sm font-semibold hover:bg-[#FF7A1A] text-white shadow-sm hover:rounded-md sm:h-12 sm:px-10"
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

        <div className="mx-auto mt-4 w-full md:w-[70vw]">
          <div className="relative overflow-hidden rounded-xl bg-[#FF7A1A]">
            <video
              className="h-[260px] md:h-[460px] w-full object-cover "
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

        
      </div>
    </section>
  );
}


