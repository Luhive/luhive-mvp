import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Flame } from 'lucide-react';
import pricingBg from '/landing/pricing-bg.svg';

import { Button } from '~/components/ui/button';
import confirmIcon from '/landing/confirm-icon.png';

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
      className="bg-[#F6F4F1] py-15"
    >
      <div className="mx-auto w-[90vw] 2xl:w-[90rem] text-center">
        <div className="mb-10">
          <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
            <span>{t('pricingV2.badge')}</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('pricingV2.title')}
          </h2>
        </div>

        {/* Main pricing card */}
        <div className="relative md:w-[42.1875rem] mx-auto rounded-[32px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          {/* Ribbon */}
          <div className="absolute -top-4 right-8 inline-flex items-center rounded-full bg-[#FF7A1A] px-5 py-1 text-xs font-semibold text-white shadow-sm">
            {t('pricingV2.ribbon')}
          </div>

          <div className="flex flex-col items-stretch gap-6 px-8 pb-8 pt-12 text-left sm:flex-row sm:items-center sm:gap-10 sm:px-10 sm:pb-10 sm:pt-14">
            {/* Left side - Pricing */}
            <div className="flex-1 space-y-2">
              <div className="text-[1.875rem] text-muted-foreground">
                <span className="line-through">${t('pricingV2.price')}</span>
              </div>
              <div className="text-[3rem] font-medium text-foreground">
                {t('pricingV2.free')}
              </div>
            </div>

            {/* Right side - Title and Features */}
            <div className="flex-1">
              <h3 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
                {t('pricingV2.premiumCommunity')}
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <img
                    src={confirmIcon}
                    alt=""
                    className="mt-1 h-3 w-3 object-contain"
                  />
                  <span>{t('pricingV2.features.feature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <img
                    src={confirmIcon}
                    alt=""
                    className="mt-1 h-3 w-3 object-contain"
                  />
                  <span>{t('pricingV2.features.feature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <img
                    src={confirmIcon}
                    alt=""
                    className="mt-1 h-3 w-3 object-contain"
                  />
                  <span>{t('pricingV2.features.feature3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <img
                    src={confirmIcon}
                    alt=""
                    className="mt-1 h-3 w-3 object-contain"
                  />
                  <span>{t('pricingV2.features.feature4')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#f4efe6] px-8 py-5 sm:px-10">
            <div className="flex justify-center">
              <Button
                className="relative inline-flex md:w-[15.1875rem] h-[3.1rem] md:h-10 items-center gap-2 rounded-[1.875rem] bg-transparent px-[2.75rem] text-sm font-semibold text-[#FF6D23] hover:bg-transparent hover:rounded-md border border-[#FF6D23]"
                asChild
              >
                <Link
                  to="/signup"
                  onClick={() => handleCTAClick('Book a Demo - Pricing V2')}
                >
                  {t('pricingV2.bookDemo')}
                  <Flame className="h-4 w-4" />
                </Link>
              </Button>
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
              <Link
                to="/create-community"
                onClick={() => handleCTAClick('Get started - Pricing CTA V2')}
              >
                {t('pricingV2.cta.button')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Three benefit cards */}
        <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
          <div className="rounded-[24px] bg-[#FF6D2312] p-4 text-xs text-muted-foreground sm:text-sm">
            <p className="mb-1 text-[1rem] font-semibold text-[#000000]">
              <span className='text-[#ff7a1a]'>{t('pricingV2.benefits.benefit1.number')}&nbsp;</span> {t('pricingV2.benefits.benefit1.title')}
            </p>
            <p>
              <span className='text-[0.875rem]'>{t('pricingV2.benefits.benefit1.description')}</span>
            </p>
          </div>
          <div className="rounded-[24px] bg-[#FF6D2312] p-4 text-xs text-muted-foreground sm:text-sm">
            <p className="mb-1 text-[1rem] font-semibold text-[#000000]">
              <span className='text-[#ff7a1a]'>{t('pricingV2.benefits.benefit2.number')}&nbsp;</span> {t('pricingV2.benefits.benefit2.title')}
            </p>
            <p>
              <span className='text-[0.875rem]'>{t('pricingV2.benefits.benefit2.description')}</span>
            </p>
          </div>
          <div className="rounded-[24px] bg-[#FF6D2312] p-4 text-xs text-muted-foreground sm:text-sm">
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


