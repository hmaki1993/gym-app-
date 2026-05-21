import { useState, useRef, useEffect } from 'react';
import { useGymTracker } from './hooks/useGymTracker';
import { translations } from './translations';
import { Dashboard } from './features/dashboard/Dashboard';
import WorkoutSession from './features/workout/WorkoutSession';
import { HistoryPage } from './features/history/HistoryPage';
import { ProgressPage } from './features/progress/ProgressPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { BottomNav } from './features/common/BottomNav';
import { NutritionPage } from './features/nutrition/NutritionPage';
import gsap from 'gsap';
import './index.css';
import { preWarmImages } from './features/workout/components/TransparentImage';
import { MUSCLE_GROUPS } from './data/exercises';
import { SplashScreen } from '@capacitor/splash-screen';

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

  const [tab, setTab] = useState<Tab>(tracker.settings.userName ? 'home' : 'settings');
  const [showWorkout, setShowWorkout] = useState(false);
  const [appLocalDate, setAppLocalDate] = useState(() => tracker.getLocalDateStr());
  const appRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);


  // ── Unified Navigation & History System ──
  useEffect(() => {
    // Hide splash screen smoothly after the app is mounted and ready
    SplashScreen.hide().catch(err => console.log('Splash hide error:', err));

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
    const baseAccent = tracker.settings.accentColor || '#00E676';
    
    // In light mode, the default neon green (#00E676) lacks contrast.
    // We dynamically switch it to a premium medium-dark forest/olive green (#166E36) for light mode.
    const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const actualTheme = tracker.settings.themeMode === 'system' ? (systemPrefersLight ? 'light' : 'dark') : tracker.settings.themeMode;
    const isLightMode = actualTheme === 'light';
    const displayAccent = (isLightMode && baseAccent.toUpperCase() === '#00E676') ? '#166E36' : baseAccent;

    root.style.setProperty('--accent-color', displayAccent);
    
    // Convert hex to RGB for transparency effects (like borders)
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : (isLightMode ? '22, 110, 54' : '0, 230, 118');
    };
    
    // Force-sync theme colors to match GitHub version if they differ
    if (tracker.settings.accentColor !== '#00E676') {
      tracker.setSettings({ 
        accentColor: '#00E676', 
        accentSecondary: '#E67E22' 
      });
    }

    root.style.setProperty('--accent-rgb', hexToRgb(displayAccent));
    
    // Update theme data-attribute
    root.setAttribute('data-theme', actualTheme);
  }, [tracker.settings.accentColor, tracker.settings.themeMode]);

  // ── Entrance Animation (Removed for rocket speed launch) ──
  useEffect(() => {
    // App loads instantly for maximum performance
  }, []);

  // ── Midnight Reset Logic to clear active yesterday's session ──
  useEffect(() => {
    const checkNewDay = () => {
      const today = tracker.getLocalDateStr();
      if (appLocalDate !== today) {
        setShowWorkout(false);
        setAppLocalDate(today);
      }
    };
    checkNewDay();
    window.addEventListener('focus', checkNewDay);
    return () => window.removeEventListener('focus', checkNewDay);
  }, [appLocalDate, tracker]);

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




  const NAV_ITEMS: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { 
      key: 'home', 
      icon: (
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            backgroundColor: 'currentColor', 
            maskImage: "url('/assets/home-custom.png')", 
            WebkitMaskImage: "url('/assets/home-custom.png')", 
            maskSize: 'contain', 
            WebkitMaskSize: 'contain', 
            maskRepeat: 'no-repeat', 
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            display: 'inline-block',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
        />
      ), 
      label: lang === 'ar' ? 'الرئيسية' : 'Home' 
    },
    { 
      key: 'history', 
      icon: (
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            backgroundColor: 'currentColor', 
            maskImage: "url('/assets/history-custom.png')", 
            WebkitMaskImage: "url('/assets/history-custom.png')", 
            maskSize: 'contain', 
            WebkitMaskSize: 'contain', 
            maskRepeat: 'no-repeat', 
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            display: 'inline-block',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
        />
      ), 
      label: t('history') 
    },
    { 
      key: 'nutrition', 
      icon: (
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            backgroundColor: 'currentColor', 
            maskImage: "url('/assets/nutrition-custom.png')", 
            WebkitMaskImage: "url('/assets/nutrition-custom.png')", 
            maskSize: 'contain', 
            WebkitMaskSize: 'contain', 
            maskRepeat: 'no-repeat', 
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            display: 'inline-block',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
        />
      ), 
      label: t('nutrition') 
    },
    { 
      key: 'progress', 
      icon: (
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            backgroundColor: 'currentColor', 
            maskImage: "url('/assets/progress-custom.png')", 
            WebkitMaskImage: "url('/assets/progress-custom.png')", 
            maskSize: 'contain', 
            WebkitMaskSize: 'contain', 
            maskRepeat: 'no-repeat', 
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            display: 'inline-block',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
        />
      ), 
      label: t('progress') 
    },
    { 
      key: 'settings', 
      icon: (
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            backgroundColor: 'currentColor', 
            maskImage: "url('/assets/settings-custom.png')", 
            WebkitMaskImage: "url('/assets/settings-custom.png')", 
            maskSize: 'contain', 
            WebkitMaskSize: 'contain', 
            maskRepeat: 'no-repeat', 
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            display: 'inline-block',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
        />
      ), 
      label: t('settings') 
    },
  ];

  return (
    <div ref={appRef} dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        width: '100vw',
        minWidth: '100%', height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: showWorkout ? '0' : 'calc(env(safe-area-inset-top) + 15px) 0 0',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: 'var(--primary-bg)',
        touchAction: 'auto',
        overscrollBehaviorX: 'none',
        opacity: 1
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
            paddingLeft: tab === 'home' ? '0px' : '16px',
            paddingRight: tab === 'home' ? '0px' : '16px',
            paddingBottom: '0px',
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
              <HistoryPage tracker={tracker} />
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

      {/* Workout Session Full Page */}
      {showWorkout && (
        <WorkoutSession
          tracker={tracker}
          onClose={() => setShowWorkout(false)}
          onSaved={() => { setShowWorkout(false); setTab('home'); }}
        />
      )}

      {/* Delete Confirm Dialog */}
      {tracker.logToDelete && (
        <ConfirmModal
          title={lang === 'ar' ? 'مسح التمرينة؟' : 'DELETE WORKOUT?'}
          message={lang === 'ar' ? 'هل أنت متأكد أنك تريد مسح هذه التمرينة نهائياً؟' : 'Are you sure you want to permanently delete this workout?'}
          confirmLabel={lang === 'ar' ? 'مسح الآن' : 'DELETE NOW'}
          cancelLabel={lang === 'ar' ? 'إلغاء' : 'CANCEL'}
          onConfirm={() => {
            tracker.deleteWorkout(tracker.logToDelete!);
            tracker.setLogToDelete(null);
          }}
          onCancel={() => tracker.setLogToDelete(null)}
        />
      )}
    </div>
  );
}
