import React from 'react';
import type { Page } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';
import { DashboardIcon, PredictorIcon, RiskIcon, ReportsIcon, DietIcon, ConsultIcon, LocationsIcon, HealthGuardLogo, CalendarIcon, ProfileIcon } from './Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page, props?: any) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setOpen, isCollapsed, toggleCollapse }) => {
    const { t } = useLanguage();
    
    const navItems = [
      { id: 'dashboard', label: t('nav.dashboard'), icon: <DashboardIcon /> },
      { id: 'predictor', label: t('nav.disease'), icon: <PredictorIcon /> },
      { id: 'risk', label: t('nav.risk'), icon: <RiskIcon /> },
      { id: 'reports', label: t('nav.reports'), icon: <ReportsIcon /> },
      { id: 'diet', label: t('nav.diet'), icon: <DietIcon /> },
      { id: 'findDoctors', label: t('nav.findDoctors'), icon: <ConsultIcon /> },
      { id: 'calendar', label: t('nav.calendar'), icon: <CalendarIcon /> },
      { id: 'profile', label: t('nav.profile'), icon: <ProfileIcon /> },
    ];
    
    const handleNavigation = (page: Page) => {
        setCurrentPage(page);
        // Close mobile sidebar after navigation
        setOpen(false);
    };
  
    return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      ></div>
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-64'} flex flex-col overflow-hidden custom-scrollbar`}
      >
        {/* Logo Header */}
        <div className="h-[57px] flex items-center border-b border-gray-200 dark:border-gray-700 shrink-0 overflow-hidden whitespace-nowrap">
          <div className="flex items-center px-4 w-full h-full">
            <HealthGuardLogo />
            <h1 className={`text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300 transition-all duration-300 ${
              isCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'
            }`}>HEAL'EM</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              title={isCollapsed ? item.label : undefined}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.id as Page);
              }}
              className={`flex items-center py-2.5 px-3.5 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden ${
                currentPage === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 dark:border-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={`whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'
              }`}>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Collapse toggle button (desktop only) */}
        <div className="hidden lg:block px-2 py-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:hover:text-blue-400 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap border-gray-200 dark:border-gray-700 ${
            isCollapsed ? 'h-0 opacity-0 border-t-0 p-0' : 'h-[52px] opacity-100 border-t p-4'
        }`}>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">&copy; 2026 HEAL'EM By IWASC Students</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;