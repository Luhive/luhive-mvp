import { useTranslation } from 'react-i18next';

import supVCLogo from '/landing/supVCLogo.png';
import gdgBakuLogo from '/landing/GDGBakuLogo.png';
import aimAzLogo from '/landing/AIMAzLogo.png';

export function LandingPartnersV2() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-[#fff6e6] py-15">
      <div className="mx-auto flex w-[90vw] flex-col items-center text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
          <span>{t('partners.badge')}</span>
        </div>

        <h2 className="mb-10 text-3xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('partners.title')}
        </h2>

        <div className="flex w-full flex-row items-center justify-between md:justify-center gap:20vw md:gap-[20vw]">
          <img
            src={supVCLogo}
            alt={t('partners.supVcAlt')}
            className="h-13 md:h-18 w-auto object-contain"
          />
          <img
            src={gdgBakuLogo}
            alt={t('partners.gdgBakuAlt')}
            className="h-20 md:h-40 w-auto object-contain"
          />
          <img
            src={aimAzLogo}
            alt={t('partners.aimAzAlt')}
            className="h-14 md:h-20 w-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}
