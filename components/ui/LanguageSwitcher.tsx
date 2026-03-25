import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, languageNames, Language } from '../../contexts/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = Object.entries(languageNames) as [Language, string][];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors text-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="hidden sm:inline">{languageNames[language]}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="py-1">
            {languages.map(([code, name]) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                  language === code
                    ? 'bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{name}</span>
                  {language === code && (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
