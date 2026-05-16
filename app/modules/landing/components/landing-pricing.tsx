import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '~/shared/components/ui/button';
import { AnalyticsEvents } from '~/shared/lib/analytics';
import { LUHIVE_CREATE_COMMUNITY_BOOKING_URL } from '~/shared/lib/utils/url';

const FREE_FEATURE_KEYS = ['feature1', 'feature2', 'feature3'] as const;
const BUSINESS_FEATURE_KEYS = ['feature1', 'feature2', 'feature3'] as const;

function PricingBulletList({ plan }: { plan: 'free' | 'business' }) {
  const { t } = useTranslation('landing');
  const keys = plan === 'business' ? BUSINESS_FEATURE_KEYS : FREE_FEATURE_KEYS;
  const prefix = plan === 'business' ? 'pricingV2.business.features' : 'pricingV2.free.features';

  return (
    <ul className="mt-6 space-y-2.5">
      {keys.map((key) => (
        <li key={key} className="flex items-start gap-3 text-base leading-snug text-[#141414]">
          <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-black" aria-hidden />
          <span>{t(`${prefix}.${key}`)}</span>
        </li>
      ))}
    </ul>
  );
}

export function LandingPricing() {
  const { t } = useTranslation('landing');

  return (
    <section
      id="pricing"
      className="bg-[#F6F4F1] py-16 md:py-20"
    >
      <div className="mx-auto w-[90vw] 2xl:w-[90rem]">
        <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight text-[#000000] sm:mb-14 sm:text-[3rem] sm:leading-tight">
          {t('pricingV2.title')}
        </h2>

        <div className="mx-auto grid max-w-[56rem] gap-8 md:grid-cols-2">
          {/* Free plan */}
          <article className="flex min-h-[430px] flex-col rounded-[24px] bg-white p-8 sm:p-10">
            <h3 className="text-[2rem] font-bold leading-tight text-[#000000] sm:text-[2.25rem]">
              {t('pricingV2.free.title')}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[#141414] sm:text-lg">
              {t('pricingV2.free.description')}
            </p>

            <PricingBulletList plan="free" />

            <div className="mt-auto flex flex-col gap-6 pt-10 sm:flex-row sm:items-end sm:justify-between">
              <p className="flex items-baseline gap-0.5">
                <span className="text-[2.5rem] font-bold leading-none text-[#000000] sm:text-[2.75rem]">
                  {t('pricingV2.free.price')}
                </span>
                <span className="text-lg text-[#666666]">{t('pricingV2.free.period')}</span>
              </p>

              <Button
                className="h-auto w-full shrink-0 rounded-full bg-[#000000] px-6 py-3 text-sm font-semibold text-white hover:bg-[#000000]/90 sm:w-auto"
                asChild
              >
                <Link
                  to="/signup"
                  onClick={() => AnalyticsEvents.startCommunityClick('Pricing Free')}
                >
                  {t('pricingV2.free.cta')}
                </Link>
              </Button>
            </div>
          </article>

          {/* Business plan */}
          <article className="flex min-h-[22rem] flex-col rounded-[24px] bg-white p-8 shadow-[0_0_40px_rgba(255,107,53,0.25)] sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <img
                src="/landing/LogoLuhive.svg"
                alt=""
                aria-hidden
                className="h-9 w-9 shrink-0"
              />
              <h3 className="text-[2rem] font-bold leading-tight text-[#000000] sm:text-[2.25rem]">
                {t('pricingV2.business.brand')}
              </h3>
              <span className="rounded-full bg-[#FF6B35] px-3 py-1 text-sm font-semibold text-white">
                {t('pricingV2.business.badge')}
              </span>
            </div>

            <p className="mt-3 text-base leading-relaxed text-[#141414] sm:text-lg">
              {t('pricingV2.business.description')}
            </p>

            <PricingBulletList plan="business" />

            <div className="mt-auto pt-10">
              <Button
                className="h-auto rounded-full bg-[#000000] px-6 py-3 text-sm font-semibold text-white hover:bg-[#000000]/90"
                asChild
              >
                <a
                  href={LUHIVE_CREATE_COMMUNITY_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => AnalyticsEvents.bookDemoClick('Pricing Business')}
                >
                  {t('pricingV2.business.cta')}
                </a>
              </Button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
