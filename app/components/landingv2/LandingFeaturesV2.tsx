import { useTranslation } from 'react-i18next';

export function LandingFeaturesV2() {
  const { t } = useTranslation('landing');

  return (
    <section
      id="features"
      className="bg-[#F6F4F1] py-15"
    >
      <div className="mx-auto w-[90vw] 2xl:w-[90rem]">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-[0.875rem] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
            <span className='text-[1rem]'>{t('features.badge')}</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground leading-[3rem] lg:text-[3rem]">
            {t('featuresV2.headingLine1')}
            <br />
            <span className="text-foreground">{t('featuresV2.headingLine2')}</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Build in Integrations */}
          <div className="rounded-[28px] bg-[#FF6D230D] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
            <h3 className="mb-1 text-center font-semibold text-foreground text-[1.25rem] md:text-[1.75rem]">
              {t('featuresV2.buildIntegrations.title')}
            </h3>
            <p className="mb-6 text-[0.875rem] md:text-[1.125rem] text-center font-normal max-w-3/5 mx-auto text-muted-foreground">
              {t('featuresV2.buildIntegrations.description')}
            </p>

            <div className="grid grid-cols-3 mx-auto max-w-[100%] md:max-w-[90%] lg:max-w-[80%] gap-4 justify-items-center">
              <div className="flex items-center justify-center rounded-[0.75rem] md:rounded-[1rem] border-[0.03125rem] border-[rgba(255,109,35,0.1)] border-solid shadow-[0_0_0.25rem_0_rgba(255,109,35,0.30)] p-[0.625rem] size-[4.2rem] md:size-[4.5rem]">
                <img
                  src="/landing/calendarGoogle.svg"
                  alt="Google Calendar"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-[0.75rem] md:rounded-[1rem] border-[0.03125rem] border-[rgba(255,109,35,0.1)] border-solid shadow-[0_0_0.25rem_0_rgba(255,109,35,0.30)] p-[0.625rem] size-[4.2rem] md:size-[4.5rem]">
                <img
                  src="/landing/microsoftForm.svg"
                  alt="Integration app"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-[0.75rem] md:rounded-[1rem] border-[0.03125rem] border-[rgba(255,109,35,0.1)] border-solid shadow-[0_0_0.25rem_0_rgba(255,109,35,0.30)] p-[0.625rem] size-[4.2rem] md:size-[4.5rem]">
                <img
                  src="/landing/GoogleDrive.svg"
                  alt="Google Drive"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-[0.75rem] md:rounded-[1rem] border-[0.03125rem] border-[rgba(255,109,35,0.1)] border-solid shadow-[0_0_0.25rem_0_rgba(255,109,35,0.30)] p-[0.625rem] size-[4.2rem] md:size-[4.5rem]">
                <img
                  src="/landing/airtable.svg"
                  alt="Integration app"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-[0.75rem] md:rounded-[1rem] border-[0.03125rem] border-[rgba(255,109,35,0.1)] border-solid shadow-[0_0_0.25rem_0_rgba(255,109,35,0.30)] p-[0.625rem] size-[4.2rem] md:size-[4.5rem]">
                <img
                  src="/landing/microsoftExcel.svg"
                  alt="Excel"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-[0.75rem] md:rounded-[1rem] border-[0.03125rem] border-[rgba(255,109,35,0.1)] border-solid shadow-[0_0_0.25rem_0_rgba(255,109,35,0.30)] p-[0.625rem] size-[4.2rem] md:size-[4.5rem]">
                <img
                  src="/landing/googleForm.svg"
                  alt="Integration app"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Gamification & Badges */}
          <div className="rounded-[28px] bg-[#FF6D230D] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
            <h3 className="mb-2 text-center text-[1.25rem] md:text-[1.75rem] font-semibold text-foreground">
              {t('featuresV2.gamification.title')}
            </h3>

            <p className="mx-auto mb-6 text-center md:max-w-[10rem] md:max-w-[16rem] mx-autotext-[0.875rem] md:text-[1.125rem] text-muted-foreground">
              {t('featuresV2.gamification.description')}
            </p>

            <div className="relative mx-auto w-full max-w-[14rem] md:max-w-[19rem] flex flex-col items-center gap-3 md:gap-4">
              {/* First Adopter */}
              <div className="relative w-full flex justify-start">
                <div className="inline-flex items-center justify-center gap-[0.3rem] md:gap-[0.4rem] rounded-[0.625rem] md:rounded-[0.75rem] border-[0.09375rem] border-[#ff8040] bg-[#ffebe2] px-[0.875rem] md:px-[1.5rem] py-[0.5rem] md:py-[0.875rem] font-medium text-[#ff8040] text-[0.8rem] md:text-[0.875rem] md:text-[1.125rem] leading-[1.2] shadow-[0px_0.125rem_0.4375rem_0px_rgba(255,128,64,0.24)]">
                  <img src="/landing/landing-heart.svg" alt="Heart" className="size-[0.875rem] md:size-[1.125rem]" />
                  {t('featuresV2.gamification.firstAdopter')}
                </div>
                {/* Floating +3 badge */}
                <div className="pointer-events-none absolute -top-1 right-10 rotate-[25deg] flex items-center justify-center rounded-[0.35rem] md:rounded-[0.5rem] border-[0.09375rem] border-[#002199] bg-[rgba(0,33,153,0.1)] size-[1.75rem] md:size-[2.25rem] font-medium text-[#002199] text-[0.7rem] md:text-[1rem] shadow-[0px_0.0625rem_0.1875rem_0px_rgba(0,33,153,0.24)]">
                  +3
                </div>
              </div>

              {/* Verified by Luhive */}
              <div className="w-full flex justify-end">
                <div className="inline-flex items-center justify-center gap-[0.3rem] md:gap-[0.4rem] rounded-[0.625rem] md:rounded-[0.75rem] border-[0.09375rem] border-[#009966] bg-[#e6eee6] px-[0.875rem] md:px-[1.5rem] py-[0.5rem] md:py-[0.875rem] font-medium text-[#009966] text-[0.8rem] md:text-[0.875rem] md:text-[1.125rem] leading-[1.2] shadow-[0px_0.125rem_0.4375rem_0px_rgba(0,153,102,0.24)]">
                  <img src="/landing/tick-landing.svg" alt="Verified" className="size-[0.875rem] md:size-[1.125rem]" />
                  {t('featuresV2.gamification.verifiedByLuhive')}
                </div>
              </div>
            </div>
          </div>


          {/* AI Powered Analytics */}
          <div className="relative overflow-hidden rounded-[28px] bg-[#FF6D230D] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
            <h3 className="mb-1 text-center font-semibold text-foreground text-[1.25rem] md:text-[1.75rem]">
              {t('featuresV2.analytics.title')}
            </h3>
            <p className="mb-6 text-[0.875rem] md:text-[1.125rem] text-center text-muted-foreground">
              {t('featuresV2.analytics.description')}
            </p>

            {/* White Analytics Box */}
            <div className="relative -mr-10 ml-14 rounded-3xl bg-white p-4 shadow-[0_0.375rem_1.75rem_0_rgba(255,128,64,0.2)]">
              <p className="mb-1 text-xs font-semibold text-foreground">
                {t('featuresV2.analytics.membersLabel')}
              </p>

              <p className="mb-4 text-lg font-bold text-foreground">
                {t('featuresV2.analytics.membersCount')} <br />
                <span className="text-xs font-medium text-emerald-600">
                  {t('featuresV2.analytics.growthLabel')}
                </span>
              </p>

              <div className="mt-2 flex-1 shrink-0 basis-0 flex items-end justify-end">
                <img
                  src="/landing/bar-chart.png"
                  alt={t('featuresV2.analytics.barChartAlt')}
                  className="h-22 w-auto object-contain"
                />
              </div>
              {/* Top Left */}
              <div className="absolute -top-6 right-6 flex h-12 w-12 items-center justify-center rounded-xl rotate-[-8deg]">
                <img src="/landing/AIDiagram.png" alt="AI Diagram" className="h-12 w-12" />
              </div>

              {/* Top Right */}
              <div className="absolute -top-6 -left-6 flex h-12 w-12 items-center justify-center rounded-xl rotate-[8deg]">
                <img src="/landing/AIIncrease.png" alt="AI Increase" className="h-12 w-12" />
              </div>

              {/* Bottom Left */}
              <div className="absolute -bottom-6 -left-6 flex h-12 w-12 items-center justify-center rounded-xl rotate-[6deg]">
                <img src="/landing/AIDiagramCircle.png" alt="AI Diagram Circle" className="h-12 w-12" />
              </div>
            </div>

            {/* Mini Floating Boxes */}


          </div>

        </div>

        <div className="mt-6 md:grid gap-6 md:grid-cols-2 flex flex-col-reverse">
          {/* Manage Your Community Quickly */}
          <div className="rounded-[28px] bg-[#FF6D230D] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
            <h3 className="mb-2 text-[1.25rem] md:text-[1.75rem] text-center font-semibold text-foreground">
              {t('featuresV2.manageCommunity.title')}
            </h3>

            <p className="mb-8 text-center max-w-[30rem] mx-auto w-full text-[0.875rem] md:text-[1.125rem] text-muted-foreground">
              {t('featuresV2.manageCommunity.description')}
            </p>

            {/* Cards Stack */}
            <div className="relative mx-auto h-[17rem] px-[1.5625rem] py-[0.0625rem] max-w-[22.5625rem] shadow-[0_2px_7px_0_rgba(255,109,35,0.24)]">

              {/* Back card 1 */}
              <div className="absolute inset-0 translate-x-0 translate-y-0 rounded-md border border-[#FF6D23]/30 bg-white shadow-[0_2px_7px_0_rgba(255,109,35,0.24)]" />

              {/* Back card 2 */}
              <div className="absolute inset-0 -rotate-3 -translate-x-2 translate-y-5 rounded-md border border-[#FF6D23]/40 bg-white shadow-[0_2px_7px_0_rgba(255,109,35,0.24)]" />

              {/* Front card */}
              <div className="absolute w-full right-4 top-10 -rotate-6 z-10 h-full rounded-md bg-white p-4 border border-[#FF6D23]/40 shadow-[0_2px_7px_0_rgba(255,109,35,0.24)]">

                {/* Header */}
                <div className="mb-4 flex items-center gap-[0.5rem]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full">
                    <img
                      src="/landing/star.svg"
                      alt="Quick Actions"
                      className="h-[1.25rem] w-[1.25rem]"
                    />
                  </div>
                  <p className="text-[0.875rem] md:text-[1.125rem] font-semibold text-foreground">
                    {t('featuresV2.manageCommunity.quickActionsTitle')}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 rounded-full border border-muted px-[1.4375rem] py-[1.0625rem] h-[2.875rem]">
                    <img
                      src="/landing/QuickActDiagram.svg"
                      alt="View Analytics"
                      className="h-[1.25rem] w-[1.25rem]"
                    />
                    <span className="text-muted-foreground text-[0.875rem">
                      {t('featuresV2.manageCommunity.viewAnalytics')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-full border border-muted px-[1.4375rem] py-[1.0625rem] h-[2.875rem]">
                    <img
                      src="/landing/calendar.svg"
                      alt="Create Event"
                      className="h-[1.25rem] w-[1.25rem]"
                    />
                    <span className="text-muted-foreground text-[0.875rem">
                      {t('featuresV2.manageCommunity.createEvent')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-full border border-muted px-[1.4375rem] py-[1.0625rem] h-[2.875rem]">
                    <img
                      src="/landing/copy.svg"
                      alt="Copy Public Link"
                      className="h-[1.25rem] w-[1.25rem]"
                    />
                    <span className="text-muted-foreground text-[0.875rem]">
                      {t('featuresV2.manageCommunity.copyPublicLink')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Magic Box – pixel-matched, i18n-safe */}
          <div className="rounded-[28px] bg-[#FF6D230D] p-4 md:p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Header */}
            <h3 className="mb-1 text-center text-[1rem] md:text-[1.25rem] md:text-[1.75rem] font-semibold text-[#1F2937]">
              {t('featuresV2.magicBox.title')}
            </h3>
            <p className="mb-4 max-w-[14rem] md:max-w-[20rem] md:mb-6 md:w-80 mx-auto text-center text-xs md:text-[0.875rem] md:text-[1.125rem] leading-relaxed text-[#6B7280]">
              {t('featuresV2.magicBox.description')}
            </p>

            {/* Inner Card */}
            <div className="bg-white p-6 md:p-7 gap-[2.5rem] w-[calc(100%+2rem)] ml-10 md:ml-0 md:w-full lg:max-w-[31rem] lg:mx-auto md:mb-0 md:mt-14 rounded-[2.14rem] border-0 md:border border-[#FF6D23]/40 shadow-[0_0.375rem_1.75rem_0_rgba(255,128,64,0.2)]">
              <p className="mb-3 md:mb-4 text-sm md:text-base leading-relaxed text-[#666661]">
                {t('featuresV2.magicBox.sampleText')}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className='flex gap-1 justify-center items-center'>

                  <img src="/landing/sancaq.svg" alt="Sancaq" className="size-7 md:size-9" />
                  <div className="flex px-1 py-1 rounded-[2.37rem] bg-[#FFD6B633]">
                    <span className="flex items-center gap-1 rounded-[2.37rem] bg-[#FF6D231A] px-2 md:px-3 py-2 md:py-2 text-xs md:text-sm font-medium text-[#FF7A1A]">
                      <img src="/landing/AnnouncementIcon.svg" alt="Announcement" className="size-3 md:size-4" />
                      {t('featuresV2.magicBox.announcement')}
                    </span>
                    <span className="flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-[#FF7A1A]">
                      {/* calendar icon */}
                      <img src="/landing/event-landing-straight.svg" alt="Event" className="size-3 md:size-4" />
                      {t('featuresV2.magicBox.event')}
                    </span>
                  </div>
                </div>

                {/* Spark Button */}
                <img src="/landing/stars.svg" alt="Stars" className="size-6 md:size-9" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}


