import React, { useState, useRef, useEffect } from 'react';
import { useGymTracker } from './hooks/useGymTracker';
import { translations } from './translations';
import { Dashboard } from './components/Dashboard';
import { WorkoutSession } from './components/WorkoutSession';
import { HistoryPage } from './components/HistoryPage';
import { ProgressPage } from './components/ProgressPage';
import { SettingsPage } from './components/SettingsPage';
import { OnboardingModal } from './components/OnboardingModal';
import { Dumbbell, TrendingUp, History, Settings, Home } from 'lucide-react';
import { THEME_COLORS } from './data/exercises';
import gsap from 'gsap';
import './index.css';

type Tab = 'home' | 'history' | 'progress' | 'settings';

function App() {
  const tracker = useGymTracker();
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const isRtl = lang === 'ar';

  const [tab, setTab] = useState<Tab>('home');
  const [showWorkout, setShowWorkout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Apply theme color CSS vars
  useEffect(() => {
    const root = document.documentElement;
    const theme = THEME_COLORS.find(c => c.hex === tracker.settings.accentColor);
    root.style.setProperty('--accent-color', tracker.settings.accentColor);
    root.style.setProperty('--accent-color-alpha', `${tracker.settings.accentColor}25`); // 15% opacity for glows
    root.style.setProperty('--accent-color-alpha-heavy', `${tracker.settings.accentColor}50`); // 30% opacity
    if (theme) root.style.setProperty('--accent-secondary', theme.secondary);
  }, [tracker.settings.accentColor]);

  // Entrance animation
  useEffect(() => {
    if (appRef.current) {
      gsap.fromTo(appRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  }, []);

  // Tab change animation
  const switchTab = (newTab: Tab) => {
    if (newTab === tab) return;
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0, y: 10, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          setTab(newTab);
          gsap.to(contentRef.current, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
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
        width: '100%', 
        margin: '0 auto', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: showWorkout ? '0' : '16px 20px 90px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>

      {!showWorkout && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', direction: 'ltr' }}>
            <div>
              <h1 className="logo-text" style={{ margin: 0, fontSize: 'var(--logo-font-size)' }}>GYMLOG</h1>
              <div className="subtitle-text">{t('premiumSystem')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {tab !== 'home' && (
                <button
                  onClick={() => setShowWorkout(true)}
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,229,160,0.35)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <Dumbbell size={18} color="#000" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Accent divider */}
          <div className="accent-divider" style={{ marginBottom: '20px' }} />

          {/* Page Content */}
          <div ref={contentRef} style={{ flex: 1 }}>
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
          <nav className="bottom-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                className={`nav-btn ${tab === item.key ? 'active' : ''}`}
                onClick={() => switchTab(item.key)}
              >
                {item.icon}
              </button>
            ))}
          </nav>
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
        <div className="modal-overlay" style={{ alignItems: 'center' }}>
          <div className="glass-panel" style={{ width: '85%', maxWidth: '340px', padding: '28px 24px', textAlign: 'center', borderRadius: '20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>{t('deleteWorkout')}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>{t('confirmDelete')}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(null)} className="glass-button" style={{ flex: 1, borderRadius: '12px' }}>{t('cancel')}</button>
              <button onClick={confirmDeleteAction} className="danger-button" style={{ flex: 1, borderRadius: '12px' }}>{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
