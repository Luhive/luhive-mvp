import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { FeatureVisualEventIntelligence } from "./feature-visual-event-intelligence";
import { FeatureVisualMemberMemory } from "./feature-visual-member-memory";
import { FeatureVisualCommunityMemory } from "./feature-visual-community-memory";
import { FeatureVisualReachTheRightPeople } from "./feature-visual-reach-the-right-people";

const FEATURE_KEYS = [
  "memberMemory",
  "eventIntelligence",
  "reachTheRightPeople",
  "communityMemory",
] as const;

export function LandingFeatures() {
  const { t } = useTranslation("landing");
  const [activeIndex, setActiveIndex] = useState(0);
  const panelId = useId();

  return (
    <section id="features" className="bg-[#F6F4F1] py-16 md:py-24">
      <div className="mx-auto flex w-[90vw] max-w-[70rem] flex-col items-center">
        <header className="mb-12 flex w-full flex-col items-center gap-3 text-center md:mb-20">
          <h2 className="max-w-[52rem] text-3xl font-medium leading-tight tracking-tight text-[#141414] md:text-[3rem]">
            {t("featuresShowcase.heading")}
          </h2>
        </header>

        <div className="flex w-full flex-col items-stretch justify-between gap-10 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
          <div
            className="flex w-full max-w-[33.125rem] flex-col gap-8 md:gap-10 lg:shrink-0"
            role="tablist"
            aria-label={t("featuresShowcase.badge")}
          >
            {FEATURE_KEYS.map((key, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`feature-tab-${key}`}
                  aria-selected={isActive}
                  aria-controls={panelId}
                  onClick={() => setActiveIndex(index)}
                  className={`flex w-full flex-col gap-3 border-l-[1.5px] border-solid pl-5 text-left transition-colors ${
                    isActive
                      ? "border-[#FF7237]"
                      : "border-[#DFDDCE] hover:border-[#DFDDCE]/80"
                  }`}
                >
                  <span
                    className={`text-xl font-medium leading-[1.2] ${
                      isActive ? "text-[#141414]" : "text-[#666661]"
                    }`}
                  >
                    {t(`featuresShowcase.items.${key}.title`)}
                  </span>
                  {isActive ? (
                    <p className="text-md leading-[1.44] text-[#666661]">
                      {t(`featuresShowcase.items.${key}.description`)}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`feature-tab-${FEATURE_KEYS[activeIndex]}`}
            className="relative min-h-[280px] w-full flex-1 overflow-hidden rounded-[14px] lg:min-h-[500px] lg:max-w-[40.625rem]"
            aria-label={t("featuresShowcase.visualAria")}
          >
            {FEATURE_KEYS[activeIndex] === "memberMemory" ? (
              <FeatureVisualMemberMemory />
            ) : FEATURE_KEYS[activeIndex] === "eventIntelligence" ? (
              <FeatureVisualEventIntelligence />
            ) : FEATURE_KEYS[activeIndex] === "reachTheRightPeople" ? (
              <FeatureVisualReachTheRightPeople />
            ) : (
              <FeatureVisualCommunityMemory />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
