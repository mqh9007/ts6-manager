import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en'],
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Resolve the persisted locale after ui.store is ready (avoids circular import)
import('@/stores/ui.store').then(({ useUiStore }) => {
  const locale = useUiStore.getState().locale;
  if (locale && locale !== i18n.language) {
    i18n.changeLanguage(locale);
  }
  // Re-apply language whenever it changes after init
  useUiStore.subscribe((state, prev) => {
    if (state.locale !== prev.locale && state.locale !== i18n.language) {
      i18n.changeLanguage(state.locale);
    }
  });
});

export default i18n;
