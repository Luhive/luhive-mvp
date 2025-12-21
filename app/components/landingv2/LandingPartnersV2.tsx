import { useTranslation } from 'react-i18next';

import supVCLogo from '/landing/supVCLogo.svg';
import gdgBakuLogo from '/landing/GDGBakuLogoV2.svg';
import aimAzLogo from '/landing/AIMAzLogoV2.svg';

export function LandingPartnersV2() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-[#F6F4F1] py-15">
      <div className="mx-auto flex w-[90vw] 2xl:w-[90rem] flex-col items-center text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
          <span>{t('partners.badge')}</span>
        </div>

        <h2 className="mb-10 text-3xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('partners.title')}
        </h2>

        <div className="flex w-full gap-5 md:w-[58.5rem] mx-auto flex-row items-center justify-between">
          <img
            src={supVCLogo}
            alt={t('partners.supVcAlt')}
              className="w-[5.13644rem] h-[1.78569rem] md:h-[4.076rem] md:w-[11.72419rem] object-contain"
          />
          <div className='flex gap-5 flex-row items-center justify-between'>
          <img
            src={gdgBakuLogo}
            alt={t('partners.gdgBakuAlt')}
            className="w-[7.89475rem] h-[1.78569rem] md:h-[4.076rem] md:w-[18.02013rem] object-contain"
          />
          <img
            src={aimAzLogo}
            alt={t('partners.aimAzAlt')}
            className="h-5 md:h-18 w-auto object-contain"
          />
          </div>
        </div>
      </div>
    </section>
  );
}
