import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  MessageCircle,
  Star,
  ShieldCheck,
  BarChart3,
  Lock,
} from 'lucide-react';

export function LandingFeatures() {
  const { t } = useTranslation('landing');

  const features = [
    {
      icon: CalendarDays,
      title: t('features.unifiedEvents.title'),
      description: t('features.unifiedEvents.description'),
    },
    {
      icon: MessageCircle,
      title: t('features.centralizedComm.title'),
      description: t('features.centralizedComm.description'),
    },
    {
      icon: Star,
      title: t('features.smartFeedback.title'),
      description: t('features.smartFeedback.description'),
    },
    {
      icon: ShieldCheck,
      title: t('features.verified.title'),
      description: t('features.verified.description'),
    },
    {
      icon: BarChart3,
      title: t('features.analytics.title'),
      description: t('features.analytics.description'),
    },
    {
      icon: Lock,
      title: t('features.privacy.title'),
      description: t('features.privacy.description'),
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block bg-primary/10 text-primary py-2 px-4 rounded-full text-sm font-semibold tracking-wide mb-4">
            {t('features.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {t('features.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 md:p-8 lg:p-10 rounded-2xl border border-border transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary"
              >
                <div className="mb-4 md:mb-6 w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center border border-border">
                  <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
