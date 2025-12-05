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
    <section id="features" className="py-[120px]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary/10 text-primary py-2 px-4 rounded-[20px] text-sm font-semibold tracking-wide mb-4">
            {t('features.badge')}
          </span>
          <h2 className="text-5xl md:text-[40px] sm:text-[32px] font-extrabold tracking-[-1px] text-foreground">
            {t('features.title')}
          </h2>
        </div>

        <div 
          className="grid gap-8"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-10 rounded-2xl border border-border transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary"
              >
                <div className="mb-6 w-16 h-16 bg-white rounded-full flex items-center justify-center border border-border">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
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
