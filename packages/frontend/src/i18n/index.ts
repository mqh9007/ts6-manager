import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

/**
 * Detect the UI language from the user's system/browser settings.
 *
 * Only Chinese (`zh`) and English (`en`) are supported. Any Chinese variant
 * (zh-CN, zh-TW, zh-HK, ...) resolves to Chinese; every other language
 * falls back to English.
 */
function detectSystemLanguage(): 'zh' | 'en' {
  if (typeof navigator === 'undefined') return 'en';

  // navigator.languages is the preferred ordered list; fall back to navigator.language.
  const languages =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language || 'en'];

  for (const lang of languages) {
    if (lang && lang.toLowerCase().startsWith('zh')) {
      return 'zh';
    }
  }
  return 'en';
}

const detectedLanguage = detectSystemLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: detectedLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'zh'],
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Keep the <html lang="..."> attribute in sync with the active language.
if (typeof document !== 'undefined') {
  document.documentElement.lang = detectedLanguage;
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;
