import React, { useState } from 'react';
import { SunIcon, MoonIcon, MenuIcon, LogoutIcon, ProfileIcon } from './Icons';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import VoiceAssistant from '../voice/VoiceAssistant';
import type { Page } from '../../App';
import type { UserProfileData } from '../../types';

interface HeaderProps {
  toggleSidebar: () => void;
  pageTitle: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  navigate: (page: Page) => void;
  userProfile: UserProfileData | null;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, pageTitle, isDarkMode, toggleDarkMode, handleLogout, navigate, userProfile }) => {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <>
    <header className="h-[57px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700/50 px-6 flex justify-between items-center sticky top-0 z-30 shrink-0">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="lg:hidden mr-4 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-xl transition-colors" aria-label="Toggle menu">
          <MenuIcon />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-1.5">
        <LanguageSwitcher />
        <button 
          onClick={() => setIsVoiceOpen(true)} 
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
          aria-label="Voice Assistant"
          title="Voice Assistant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button onClick={toggleDarkMode} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" aria-label="Toggle dark mode">
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        <button onClick={handleLogout} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors" aria-label="Logout">
          <LogoutIcon />
        </button>
        <button
          onClick={() => navigate('profile')}
          className="ml-1 w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-blue-200 dark:ring-blue-700 hover:ring-blue-400 dark:hover:ring-blue-500 transition-all overflow-hidden bg-blue-50 dark:bg-gray-600 text-blue-600 dark:text-blue-300"
          aria-label="Open user profile"
        >
          {userProfile?.photo ? (
            <img src={userProfile.photo} alt="User profile" className="w-full h-full object-cover" />
          ) : (
            <ProfileIcon />
          )}
        </button>
      </div>
    </header>
    <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} navigate={navigate} />
    </>
  );
};

export default Header;