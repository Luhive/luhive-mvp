import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../../locales/en/landing.json';
import azTranslations from '../../locales/az/landing.json';

const resources = {
  en: {
    landing: enTranslations,
  },
  az: {
    landing: azTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['en', 'az'],
    lng: 'en', // Default language is English
    fallbackLng: 'en',
    defaultNS: 'landing',
    ns: ['landing'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Only check localStorage, don't use navigator
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false, // Prevents hydration issues
    },
  });

export default i18n;
