import { useTranslation } from 'react-i18next';

import supVCLogo from '/landing/supVCLogo.png';
import gdgBakuLogo from '/landing/GDGBakuLogo.png';
import aimAzLogo from '/landing/AIMAzLogo.png';

export function LandingPartnersV2() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-[#fff6e6] py-16 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6">
        <div className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
          <span>{t('partners.badge')}</span>
        </div>

        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('partners.title')}
        </h2>

        <div className="flex w-full flex-col items-center justify-center gap-10 sm:flex-row sm:gap-16">
          <img
            src={supVCLogo}
            alt={t('partners.supVcAlt')}
            className="h-14 w-auto object-contain"
          />
          <img
            src={gdgBakuLogo}
            alt={t('partners.gdgBakuAlt')}
            className="h-16 w-auto object-contain"
          />
          <img
            src={aimAzLogo}
            alt={t('partners.aimAzAlt')}
            className="h-16 w-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}
