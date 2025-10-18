
import React from 'react';
import type { Page } from '../../App';
import Card from '../ui/Card';
import { PredictorIcon, RiskIcon, ReportsIcon, DietIcon, ConsultIcon, LocationsIcon } from '../layout/Icons';

interface DashboardProps {
  navigate: (page: Page, props?: any) => void;
}

const features = [
  {
    page: 'predictor' as Page,
    icon: <PredictorIcon />,
    title: 'Disease Predictor',
    description: 'Enter your symptoms to get AI-powered potential diagnoses and next steps.',
    color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
  },
  {
    page: 'risk' as Page,
    icon: <RiskIcon />,
    title: 'Health Risk Analysis',
    description: 'Answer a few lifestyle questions to understand your long-term health risks.',
    color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300'
  },
  {
    page: 'reports' as Page,
    icon: <ReportsIcon />,
    title: 'E-Reports Analysis',
    description: 'Upload your medical reports for a simplified, AI-driven explanation of the results.',
    color: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300'
  },
  {
    page: 'diet' as Page,
    icon: <DietIcon />,
    title: 'Diet Planner',
    description: 'Get a personalized diet plan based on your health goals and preferences.',
    color: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
  },
  {
    page: 'consult' as Page,
    icon: <ConsultIcon />,
    title: 'E-Consultation',
    description: 'Find and book appointments with specialized doctors near you.',
    color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
  },
  {
    page: 'locations' as Page,
    icon: <LocationsIcon />,
    title: 'Nearby Health Services',
    description: 'Locate hospitals, clinics, and pharmacies on an interactive map.',
    color: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
  }
];

const Dashboard: React.FC<DashboardProps> = ({ navigate }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome to HealthGuard AI</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Your intelligent health companion. Select a feature to get started.</p>
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
