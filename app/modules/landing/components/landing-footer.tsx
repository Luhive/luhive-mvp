import { Link } from 'react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';

import { AnalyticsEvents } from '~/shared/lib/analytics';

const LINK_ALI_ALIYEV = 'https://www.linkedin.com/in/alyaliyev/';
const LINK_NILUFAR_SAFARLI = 'https://www.linkedin.com/in/nilufarsafarli/';

const LINK_LINKEDIN_SOCIAL = 'https://www.linkedin.com/company/luhive';

function externalTabProps(href: string) {
  if (!href.startsWith('http')) {
    return {};
  }
  return { target: '_blank' as const, rel: 'noopener noreferrer' as const };
}

function FooterExternalArrowIcon() {
  return (
    <HugeiconsIcon
      icon={ArrowUpRight01Icon}
      size={24}
      color="currentColor"
      strokeWidth={1.5}
      className="shrink-0"
      aria-hidden
    />
  );
}

const footerFounderLinkClassName =
  'inline-flex items-center gap-1.5 text-[0.9375rem] leading-5 font-normal text-foreground underline decoration-foreground underline-offset-[0.2em]';

function FooterFoundersColumn() {
  return (
    <div className="min-w-0">
      <p className="mb-5 text-[0.9em] leading-4 font-semibold text-[#737373]">Meet the Founders</p>
      <ul className="flex flex-col gap-4">
        <li>
          <a
            href={LINK_ALI_ALIYEV}
            {...externalTabProps(LINK_ALI_ALIYEV)}
            className={footerFounderLinkClassName}
          >
            Ali Aliyev
            <FooterExternalArrowIcon />
          </a>
        </li>
        <li>
          <a
            href={LINK_NILUFAR_SAFARLI}
            {...externalTabProps(LINK_NILUFAR_SAFARLI)}
            className={footerFounderLinkClassName}
          >
            Nilufar Safarli
            <FooterExternalArrowIcon />
          </a>
        </li>
      </ul>
    </div>
  );
}

function FooterSocialsColumn() {
  return (
    <div className="shrink-0">
      <p className="mb-5 text-[0.9em] leading-4 font-semibold text-[#737373]">Socials</p>
      <a
        href={LINK_LINKEDIN_SOCIAL}
        target="_blank"
        rel="noopener noreferrer"
        className={footerFounderLinkClassName}
        onClick={() => AnalyticsEvents.socialLinkClick('LinkedIn')}
      >
        LinkedIn
        <FooterExternalArrowIcon />
      </a>
    </div>
  );
}

function FooterLogoWordmark() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src="/landing/LogoLuhive.svg"
        alt=""
        className="h-9 w-9 shrink-0 object-contain"
        width={36}
        height={36}
      />
      <span
        className="text-[1.375rem] font-bold leading-none tracking-tight text-foreground"
        style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
      >
        Luhive
      </span>
    </div>
  );
}

function FooterLegalLinks() {
  return (
    <>
      <Link
        to="/privacy-policy"
        className="text-[0.8125rem] leading-4 font-normal text-[#737373] underline decoration-[#737373] underline-offset-[0.2em]"
      >
        Privacy Policy
      </Link>
      <Link
        to="/terms-of-service"
        className="text-[0.8125rem] leading-4 font-normal text-[#737373] underline decoration-[#737373] underline-offset-[0.2em]"
      >
        Terms of Service
      </Link>
    </>
  );
}

export function LandingFooter() {
  return (
    <footer id="contact" className="bg-[#F6F4F1]">
      <div className="mx-auto w-[90vw] border-t border-[#E5E5E5] 2xl:w-[90rem]">
        <div className="md:hidden pb-12 pt-10">
          <div className="mb-12 flex flex-col gap-[44px]">
            <h2 className="text-[2.125rem] font-extrabold leading-[1.3] tracking-[-0.02em] text-foreground [font-family:var(--font-sans),ui-sans-serif,system-ui,sans-serif]">
              <span className="block">
                Stop Organising.
                <br />
                Start Growing.
              </span>
            </h2>

            <div className="flex w-full items-start justify-start gap-[100px]">
              <FooterFoundersColumn />
              <FooterSocialsColumn />
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <FooterLogoWordmark />
            <nav className="flex flex-wrap items-center justify-end gap-x-10 gap-y-1">
              <FooterLegalLinks />
            </nav>
          </div>
        </div>

        <div className="hidden md:block pb-16 pt-16">
          <div className="mb-40 flex items-start justify-between gap-12 lg:gap-16">
            <h2 className="text-[3.25rem] font-extrabold leading-[1.4] tracking-[-0.02em] text-foreground [font-family:var(--font-sans),ui-sans-serif,system-ui,sans-serif]">
              <span className="block">
                Stop Organising.
                <br />
                Start Growing.
              </span>
            </h2>

            <div className="flex shrink-0 gap-[100px]">
              <FooterFoundersColumn />
              <FooterSocialsColumn />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-12 gap-y-3">
            <FooterLogoWordmark />
            <nav className="flex flex-wrap items-center gap-x-10 gap-y-1">
              <FooterLegalLinks />
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
