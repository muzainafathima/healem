
import React from 'react';
import type { Page } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../ui/Card';
import { PredictorIcon, RiskIcon, ReportsIcon, DietIcon, ConsultIcon, LocationsIcon } from '../layout/Icons';

interface DashboardProps {
  navigate: (page: Page, props?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ navigate }) => {
  const { t } = useLanguage();
  
  const features = [
    {
      page: 'predictor' as Page,
      icon: <PredictorIcon />,
      title: t('dashboard.predictor.title'),
      description: t('dashboard.predictor.desc'),
      color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
    },
    {
      page: 'risk' as Page,
      icon: <RiskIcon />,
      title: t('dashboard.risk.title'),
      description: t('dashboard.risk.desc'),
      color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300'
    },
    {
      page: 'reports' as Page,
      icon: <ReportsIcon />,
      title: t('dashboard.reports.title'),
      description: t('dashboard.reports.desc'),
      color: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'
    },
    {
      page: 'diet' as Page,
      icon: <DietIcon />,
      title: t('dashboard.diet.title'),
      description: t('dashboard.diet.desc'),
      color: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
    },
    {
      page: 'consult' as Page,
      icon: <ConsultIcon />,
      title: t('dashboard.consult.title'),
      description: t('dashboard.consult.desc'),
      color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
    },
    {
      page: 'locations' as Page,
      icon: <LocationsIcon />,
      title: t('dashboard.locations.title'),
      description: t('dashboard.locations.desc'),
      color: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
    }
  ];
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('dashboard.welcome')}</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <button
            key={feature.page}
            onClick={() => navigate(feature.page)}
            className="text-left transform hover:-translate-y-1 transition-transform duration-200"
          >
            <Card className="h-full flex flex-col">
              <div className="flex items-start">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    {feature.icon}
                  </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">{feature.title}</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400 flex-grow">{feature.description}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
