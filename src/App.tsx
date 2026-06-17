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

import { Header } from './features/common/Header';
import { ConfirmModal } from './features/common/ConfirmModal';
import { useWidgetSync, syncWidgetState } from './hooks/useWidgetSync';
import { Crown } from 'lucide-react';
import { registerPlugin } from '@capacitor/core';
const FloatingWidget = registerPlugin<any>('FloatingWidget');

function InactiveWidgetSync({ tracker }: { tracker: ReturnType<typeof useGymTracker> }) {
  const todayStr = tracker.getLocalDateStr();
  const isFinished = tracker.logs.some(log => {
    const logDate = new Date(log.date);
    const logLocalDate = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
    return logLocalDate === todayStr || log.date.startsWith(todayStr);
  });
  useWidgetSync(false, null, 0, '', null, tracker.logs.map(l => l.date.split('T')[0]), isFinished, tracker.settings.accentColor);
  return null;
}

type Tab = 'home' | 'history' | 'progress' | 'nutrition' | 'settings';

export default function App() {
  const tracker = useGymTracker();
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const isRtl = lang === 'ar';

  const [tab, setTab] = useState<Tab>(tracker.settings.userName ? 'home' : 'settings');
  const [showWorkout, setShowWorkout] = useState(false);
  const [showPremiumOverlayModal, setShowPremiumOverlayModal] = useState(false);

  // Ask for overlay permission once for new users after they set their name
  useEffect(() => {
    if (tracker.settings.userName) {
      const hasAsked = localStorage.getItem('gymlog_overlay_requested');
      const isAndroid = (window as any).Capacitor?.getPlatform() === 'android' || !!(window as any).AndroidStorage;
      if (isAndroid && !hasAsked) {
        // Wait a few seconds before popping the premium card
        const timer = setTimeout(async () => {
          try {
            const { granted } = await FloatingWidget.checkOverlayPermission();
            if (!granted) {
              setShowPremiumOverlayModal(true);
            }
          } catch (e) {
            console.log('Floating widget not supported', e);
          }
          localStorage.setItem('gymlog_overlay_requested', 'true');
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [tracker.settings.userName]);
  
  // Synchronize workout active state from storage when app is resumed or synced
  useEffect(() => {
    const checkActiveSession = () => {
      let draftRaw = localStorage.getItem('gymlog_active_session');
      if (!draftRaw && (window as any).AndroidStorage) {
        draftRaw = (window as any).AndroidStorage.getItem('gymlog_active_session');
      }
      
      if (!draftRaw && showWorkout && (window as any).gymlog_workout_active) {
        setShowWorkout(false);
        setTab('home');
      }
    };

    window.addEventListener('gymlog_sync', checkActiveSession);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkActiveSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('gymlog_sync', checkActiveSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showWorkout]);

  const isFloating = window.location.search.includes('floating=true');
  const [floatingMode, setFloatingMode] = useState(() => new URLSearchParams(window.location.search).get('mode'));

  useEffect(() => {
    const handleRoute = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setFloatingMode(customEvent.detail);
      }
    };
    window.addEventListener('gymlog_route', handleRoute);
    return () => window.removeEventListener('gymlog_route', handleRoute);
  }, []);

  const appRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── One-time App Mount Initialization ──
  useEffect(() => {
    // Hide splash screen smoothly after the app is mounted and ready
    SplashScreen.hide().catch(err => console.log('Splash hide error:', err));

    // Defer CPU-intensive image pre-processing to prevent blocking startup
    const timer = setTimeout(() => {
      preWarmImages(MUSCLE_GROUPS.map(mg => mg.icon), 45);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

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
      label: t('homeTab') 
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

  const closeNativeWidget = () => {
    if ((window as any).AndroidFloating) {
      (window as any).AndroidFloating.closeFloatingWidget();
    } else {
      setShowWorkout(false);
    }
  };

  if (isFloating) {
    return (
      <div ref={appRef} dir={isRtl ? 'rtl' : 'ltr'}
        style={{ width: '100vw', height: '100dvh', background: 'var(--primary-bg)', overflow: 'hidden' }}>
        {floatingMode === 'history' ? (
          <HistoryPage tracker={tracker} isFloating={true} onClose={closeNativeWidget} />
        ) : (
          <WorkoutSession
            tracker={tracker}
            onClose={closeNativeWidget}
            onSaved={async () => {
              const sessionDate = new Date(tracker.sessionStartTime);
              const todayStr = tracker.getLocalDateStr(sessionDate);
              const historyDates = tracker.logs.map(log => log.date.split('T')[0]);
              if (!historyDates.includes(todayStr)) {
                historyDates.push(todayStr);
              }
              await syncWidgetState({
                isActive: false,
                activeExercise: null,
                completedSets: 0,
                muscleGroup: '',
                loggedData: null,
                historyDates: historyDates,
                isFinished: true,
                accentColor: tracker.settings.accentColor
              });
              closeNativeWidget();
            }}
          />
        )}
      </div>
    );
  }

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
          <InactiveWidgetSync tracker={tracker} />
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
                onStartWorkout={() => { setShowWorkout(true); }}
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
          title={t('deleteWorkoutQ')}
          message={t('deleteWorkoutConfirmPermanent')}
          confirmLabel={t('deleteNow')}
          cancelLabel={t('cancel')}
          onConfirm={() => {
            tracker.deleteWorkout(tracker.logToDelete!);
            tracker.setLogToDelete(null);
          }}
          onCancel={() => tracker.setLogToDelete(null)}
        />
      )}
      {/* ── Premium Overlay Modal ── */}
      {showPremiumOverlayModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px', padding: '24px',
            maxWidth: '340px', width: '100%',
            textAlign: 'center', position: 'relative'
          }}>
            <button onClick={() => setShowPremiumOverlayModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>
              ✕
            </button>
            <Crown size={48} color="#FFD700" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#FFD700', margin: '0 0 8px', fontSize: '22px' }}>GymLog Premium</h3>
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              عشان تفعل ميزة الكارت الطاير (Floating Widget) وتقدر تتابع تمرينك وانت برة الأبلكيشن، محتاجين صلاحية الـ Overlay. الميزة دي حصرية في النسخة الـ Premium!
            </p>
            <button onClick={async () => {
              setShowPremiumOverlayModal(false);
              try {
                await FloatingWidget.requestOverlayPermission();
              } catch (e) {
                console.log(e);
              }
            }}
              style={{
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                color: '#000', border: 'none', borderRadius: '12px',
                padding: '14px 24px', fontSize: '16px', fontWeight: 'bold',
                width: '100%', cursor: 'pointer'
              }}>
              تفعيل الان
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
