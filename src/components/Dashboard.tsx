import React, { useRef, useEffect } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import { translations } from '../translations';
import { MUSCLE_GROUPS } from '../data/exercises';
import { Dumbbell, TrendingUp, Flame, Zap } from 'lucide-react';
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

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  const weeklyCount = tracker.getWeeklyCount();
  const recentLog = tracker.logs[0];
  const totalVolume = recentLog ? tracker.getTotalVolume(recentLog) : 0;

  return (
    <div ref={containerRef} style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 120px)', // Precise viewport fit
      justifyContent: 'space-between',
      padding: '10px 4px',
      overflow: 'hidden'
    }}>

      {/* 1. TOP: Welcome & Stats */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
        <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '2px' }}>
          {t('welcomeBack')}
        </div>
        <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', letterSpacing: '-1px', lineHeight: '1', marginBottom: '16px' }}>
          {tracker.settings.userName || 'Champion'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: t('thisWeek'), val: weeklyCount, target: 'history' as const },
            { label: 'PRs', val: tracker.prs.length, target: 'progress' as const },
            { label: t('allTime'), val: tracker.logs.length, target: 'history' as const }
          ].map((s, i) => (
            <div
              key={i}
              onClick={() => onTabSwitch(s.target)}
              style={{
                padding: '10px 6px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>{s.val}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MIDDLE: Start Workout CTA */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={onStartWorkout}
          className="elite-pulse-text"
          style={{
            background: 'none', border: 'none',
            color: 'var(--accent-color)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '4px',
            textTransform: 'uppercase', letterSpacing: '8px',
            transition: 'all 0.4s ease'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: '900', opacity: 0.5 }}>{t('startWorkout').split(' ')[0]}</div>
          <div style={{ fontSize: '26px', fontWeight: '950', lineHeight: '1.1' }}>{t('startWorkout').split(' ')[1]}</div>
        </button>
      </div>

      {/* 3. BOTTOM: Last Session / Status */}
      <div style={{ marginBottom: '12px' }}>
        {recentLog ? (
          <div style={{ padding: '14px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={12} color="var(--accent-color)" />
                <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('lastSession')}</span>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700' }}>{formatDate(recentLog.date, lang)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={MUSCLE_GROUPS.find(m => m.key === recentLog.muscleGroup)?.icon}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {MUSCLE_GROUPS.find(m => m.key === recentLog.muscleGroup)?.[lang] ?? recentLog.muscleGroup}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '2px' }}>
                  {recentLog.exercises.length} {t('exercises')} · {totalVolume.toFixed(0)}{unit}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>
            <Dumbbell size={24} color="var(--accent-color)" style={{ marginBottom: '8px', opacity: 0.3 }} />
            <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>READY FOR YOUR FIRST SESSION</div>
          </div>
        )}
      </div>

      {/* 4. FOOTER Branding */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="pulse-dot" style={{ width: '4px', height: '4px' }} />
          <span style={{ fontSize: '8px', fontWeight: '950', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.3 }}>
            GYMLOG ELITE SYSTEM
          </span>
        </div>
      </div>
    </div>
  );
}
