import { useTranslation } from 'react-i18next';

export function LandingPartnersV2() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-[#F6F4F1] py-10">
      <div className="mx-auto flex w-[90vw] 2xl:w-[100rem] flex-col items-center text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
          <span className='text-[1rem]'>{t('partners.badge')}</span>
        </div>

        <h2 className="mb-10 lg:mb-15 text-2xl font-semibold tracking-tight text-foreground lg:text-[3rem]">
          {t('partners.title')}
        </h2>

        <div className="w-full max-w-5xl mx-auto grid grid-cols-3 place-items-center gap-4">
          <img
            src="/landing/supVCLogo.svg"
            alt={t('partners.supVcAlt')}
            className="h-[clamp(1.8rem,5vw,4rem)] w-auto"
          />
          <img
            src="/landing/GDGBakuLogoV2.svg"
            alt={t('partners.gdgBakuAlt')}
            className="h-[clamp(2rem,5vw,4rem)] w-auto"
          />
          <img
            src="/landing/AIMAzLogoV2.svg"
            alt={t('partners.aimAzAlt')}
            className="h-[clamp(1.4rem,5vw,2.8rem)] w-auto"
          />
        </div>
      </div>
    </section>
  );
}
