import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';

const FAQ_ITEM_IDS = ['pay-for-services', 'be-home', 'products'];

export function LandingFAQV2() {
  const { t } = useTranslation('landing');
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEM_IDS[0] ?? null);

  const toggleItem = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      id="faqs"
      className="bg-[#fff6e6] pb-24 pt-20 sm:pb-28 sm:pt-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
            <span>{t('faqV2.badge')}</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t('faqV2.title')}
          </h2>
        </div>

        <div className="divide-y divide-[#f3ecde] rounded-3xl bg-white/70">
          {FAQ_ITEM_IDS.map((itemId) => {
            const isOpen = itemId === openId;
            return (
              <button
                key={itemId}
                type="button"
                onClick={() => toggleItem(itemId)}
                className="flex w-full flex-col items-stretch px-5 py-5 text-left text-sm text-foreground sm:px-7 sm:py-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{t(`faqV2.items.${itemId}.question`)}</span>
                  <span className="text-lg text-muted-foreground">
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
                {isOpen && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {t(`faqV2.items.${itemId}.answer`)}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <h3 className="flex flex-wrap items-center justify-center gap-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            <span className="block w-full">{t('faqV2.cta.titleLine1')}</span>
            <span className="inline-block">{t('faqV2.cta.titleFree')}</span>
            <Button
              className="inline-flex h-12 items-center gap-3 rounded-full bg-[#FF7A1A] px-8 text-base font-semibold text-white shadow-sm hover:bg-[#ff8e3a]"
              asChild
            >
              <Link to="/contact">
                <span>{t('faqV2.cta.button')}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm">
                  →
                </span>
              </Link>
            </Button>
            <span className="inline-block">{t('faqV2.cta.titleConsultation')}</span>
          </h3>
        </div>
      </div>
    </section>
  );
}


