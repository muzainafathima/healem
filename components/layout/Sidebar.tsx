import React from 'react';
import type { Page } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';
import { DashboardIcon, PredictorIcon, RiskIcon, ReportsIcon, DietIcon, ConsultIcon, LocationsIcon, HealthGuardLogo, CalendarIcon, ProfileIcon } from './Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page, props?: any) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setOpen }) => {
    const { t } = useLanguage();
    
    const navItems = [
      { id: 'dashboard', label: t('nav.dashboard'), icon: <DashboardIcon /> },
      { id: 'predictor', label: t('nav.disease'), icon: <PredictorIcon /> },
      { id: 'risk', label: t('nav.risk'), icon: <RiskIcon /> },
      { id: 'reports', label: t('nav.reports'), icon: <ReportsIcon /> },
      { id: 'diet', label: t('nav.diet'), icon: <DietIcon /> },
      { id: 'consult', label: t('nav.consult'), icon: <ConsultIcon /> },
      { id: 'locations', label: t('nav.locations'), icon: <LocationsIcon /> },
      { id: 'calendar', label: t('nav.calendar'), icon: <CalendarIcon /> },
      { id: 'profile', label: t('nav.profile'), icon: <ProfileIcon /> },
    ];
    
    const handleNavigation = (page: Page) => {
        setCurrentPage(page);
        if (window.innerWidth < 1024) { // Close sidebar on mobile after navigation
            setOpen(false);
        }
    };
  
    return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      ></div>
      <aside
        className={`fixed lg:relative top-0 left-0 h-full bg-white dark:bg-gray-800 w-108 shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:flex lg:flex-shrink-0 flex-col`}
      >
        <div className="p-6 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <HealthGuardLogo />
          <h1 className="text-2xl font-bold ml-3 text-gray-800 dark:text-white">HealthGuard AI</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.id as Page);
              }}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">&copy; 2025 HealthGuard AI By IWASC Students</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;