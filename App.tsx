import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import DiseasePredictor from './components/predictor/DiseasePredictor';
import RiskAnalysis from './components/risk/RiskAnalysis';
import EReports from './components/reports/EReports';
import DietPlanner from './components/diet/DietPlanner';
import FindDoctors from './components/findDoctors/FindDoctors';
import AppointmentCalendar from './components/calendar/AppointmentCalendar';
import UserProfile from './components/profile/UserProfile';
import Intro from './components/intro/Intro';
import Auth from './components/auth/Auth';
import Spinner from './components/ui/Spinner';
import Chatbot from './components/chat/Chatbot';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import useDarkMode from './hooks/useDarkMode';
import { onAuthChange, signOutUser } from './services/firebaseService';
import type { AppUser, UserProfileData } from './types';
import { initializeApp as initCapacitor } from './utils/capacitor';

export type Page = 'dashboard' | 'predictor' | 'risk' | 'reports' | 'diet' | 'findDoctors' | 'calendar' | 'profile';

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const [isIntro, setIsIntro] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [pageProps, setPageProps] = useState<Record<string, any>>({});
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

  // Initialize Capacitor
  useEffect(() => {
    initCapacitor().catch(console.error);
  }, []);

  // Show intro screen for a short duration
  useEffect(() => {
    const timer = setTimeout(() => setIsIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for Firebase auth state changes and load user profile
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
        // Load user profile from localStorage
        try {
          const savedProfile = localStorage.getItem('userProfile');
          if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
          }
        } catch (error) {
            console.error("Failed to load user profile from localStorage", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleLogout = async () => {
    await signOutUser();
    // The onAuthChange listener will handle setting the user to null.
  };

  const handleNavigate = (page: Page, props: any = {}) => {
    setCurrentPage(page);
    setPageProps({ [page]: props });
  };

  const handleProfileUpdate = (newProfile: UserProfileData) => {
    setUserProfile(newProfile);
    try {
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
    } catch (error) {
        console.error("Failed to save user profile to localStorage", error);
    }
  };

  const renderPage = () => {
    if (!user) return null;
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard navigate={handleNavigate} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />;
      case 'predictor':
        return <DiseasePredictor userProfile={userProfile} navigate={handleNavigate as (page: 'findDoctors', props: { specialty: string }) => void} />;
      case 'risk':
        return <RiskAnalysis userProfile={userProfile} navigate={handleNavigate as (page: 'diet', props: { lifestyleData: Record<string, string> }) => void} />;
      case 'reports':
        return <EReports />;
      case 'diet':
        return <DietPlanner lifestyleData={pageProps.diet?.lifestyleData} />;
      case 'findDoctors':
        return <FindDoctors />;
      case 'calendar':
        return <AppointmentCalendar user={user} />;
      case 'profile':
        return <UserProfile userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />;
      default:
        return <Dashboard navigate={handleNavigate} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />;
    }
  };
  
  const pageTitles: Record<Page, string> = {
    dashboard: t('title.dashboard'),
    predictor: t('title.disease'),
    risk: t('title.risk'),
    reports: t('title.reports'),
    diet: t('title.diet'),
    findDoctors: t('title.findDoctors'),
    calendar: t('title.calendar'),
    profile: t('title.profile')
  };

  if (isIntro) {
    return <Intro />;
  }
  
  if (isInitializing) {
    return <Spinner message={t('common.loading')} fullScreen />;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex text-gray-800 dark:text-gray-200">
      <Sidebar currentPage={currentPage} setCurrentPage={handleNavigate} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        {currentPage !== 'dashboard' && (
          <Header 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
            pageTitle={pageTitles[currentPage]}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            handleLogout={handleLogout}
            navigate={handleNavigate}
            userProfile={userProfile}
          />
        )}
        <main className={`flex-1 ${currentPage !== 'dashboard' ? 'p-4 sm:p-6 lg:p-8' : ''} overflow-y-auto`}>
          {renderPage()}
        </main>
      </div>
      {/* Floating Chatbot - appears on all pages */}
      <Chatbot />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;