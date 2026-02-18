export { meta } from "~/modules/landing/model/landing-meta";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "~/shared/lib/i18n";
import { LandingNavbar } from "~/modules/landing/components/landing-navbar";
import { LandingAbout } from "~/modules/landing/components/landing-about";
import { LandingPartners } from "~/modules/landing/components/landing-partners";
import { LandingFeatures } from "~/modules/landing/components/landing-features";
import { LandingPricing } from "~/modules/landing/components/landing-pricing";
import { LandingFAQ } from "~/modules/landing/components/landing-faq";
import { LandingFooter } from "~/modules/landing/components/landing-footer";

export default function LandingPage() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <LandingAbout />
      <LandingPartners />
      <LandingFeatures />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooter />
    </div>
  );
}
