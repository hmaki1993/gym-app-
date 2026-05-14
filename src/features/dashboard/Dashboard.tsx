import React, { useRef } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';
import { Flame, Activity, Award, History as HistoryIcon, Calendar, Clock } from 'lucide-react'; 
import gsap from 'gsap';
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

export const Dashboard: React.FC<DashboardProps> = ({ tracker, onStartWorkout, onTabSwitch }) => {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const containerRef = useRef<HTMLDivElement>(null);
  const weeklyCount = tracker.getWeeklyCount();
  const recentLog = tracker.logs[0];

  const { totalVolume, unit } = React.useMemo(() => {
    if (!recentLog) return { totalVolume: 0, unit: '' };
    const vol = recentLog.exercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((setAcc, set) => setAcc + (Number(set.weight || 0) * Number(set.reps || 0)), 0), 0
    );
    return { totalVolume: vol, unit: tracker.settings.weightUnit || 'kg' };
  }, [recentLog, tracker.settings.weightUnit]);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(btn, {
      rotateY: x * 15,
      rotateX: -y * 15,
      translateZ: 30,
      duration: 0.5,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      rotateY: 0,
      rotateX: 0,
      translateZ: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)'
    });
  };

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

  const workoutWords = (hasWorkoutToday 
    ? (lang === 'ar' ? 'تكملة التمرين' : 'RESUME WORKOUT') 
    : (lang === 'ar' ? 'بدء التمرين' : 'START WORKOUT')
  ).split(' ');

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

      {/* 1. TOP: Stats (Enlarged and Lowered) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px', marginTop: '45px', padding: '0 16px' }}>

{[
          { label: t('thisWeek'), val: weeklyCount, target: 'history' as const, icon: <Activity size={32} />, color: '#b8906a' },
          { label: 'PRs', val: tracker.prs.length, target: 'progress' as const, icon: <Award size={32} />, color: '#b8906a' },
          { label: t('allTime'), val: tracker.logs.length, target: 'history' as const, icon: <HistoryIcon size={32} />, color: '#b8906a' }
        ].map((s, i) => (
          <div key={i} onClick={() => onTabSwitch(s.target)} style={{ textAlign: 'center', cursor: 'pointer', flex: 1, padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: s.color, marginBottom: '8px', opacity: 0.8 }}>{s.icon}</div>
            <div style={{ fontSize: '48px', fontWeight: '950', color: 'var(--text-primary)', lineHeight: '1', fontFamily: 'Outfit', letterSpacing: '-1.5px' }}>{s.val}</div>
            <div style={{ fontSize: '11px', color: 'rgba(var(--theme-rgb), 0.5)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 2. MIDDLE: Elite CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1200px', flex: 1, padding: '0 16px' }}>
        <div
          onClick={onStartWorkout}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="pulse-text-elite"
          style={{
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', transformStyle: 'preserve-3d', textAlign: 'center',
            padding: '20px', width: '100%', maxWidth: '350px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateZ(50px)' }}>
            {workoutWords.map((word, i) => (
              <div key={i} className="premium-title" style={{ 
                fontSize: 'min(16vw, 68px)', 
                lineHeight: '0.85',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                {word}
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: '16px',
            fontSize: '11px', 
            fontWeight: '900', 
            color: 'rgba(255,255,255,0.4)', 
            letterSpacing: '6px',
            textTransform: 'uppercase',
            opacity: 0.8,
            transform: 'translateZ(25px)'
          }}>
            {lang === 'ar' ? 'اضغط للبدء' : 'TAP TO BEGIN'}
          </div>
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
            boxShadow: '0 0 15px rgba(255, 94, 0, 0.6), 0 0 30px rgba(255, 94, 0, 0.3)',
            zIndex: 10
          }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={14} color="var(--accent-secondary)" fill="var(--accent-secondary)" />
                <span style={{ fontSize: '11px', fontWeight: '950', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'Outfit, sans-serif' }}>{t('lastSession')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', fontWeight: '800' }}>
                  <Calendar size={13} color="var(--accent-color)" />
                  <span>{formatDate(recentLog.date, lang)}</span>
                </div>
                {recentLog.startTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888', fontWeight: '800' }}>
                    <Clock size={13} color="#888" />
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
                    letterSpacing: '-0.8px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 
                  }}>
                    {recentDisplayTitle}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '18px', fontWeight: '950', color: 'var(--accent-color)', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                  {totalVolume.toFixed(0)} <span style={{ fontSize: '10px', opacity: 0.6 }}> {t(unit as any)}</span>
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
