import React, { useRef } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';
import { Flame, Calendar, Clock } from 'lucide-react'; 
import { TransparentImage } from '../workout/components/TransparentImage';

interface DashboardProps {
  tracker: ReturnType<typeof useGymTracker>;
  onStartWorkout: () => void;
  onTabSwitch: (tab: 'home' | 'history' | 'progress' | 'nutrition' | 'settings') => void;
}

function formatTime(timeStr: string, lang: 'ar' | 'en') {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? (lang === 'ar' ? 'م' : 'pm') : (lang === 'ar' ? 'ص' : 'am');
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

  const recentDisplayTitle = React.useMemo(() => {
    if (!recentLog) return '';
    const exerciseToMuscle: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex] = group; });
    });

    const involvedGroups = new Set<string>();
    recentLog.exercises.forEach(ex => {
      const group = exerciseToMuscle[ex.name];
      if (group) involvedGroups.add(group);
      else involvedGroups.add(recentLog.muscleGroup);
    });

    return Array.from(involvedGroups).sort().map(g => {
      const mg = MUSCLE_GROUPS.find(m => m.key === g);
      return mg?.[lang] ?? g;
    }).join(' & ');
  }, [recentLog, lang]);

  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

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
                  ? (lang === 'ar' ? 'اكتمل هدف الأسبوع! 🎉' : 'WEEKLY GOAL COMPLETED! 🎉') 
                  : (lang === 'ar' ? 'الهدف الأسبوعي للتمرين' : 'WEEKLY TRAINING GOAL')}
              </span>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '950', 
                color: isGoalCompleted ? 'var(--accent-color)' : 'var(--text-secondary)', 
                fontFamily: "'Montserrat', sans-serif",
                transition: 'color 0.3s ease'
              }}>
                {weeklyCount} / 4 {lang === 'ar' ? 'تمارين' : 'WORKOUTS'}
              </span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '6px', 
              background: 'rgba(var(--theme-rgb), 0.05)', 
              borderRadius: '3px', 
              overflow: 'hidden', 
              border: isGoalCompleted ? '1px solid var(--accent-color)' : '1px solid rgba(var(--theme-rgb), 0.08)',
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '0 16px' }}>
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
            WebkitUserSelect: 'none'
          }}
        >
          <img 
            src="/assets/stopwatch-ultra-clean-v3.png" 
            alt={hasWorkoutToday ? "Resume" : "Start"} 
            style={{ 
              width: '100%', 
              height: 'auto', 
              objectFit: 'contain',
              willChange: 'transform, filter'
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
            background: tracker.settings.themeMode === 'dark' 
              ? 'rgba(10, 10, 12, 0.4)' 
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: 'none',
            borderTop: tracker.settings.themeMode === 'dark' 
              ? '1px solid rgba(255,255,255,0.1)' 
              : '1px solid rgba(0,0,0,0.08)',
            boxShadow: tracker.settings.themeMode === 'dark'
              ? '0 -20px 40px rgba(0,0,0,0.8)'
              : '0 -10px 30px rgba(0,0,0,0.05)',
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
                <Flame size={14} color="var(--accent-secondary)" fill="var(--accent-secondary)" />
                <span style={{ fontSize: '11px', fontWeight: '950', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'Montserrat', sans-serif" }}>{t('lastSession')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', fontWeight: '800' }}>
                  <Calendar size={13} color="var(--accent-color)" />
                  <span>{formatDate(recentLog.date, lang)}</span>
                </div>
                {recentLog.startTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', fontWeight: '800' }}>
                    <Clock size={13} color="var(--accent-color)" />
                    <span>{formatTime(recentLog.startTime, lang)}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {(() => {
                    const exerciseToMuscle: Record<string, string> = {};
                    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
                      exercises.forEach(ex => { exerciseToMuscle[ex] = group; });
                    });
                    const involvedGroups = new Set<string>();
                    recentLog.exercises.forEach(ex => {
                      const group = exerciseToMuscle[ex.name];
                      if (group) involvedGroups.add(group);
                      else involvedGroups.add(recentLog.muscleGroup);
                    });
                    return Array.from(involvedGroups).sort().map(g => {
                      const mg = MUSCLE_GROUPS.find(m => m.key === g);
                      return mg?.icon ? (
                        <TransparentImage 
                          key={g} src={mg.icon} alt="" width={48} height={48} threshold={45}
                          style={{ filter: tracker.settings.themeMode === 'dark' ? 'grayscale(1) brightness(1.2)' : 'grayscale(1) brightness(0.8)' }}
                        />
                      ) : <span key={g} style={{ fontSize: '24px' }}>💪</span>;
                    });
                  })()}
                </div>
                <div>
                  <div style={{ 
                    fontSize: '24px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', 
                    letterSpacing: '-0.8px', fontFamily: "'Montserrat', sans-serif", lineHeight: 1 
                  }}>
                    {recentDisplayTitle}
                  </div>
                </div>
              </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '950', color: 'var(--accent-color)', fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>
                    {recentLog.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} <span style={{ fontSize: '10px', opacity: 0.6 }}> SETS</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {recentLog.exercises.length} EXERCISES
                  </div>
                </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '15px', opacity: 0.2 }}>
            <div style={{ fontSize: '8px', fontWeight: '950', letterSpacing: '2px', color: 'var(--text-secondary)' }}>NO RECENT SESSIONS</div>
          </div>
        )}
      </div>
    </div>
  );
};
