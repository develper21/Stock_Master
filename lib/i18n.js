import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enTranslations from '../locales/en/common.json';
import hiTranslations from '../locales/hi/common.json';
import esTranslations from '../locales/es/common.json';
import frTranslations from '../locales/fr/common.json';
import deTranslations from '../locales/de/common.json';
import zhTranslations from '../locales/zh/common.json';

const resources = {
  en: {
    common: enTranslations,
  },
  hi: {
    common: hiTranslations,
  },
  es: {
    common: esTranslations,
  },
  fr: {
    common: frTranslations,
  },
  de: {
    common: deTranslations,
  },
  zh: {
    common: zhTranslations,
  },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Translation helper functions
export const t = (key, options = {}) => {
  return i18n.t(key, { ...options, ns: 'common' });
};

export const changeLanguage = (lng) => {
  return i18n.changeLanguage(lng);
};

export const getCurrentLanguage = () => {
  return i18n.language;
};

export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
  ];
};

// Format functions with i18n support
export const formatCurrency = (amount, currency = 'USD') => {
  const locale = getCurrentLanguage();
  return new Intl.NumberFormat(locale === 'hi' ? 'en-IN' : locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  const locale = getCurrentLanguage();
  const dateObj = new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString(locale, { ...defaultOptions, ...options });
};

export const formatNumber = (number, options = {}) => {
  const locale = getCurrentLanguage();
  return new Intl.NumberFormat(locale, options).format(number);
};

export const formatRelativeTime = (date) => {
  const locale = getCurrentLanguage();
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return t('time.justNow');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t('time.minutesAgo', { count: diffInMinutes });
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t('time.hoursAgo', { count: diffInHours });
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return t('time.daysAgo', { count: diffInDays });
  }
  
  return formatDate(dateObj);
};

// RTL language detection
export const isRTL = () => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(getCurrentLanguage());
};

// Pluralization helpers
export const pluralize = (count, singular, plural) => {
  if (count === 1) {
    return singular;
  }
  return plural || singular + 's';
};

// Translation namespace management
export const loadNamespace = async (namespace) => {
  if (!i18n.hasResourceBundle(getCurrentLanguage(), namespace)) {
    await i18n.loadResources(getCurrentLanguage(), {
      [namespace]: await import(`../locales/${getCurrentLanguage()}/${namespace}.json`),
    });
  }
};

// Server-side translation helper
export const getServerTranslations = async (locale = 'en', namespaces = ['common']) => {
  const resources = {};
  
  for (const ns of namespaces) {
    try {
      const translations = await import(`../locales/${locale}/${ns}.json`);
      resources[ns] = translations.default;
    } catch (error) {
      console.warn(`Translation file not found: ${locale}/${ns}.json`);
      // Fallback to English
      try {
        const fallbackTranslations = await import(`../locales/en/${ns}.json`);
        resources[ns] = fallbackTranslations.default;
      } catch (fallbackError) {
        console.warn(`Fallback translation file not found: en/${ns}.json`);
        resources[ns] = {};
      }
    }
  }
  
  return {
    resources,
    locale,
    namespaces,
  };
};
