import React, { useState } from 'react';
import { ScreenType, PlantItem, DiseaseItem, CareTask, PlantNotification } from './types';
import { samplePlants, sampleDiseases, initialCareTasks, initialNotifications, sampleProfile } from './data/plantData';
import { TopAppBar, BottomNavBar, DesktopSidebar } from './components/Navigation';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreens } from './components/OnboardingScreens';
import { AuthScreens } from './components/AuthScreens';
import { HomeDashboard } from './components/HomeDashboard';
import { CategoryList } from './components/CategoryList';
import { PlantDetail } from './components/PlantDetail';
import { ScanCamera } from './components/ScanCamera';
import { DiagnosisDetail } from './components/DiagnosisDetail';
import { ProfileScreen } from './components/ProfileScreen';
import { CareScheduleModal } from './components/CareScheduleModal';
import { NotificationModal } from './components/NotificationModal';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedPlant, setSelectedPlant] = useState<PlantItem>(samplePlants[0]);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseItem>(sampleDiseases.chlorosis);
  const [favorites, setFavorites] = useState<string[]>(['1', '2', '4']);
  const [careTasks, setCareTasks] = useState<CareTask[]>(initialCareTasks);
  const [notifications, setNotifications] = useState<PlantNotification[]>(initialNotifications);
  const [showCareModal, setShowCareModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [userProfile, setUserProfile] = useState(sampleProfile);

  // Screen History / Back navigation
  const [history, setHistory] = useState<ScreenType[]>(['home']);

  const navigateTo = (screen: ScreenType) => {
    setHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevScreen = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentScreen(prevScreen);
    } else {
      setCurrentScreen('home');
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleTask = (id: string) => {
    setCareTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (
    plantName: string,
    taskType: 'Water' | 'Fertilize' | 'Prune' | 'Mist'
  ) => {
    const newTask: CareTask = {
      id: Date.now().toString(),
      plantName,
      taskType,
      dueDate: 'Today',
      completed: false,
    };
    setCareTasks((prev) => [newTask, ...prev]);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // Render full screen standalone experiences without outer shells
  if (currentScreen === 'splash') {
    return (
      <SplashScreen
        onGetStarted={() => navigateTo('onboarding_1')}
        onLogin={() => navigateTo('login')}
      />
    );
  }

  if (currentScreen === 'onboarding_1') {
    return (
      <OnboardingScreens
        step={1}
        onNext={() => navigateTo('onboarding_2')}
        onSkip={() => navigateTo('home')}
        onSignUp={() => navigateTo('signup')}
        onLogin={() => navigateTo('login')}
      />
    );
  }

  if (currentScreen === 'onboarding_2') {
    return (
      <OnboardingScreens
        step={2}
        onNext={() => navigateTo('onboarding_3')}
        onSkip={() => navigateTo('home')}
        onSignUp={() => navigateTo('signup')}
        onLogin={() => navigateTo('login')}
      />
    );
  }

  if (currentScreen === 'onboarding_3') {
    return (
      <OnboardingScreens
        step={3}
        onNext={() => navigateTo('signup')}
        onSkip={() => navigateTo('home')}
        onSignUp={() => navigateTo('signup')}
        onLogin={() => navigateTo('login')}
      />
    );
  }

  if (currentScreen === 'login' || currentScreen === 'signup') {
    return (
      <AuthScreens
        mode={currentScreen === 'login' ? 'login' : 'signup'}
        onSwitchMode={(mode) => navigateTo(mode)}
        onSuccessAuth={() => navigateTo('home')}
        onBack={() => navigateTo('home')}
      />
    );
  }

  if (currentScreen === 'scan') {
    return (
      <ScanCamera
        setScreen={navigateTo}
        onDiagnose={(disease) => {
          setSelectedDisease(disease);
          navigateTo('diagnosis');
        }}
      />
    );
  }

  // Regular In-App Layout for Home, Category, Details, Profile, Diagnosis
  const isDetailView = currentScreen === 'plant_detail' || currentScreen === 'diagnosis';
  const getHeaderTitle = () => {
    switch (currentScreen) {
      case 'home':
        return 'FloraVeda';
      case 'category_flowers':
        return 'Flowers';
      case 'plant_detail':
        return selectedPlant.name;
      case 'diagnosis':
        return selectedDisease.name;
      case 'profile':
        return 'My Profile';
      default:
        return 'FloraVeda';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf7] text-[#191c1b] flex flex-col md:flex-row antialiased selection:bg-[#cdecae] selection:text-[#0d2000]">
      {/* Desktop Sidebar Navigation */}
      <DesktopSidebar
        currentScreen={currentScreen}
        setScreen={navigateTo}
        unreadCount={unreadNotifsCount}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <TopAppBar
          title={getHeaderTitle()}
          showBack={isDetailView || currentScreen === 'category_flowers'}
          onBack={handleBack}
          onOpenNotifications={() => setShowNotifModal(true)}
          unreadCount={unreadNotifsCount}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 px-4 md:px-8 max-w-7xl w-full mx-auto">
          {currentScreen === 'home' && (
            <HomeDashboard
              setScreen={navigateTo}
              onSelectDisease={(disease) => {
                setSelectedDisease(disease);
                navigateTo('diagnosis');
              }}
            />
          )}

          {currentScreen === 'category_flowers' && (
            <CategoryList
              setScreen={navigateTo}
              onSelectPlant={(plant) => {
                setSelectedPlant(plant);
                navigateTo('plant_detail');
              }}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {currentScreen === 'plant_detail' && (
            <PlantDetail
              plant={selectedPlant}
              isFavorite={favorites.includes(selectedPlant.id)}
              onToggleFavorite={toggleFavorite}
              onAddToSchedule={handleAddTask}
              onBack={handleBack}
            />
          )}

          {currentScreen === 'diagnosis' && (
            <DiagnosisDetail
              disease={selectedDisease}
              onAddToSchedule={handleAddTask}
              onBack={handleBack}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              profile={userProfile}
              favoritesCount={favorites.length}
              unreadNotifsCount={unreadNotifsCount}
              onOpenNotifications={() => setShowNotifModal(true)}
              onOpenCareSchedule={() => setShowCareModal(true)}
              onLogout={() => navigateTo('splash')}
              setScreen={navigateTo}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        currentScreen={currentScreen}
        setScreen={navigateTo}
        unreadCount={unreadNotifsCount}
      />

      {/* Care Schedule Modal */}
      {showCareModal && (
        <CareScheduleModal
          tasks={careTasks}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onClose={() => setShowCareModal(false)}
        />
      )}

      {/* Notifications Modal */}
      {showNotifModal && (
        <NotificationModal
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearNotifications}
          onClose={() => setShowNotifModal(false)}
        />
      )}
    </div>
  );
};

export default App;
