import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Flame } from 'lucide-react';

import { Button } from '~/components/ui/button';

export function LandingPricingV2() {
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
      id="pricing"
      className="bg-[#F6F4F1] py-10"
    >
      <div className="mx-auto w-[90vw] 2xl:w-[90rem] text-center">

        <div className="mb-10">
          <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
            <span>{t('pricingV2.badge')}</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[3rem]">
            {t('pricingV2.title')}
          </h2>
        </div>

        {/* Main pricing card */}
        <div className="relative md:w-[42.1875rem] py-[2.1875rem] mx-auto rounded-[32px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <div className="absolute -top-[1.6875rem] left-0 md:left-auto md:right-8 inline-flex items-center -rotate-[0.969deg] rounded-[3.75rem] bg-[#FF7A1A] h-[3.13413rem] p-[0.25rem] px-[1.25rem] text-[1rem] font-semibold text-white shadow-sm">
            {t('pricingV2.ribbon')}
          </div>

          

          <div className='flex flex-col px-[2.125rem] md:px-[2.5rem] gap-[1.5rem]'>
          <div className='flex justify-center items-center'>
            <h3 className="text-2xl hidden md:block font-semibold text-foreground sm:text-[1.875rem]">
                {t('pricingV2.premiumCommunity')}
              </h3>
          </div>
          <div className="flex flex-col items-stretch justify-between px-0 md:px-8 text-left sm:flex-row sm:items-center sm:gap-10">
            <div className="w-max hidden md:block">
              <div className="text-[1.875rem] text-muted-foreground">
                <span className="relative inline-block">${t('pricingV2.price')}
                <span className="absolute left-0 top-1/2 w-full h-[0.125rem] bg-[#FF6D23] -translate-y-1/2"></span>
                </span>
              </div>
              <div className="text-[3rem] font-medium text-foreground">
                {t('pricingV2.free')}
              </div>
            </div>

            <div className='md:hidden flex flex-col justify-between items-center'>
                          {/* deep clean */}
              <div className='flex w-full justify-between items-center'>
              <div className="flex flex-col items-center justify-center">
                <h3 className="w-max font-semibold text-foreground text-[1.125rem]">{t('pricingV2.planName')}</h3>
              </div>
  
              <div className='w-max flex flex-col justify-center items-center md:hidden'>
                <div className="w-max block md:hidden">
                  <div className="text-[1.25rem] text-muted-foreground">
                    <span className="relative inline-block">${t('pricingV2.price')}
                    <span className="absolute left-0 top-1/2 w-full h-[0.125rem] bg-[#FF6D23] -translate-y-1/2"></span>
                    </span>
                  </div>
                  <div className="text-[1.5rem] font-medium text-foreground">
                    {t('pricingV2.free')}
                  </div>
                </div>
              </div>
              </div>

              <div className="block md:hidden my-5">
            <div className="flex justify-center items-center w-full">
              <Button
                className="relative inline-flex md:w-[15.1875rem] h-[2.5rem] md:h-10 items-center gap-2 rounded-[1.875rem] bg-transparent px-[2.75rem] text-sm font-semibold text-[#FF6D23] hover:bg-transparent hover:rounded-md border border-[#FF6D23]"
                asChild
              >
                <a
                  href="https://tally.so/r/NpDVoG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className='text-[0.875rem] font-bold'
                  onClick={() => handleCTAClick('Start Your Community - Pricing V2')}
                >
                  {t('pricingV2.bookDemo')}
                </a>
              </Button>
            </div>
            </div>
            </div>

            <div className="w-max">
              <ul className="space-y-1.5 w-max text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <img
                    src="/landing/confirm-icon.png"
                    alt=""
                    className="mt-1 h-3 w-3 object-contain"
                  />
                  <span className='text-[#141414] text-[0.75rem] md:text-[1rem]'>{t('pricingV2.features.feature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <img
                    src="/landing/confirm-icon.png"
                    alt=""
                    className="mt-1 h-3 w-3 object-contain"
                  />
                  <span className='text-[#141414] text-[0.75rem] md:text-[1rem]'>{t('pricingV2.features.feature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <img
                    src="/landing/confirm-icon.png"
                    alt=""
                    className="mt-1 h-3 w-3 object-contain"
                  />
                  <span className='text-[#141414] text-[0.75rem] md:text-[1rem]'>{t('pricingV2.features.feature3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <img
                    src="/landing/confirm-icon.png"
                    alt=""
                    className="mt-1 h-3 w-3 object-contain"
                  />
                  <span className='text-[#141414] text-[0.75rem] md:text-[1rem]'>{t('pricingV2.features.feature4')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="flex justify-center">
              <Button
                className="relative inline-flex md:w-[15.1875rem] h-[3.1rem] md:h-10 items-center gap-2 rounded-[1.875rem] bg-transparent px-[2.75rem] text-sm font-semibold text-[#FF6D23] hover:bg-transparent hover:rounded-md border border-[#FF6D23]"
                asChild
              >
                <a
                  href="https://tally.so/r/NpDVoG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className='text-[0.875rem] font-bold'
                  onClick={() => handleCTAClick('Start Your Community - Pricing V2')}
                >
                  {t('about.startYourCommunity')}
                  <Flame className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          </div>
        </div>

        {/* Gradient CTA block */}
        <div className="mt-12 rounded-[40px] bg-[url('/landing/pricing-bg.svg')] bg-cover bg-center px-6 py-12 text-left text-white sm:px-12 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="mb-4 md:text-[3rem] font-semibold tracking-tight text-[2rem]">
              {t('pricingV2.cta.title')}
            </h3>
            <p className="mx-auto mb-8 w-[20rem] text-sm font-medium text-white/90 sm:text-base">
              {t('pricingV2.cta.description')}
            </p>
            <Button
              size="lg"
              className="mx-auto inline-flex h-[3.1rem] md:h-10 rounded-full bg-[#000000] px-8 text-sm font-semibold text-[#ffffff]
              hover:rounded-md hover:bg-[#000000] hover:text-[#ffffff] sm:h-11"
              asChild
            >
              <a
                href="https://tally.so/r/NpDVoG"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCTAClick('Start Your Community - Pricing CTA V2')}
              >
                {t('about.startYourCommunity')}
              </a>
            </Button>
          </div>
        </div>

        {/* Three benefit cards */}
        <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
          <div className="rounded-[24px] bg-[#FF6D2312] p-6 text-xs text-muted-foreground sm:text-sm">
            <p className="mb-1 text-[1rem] font-semibold text-[#000000]">
              <span className='text-[#ff7a1a]'>{t('pricingV2.benefits.benefit1.number')}&nbsp;</span> {t('pricingV2.benefits.benefit1.title')}
            </p>
            <p>
              <span className='text-[0.875rem]'>{t('pricingV2.benefits.benefit1.description')}</span>
            </p>
          </div>
          <div className="rounded-[24px] bg-[#FF6D2312] p-6 text-xs text-muted-foreground sm:text-sm">
            <p className="mb-1 text-[1rem] font-semibold text-[#000000]">
              <span className='text-[#ff7a1a]'>{t('pricingV2.benefits.benefit2.number')}&nbsp;</span> {t('pricingV2.benefits.benefit2.title')}
            </p>
            <p>
              <span className='text-[0.875rem]'>{t('pricingV2.benefits.benefit2.description')}</span>
            </p>
          </div>
          <div className="rounded-[24px] bg-[#FF6D2312] p-6 text-xs text-muted-foreground sm:text-sm">
            <p className="mb-1 text-[1rem] font-semibold text-[#000000]">
              <span className='text-[#ff7a1a]'>{t('pricingV2.benefits.benefit3.number')}&nbsp;</span> {t('pricingV2.benefits.benefit3.title')}
            </p>
            <p>
              <span className='text-[0.875rem]'>{t('pricingV2.benefits.benefit3.description')}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


