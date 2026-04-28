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
import { TrendingUp, History, Settings, Home } from 'lucide-react';
import gsap from 'gsap';
import './index.css';

import { Header } from './features/common/Header';
import { ConfirmModal } from './features/common/ConfirmModal';

type Tab = 'home' | 'history' | 'progress' | 'settings';

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


  // Global edge-swipe prevention & History Trap (Kill Chrome Back Arrow)
  useEffect(() => {
    const touchState = { startX: 0, startY: 0, isEdge: false };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const threshold = 100; // Increased threshold
      touchState.startX = touch.pageX;
      touchState.startY = touch.pageY;
      touchState.isEdge = touch.pageX < threshold || touch.pageX > window.innerWidth - threshold;

      // If NOT on a button and in edge zone, block immediately
      if (touchState.isEdge && !(e.target as HTMLElement).closest('button, a, input, [role="button"]')) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchState.isEdge) {
        const touch = e.touches[0];
        const dx = Math.abs(touch.pageX - touchState.startX);
        const dy = Math.abs(touch.pageY - touchState.startY);

        // AGGRESSIVE KILL: If any horizontal movement starts in edge zone, block it
        if (dx > 0 && dx > dy) {
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    // 2. Trap history so there's 'nowhere to go back to'
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart, { capture: true } as any);
      window.removeEventListener('touchmove', handleTouchMove, { capture: true } as any);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Tab change animation
  const switchTab = (newTab: Tab) => {
    if (newTab === tab) return;
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0, 
        y: 20, 
        scale: 0.95,
        rotateX: 5,
        duration: 0.2, 
        ease: 'power2.in',
        onComplete: () => {
          setTab(newTab);
          gsap.fromTo(contentRef.current, 
            { opacity: 0, y: -20, scale: 1.05, rotateX: -5 },
            { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.4, ease: 'power3.out' }
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
    { key: 'home', icon: <Home size={20} strokeWidth={2} />, label: lang === 'ar' ? 'الرئيسية' : 'Home' },
    { key: 'history', icon: <History size={20} strokeWidth={2} />, label: t('history') },
    { key: 'progress', icon: <TrendingUp size={20} strokeWidth={2} />, label: t('progress') },
    { key: 'settings', icon: <Settings size={20} strokeWidth={2} />, label: t('settings') },
  ];

  return (
    <div ref={appRef} dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        width: '100vw',
        minWidth: '100%', height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: showWorkout ? '0' : '5px 16px 0',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: 'var(--bg-color)',
        touchAction: 'pan-y'
      }}>

      {!showWorkout && (
        <>
          <Header tab={tab} t={t} />

          {/* Accent divider */}
          <div className="accent-divider" style={{ marginBottom: '5px' }} />

          {/* Main Content Area - Handles internal scroll and padding */}
          <div ref={contentRef} className="hide-scroll" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: '10px',
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

      {/* Onboarding */}
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
