import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';

function applyTheme(theme: 'dark' | 'light') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

interface UiStore {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  locale: string;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLocale: (locale: string) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      locale: 'en',
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        applyTheme(next);
      },
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      setLocale: (locale) => {
        set({ locale });
        i18n.changeLanguage(locale);
      },
    }),
    {
      name: 'ts6-ui',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyTheme(state.theme);
        }
        if (state?.locale) {
          i18n.changeLanguage(state.locale);
        }
      },
    },
  ),
);
