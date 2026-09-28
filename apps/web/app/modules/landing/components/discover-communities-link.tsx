import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { LandingHubPreview } from "~/modules/landing/model/landing-hub-preview";
import { AnalyticsEvents } from "~/shared/lib/analytics";
import { Routes } from "~/shared/lib/routing/routes";

const FALLBACK_AVATARS = [
  "/landing/features/feature-avatar-1.svg",
  "/landing/features/feature-avatar-2.svg",
  "/landing/features/feature-avatar-3.svg",
];

const FAN_CLASS_NAMES = [
  "",
  "[@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-1",
  "[@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-2",
];

const LOGO_SIZE_PX = 24;

type DiscoverCommunitiesLinkProps = {
  hubPreview: LandingHubPreview | null;
};

export function DiscoverCommunitiesLink({ hubPreview }: DiscoverCommunitiesLinkProps) {
  const { t } = useTranslation("landing");
  const logos = hubPreview?.logos ?? [];
  const faces =
    logos.length > 0
      ? logos.map((logo) => logo.logoUrl)
      : FALLBACK_AVATARS;
  const label = hubPreview?.communityCountLabel
    ? t("hero.ctaDiscoverCount", { count: hubPreview.communityCountLabel })
    : t("hero.ctaDiscover");

  return (
    <Link
      to={Routes.hub}
      prefetch="render"
      data-umami-event="hero_hub_clicked"
      onClick={() => AnalyticsEvents.discoverHubClick("Hero")}
      className="group inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/[0.06] py-1 pl-1 pr-1.5 text-sm font-medium text-foreground/70 transition-[color,background-color,border-color,transform] duration-150 ease-out hover:border-primary/30 hover:bg-primary/10 hover:text-foreground active:scale-[0.97]"
    >
      <span className="flex -space-x-2" aria-hidden>
        {faces.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            width={LOGO_SIZE_PX}
            height={LOGO_SIZE_PX}
            className={`size-6 rounded-full bg-white object-cover ring-2 ring-[#F6F4F1] transition-transform duration-200 ease-out ${FAN_CLASS_NAMES[index] ?? ""}`}
          />
        ))}
      </span>
      <span className="inline-flex items-center gap-1.5 transition-transform duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5">
        {label}
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white">
          <ArrowRight aria-hidden className="size-3" />
        </span>
      </span>
    </Link>
  );
}
