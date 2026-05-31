import React, { useRef, useState, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';

import { TransparentImage } from '../workout/components/TransparentImage';

interface DashboardProps {
  tracker: ReturnType<typeof useGymTracker>;
  onStartWorkout: () => void;
  onTabSwitch: (tab: 'home' | 'history' | 'progress' | 'nutrition' | 'settings') => void;
}

function formatTime(timeStr: string, _lang: 'ar' | 'en') {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
}

function formatDate(iso: string, lang: 'ar' | 'en') {
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const Dashboard: React.FC<DashboardProps> = ({ tracker, onStartWorkout }) => {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const containerRef = useRef<HTMLDivElement>(null);
  const recentLog = tracker.logs[0];

  // Removed unused volume memo

  const recentGroupKeys = React.useMemo(() => {
    if (!recentLog) return [];
    const exerciseToMuscle: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex] = group; });
    });

    const involvedGroups = new Set<string>();
    recentLog.exercises.forEach(ex => {
      const group = (ex as any).muscleGroup || exerciseToMuscle[ex.name] || recentLog.muscleGroup;
      if (group) involvedGroups.add(group);
    });

    return Array.from(involvedGroups).sort();
  }, [recentLog]);

  const recentGroups = React.useMemo(() => {
    return recentGroupKeys.map(g => {
      const mg = MUSCLE_GROUPS.find(m => m.key === g);
      return mg?.[lang] ?? g;
    });
  }, [recentGroupKeys, lang]);

  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [todayStr, setTodayStr] = useState(getTodayStr);

  // Refresh todayStr every 60s and when app comes back to foreground
  useEffect(() => {
    const refresh = () => setTodayStr(getTodayStr());
    const interval = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const hasWorkoutToday = tracker.logs.some(log => {
    const logDate = new Date(log.date);
    const logLocalDate = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
    return logLocalDate === todayStr || log.date.startsWith(todayStr);
  });

  return (
    <div ref={containerRef} style={{
      display: 'flex', flexDirection: 'column',
      width: '100%',
      flex: 1,
      padding: '0 0px 0px', 
      transformStyle: 'preserve-3d',
      justifyContent: 'space-between', 
      height: '100%',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes gymlog-pulse-glow {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        .gymlog-pulse-active {
          animation: gymlog-pulse-glow 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* 1. TOP: Weekly Training Goal Progress Bar */}
      {(() => {
        const weeklyCount = tracker.getWeeklyCount();
        const isGoalCompleted = weeklyCount >= 4;
        return (
          <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '950', 
                color: isGoalCompleted ? 'var(--accent-color)' : 'var(--text-secondary)', 
                letterSpacing: '2px', 
                textTransform: 'uppercase',
                transition: 'color 0.3s ease'
              }}>
                {isGoalCompleted 
                  ? t('weeklyGoalCompleted') 
                  : t('weeklyTrainingGoal')}
              </span>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '950', 
                color: isGoalCompleted ? 'var(--accent-color)' : 'var(--text-secondary)', 
                fontFamily: "var(--heading-font)",
                transition: 'color 0.3s ease'
              }}>
                {weeklyCount} / 4 {t('workouts').toUpperCase()}
              </span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '6px', 
              background: 'rgba(var(--theme-rgb), 0.14)', 
              borderRadius: '3px', 
              overflow: 'hidden', 
              border: isGoalCompleted ? '1px solid var(--accent-color)' : '1px solid rgba(var(--theme-rgb), 0.18)',
              transition: 'border-color 0.3s ease'
            }}>
              <div style={{ 
                width: `${Math.min(100, (weeklyCount / 4) * 100)}%`, 
                height: '100%', 
                background: 'var(--accent-color)', 
                borderRadius: '3px',
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>
          </div>
        );
      })()}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '12vh 16px 0 16px' }}>
        <div
          onClick={onStartWorkout}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
          onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
          style={{
            cursor: 'pointer',
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '230px',
            margin: '0 auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            position: 'relative'
          }}
        >
          <img 
            src={hasWorkoutToday 
              ? (tracker.settings.themeMode === 'light' ? "/assets/stopwatch-stop-light.png" : "/assets/stopwatch-stop.png") 
              : (tracker.settings.themeMode === 'light' ? "/assets/stopwatch-ultra-clean-v3-light.png" : "/assets/stopwatch-ultra-clean-v3.png")}
            alt={hasWorkoutToday ? "Resume" : "Start"}  
            style={{ 
              width: '100%', 
              height: 'auto', 
              objectFit: 'contain',
              willChange: 'transform, filter',
              display: 'block'
            }} 
          />
        </div>
      </div>

      {/* 3. BOTTOM: Detailed Last Session */}
      <div style={{ transformStyle: 'preserve-3d', marginBottom: '0px' }}>
        {recentLog ? (
          <div 
          style={{ 
            padding: '24px 20px 16px 32px', 
            background: 'rgba(var(--theme-rgb), 0.03)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderTop: tracker.settings.themeMode === 'dark' 
              ? '1px solid rgba(230, 126, 34, 0.2)' 
              : '1px solid rgba(0,0,0,0.08)',
            boxShadow: 'var(--elite-shadow)',
            margin: '0 0 -10px',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '20%', 
            bottom: '20%', 
            width: '4px', 
            background: 'var(--accent-secondary)', 
            borderRadius: '2px',
            zIndex: 10
          }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/assets/flame-custom.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                <span style={{ fontSize: '11px', fontWeight: '950', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "var(--heading-font)" }}>{t('lastSession')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(var(--theme-rgb), 0.6)', fontWeight: '800' }}>
                  <img src="/assets/calendar-custom.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  <span>{formatDate(recentLog.date, lang)}</span>
                </div>
                {recentLog.startTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(var(--theme-rgb), 0.6)', fontWeight: '800' }}>
                    <img src="/assets/clock-custom.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <span>{formatTime(recentLog.startTime, lang)}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {recentGroupKeys.map(g => {
                    const mg = MUSCLE_GROUPS.find(m => m.key === g);
                    return mg?.icon ? (
                      <TransparentImage 
                        key={g} src={mg.icon} alt="" width={48} height={48} threshold={45}
                        style={{ filter: 'none' }}
                      />
                    ) : <span key={g} style={{ fontSize: '24px' }}>💪</span>;
                  })}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '21px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : 'var(--text-primary)', 
                    letterSpacing: '-0.8px', fontFamily: "var(--heading-font)", lineHeight: 1,
                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    {recentGroups.length === 0 ? (
                      ''
                    ) : recentGroups.length === 1 ? (
                      recentGroups[0]
                    ) : (
                      <>
                        <span>{recentGroups[0]}</span>
                        <span style={{ 
                          fontSize: '18px', 
                          color: 'var(--accent-secondary)', 
                          opacity: 0.85, 
                          transform: 'translateY(1.5px)', 
                          display: 'inline-block',
                          fontWeight: '800'
                        }}>&</span>
                        <span>{recentGroups[1]}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>


            </div>
          </div>
        ) : (
          <div 
            onClick={onStartWorkout}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{
              padding: '10px 20px', 
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              margin: '0 auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            <img 
              src="/assets/start-first-training.png" 
              alt="Start First Training"
              style={{
                width: '100%',
                maxWidth: '280px',
                height: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
