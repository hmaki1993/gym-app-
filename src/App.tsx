import { useState, useRef, useEffect } from 'react';
import { useGymTracker } from './hooks/useGymTracker';
import { translations } from './translations';
import { Dashboard } from './features/dashboard/Dashboard';
import { WorkoutSession } from './features/workout/WorkoutSession';
import { HistoryPage } from './features/history/HistoryPage';
import { ProgressPage } from './features/progress/ProgressPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { OnboardingModal } from './features/common/OnboardingModal';
import { BottomNav } from './features/common/BottomNav';
import { NutritionPage } from './features/nutrition/NutritionPage';
import { TrendingUp, History, Settings, Home, Utensils } from 'lucide-react';
import gsap from 'gsap';
import './index.css';
import { preWarmImages } from './features/workout/components/TransparentImage';
import { MUSCLE_GROUPS } from './data/exercises';

// Pre-process muscle icons immediately on app load (runs once, cached forever)
preWarmImages(MUSCLE_GROUPS.map(mg => mg.icon), 45);

import { Header } from './features/common/Header';
import { ConfirmModal } from './features/common/ConfirmModal';

type Tab = 'home' | 'history' | 'progress' | 'nutrition' | 'settings';

export default function App() {
  const tracker = useGymTracker();
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const isRtl = lang === 'ar';

  const [tab, setTab] = useState<Tab>('home');
  const [showWorkout, setShowWorkout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);


  // ── Unified Navigation & History System ──
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const EDGE_THRESHOLD = 30;

    // 1. Edge Swipe Blocker (Refined for Internal Back)
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = Math.abs(x - startX);
      const dy = Math.abs(y - startY);

      // Block native browser arrow but ALLOW the gesture to trigger popstate
      // We block if it's horizontal and near the edge, but we let it pass 
      // if it's meant to be a fast flick for the system back gesture.
      if ((startX < EDGE_THRESHOLD || startX > window.innerWidth - EDGE_THRESHOLD) && dx > dy && dx > 10) {
        // Only prevent if we haven't handled it via history
        if (!(e.target as HTMLElement).closest('.allow-swipe') && e.cancelable) {
           // We block the browser's UI arrow but the system back still fires popstate
           e.preventDefault();
        }
      }
    };

    // 2. The Internal "Back Button" Engine
    const handlePopState = () => {
      // Logic: If Workout is open -> Close it. If not on Home -> Go Home.
      if (showWorkout) {
        setShowWorkout(false);
        window.history.pushState(null, '', window.location.href); // Keep the trap active
      } else if (tab !== 'home') {
        setTab('home');
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Initial trap
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [tab, showWorkout]); // Re-bind when state changes to have fresh values

  // ── Dynamic Theme Synchronization ──
  useEffect(() => {
    const root = document.documentElement;
    const accent = tracker.settings.accentColor || '#326144';
    root.style.setProperty('--accent-color', accent);
    
    // Convert hex to RGB for transparency effects (like borders)
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '50, 97, 68';
    };
    
    root.style.setProperty('--accent-rgb', hexToRgb(accent));
    
    // Update theme data-attribute
    root.setAttribute('data-theme', tracker.settings.themeMode);
  }, [tracker.settings.accentColor, tracker.settings.themeMode]);

  // When opening workout, push a state so back gesture can close it
  useEffect(() => {
    if (showWorkout) {
      window.history.pushState({ workout: true }, '', window.location.href);
    }
  }, [showWorkout]);

  // Update history when tab changes so back gesture knows where to go
  const switchTab = (newTab: Tab) => {
    if (newTab === tab) return;
    window.history.pushState({ tab: newTab }, '', window.location.href);
    
    if (contentRef.current) {
      // Rocket-speed transition
      gsap.to(contentRef.current, {
        opacity: 0,
        x: newTab === 'home' ? 10 : -10,
        duration: 0.1, // Ultra fast
        force3D: true,
        ease: 'power2.in',
        onComplete: () => {
          setTab(newTab);
          gsap.fromTo(contentRef.current,
            { opacity: 0, x: newTab === 'home' ? -10 : 10 },
            { opacity: 1, x: 0, duration: 0.15, ease: 'power2.out', force3D: true }
          );
        }
      });
    } else {
      setTab(newTab);
    }
  };

  const handleDeleteWorkout = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = () => {
    if (confirmDelete) {
      tracker.deleteWorkout(confirmDelete);
      setConfirmDelete(null);
    }
  };

  const NAV_ITEMS: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'home', icon: <Home size={26} strokeWidth={2} />, label: lang === 'ar' ? 'الرئيسية' : 'Home' },
    { key: 'history', icon: <History size={26} strokeWidth={2} />, label: t('history') },
    { key: 'nutrition', icon: <Utensils size={26} strokeWidth={2} />, label: t('nutrition') },
    { key: 'progress', icon: <TrendingUp size={26} strokeWidth={2} />, label: t('progress') },
    { key: 'settings', icon: <Settings size={26} strokeWidth={2} />, label: t('settings') },
  ];

  return (
    <div ref={appRef} dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        width: '100vw',
        minWidth: '100%', height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: showWorkout ? '0' : 'calc(env(safe-area-inset-top) + 0px) 16px 0',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: 'var(--primary-bg)',
        touchAction: 'auto',
        overscrollBehaviorX: 'none'
      }}>

      {!showWorkout && (
        <>
          <Header tab={tab} t={t} tracker={tracker} />

          {/* Accent divider */}
          <div className="accent-divider" style={{ marginBottom: '5px' }} />

          {/* Main Content Area - Handles internal scroll and padding */}
          <div ref={contentRef} className="hide-scrollbar" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: '0',
            touchAction: 'pan-y'
          }}>
            {tab === 'home' && (
              <Dashboard
                tracker={tracker}
                onStartWorkout={() => { setShowWorkout(true); tracker.resetSessionTimer(); }}
                onTabSwitch={switchTab}
              />
            )}
            {tab === 'history' && (
              <HistoryPage tracker={tracker} onDeleteWorkout={handleDeleteWorkout} />
            )}
            {tab === 'progress' && <ProgressPage tracker={tracker} />}
            {tab === 'nutrition' && <NutritionPage tracker={tracker} />}
            {tab === 'settings' && <SettingsPage tracker={tracker} />}
          </div>

          {/* Bottom Navigation */}
          <BottomNav 
            items={NAV_ITEMS}
            activeTab={tab}
            onTabChange={switchTab}
          />
        </>
      )}

      {/* Onboarding - Only if no profile exists */}
      {!tracker.settings.userName && (
        <OnboardingModal tracker={tracker} onComplete={() => { }} />
      )}

      {/* Workout Session Full Page */}
      {showWorkout && (
        <WorkoutSession
          tracker={tracker}
          onClose={() => setShowWorkout(false)}
          onSaved={() => { setShowWorkout(false); setTab('home'); }}
        />
      )}

      {/* Delete Confirm Dialog */}
      {confirmDelete && (
        <ConfirmModal
          title={t('deleteWorkout')}
          message={t('confirmDelete')}
          confirmLabel={t('confirm')}
          cancelLabel={t('cancel')}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
