import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

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
      className="bg-[#fff6e6] pb-24 pt-20 sm:pb-8 sm:pt-24"
    >
      <div className="mx-auto w-[90vw] text-center">
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
        <div className="relative rounded-[32px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          {/* Ribbon */}
          <div className="absolute -top-4 left-8 inline-flex items-center rounded-full bg-[#FF7A1A] px-5 py-1 text-xs font-semibold text-white shadow-sm">
            {t('pricingV2.ribbon')}
          </div>

          <div className="flex flex-col items-stretch gap-6 px-8 pb-8 pt-12 text-left sm:flex-row sm:items-center sm:gap-10 sm:px-10 sm:pb-10 sm:pt-14">
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold text-foreground">{t('pricingV2.planName')}</h3>
              <div className="flex items-baseline gap-3 text-sm text-muted-foreground">
                <div className="relative text-2xl font-semibold text-foreground">
                  <span className="relative inline-block">
                    {t('pricingV2.price')}
                    <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 -skew-y-3 bg-[#ff7a1a]" />
                  </span>
                </div>
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {t('pricingV2.currency')}
                </span>
              </div>
            </div>

            <div className="flex-1">
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
                variant="outline"
                className="h-10 rounded-full border-[#FF7A1A] px-8 text-sm font-semibold text-[#FF7A1A] hover:rounded-md hover:bg-white"
                asChild
              >
                <Link
                  to="/signup"
                  onClick={() => handleCTAClick('Try for free - Pricing V2')}
                >
                  {t('navV2.tryForFree')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Gradient CTA block */}
        <div className="mt-12 rounded-[40px] bg-[radial-gradient(circle_at_top_left,#ffd8a8,transparent_55%),radial-gradient(circle_at_bottom_right,#ff8040,transparent_45%),linear-gradient(90deg,#ffb26b,#ff8040)] px-6 py-12 text-left text-white sm:px-12 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="mb-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('pricingV2.cta.title')}
            </h3>
            <p className="mx-auto mb-8 max-w-2xl text-sm font-medium text-white/90 sm:text-base">
              {t('pricingV2.cta.description')}
            </p>
            <Button
              size="lg"
              className="mx-auto inline-flex h-10 rounded-full bg-[#000000] px-8 text-sm font-semibold text-[#ffffff]
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
            <p className="mb-1 text-md font-semibold text-[#000000]">
              <span className='text-[#ff7a1a]'>{t('pricingV2.benefits.benefit1.number')}&nbsp;</span> {t('pricingV2.benefits.benefit1.title')}
            </p>
            <p>
              <span className='text-[12px]'>{t('pricingV2.benefits.benefit1.description')}</span>
            </p>
          </div>
          <div className="rounded-[24px] bg-[#FF6D2312] p-4 text-xs text-muted-foreground sm:text-sm">
            <p className="mb-1 text-md font-semibold text-[#000000]">
              <span className='text-[#ff7a1a]'>{t('pricingV2.benefits.benefit2.number')}&nbsp;</span> {t('pricingV2.benefits.benefit2.title')}
            </p>
            <p>
              <span className='text-[12px]'>{t('pricingV2.benefits.benefit2.description')}</span>
            </p>
          </div>
          <div className="rounded-[24px] bg-[#FF6D2312] p-4 text-xs text-muted-foreground sm:text-sm">
            <p className="mb-1 text-md font-semibold text-[#000000]">
              <span className='text-[#ff7a1a]'>{t('pricingV2.benefits.benefit3.number')}&nbsp;</span> {t('pricingV2.benefits.benefit3.title')}
            </p>
            <p>
              <span className='text-[12px]'>{t('pricingV2.benefits.benefit3.description')}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


