import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en.json';

type TranslationBundle = Record<string, unknown>;
type TranslationModule = { default: TranslationBundle };

// English is the global fallback and is bundled for the first render. Other locale
// files are fetched only when the visitor chooses or detects that language.
const translationLoaders: Record<string, () => Promise<TranslationModule>> = {
  zh: () => import('./locales/zh.json'),
  ru: () => import('./locales/ru.json'),
  ja: () => import('./locales/ja.json'),
  es: () => import('./locales/es.json'),
  pt: () => import('./locales/pt.json'),
  ar: () => import('./locales/ar.json'),
  ko: () => import('./locales/ko.json'),
};

const pendingLoads = new Map<string, Promise<void>>();

export async function loadLanguageResources(languageCode: string): Promise<void> {
  const code = languageCode.split('-')[0].toLowerCase();
  if (code === 'en' || i18n.hasResourceBundle(code, 'translation')) return;

  const existingLoad = pendingLoads.get(code);
  if (existingLoad) return existingLoad;

  const loader = translationLoaders[code];
  if (!loader) return;

  const loadPromise = loader()
    .then(({ default: translation }) => {
      i18n.addResourceBundle(code, 'translation', translation, true, true);
    })
    .catch((error) => {
      // Keep the English fallback available if a locale chunk cannot be retrieved.
      console.error(`[i18n] Failed to load ${code} resources`, error);
    })
    .finally(() => {
      pendingLoads.delete(code);
    });

  pendingLoads.set(code, loadPromise);
  return loadPromise;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: enTranslation } },
    fallbackLng: 'en',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupQuerystring: 'lng',
    },
  })
  .then(() => loadLanguageResources(i18n.language));

i18n.on('languageChanged', (language) => {
  void loadLanguageResources(language);
});

export default i18n;

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

export function getLanguageName(code: string) {
  const lang = languages.find((language) => language.code === code);
  return lang ? lang.name : code;
}

export function getLanguageDir(code: string): 'ltr' | 'rtl' {
  const lang = languages.find((language) => language.code === code);
  return (lang?.dir as 'ltr' | 'rtl') || 'ltr';
}
