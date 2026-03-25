import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Intro: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 animate-fade-in">
      <div className="flex items-center justify-center">
        <img src="/healem.jpg" alt="HEAL'EM" className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-gray-800" />
      </div>
      <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium tracking-wide">{t('intro.tagline')}</p>
    </div>
  );
};

export default Intro;
