import { useTranslation } from 'react-i18next';

const PARTNERS = [
  { src: "/landing/partners/Sup.png", alt: "SUP.VC" },
  { src: "/landing/partners/GDG.png", alt: "GDG Baku" },
  { src: "/landing/partners/Nextgenhub.png", alt: "Nextgen Hub" },
  { src: "/landing/partners/Cursor.png", alt: "Cursor" },
  { src: "/landing/partners/Techsales.png", alt: "Techsales" },
  { src: "/landing/partners/Xsolla.png", alt: "Xsolla" },
  { src: "/landing/partners/Eic.png", alt: "EIC" },
  { src: "/landing/partners/Hackcafe.png", alt: "Hackcafe" },
  { src: "/landing/partners/Wesolve.png", alt: "Wesolve" },
];

export function LandingPartners() {
  const { t } = useTranslation('landing');

  return (
    <section className="border-y border-border/40 py-5 bg-[#F6F4F1]">
      <div className="mx-auto flex w-[90vw] max-w-7xl flex-col items-center gap-4 px-6 md:flex-row md:gap-8">
        <p className="shrink-0 text-sm text-muted-foreground leading-tight text-center md:text-left md:max-w-[10rem] md:mb-0 mb-6">
          {t("partners.subtitle")}
        </p>

        <div className="relative w-full flex-1 overflow-hidden">
         <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F6F4F1] to-transparent hidden md:block" />
         <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F6F4F1] to-transparent hidden md:block" />

          <div
            className="flex w-max items-center opacity-60 gap-12 hover:[animation-play-state:paused]"
            style={{ animation: "scroll-left 25s linear infinite" }}
          >
            {[...PARTNERS, ...PARTNERS].map((partner, i) => (
              <img
                key={`${partner.alt}-${i}`}
                src={partner.src}
                alt={partner.alt}
                className="h-6 w-auto object-contain lg:h-8"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
