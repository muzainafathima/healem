
import React, { useState } from 'react';
import type { Page } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';
import { PredictorIcon, RiskIcon, ReportsIcon, DietIcon, ConsultIcon } from '../layout/Icons';

interface DashboardProps {
  navigate: (page: Page, props?: any) => void;
  toggleSidebar: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ navigate, toggleSidebar }) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const features = [
    {
      page: 'predictor' as Page,
      icon: <PredictorIcon />,
      title: t('dashboard.predictor.title'),
      color: 'bg-blue-500 dark:bg-blue-600'
    },
    {
      page: 'reports' as Page,
      icon: <ReportsIcon />,
      title: t('dashboard.reports.title'),
      color: 'bg-green-500 dark:bg-green-600'
    },
    {
      page: 'risk' as Page,
      icon: <RiskIcon />,
      title: t('dashboard.risk.title'),
      color: 'bg-yellow-500 dark:bg-yellow-600'
    },
    {
      page: 'diet' as Page,
      icon: <DietIcon />,
      title: t('dashboard.diet.title'),
      color: 'bg-red-500 dark:bg-red-600'
    },
    {
      page: 'findDoctors' as Page,
      icon: <ConsultIcon />,
      title: t('dashboard.findDoctors.title'),
      color: 'bg-purple-500 dark:bg-purple-600'
    }
  ];

  const handleFeatureClick = (page: Page) => {
    navigate(page);
    setIsExpanded(false);
  };

  // Calculate positions for circular arrangement
  const getCirclePosition = (index: number, total: number) => {
    const angle = (index * 360) / total - 90; // Start from top
    const radius = 140; // Distance from center
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y };
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hamburger menu button - top left */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 lg:top-6 lg:left-6 z-50 p-3 lg:p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 text-white"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Welcome text - only HEAL'EM shows on left when expanded */}
      <div className={`absolute top-8 px-4 z-10 ${
        isExpanded 
          ? 'left-8 right-auto text-left' 
          : 'left-0 right-0 text-center'
      }`} style={{
        transition: 'left 1000ms cubic-bezier(0.4, 0, 0.2, 1), right 1000ms cubic-bezier(0.4, 0, 0.2, 1), text-align 1000ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <h2 className={`text-xl md:text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-1 transition-all duration-1000 ${
          isExpanded ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'
        }`} style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
          Welcome to
        </h2>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white" style={{
          transition: 'all 1000ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          HEAL'EM
        </h2>
        <p className={`mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400 transition-all duration-1000 ${
          isExpanded ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'
        }`} style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}>
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Central interactive area */}
      <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
        {/* Feature circles - appear when expanded */}
        {features.map((feature, index) => {
          const position = getCirclePosition(index, features.length);
          const delay = index * 100;

          return (
            <button
              key={feature.page}
              onClick={() => handleFeatureClick(feature.page)}
              className={`absolute transition-all duration-500 ease-out ${
                isExpanded 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-0 pointer-events-none'
              }`}
              style={{
                transform: isExpanded 
                  ? `translate(${position.x}px, ${position.y}px)` 
                  : 'translate(0, 0)',
                transitionDelay: isExpanded ? `${delay}ms` : '0ms',
              }}
            >
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full ${feature.color} shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center text-white`}>
                <div className="scale-75 md:scale-90">
                  {feature.icon}
                </div>
              </div>
              <p className="mt-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 text-center max-w-[100px]">
                {feature.title}
              </p>
            </button>
          );
        })}

        {/* Main central circle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative z-20 transition-all duration-500 ease-out ${
            isExpanded 
              ? 'w-24 h-24 md:w-28 md:h-28' 
              : 'w-32 h-32 md:w-40 md:h-40'
          }`}
        >
          <div className={`w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 shadow-2xl flex items-center justify-center transform transition-all duration-500 ${
            isExpanded 
              ? 'rotate-180 scale-100' 
              : 'rotate-0 scale-100 hover:scale-110'
          }`}>
            <span className={`text-white font-bold text-lg md:text-2xl transition-transform duration-500 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}>
              {isExpanded ? '×' : 'HOME'}
            </span>
          </div>
          
          {/* Pulsing ring effect when not expanded */}
          {!isExpanded && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 dark:border-blue-400 animate-ping opacity-20"></div>
          )}
        </button>
      </div>

      {/* Bottom hint text */}
      <div className="absolute bottom-8 left-0 right-0 text-center px-4 z-10">
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
          {!isExpanded && '© 2026 HEAL\'EM By IWASC Students'}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
