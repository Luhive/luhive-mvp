import { useTranslation } from 'react-i18next';
import { Link2Off, Sparkles, BadgeCheck, Globe } from 'lucide-react';

export function LandingAbout() {
  const { t } = useTranslation('landing');

  return (
    <section id="about" className="py-[120px] bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary/10 text-primary py-2 px-4 rounded-[20px] text-sm font-semibold tracking-wide mb-4">
            {t('about.badge')}
          </span>
          <h2 className="text-5xl md:text-[40px] sm:text-[32px] font-extrabold tracking-[-1px] text-foreground mb-4">
            {t('about.title')}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground max-w-[700px] mx-auto mt-4">
            {t('about.description')}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-3 gap-5 mt-16">
          {/* Large Card: The Problem */}
          <div className="col-span-2 bg-white border border-border rounded-[20px] p-10 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30 flex flex-col">
            <div className="mb-5">
              <Link2Off className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 tracking-[-0.5px]">
              {t('about.problem.title')}
            </h3>
            <p
              className="text-base leading-relaxed text-muted-foreground mb-0"
              dangerouslySetInnerHTML={{ __html: t('about.problem.description') }}
            />
            <p className="text-lg font-semibold text-primary mt-4 mb-0">
              {t('about.problem.highlight')}
            </p>
          </div>

          {/* Illustration Card 1 */}
          <div className="col-span-1 bg-white border border-border rounded-[20px] p-0 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div className="w-full h-full flex items-center justify-center min-h-[280px] p-8">
              <img
                src="/landing/problem.png"
                alt="Community Fragmentation Problem"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Medium Card: Our Solution */}
          <div className="col-span-1 bg-white border border-border rounded-[20px] p-10 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30 flex flex-col">
            <div className="mb-5">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 tracking-[-0.5px]">
              {t('about.solution.title')}
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground mb-0">
              {t('about.solution.description')}
            </p>
          </div>

          {/* Illustration Card 2 */}
          <div className="col-span-1 bg-white border border-border rounded-[20px] p-0 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div className="w-full h-full flex items-center justify-center min-h-[280px] p-8">
              <img
                src="/landing/solution.png"
                alt="Luhive Unified Solution"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Medium Card: Who We Serve */}
          <div className="col-span-1 bg-white border border-border rounded-[20px] p-10 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30 flex flex-col">
            <div className="mb-5">
              <BadgeCheck className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 tracking-[-0.5px]">
              {t('about.whoWeServe.title')}
            </h3>
            <p
              className="text-base leading-relaxed text-muted-foreground mb-0"
              dangerouslySetInnerHTML={{ __html: t('about.whoWeServe.description') }}
            />
          </div>

          {/* Illustration Card 3: Vision */}
          <div className="col-span-1 bg-white border border-border rounded-[20px] p-0 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div className="w-full h-full flex items-center justify-center min-h-[280px] p-8">
              <img
                src="/landing/vision.png"
                alt="Luhive Vision"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Large Card: Our Vision */}
          <div className="col-span-2 bg-white border border-border rounded-[20px] p-10 transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30 flex flex-col">
            <div className="mb-5">
              <Globe className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 tracking-[-0.5px]">
              {t('about.vision.title')}
            </h3>
            <p
              className="text-base leading-relaxed text-muted-foreground mb-0"
              dangerouslySetInnerHTML={{ __html: t('about.vision.description') }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

