import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '~/components/ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  // Get the base language code (e.g., 'az' from 'az-AZ')
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'az' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 font-semibold"
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4" />
      <span>{currentLang === 'en' ? 'EN' : 'AZ'}</span>
    </Button>
  );
}
