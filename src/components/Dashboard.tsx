import React, { useRef, useEffect } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import { translations } from '../translations';
import { MUSCLE_GROUPS } from '../data/exercises';
import { Dumbbell, TrendingUp, Flame, Activity, Award, History } from 'lucide-react';
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

  return (
    <div ref={containerRef} style={{
      display: 'flex', flexDirection: 'column',
      flex: 1,
      padding: '5px 16px'
    }}>

      {/* 1. TOP: Welcome & Stats (Ultra Compact) */}
      <div style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '25px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-color)', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.6, fontFamily: 'Kanit, sans-serif' }}>
            {lang === 'ar' ? 'أهلاً، ' : 'WELCOME, '}
          </span>
          <span style={{ fontSize: '26px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', fontFamily: 'Kanit, sans-serif' }}>
            {tracker.settings.userName || 'Ahmed'}
          </span>
        </div>

        {/* Stats Section - Transparent Unified Card with Dividers */}
        <div style={{ 
          background: 'none', 
          border: '1px solid rgba(0, 229, 160, 0.15)', 
          borderRadius: '20px',
          padding: '10px 0',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[
              { label: t('thisWeek'), val: weeklyCount, target: 'history' as const, icon: <Activity size={14} color="var(--accent-color)" /> },
              { label: 'PRs', val: tracker.prs.length, target: 'progress' as const, icon: <Award size={14} color="var(--accent-color)" /> },
              { label: t('allTime'), val: tracker.logs.length, target: 'history' as const, icon: <History size={14} color="var(--accent-color)" /> }
            ].map((s, i) => (
              <React.Fragment key={i}>
                <div 
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
                    padding: '8px 0'
                  }}
                >
                  <div style={{ opacity: 0.5, marginBottom: '2px' }}>{s.icon}</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1', fontFamily: 'Kanit, sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: '8px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4 }}>{s.label}</div>
                </div>
                {i < 2 && <div style={{ width: '1px', height: '25px', background: 'rgba(255,255,255,0.08)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE: Start Workout CTA */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <button
          onClick={onStartWorkout}
          style={{
            background: 'none', border: 'none',
            color: 'var(--accent-color)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '4px',
            textTransform: 'uppercase', letterSpacing: '4px',
            transition: 'all 0.4s ease',
            fontFamily: "'Bebas Neue', cursive",
            width: '100%'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: '700', opacity: 0.6, letterSpacing: '4px', fontFamily: 'Kanit, sans-serif', color: 'var(--accent-color)' }}>{t('startWorkout').split(' ')[0]}</div>
          <div style={{ 
            fontSize: '56px', 
            fontWeight: '900', 
            lineHeight: '1', 
            color: '#fff', 
            textShadow: '0 0 20px rgba(0,229,160,0.2)', 
            width: '100%', 
            textAlign: 'center', 
            fontFamily: 'Kanit, sans-serif',
            animation: 'pulse-glow 3s ease-in-out infinite'
          }}>
            {t('startWorkout').split(' ')[1]}
          </div>
          <div style={{ width: '40px', height: '2px', background: 'var(--accent-color)', marginTop: '5px', opacity: 0.5 }} />
        </button>
      </div>

      {/* 3. BOTTOM: Last Session (Ultra Clean) */}
      <div style={{ marginTop: 'auto', paddingBottom: '10px' }}>
        {recentLog ? (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', opacity: 0.5 }}>
              <Flame size={12} color="var(--accent-color)" />
              <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('lastSession')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '20px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  {MUSCLE_GROUPS.find(m => m.key === recentLog.muscleGroup)?.[lang] ?? recentLog.muscleGroup}
                </div>
                <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '800' }}>
                  <span style={{ color: 'var(--accent-color)' }}>{totalVolume.toFixed(0)}</span>{unit}
                </div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', opacity: 0.4 }}>
                {formatDate(recentLog.date, lang)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', opacity: 0.3 }}>
            <div style={{ fontSize: '9px', fontWeight: '950', letterSpacing: '2px' }}>NO RECENT MISSIONS</div>
          </div>
        )}
      </div>

      {/* 4. FOOTER Branding */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '15px', opacity: 0.15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '15px', height: '1px', background: '#fff' }} />
          <span style={{ fontSize: '7px', fontWeight: '950', color: '#fff', letterSpacing: '3px', textTransform: 'uppercase' }}>
            GYMLOG ELITE
          </span>
          <div style={{ width: '15px', height: '1px', background: '#fff' }} />
        </div>
      </div>
    </div>
  );
}
