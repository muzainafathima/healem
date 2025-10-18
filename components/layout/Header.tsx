import React from 'react';
import { SunIcon, MoonIcon, MenuIcon, LogoutIcon, ProfileIcon } from './Icons';
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
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="lg:hidden mr-4 text-gray-600 dark:text-gray-300">
          <MenuIcon />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
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
  );
};

export default Header;