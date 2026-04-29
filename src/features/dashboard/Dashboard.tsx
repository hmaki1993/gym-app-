import React, { useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { MUSCLE_GROUPS } from '../../data/exercises';
import { Flame, Activity, Award, History } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onStartWorkout: () => void;
  onTabSwitch: (tab: 'home' | 'history' | 'progress' | 'settings') => void;
}

function formatDate(iso: string, lang: 'ar' | 'en') {
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function Dashboard({ tracker, onStartWorkout, onTabSwitch }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const unit = tracker.settings.weightUnit;
  const containerRef = useRef<HTMLDivElement>(null);

  const weeklyCount = tracker.getWeeklyCount();
  const recentLog = tracker.logs[0];
  const totalVolume = recentLog ? tracker.getTotalVolume(recentLog) : 0;

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 20, rotateX: 10, translateZ: -50 },
        { opacity: 1, y: 0, rotateX: 0, translateZ: 0, stagger: 0.1, duration: 0.8, ease: 'power4.out' }
      );
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(btn, {
      rotateY: x * 15,
      rotateX: -y * 15,
      translateZ: 20,
      duration: 0.5,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      rotateY: 0,
      rotateX: 0,
      translateZ: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)'
    });
  };

  const workoutWords = t('startWorkout').toUpperCase().split(' ');

  return (
    <div ref={containerRef} className="hide-scrollbar" style={{
      display: 'flex', flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '10px 16px 80px',
      transformStyle: 'preserve-3d'
    }}>

      {/* 1. TOP: Welcome & Stats */}
      <div style={{ marginBottom: '20px', transformStyle: 'preserve-3d', paddingTop: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '10px', 
            fontWeight: '900', 
            color: 'var(--accent-color)', 
            letterSpacing: '4px', 
            textTransform: 'uppercase', 
            fontFamily: 'Outfit, sans-serif',
            opacity: 0.6,
            marginBottom: '4px'
          }}>
            {lang === 'ar' ? 'أهلاً بك،' : 'WELCOME BACK,'}
          </div>
          <div className="spatial-name-glow" style={{ 
            fontSize: '42px', 
            fontWeight: '950', 
            color: 'var(--text-primary)', 
            letterSpacing: '-1.5px', 
            fontFamily: 'Outfit, sans-serif',
            lineHeight: '0.85',
            background: 'linear-gradient(to bottom, var(--text-primary) 0%, var(--accent-color) 200%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {tracker.settings.userName || 'Elite User'}
          </div>
        </div>

        <div className="glass-panel antigravity-card" style={{ 
          background: 'linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, var(--accent-color-alpha) 100%)', 
          border: '1px solid rgba(255,255,255,0.05)', 
          borderTop: '1px solid rgba(255,255,255,0.12)', 
          borderRadius: '32px',
          padding: '24px 0',
          marginBottom: '20px',
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px var(--accent-color-alpha)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[
              { label: t('thisWeek'), val: weeklyCount, target: 'history' as const, icon: <Activity size={16} /> },
              { label: 'PRs', val: tracker.prs.length, target: 'progress' as const, icon: <Award size={16} /> },
              { label: t('allTime'), val: tracker.logs.length, target: 'history' as const, icon: <History size={16} /> }
            ].map((s, i) => (
              <React.Fragment key={i}>
                <button 
                  onClick={() => onTabSwitch(s.target)}
                  style={{ 
                    textAlign: 'center', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px',
                    flex: 1,
                    transform: 'translateZ(10px)',
                    background: 'none',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  <div style={{ color: 'var(--accent-color)', opacity: 0.8, marginBottom: '2px' }}>{s.icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: '950', color: 'var(--text-primary)', lineHeight: '1', fontFamily: 'Outfit, sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'Outfit, sans-serif', opacity: 0.6 }}>{s.label}</div>
                </button>
                {i < 2 && <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.05)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE: Start Workout CTA */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '20px 0', perspective: '1000px' }}>
        <button
          onClick={onStartWorkout}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="pulse-elite antigravity-card"
          style={{
            background: 'none', border: 'none',
            color: '#fff', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '20px',
            width: '100%',
            fontFamily: 'Outfit, sans-serif',
            transformStyle: 'preserve-3d'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', transformStyle: 'preserve-3d' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateZ(30px)' }}>
              {workoutWords.map((word: string, i: number) => (
                <div key={i} className="premium-title" style={{ 
                  fontSize: '48px', 
                  lineHeight: '0.9',
                  letterSpacing: '1px',
                  marginBottom: '2px'
                }}>
                  {word}
                </div>
              ))}
            </div>
          </div>
          
          <span style={{ 
            fontSize: '10px', 
            fontWeight: '900', 
            color: 'var(--accent-color)', 
            letterSpacing: '8px', 
            opacity: 0.6,
            textTransform: 'uppercase',
            fontFamily: 'Outfit, sans-serif',
            transform: 'translateZ(10px)'
          }}>TAP TO BEGIN</span>
        </button>
      </div>

      {/* 3. BOTTOM: Last Session */}
      <div style={{ marginTop: '40px', paddingBottom: '20px', transformStyle: 'preserve-3d' }}>
        {recentLog ? (
          <div className="antigravity-card" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', opacity: 0.5 }}>
              <Flame size={12} color="var(--accent-color)" />
              <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'Outfit, sans-serif' }}>{t('lastSession')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif' }}>
                  {MUSCLE_GROUPS.find(m => m.key === recentLog.muscleGroup)?.[lang] ?? recentLog.muscleGroup}
                </div>
                <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
                  <span style={{ color: 'var(--accent-color)' }}>{totalVolume.toFixed(0)}</span> {unit}
                </div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', opacity: 0.4, fontFamily: 'Outfit, sans-serif' }}>
                {formatDate(recentLog.date, lang)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', opacity: 0.3 }}>
            <div style={{ fontSize: '9px', fontWeight: '950', letterSpacing: '2px', fontFamily: 'Outfit, sans-serif' }}>NO RECENT MISSIONS</div>
          </div>
        )}
      </div>

    </div>
  );
}
