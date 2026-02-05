import React from 'react';
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Intro: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 animate-fadeIn">
      <div className="flex items-center">
        <img src="/healem.jpg" alt="HEAL'EM" className="h-32 md:h-40" />
      </div>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t('intro.tagline')}</p>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Intro;
