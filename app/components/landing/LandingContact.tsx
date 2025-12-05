import { useTranslation } from 'react-i18next';
import { Mail, Linkedin } from 'lucide-react';

export function LandingContact() {
  const { t } = useTranslation('landing');

  return (
    <section id="contact" className="py-[120px] bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary/10 text-primary py-2 px-4 rounded-[20px] text-sm font-semibold tracking-wide mb-4">
            {t('contact.badge')}
          </span>
          <h2 className="text-5xl md:text-[40px] sm:text-[32px] font-extrabold tracking-[-1px] text-foreground">
            {t('contact.title')}
          </h2>
        </div>

        <div className="flex justify-center mt-12">
          <div className="w-full max-w-[700px]">
            <h3 className="text-[28px] font-bold mb-4 text-foreground">
              {t('contact.getInTouch')}
            </h3>
            <p className="text-lg leading-relaxed text-muted-foreground mb-10">
              {t('contact.description')}
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-5 p-6 bg-white rounded-xl border border-border transition-all hover:border-primary hover:shadow-sm">
                <div className="flex items-center justify-center w-[52px] h-[52px] bg-transparent border border-border rounded-full flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-foreground mb-1.5">
                    {t('contact.email.label')}
                  </h4>
                  <a
                    href="mailto:hi@luhive.com"
                    className="text-[15px] text-primary no-underline transition-colors hover:text-primary/80 hover:underline"
                  >
                    {t('contact.email.value')}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 bg-white rounded-xl border border-border transition-all hover:border-primary hover:shadow-sm">
                <div className="flex items-center justify-center w-[52px] h-[52px] bg-transparent border border-border rounded-full flex-shrink-0">
                  <Linkedin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-foreground mb-1.5">
                    {t('contact.linkedin.label')}
                  </h4>
                  <a
                    href="https://linkedin.com/company/luhive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] text-primary no-underline transition-colors hover:text-primary/80 hover:underline"
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

