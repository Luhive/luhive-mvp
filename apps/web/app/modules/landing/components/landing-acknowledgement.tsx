import { Trans } from 'react-i18next';

const paragraphClassName =
  'w-full text-left text-[1.125rem] font-normal leading-[1.65] text-foreground md:text-[1.25rem] md:leading-[1.7] lg:text-[1.5rem] lg:leading-[1.75]';

const strongClassName = 'font-semibold text-foreground';

export function LandingAcknowledgement() {
  return (
    <section className="bg-[#F6F4F1] py-16 md:py-24">
      <div className="mx-auto flex w-[90vw] max-w-[57rem] flex-col gap-10 lg:max-w-[60rem] lg:gap-14">
        <p className={paragraphClassName}>
          <Trans
            i18nKey="acknowledgement.problem"
            components={{ strong: <strong className={strongClassName} /> }}
          />
        </p>

        <p className={`${paragraphClassName} text-pretty`}>
          <img
            src="/landing/LogoLuhive.svg"
            alt=""
            aria-hidden
            className="mr-[0.28em] inline-block h-[1.15cap] w-auto shrink-0 align-[-0.08em]"
          />
          <Trans
            i18nKey="acknowledgement.solution"
            components={{ strong: <strong className={strongClassName} /> }}
          />
        </p>
      </div>
    </section>
  );
}
