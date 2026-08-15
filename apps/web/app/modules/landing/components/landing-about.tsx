import { useTranslation } from 'react-i18next';

import { LandingHeroDashboard } from "./landing-hero-dashboard";
import { BookACallButton } from "./book-a-call-button";

export function LandingAbout() {
  const { t } = useTranslation('landing');

  return (
    <section
      id="about"
      className="bg-[#F6F4F1] pt-32 pb-12 md:pt-28 lg:pt-36 lg:pb-20"
    >
      <div className="mx-auto w-[95vw] 3xl:w-[60rem] text-center">
        <h2 className="mb-6 md:mb-8 tracking-tight font-semibold text-foreground max-md:leading-snug md:leading-tight text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
          <span className="block">{t("hero.title")}</span>
          <span className="block text-foreground">
            {t("hero.titleHighlight")}{" "}
            <span className="inline-block font-semibold align-baseline tracking-tight text-primary md:leading-tight">
              {" "}
              {t("about.communities")}
            </span>
          </span>
        </h2>

        <p className="mx-auto mb-8 md:mb-10 max-w-3xl text-sm lg:text-lg leading-relaxed text-muted-foreground">
          {t("hero.subtitle")}
        </p>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-center">
            <BookACallButton />
          </div>

          <div className="mx-auto mt-5 md:mt-0 w-full overflow-hidden">
            <LandingHeroDashboard />
          </div>

          {/* <div className="flex justify-center mt-8">
            <a
              href="https://luhive.com/hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-base font-medium text-[#FF6D23] hover:text-[#E55A1A] transition-colors duration-200 group"
              onClick={() => AnalyticsEvents.discoverHubClick("About V2")}
            >
              <span className="text-md lg:text-lg font-medium underlines">
                Discover Hub
              </span>
              <Globe className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div> */}
        </div>
      </div>
    </section>
  );
}


