import { useTranslation } from 'react-i18next';
import { Mail, Linkedin } from 'lucide-react';

export function LandingContact() {
  const { t } = useTranslation('landing');

  return (
    <section id="contact" className="py-16 md:py-24 lg:py-32 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-12">
          <span className="inline-block bg-primary/10 text-primary py-2 px-4 rounded-full text-sm font-semibold tracking-wide mb-4">
            {t('contact.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {t('contact.title')}
          </h2>
        </div>

        <div className="flex justify-center mt-10 md:mt-12">
          <div className="w-full max-w-xl md:max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-foreground">
              {t('contact.getInTouch')}
            </h3>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground mb-8 md:mb-10">
              {t('contact.description')}
            </p>

            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-start gap-4 md:gap-5 p-4 md:p-6 bg-white rounded-xl border border-border transition-all hover:border-primary hover:shadow-sm">
                <div className="flex items-center justify-center w-11 h-11 md:w-14 md:h-14 bg-transparent border border-border rounded-full flex-shrink-0">
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-foreground mb-1 md:mb-1.5">
                    {t('contact.email.label')}
                  </h4>
                  <a
                    href="mailto:hi@luhive.com"
                    className="text-sm md:text-base text-primary no-underline transition-colors hover:text-primary/80 hover:underline"
                  >
                    {t('contact.email.value')}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 md:gap-5 p-4 md:p-6 bg-white rounded-xl border border-border transition-all hover:border-primary hover:shadow-sm">
                <div className="flex items-center justify-center w-11 h-11 md:w-14 md:h-14 bg-transparent border border-border rounded-full flex-shrink-0">
                  <Linkedin className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-foreground mb-1 md:mb-1.5">
                    {t('contact.linkedin.label')}
                  </h4>
                  <a
                    href="https://linkedin.com/company/luhive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm md:text-base text-primary no-underline transition-colors hover:text-primary/80 hover:underline"
                  >
                    {t('contact.linkedin.value')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
