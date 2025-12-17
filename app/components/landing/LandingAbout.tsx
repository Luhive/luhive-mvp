import { useTranslation } from 'react-i18next';
import { Link2Off, Sparkles, BadgeCheck, Globe } from 'lucide-react';

export function LandingAbout() {
  const { t } = useTranslation('landing');

  return (
    <section id="about" className="py-16 md:py-24 lg:py-32 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block bg-primary/10 text-primary py-2 px-4 rounded-full text-sm font-semibold tracking-wide mb-4">
            {t('about.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            {t('about.title')}
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-xl md:max-w-2xl mx-auto mt-4">
            {t('about.description')}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-12 md:mt-16">
          {/* Large Card: The Problem */}
          <div className="md:col-span-2 bg-white border border-border rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-10 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30 flex flex-col">
            <div className="mb-4 md:mb-5">
              <Link2Off className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">
              {t('about.problem.title')}
            </h3>
            <p
              className="text-sm md:text-base leading-relaxed text-muted-foreground mb-0"
              dangerouslySetInnerHTML={{ __html: t('about.problem.description') }}
            />
            <p className="text-base md:text-lg font-semibold text-primary mt-4 mb-0">
              {t('about.problem.highlight')}
            </p>
          </div>

          {/* Illustration Card 1 */}
          <div className="bg-white border border-border rounded-2xl lg:rounded-3xl p-0 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div className="w-full h-full flex items-center justify-center min-h-48 md:min-h-64 p-6 md:p-8">
              <img
                src="/landing/problem.png"
                alt="Community Fragmentation Problem"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Medium Card: Our Solution */}
          <div className="bg-white border border-border rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-10 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30 flex flex-col">
            <div className="mb-4 md:mb-5">
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">
              {t('about.solution.title')}
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-muted-foreground mb-0">
              {t('about.solution.description')}
            </p>
          </div>

          {/* Illustration Card 2 */}
          <div className="bg-white border border-border rounded-2xl lg:rounded-3xl p-0 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div className="w-full h-full flex items-center justify-center min-h-48 md:min-h-64 p-6 md:p-8">
              <img
                src="/landing/solution.png"
                alt="Luhive Unified Solution"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Medium Card: Who We Serve */}
          <div className="bg-white border border-border rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-10 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30 flex flex-col">
            <div className="mb-4 md:mb-5">
              <BadgeCheck className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">
              {t('about.whoWeServe.title')}
            </h3>
            <p
              className="text-sm md:text-base leading-relaxed text-muted-foreground mb-0"
              dangerouslySetInnerHTML={{ __html: t('about.whoWeServe.description') }}
            />
          </div>

          {/* Illustration Card 3: Vision */}
          <div className="bg-white border border-border rounded-2xl lg:rounded-3xl p-0 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div className="w-full h-full flex items-center justify-center min-h-48 md:min-h-64 p-6 md:p-8">
              <img
                src="/landing/vision.png"
                alt="Luhive Vision"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Large Card: Our Vision */}
          <div className="md:col-span-2 bg-white border border-border rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-10 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30 flex flex-col">
            <div className="mb-4 md:mb-5">
              <Globe className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">
              {t('about.vision.title')}
            </h3>
            <p
              className="text-sm md:text-base leading-relaxed text-muted-foreground mb-0"
              dangerouslySetInnerHTML={{ __html: t('about.vision.description') }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
