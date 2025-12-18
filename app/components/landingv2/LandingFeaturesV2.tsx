import { useTranslation } from 'react-i18next';

import calendarGoogle from '/landing/calendarGoogle.png';
import secondIntegratedApp from '/landing/secondIntegratedApp.png';
import googleDrive from '/landing/GoogleDrive.png';
import forthIntegratedApp from '/landing/ForthIntegratedApp.png';
import AIDiagram from '/landing/AIDiagram.png';
import AIIncrease from '/landing/AIIncrease.png';
import AIDiagramCircle from '/landing/AIDiagramCircle.png';
import excelLogo from '/landing/ExcelLogo.png';
import sixthIntegratedLogo from '/landing/SixthIntegratedLogo.png';
import barChart from '/landing/bar-chart.png';
import sancaqIMG from '/landing/sancaq.png';
import AnnouncementIcon from '/landing/AnnouncementIcon.png';
import stars from '/landing/stars.png';

export function LandingFeaturesV2() {
  const { t } = useTranslation('landing');

  return (
    <section
      id="features"
      className="bg-[#fff6e6] pb-24 pt-20 sm:pb-8 sm:pt-24"
    >
      <div className="mx-auto w-[90vw]">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
            <span>{t('features.badge')}</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('featuresV2.headingLine1')}
            <br />
            <span className="text-foreground">{t('featuresV2.headingLine2')}</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Build in Integrations */}
          <div className="rounded-[28px] bg-[#FF6D230D] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
            <h3 className="mb-1 text-center font-semibold text-foreground sm:text-lg">
              {t('featuresV2.buildIntegrations.title')}
            </h3>
            <p className="mb-6 text-xs text-center text-muted-foreground sm:text-sm">
              {t('featuresV2.buildIntegrations.description')}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center justify-center rounded-2xl  p-3">
                <img
                  src={calendarGoogle}
                  alt="Google Calendar"
                  className="h-17 w-17 object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-2xl  p-3">
                <img
                  src={secondIntegratedApp}
                  alt="Integration app"
                  className="h-17 w-17 object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-2xl  p-3">
                <img
                  src={googleDrive}
                  alt="Google Drive"
                  className="h-17 w-17 object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-2xl  p-3">
                <img
                  src={forthIntegratedApp}
                  alt="Integration app"
                  className="h-17 w-17 object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-2xl  p-3">
                <img
                  src={excelLogo}
                  alt="Excel"
                  className="h-17 w-17 object-contain"
                />
              </div>
              <div className="flex items-center justify-center rounded-2xl  p-3">
                <img
                  src={sixthIntegratedLogo}
                  alt="Integration app"
                  className="h-17 w-17 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Gamification & Badges */}
<div className="rounded-[28px] bg-[#FF6D230D] p-8 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
  <h3 className="mb-2 text-center text-lg font-semibold text-foreground">
    {t('featuresV2.gamification.title')}
  </h3>

  <p className="mx-auto mb-6 max-w-[260px] text-center text-sm text-muted-foreground">
    {t('featuresV2.gamification.description')}
  </p>

  <div className="relative flex flex-col items-center gap-4">
    {/* First Adopter */}
    <div className='relative w-full flex justify-baseline align-baseline'>
        <div className="inline-flex items-center gap-2 rounded-md border border-[#FF7A1A] bg-[#FFF1E4] px-6 py-2.5 text-sm font-medium text-[#FF7A1A] shadow-sm">
          <span className="text-base">♡</span>
          {t('featuresV2.gamification.firstAdopter')}
        </div>
        <div className="pointer-events-none absolute number-box-gamification-card rotate-12 rounded-md border border-[#002199] bg-[#0021991A] px-3 py-3 text-xs font-semibold text-blue-600 shadow-md">
          +3
        </div>
    </div>

    {/* Verified by Luhive */}
    <div className='w-full flex justify-end align-middle'>

    <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500 bg-emerald-50 px-6 py-2.5 text-sm font-medium text-emerald-700 shadow-sm">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-600 text-[10px]">
        ✓
      </span>
      {t('featuresV2.gamification.verifiedByLuhive')}
    </div>
    </div>

    {/* Floating +3 badge */}
    
  </div>
</div>


          {/* AI Powered Analytics */}
<div className="relative overflow-hidden rounded-[28px] bg-[#FF6D230D] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
  <h3 className="mb-1 text-center font-semibold text-foreground sm:text-lg">
    {t('featuresV2.analytics.title')}
  </h3>
  <p className="mb-6 text-xs text-center text-muted-foreground sm:text-sm">
    {t('featuresV2.analytics.description')}
  </p>

  {/* White Analytics Box */}
  <div className="relative -mr-10 ml-14 rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
    <p className="mb-1 text-xs font-semibold text-foreground">
      {t('featuresV2.analytics.membersLabel')}
    </p>

    <p className="mb-4 text-lg font-bold text-foreground">
      {t('featuresV2.analytics.membersCount')} <br />
      <span className="text-xs font-medium text-emerald-600">
        {t('featuresV2.analytics.growthLabel')}
      </span>
    </p>

    <div className="mt-2 flex items-end justify-end">
      <img
        src={barChart}
        alt={t('featuresV2.analytics.barChartAlt')}
        className="md:h-16 h-22 w-auto object-contain"
      />
    </div>
    {/* Top Left */}
  <div className="absolute -top-6 right-6 flex h-12 w-12 items-center justify-center rounded-xl rotate-[-8deg]">
    <img src={AIDiagram} alt="AI Diagram" className="h-12 w-12" />
  </div>

  {/* Top Right */}
  <div className="absolute -top-6 -left-6 flex h-12 w-12 items-center justify-center rounded-xl rotate-[8deg]">
    <img src={AIIncrease} alt="AI Increase" className="h-12 w-12" />
  </div>

  {/* Bottom Left */}
  <div className="absolute -bottom-6 -left-6 flex h-12 w-12 items-center justify-center rounded-xl rotate-[6deg]">
    <img src={AIDiagramCircle} alt="AI Diagram Circle" className="h-12 w-12" />
  </div>
  </div>

  {/* Mini Floating Boxes */}

  
</div>

        </div>

        <div className="mt-6 md:grid gap-6 md:grid-cols-2 flex flex-col-reverse">
          {/* Manage Your Community Quickly */}
<div className="rounded-[28px] bg-[#FF6D230D] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
  <h3 className="mb-2 text-lg text-center font-semibold text-foreground">
    {t('featuresV2.manageCommunity.title')}
  </h3>

  <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
    {t('featuresV2.manageCommunity.description')}
  </p>

  {/* Cards Stack */}
  <div className="relative mx-auto h-[210px] max-w-[300px]">

    {/* Back card 1 */}
    <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[28px] border border-[#FF6D23]/30 bg-white" />

    {/* Back card 2 */}
    <div className="absolute inset-0 -rotate-4 translate-x-2 translate-y-8 rounded-[28px] border border-[#FF6D23]/40 bg-white" />

    {/* Front card */}
    <div className="absolute w-full top-12 -rotate-6 z-10 h-full rounded-[28px] bg-white p-4 border border-[#FF6D23]/40">

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full">
          <img
            src="/landing/star.png"
            alt="Quick Actions"
            className="h-4 w-4"
          />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t('featuresV2.manageCommunity.quickActionsTitle')}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3 rounded-full border border-muted px-4 py-1">
          <img
            src="/landing/QuickActDiagram.png"
            alt="View Analytics"
            className="h-4 w-4"
          />
          <span className="text-muted-foreground text-sm">
            {t('featuresV2.manageCommunity.viewAnalytics')}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-muted px-4 py-1">
          <img
            src="/landing/calendar.png"
            alt="Create Event"
            className="h-4 w-4"
          />
          <span className="text-muted-foreground text-sm">
            {t('featuresV2.manageCommunity.createEvent')}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-muted px-4 py-1">
          <img
            src="/landing/copy.png"
            alt="Copy Public Link"
            className="h-4 w-4"
          />
          <span className="text-muted-foreground text-sm">
            {t('featuresV2.manageCommunity.copyPublicLink')}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>


          {/* Magic Box – pixel-matched, i18n-safe */}
<div className="rounded-[28px] bg-[#FF6D230D] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.03)]">
  {/* Header */}
  <h3 className="mb-1 text-center text-lg font-semibold text-[#1F2937]">
    {t('featuresV2.magicBox.title')}
  </h3>
  <p className="mb-6 w-80 mx-auto text-center text-sm leading-relaxed text-[#6B7280]">
    {t('featuresV2.magicBox.description')}
  </p>

  {/* Inner Card */}
  <div className="rounded-xl w-full md:w-100 bg-white p-4 mx-auto border border-[#FF6D23]/40">
    <p className="mb-4 text-sm leading-relaxed text-[#9CA3AF]">
      {t('featuresV2.magicBox.sampleText')}
    </p>

    {/* Actions */}
    <div className="flex items-center justify-between">
      <div className='flex gap-1 justify-center items-center'>

      <img src={sancaqIMG} alt="Sancaq" className="h-7 w-7" />
      <div className="flex p-1 py-1 rounded-lg bg-[#FFD6B633]">
        <span className="flex items-center gap-1 rounded-full bg-[#FF6D231A] px-3 py-1 text-[12px] font-medium text-[#FF7A1A]">
          <img src={AnnouncementIcon} alt="Announcement" className="h-4 w-4" />
          {t('featuresV2.magicBox.announcement')}
        </span>
        <span className="flex items-center gap-1  px-3 py-1 text-[12px] font-medium text-[#FF7A1A]">
          {/* calendar icon */}
          <img src="/landing/calendar.png" alt="Stars" className="h-4 w-4" />
          {t('featuresV2.magicBox.event')}
        </span>
      </div>
      </div>

      {/* Spark Button */}
      <img src={stars} alt="Stars" className="h-7 w-7" />
    </div>
  </div>
</div>

        </div>
      </div>
    </section>
  );
}


