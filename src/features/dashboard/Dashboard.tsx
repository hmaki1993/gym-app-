import React, { useRef } from 'react';
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


  // Entrance animation removed to prevent 'refresh' feeling on tab switch
  /*
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 20, rotateX: 10, translateZ: -50 },
        { opacity: 1, y: 0, rotateX: 0, translateZ: 0, stagger: 0.1, duration: 0.8, ease: 'power4.out' }
      );
    }
  }, []);
  */

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

  const todayStr = new Date().toISOString().split('T')[0];
  const hasWorkoutToday = tracker.logs.some(log => log.date.startsWith(todayStr));
  
  const workoutWords = (hasWorkoutToday 
    ? (lang === 'ar' ? 'تكملة التمرين' : 'RESUME WORKOUT') 
    : t('startWorkout').toUpperCase()
  ).split(' ');

  return (
    <div ref={containerRef} className="hide-scrollbar" style={{
      display: 'flex', flexDirection: 'column',
      width: '100%',
      flex: 1,
      padding: '20px 16px 100px',
      transformStyle: 'preserve-3d',
      justifyContent: 'space-between'
    }}>

      {/* 1. TOP: Stats */}
      <div style={{ transformStyle: 'preserve-3d' }}>
        <div style={{ 
          padding: '10px 0',
          marginBottom: '10px',
          transformStyle: 'preserve-3d'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0' }}>
            {[
              { label: t('thisWeek'), val: weeklyCount, target: 'history' as const, icon: <Activity size={24} />, color: '#4da6ff' },
              { label: 'PRs', val: tracker.prs.length, target: 'progress' as const, icon: <Award size={24} />, color: '#ffcc00' },
              { label: t('allTime'), val: tracker.logs.length, target: 'history' as const, icon: <History size={24} />, color: '#ff4d4d' }
            ].map((s, i) => (
              <button 
                key={i}
                onClick={() => onTabSwitch(s.target)}
                onMouseDown={(e) => gsap.to(e.currentTarget, { y: 2, scale: 0.98, duration: 0.1 })}
                onMouseUp={(e) => gsap.to(e.currentTarget, { y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' })}
                onMouseLeave={(e) => gsap.to(e.currentTarget, { y: 0, scale: 1, duration: 0.4 })}
                role="button"
                style={{ 
                  textAlign: 'center', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1,
                  padding: '20px 0',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  touchAction: 'manipulation'
                }}
              >
                {/* Background Glow Halo */}
                <div style={{ 
                  position: 'absolute', 
                  width: '60px', 
                  height: '60px', 
                  background: `radial-gradient(circle, ${s.color}15 0%, transparent 70%)`,
                  borderRadius: '50%',
                  top: '15%',
                  pointerEvents: 'none'
                }} />

                <div style={{ color: s.color, filter: `drop-shadow(0 0 10px ${s.color}60)`, marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '32px', fontWeight: '950', color: 'var(--text-primary)', lineHeight: '1', fontFamily: 'Outfit, sans-serif', letterSpacing: '-1.5px' }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: 'rgba(var(--theme-rgb), 0.6)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'Outfit, sans-serif' }}>{s.label}</div>
                
                {/* Bottom Neon Indicator */}
                <div style={{ 
                  width: '20px', 
                  height: '2px', 
                  background: s.color, 
                  marginTop: '12px', 
                  borderRadius: '2px', 
                  boxShadow: `0 0 10px ${s.color}80`,
                  opacity: 0.4
                }} />
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* 2. MIDDLE: Start Workout CTA */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', perspective: '1000px' }}>
        <button
          onClick={onStartWorkout}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="pulse-elite antigravity-card"
          role="button"
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-primary)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '24px',
            width: '100%',
            fontFamily: 'Outfit, sans-serif',
            transformStyle: 'preserve-3d',
            touchAction: 'manipulation'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', transformStyle: 'preserve-3d' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateZ(40px)' }}>
              {workoutWords.map((word: string, i: number) => (
                <div key={i} className="premium-title" style={{ 
                  fontSize: '48px', 
                  lineHeight: '0.9',
                  marginBottom: '4px'
                }}>
                  {word}
                </div>
              ))}
            </div>
          </div>
          
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '950', 
            color: 'var(--accent-color)', 
            letterSpacing: '5px', 
            opacity: 0.8,
            textTransform: 'uppercase',
            fontFamily: 'Outfit, sans-serif',
            transform: 'translateZ(20px)'
          }}>TAP TO BEGIN</span>
        </button>
      </div>

      {/* 3. BOTTOM: Last Session */}
      <div style={{ transformStyle: 'preserve-3d' }}>
        {recentLog ? (
          <div 
            onClick={() => onTabSwitch('history')}
            className="antigravity-card" 
            role="button"
            style={{ 
              borderTop: '1px solid rgba(var(--theme-rgb), 0.05)', 
              paddingTop: '20px',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', opacity: 0.7 }}>
              <Flame size={12} color="var(--accent-color)" />
              <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'Outfit, sans-serif' }}>{t('lastSession')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif' }}>
                  {MUSCLE_GROUPS.find(m => m.key === recentLog.muscleGroup)?.[lang] ?? recentLog.muscleGroup}
                </div>
                <div style={{ width: '1px', height: '15px', background: 'rgba(var(--theme-rgb), 0.08)' }} />
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
                  <span style={{ color: 'var(--accent-color)' }}>{totalVolume.toFixed(0)}</span> {unit}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(var(--theme-rgb), 0.5)', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>
                {formatDate(recentLog.date, lang)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', opacity: 0.2 }}>
            <div style={{ fontSize: '9px', fontWeight: '950', letterSpacing: '3px', fontFamily: 'Outfit, sans-serif' }}>NO RECENT MISSIONS</div>
          </div>
        )}
      </div>

    </div>
  );
}
