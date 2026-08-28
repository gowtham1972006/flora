import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScreenType, PlantItem, DiseaseItem, CareTask } from './types';
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

// Backend hooks & services
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { fetchCareTasks, addCareTask, toggleCareTask } from './lib/careTasks';
import { fetchFavoriteIds, toggleFavorite } from './lib/plants';

// Fallback static data (used while loading or when unauthenticated)
import { samplePlants, sampleDiseases } from './data/plantData';

export const App: React.FC = () => {
  // ── Auth state (Supabase session) ────────────────────────────────────────────
  const { user, profile, loading: authLoading, error: authError, login, register, loginWithGoogle, logout, clearError, refreshProfile } = useAuth();

  // ── Screen / navigation ──────────────────────────────────────────────────────
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [history, setHistory] = useState<ScreenType[]>(['splash']);
  const justLoggedOutRef = useRef(false);

  // ── Selected items ────────────────────────────────────────────────────────────
  const [selectedPlant, setSelectedPlant] = useState<PlantItem>(samplePlants[0]);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseItem>(sampleDiseases.chlorosis);

  // ── Local care task state (synced from Supabase) ──────────────────────────────
  const [careTasks, setCareTasks] = useState<CareTask[]>([]);
  const [careTasksLoading, setCareTasksLoading] = useState(false);

  // ── Favorites (IDs from Supabase, fallback to empty) ─────────────────────────
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // ── Modal visibility ──────────────────────────────────────────────────────────
  const [showCareModal, setShowCareModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // ── Notifications (real-time via Supabase) ────────────────────────────────────
  const { notifications, unreadCount, markAll, clearAll } = useNotifications(user?.id ?? null);

  // ── Load user data when authenticated ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Load care tasks
    setCareTasksLoading(true);
    fetchCareTasks(user.id)
      .then(setCareTasks)
      .catch(console.error)
      .finally(() => setCareTasksLoading(false));

    // Load favorites
    fetchFavoriteIds(user.id)
      .then(setFavoriteIds)
      .catch(console.error);
  }, [user]);

  // ── Navigate when auth state changes ─────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !justLoggedOutRef.current) {
      if (user && (currentScreen === 'login' || currentScreen === 'signup' || currentScreen === 'splash')) {
        navigateTo('home');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // ── Navigation helpers ────────────────────────────────────────────────────────
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

  // ── Favorites ─────────────────────────────────────────────────────────────────
  const handleToggleFavorite = useCallback(async (plantId: string) => {
    if (!user) {
      // Unauthenticated: in-memory only
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(plantId)) next.delete(plantId); else next.add(plantId);
        return next;
      });
      return;
    }

    const isFav = favoriteIds.has(plantId);
    // Optimistic
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(plantId); else next.add(plantId);
      return next;
    });
    try {
      await toggleFavorite(user.id, plantId, isFav);
      refreshProfile();
    } catch (err) {
      // Revert
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(plantId); else next.delete(plantId);
        return next;
      });
      console.error('Failed to toggle favorite:', err);
    }
  }, [user, favoriteIds, refreshProfile]);

  // ── Care Tasks ────────────────────────────────────────────────────────────────
  const handleToggleTask = useCallback(async (id: string) => {
    const task = careTasks.find((t) => t.id === id);
    if (!task) return;

    // Optimistic
    setCareTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

    if (user) {
      try {
        await toggleCareTask(id, !task.completed);
      } catch (err) {
        // Revert
        setCareTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t)));
        console.error('Failed to toggle task:', err);
      }
    }
  }, [careTasks, user]);

  const handleAddTask = useCallback(async (
    plantName: string,
    taskType: 'Water' | 'Fertilize' | 'Prune' | 'Mist'
  ) => {
    if (user) {
      try {
        const newTask = await addCareTask(user.id, plantName, taskType, 0);
        setCareTasks((prev) => [newTask, ...prev]);
      } catch (err) {
        console.error('Failed to add task:', err);
      }
    } else {
      // Unauthenticated fallback
      const newTask: CareTask = {
        id: Date.now().toString(),
        plantName,
        taskType,
        dueDate: 'Today',
        completed: false,
      };
      setCareTasks((prev) => [newTask, ...prev]);
    }
  }, [user]);

  // ── Auth actions ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    justLoggedOutRef.current = true;
    await logout();
    setFavoriteIds(new Set());
    setCareTasks([]);
    // Hard-reset the nav stack to splash
    setHistory(['splash']);
    setCurrentScreen('splash');
    // Release the guard after navigation settles
    setTimeout(() => { justLoggedOutRef.current = false; }, 800);
  };

  // ── Derived values ────────────────────────────────────────────────────────────
  const favoritesArray = Array.from(favoriteIds);

  // ── Render: Auth loading splash ───────────────────────────────────────────────
  // Show the splash screen immediately. The tiny spinner overlay resolves in <1s.
  if (currentScreen === 'splash') {
    return (
      <>
        <SplashScreen
          onGetStarted={() => navigateTo('onboarding_1')}
          onLogin={() => navigateTo('login')}
        />
        {/* Brief loading overlay while we check for an existing session */}
        {authLoading && (
          <div className="fixed inset-0 z-50 bg-[#f8faf7] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-[#4c6635]">
              <div className="w-12 h-12 rounded-full border-4 border-[#cdecae] border-t-[#4c6635] animate-spin" />
              <p className="text-sm font-medium text-[#44483e]">Loading FloraVeda...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Render: Full-screen standalone routes ─────────────────────────────────────

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
        onLogin={login}
        onRegister={register}
        onGoogleAuth={loginWithGoogle}
        authError={authError}
        authLoading={authLoading}
      />
    );
  }

  if (currentScreen === 'scan') {
    return (
      <ScanCamera
        setScreen={navigateTo}
        userId={user?.id}
        onDiagnose={(disease) => {
          setSelectedDisease(disease);
          navigateTo('diagnosis');
        }}
      />
    );
  }

  // ── Render: Main in-app layout ────────────────────────────────────────────────
  const isDetailView = currentScreen === 'plant_detail' || currentScreen === 'diagnosis';
  const categoryScreens: ScreenType[] = ['category_flowers', 'category_leaf', 'category_succulents', 'category_trees'];
  const showBack = isDetailView || categoryScreens.includes(currentScreen);

  const getHeaderTitle = () => {
    switch (currentScreen) {
      case 'home':              return 'FloraVeda';
      case 'category_flowers':  return 'Flowers';
      case 'category_leaf':     return 'Leaf Plants';
      case 'category_succulents': return 'Succulents';
      case 'category_trees':    return 'Trees';
      case 'plant_detail':      return selectedPlant.name;
      case 'diagnosis':         return selectedDisease.name;
      case 'profile':           return 'My Profile';
      default:                  return 'FloraVeda';
    }
  };

  // Build current user profile for display (fall back gracefully)
  const displayProfile = profile ?? {
    name: user?.email?.split('@')[0] ?? 'Plant Lover',
    role: 'Plant Enthusiast',
    avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${user?.id ?? 'default'}`,
    plantsCount: careTasks.length,
    favoritesCount: favoriteIds.size,
  };

  return (
    <div className="min-h-screen bg-[#f8faf7] text-[#191c1b] flex flex-col md:flex-row antialiased selection:bg-[#cdecae] selection:text-[#0d2000]">
      <DesktopSidebar
        currentScreen={currentScreen}
        setScreen={navigateTo}
        unreadNotifsCount={unreadCount}
        onOpenNotifications={() => setShowNotifModal(true)}
        onOpenCareSchedule={() => setShowCareModal(true)}
        profile={displayProfile}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopAppBar
          title={getHeaderTitle()}
          showBack={showBack}
          onBack={handleBack}
          onOpenNotifications={() => setShowNotifModal(true)}
          unreadCount={unreadCount}
        />

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

          {/* Category screens – all four are now handled */}
          {categoryScreens.includes(currentScreen) && (
            <CategoryList
              setScreen={navigateTo}
              category={
                currentScreen === 'category_flowers' ? 'Flowers'
                : currentScreen === 'category_leaf' ? 'Leaf Plant'
                : currentScreen === 'category_succulents' ? 'Succulents'
                : 'Trees'
              }
              onSelectPlant={(plant) => {
                setSelectedPlant(plant);
                navigateTo('plant_detail');
              }}
              favorites={favoritesArray}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {currentScreen === 'plant_detail' && (
            <PlantDetail
              plant={selectedPlant}
              isFavorite={favoriteIds.has(selectedPlant.id)}
              onToggleFavorite={handleToggleFavorite}
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
              profile={displayProfile}
              favoritesCount={favoriteIds.size}
              unreadNotifsCount={unreadCount}
              onOpenNotifications={() => setShowNotifModal(true)}
              onOpenCareSchedule={() => setShowCareModal(true)}
              onLogout={handleLogout}
              setScreen={navigateTo}
              userId={user?.id}
              onProfileUpdated={refreshProfile}
            />
          )}
        </main>
      </div>

      <BottomNavBar
        currentScreen={currentScreen}
        setScreen={navigateTo}
        unreadCount={unreadCount}
      />

      {showCareModal && (
        <CareScheduleModal
          tasks={careTasks}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onClose={() => setShowCareModal(false)}
        />
      )}

      {showNotifModal && (
        <NotificationModal
          notifications={notifications}
          onMarkAllRead={markAll}
          onClearAll={clearAll}
          onClose={() => setShowNotifModal(false)}
        />
      )}
    </div>
  );
};

export default App;
