import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../translations';

export type Language = 
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' 
  | 'ar' | 'hi' | 'bn' | 'pa' | 'te' | 'mr' | 'ta' | 'ur' | 'gu' | 'kn'
  | 'ml' | 'or' | 'as' | 'tr' | 'vi' | 'th' | 'id' | 'ms' | 'fil' | 'nl'
  | 'pl' | 'uk' | 'ro' | 'el' | 'cs' | 'sv' | 'hu' | 'fi' | 'no' | 'da'
  | 'he' | 'fa' | 'sw' | 'am' | 'ne' | 'si' | 'my' | 'km' | 'lo';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getLanguageName: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  pa: 'ਪੰਜਾਬੀ',
  te: 'తెలుగు',
  mr: 'मराठी',
  ta: 'தமிழ்',
  ur: 'اردو',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  or: 'ଓଡ଼ିଆ',
  as: 'অসমীয়া',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  fil: 'Filipino',
  nl: 'Nederlands',
  pl: 'Polski',
  uk: 'Українська',
  ro: 'Română',
  el: 'Ελληνικά',
  cs: 'Čeština',
  sv: 'Svenska',
  hu: 'Magyar',
  fi: 'Suomi',
  no: 'Norsk',
  da: 'Dansk',
  he: 'עברית',
  fa: 'فارسی',
  sw: 'Kiswahili',
  am: 'አማርኛ',
  ne: 'नेपाली',
  si: 'සිංහල',
  my: 'မြန်မာ',
  km: 'ខ្មែរ',
  lo: 'ລາວ'
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('healthguard-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('healthguard-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    console.log('Setting language to:', lang);
    setLanguageState(lang);
    localStorage.setItem('healthguard-language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const getLanguageName = (): string => {
    return languageNames[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
