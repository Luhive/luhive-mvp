import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { StackedCarousel } from './StackedCarousel';

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
      className="bg-[#F6F4F1] lg:pb-15 lg:pt-24 pb-8 pt-28"
    >
      <div className="mx-auto w-[95vw] 3xl:w-[60rem] text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
          <span className="text-[1.3125rem">{t('about.badge')}</span>
        </div>

        <h2 className="mb-4 text-5xl font-extrabold trcking-tight text-foreground lg:text-7xl md:leading-tight">
          {t('hero.title')}
          <br />
          <span className="text-foreground">
            {t('hero.titleHighlight')}{' '}
            <motion.span
              className="mb-4 inline-block text-5xl font-extrabold tracking-tight text-primary px-6 rounded-2xl py-2 lg:py-0 md:rounded-2xl lg:rounded-3xl bg-primary/20 lg:text-7xl md:leading-tight"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{
                opacity: { duration: 0.6 },
                y: { type: 'spring', stiffness: 100, damping: 15 },
              }}
              style={{ willChange: 'transform, opacity' }}
            >
              {t('about.communities')}
            </motion.span>
          </span>
        </h2>

        

        <p className="mx-auto mt-5 mb-6 lg:mt-11 lg:mb-7 max-w-2xl text-sm lg:text-lg leading-relaxed text-muted-foreground">
          {t('hero.subtitle')}
        </p>

        <div className='flex flex-col gap-5 mt:gap-0'>
          <div className="flex items-center justify-center">
            <Button
            size="lg"
              className="h-auto rounded-full bg-[#FF6D23] px-8 py-3.5 text-base leading-[1.5] text-white shadow-[0px_2px_6px_0px_rgba(255,109,35,0.35)] hover:bg-[#E55A1A] hover:shadow-[0px_4px_8px_0px_rgba(255,109,35,0.45)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6D23]/50 focus-visible:ring-offset-2 md:px-11"
            asChild
          >
              <a
                href="https://tally.so/r/NpDVoG"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCTAClick('Start Your Community - About V2')}
            >
                {t('about.startYourCommunity')}
              </a>
          </Button>
        </div>

        <div className="mx-auto mt-4 w-full md:w-[74.75rem]">
            {/* <div className="relative overflow-hidden rounded-xl bg-[#FF7A1A]">
            <video
              className="h-[260px] md:h-[29.375rem] md:w-[74.75rem] w-full object-cover "
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
          </div> */}
            <StackedCarousel />
        </div>

          <div className="flex justify-center mt-8">
            <a
              href="https://luhive.com/hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-base font-medium text-[#FF6D23] hover:text-[#E55A1A] transition-colors duration-200 group"
            >
              <span className='text-md lg:text-lg font-medium underlines'>Discover Hub</span>
              <ExternalLink className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div>
        </div>

        
      </div>
    </section>
  );
}


