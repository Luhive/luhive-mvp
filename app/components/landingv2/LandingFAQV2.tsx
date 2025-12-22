import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '~/components/ui/button';

const FAQ_ITEM_IDS = ['what-is-luhive', 'who-is-luhive-built-for', 'what-problem-does-luhive-solve', 'how-does-luhive-provide-deep-analytics'];

export function LandingFAQV2() {
  const { t } = useTranslation('landing');
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEM_IDS[0] ?? null);

  const toggleItem = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      id="faqs"
      className="bg-[#F6F4F1] py-10"
    >
      <div className="mx-auto w-[90vw] 2xl:w-[90rem]">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
            <span>{t('faqV2.badge')}</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('faqV2.title')}
          </h2>
        </div>

        <div className="divide-y w-full md:w-[60%] mx-auto  divide-[#f3ecde] rounded-3xl bg-transparent">
          {FAQ_ITEM_IDS.map((itemId) => {
            const isOpen = itemId === openId;
            return (
              <button
                key={itemId}
                type="button"
                onClick={() => toggleItem(itemId)}
                className="flex w-full flex-col items-stretch px-0 md:px-5 py-5 text-left text-lg text-foreground sm:px-7 sm:py-6 transition-colors hover:bg-muted/30 rounded-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{t(`faqV2.items.${itemId}.question`)}</span>
                  <span 
                    className={`text-3xl text-muted-foreground transition-transform duration-300 ease-in-out ${
                      isOpen ? 'rotate-0' : 'rotate-0'
                    }`}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-md">
                    {t(`faqV2.items.${itemId}.answer`)}
                  </p>
                </div>
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
              <a
                href="https://tally.so/r/NpDVoG"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{t('faqV2.cta.button')}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm">
                  →
                </span>
              </a>
            </Button>
            <span className="inline-block">{t('faqV2.cta.titleConsultation')}</span>
          </h3>
        </div>
      </div>
    </section>
  );
}


