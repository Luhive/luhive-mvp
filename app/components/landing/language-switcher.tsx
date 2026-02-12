import { useTranslation } from 'react-i18next';
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
      className="flex items-center gap-2 font-semibold hover:bg-transparent hover:text-black"
      aria-label="Switch language"
    >
      <img src="/landing/change-language.svg" alt="Language Change Icon" className="h-5 w-5" />
      <span className="text-sm font-semibold">{currentLang === 'en' ? 'EN' : 'AZ'}</span>
    </Button>
  );
}
