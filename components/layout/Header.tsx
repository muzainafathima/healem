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
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="lg:hidden mr-4 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors" aria-label="Toggle menu">
          <MenuIcon />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <button 
          onClick={() => setIsVoiceOpen(true)} 
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
          aria-label="Voice Assistant"
          title="Voice Assistant"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Toggle dark mode">
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        <button onClick={handleLogout} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Logout">
          <LogoutIcon />
        </button>
        <button
          onClick={() => navigate('profile')}
          className="ml-2 w-9 h-9 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors overflow-hidden"
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