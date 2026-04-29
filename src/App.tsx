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


  // ── Nuclear Chrome Back-Arrow Killer ──
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let edgeSwipeBlocked = false;
    const EDGE_THRESHOLD = 30; // px from screen edge

    const isInsideAllowedScroller = (el: EventTarget | null): boolean => {
      if (!el) return false;
      return !!(el as HTMLElement).closest?.('.allow-swipe');
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      edgeSwipeBlocked = false;

      // If touch starts in the edge zone AND it's not inside an allowed horizontal scroller
      if (
        (startX < EDGE_THRESHOLD || startX > window.innerWidth - EDGE_THRESHOLD) &&
        !isInsideAllowedScroller(e.target)
      ) {
        edgeSwipeBlocked = true;
        // Block immediately at touchstart so Chrome never sees it
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!edgeSwipeBlocked) return;
      // Keep blocking the entire gesture until finger lifts
      if (e.cancelable) e.preventDefault();
    };

    // History trap: push a dummy state so there's nowhere to go back to
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('touchstart', onTouchStart, { capture: true } as any);
      window.removeEventListener('touchmove', onTouchMove, { capture: true } as any);
      window.removeEventListener('popstate', onPopState);
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
    { key: 'home', icon: <Home size={26} strokeWidth={2} />, label: lang === 'ar' ? 'الرئيسية' : 'Home' },
    { key: 'history', icon: <History size={26} strokeWidth={2} />, label: t('history') },
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
        padding: showWorkout ? '0' : '5px 16px 0',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: 'var(--bg-color)',
        touchAction: 'auto',
        overscrollBehaviorX: 'none'
      }}>

      {!showWorkout && (
        <>
          <Header tab={tab} t={t} />

          {/* Accent divider */}
          <div className="accent-divider" style={{ marginBottom: '5px' }} />

          {/* Main Content Area - Handles internal scroll and padding */}
          <div ref={contentRef} className="hide-scrollbar" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: '65px',
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
