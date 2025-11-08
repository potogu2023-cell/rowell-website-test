import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';
import ruTranslation from './locales/ru.json';
import jaTranslation from './locales/ja.json';
import esTranslation from './locales/es.json';
import ptTranslation from './locales/pt.json';
import arTranslation from './locales/ar.json';
import koTranslation from './locales/ko.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
  ru: {
    translation: ruTranslation,
  },
  ja: {
    translation: jaTranslation,
  },
  es: {
    translation: esTranslation,
  },
  pt: {
    translation: ptTranslation,
  },
  ar: {
    translation: arTranslation,
  },
  ko: {
    translation: koTranslation,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'zh', // Fallback language (Chinese)
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Order of language detection - prioritize querystring for testing
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupQuerystring: 'lng',
    },
  });

export default i18n;




// Language configurations
export const languages = [
  { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', dir: 'ltr' },
];

// Get language name by code
export function getLanguageName(code: string): string {
  const lang = languages.find(l => l.code === code);
  return lang ? lang.name : code;
}

// Get language direction (for RTL support)
export function getLanguageDir(code: string): 'ltr' | 'rtl' {
  const lang = languages.find(l => l.code === code);
  return (lang?.dir as 'ltr' | 'rtl') || 'ltr';
}

