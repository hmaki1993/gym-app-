import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';

import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
}

const MiniChart = React.memo(function MiniChart({ data, color, title }: { data: { date: string; value: number }[]; color: string, title: string }) {
  if (data.length < 2) return null;
  // Limit to last 8 sessions for an elite visual density
  const recentData = data.slice(-8);
  const W = 320, H = 130;
  const vals = recentData.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max > min ? max - min : 1;

  const pts = recentData.map((d, i) => {
    // Spread points across W.
    const x = (i / (recentData.length - 1)) * (W - 40) + 20;
    const y = max > min 
      ? H - 25 - ((d.value - min) / range) * (H - 45)
      : H / 2;
    return { x, y, val: d.value, date: new Date(d.date) };
  });

  const getStepPath = (points: {x: number, y: number}[]) => {
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      // Horizontal to the new X, then Vertical to the new Y. This creates actual "steps".
      d += ` L ${curr.x},${points[i-1].y} L ${curr.x},${curr.y}`;
    }
    return d;
  };

  const pathD = getStepPath(pts);
  const gridId = `grid-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div style={{ 
      width: '100%', 
      background: 'rgba(0, 0, 0, 0.25)', 
      borderRadius: '20px', 
      border: '1.5px solid rgba(var(--theme-rgb), 0.12)', 
      padding: '20px 12px 8px', 
      marginTop: '16px', 
      overflow: 'hidden', 
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      transform: 'translate3d(0, 0, 0)',
      willChange: 'transform',
    }}>
      <svg width="100%" viewBox={`0 0 ${W} 155`} style={{ overflow: 'visible', transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}>
        <defs>
          {/* Subtle technical grid background */}
          <pattern id={gridId} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(var(--theme-rgb), 0.3)" strokeWidth="0.8" shapeRendering="optimizeSpeed" />
          </pattern>
        </defs>

        <rect width="100%" height={H} fill={`url(#${gridId})`} opacity="0.6" shapeRendering="optimizeSpeed" />
        
        {/* Step Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" shapeRendering="optimizeSpeed" />

        {pts.map((p, i) => {
          const isMax = p.val === max;
          const isLast = i === pts.length - 1;
          const isFirst = i === 0;
          const dateStr = p.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
          const textAnchor = isFirst ? "start" : (isLast ? "end" : "middle");

          return (
            <React.Fragment key={i}>
              {/* Connector Nodes */}
              <circle cx={p.x} cy={p.y} r={isMax || isLast ? "6" : "4"} fill="var(--primary-bg)" stroke={isMax ? '#ff9500' : color} strokeWidth="2" shapeRendering="optimizeSpeed" />
              <circle cx={p.x} cy={p.y} r={isMax || isLast ? "2.5" : "1.5"} fill={isMax ? '#ff9500' : color} shapeRendering="optimizeSpeed" />
              
              {/* Values */}
              <text x={p.x} y={p.y - 12} fill={isMax ? '#ff9500' : "var(--text-primary)"} fontSize={isMax ? "12" : "10"} fontWeight="950" textAnchor={textAnchor}>
                {p.val}
              </text>
              
              {/* Dates */}
              <text x={p.x} y={H + 18} fill="var(--text-secondary)" fontSize="8.5" fontWeight="800" textAnchor={textAnchor} opacity={isLast ? "0.9" : "0.5"} letterSpacing="0.5px">
                {dateStr}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
});

const ExerciseHistoryDetails = React.memo(function ExerciseHistoryDetails({ 
  sessions, 
  lang, 
  isOpen,
  toggleOpen
}: { 
  sessions: any[]; 
  lang: string; 
  isOpen: boolean;
  toggleOpen: () => void;
}) {
  const t = (k: keyof typeof translations.en) => (translations[lang as 'en' | 'ar'] as any)[k] ?? k;
  const [showAll, setShowAll] = useState(false);

  const visibleSessions = showAll ? sessions : sessions.slice(0, 3);

  if (sessions.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {isOpen && (
        <div style={{ marginTop: '6px' }}>
          <div 
            className="details-inner"
            style={{
              padding: '4px 0 0 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              animation: 'fadeSlideDown 0.15s ease-out forwards',
            }}
          >

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visibleSessions.map((sess: any, sIdx: number) => (
                  <div key={sIdx} style={{ 
                    background: 'rgba(var(--theme-rgb), 0.02)', 
                    borderRadius: '16px', 
                    padding: '12px',
                    border: '1px solid rgba(var(--theme-rgb), 0.05)',
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ 
                        width: '4px', 
                        height: '14px', 
                        background: 'var(--accent-color)', 
                        borderRadius: '4px',
                        opacity: 0.7 
                      }} />
                      {sess.displayDate}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {sess.sets.map((set: any, setIdx: number) => (
                        <div 
                          key={setIdx} 
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 8px',
                            borderRadius: '10px',
                            background: set.isThisBest
                              ? 'rgba(var(--accent-rgb), 0.12)'
                              : 'rgba(var(--theme-rgb), 0.07)',
                            border: set.isThisBest
                              ? '1px solid rgba(var(--accent-rgb), 0.3)'
                              : '1px solid rgba(var(--theme-rgb), 0.08)',
                            minWidth: '52px',
                            gap: '1px',
                          }}
                        >
                          <span style={{ 
                            fontSize: '8px', 
                            fontWeight: '800', 
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {lang === 'ar' ? `${set.setNumber}` : `S${set.setNumber}`}
                          </span>
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: '900', 
                            color: set.isThisBest ? 'var(--accent-color)' : 'var(--text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.3px',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '1px'
                          }}>
                            {set.weightText}<span style={{ fontSize: '9px', fontWeight: '800', color: set.isThisBest ? 'var(--accent-color)' : 'var(--text-secondary)', opacity: set.isThisBest ? 0.9 : 0.6 }}>{set.unitText}</span>
                          </span>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '800', 
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                            opacity: 0.9
                          }}>
                            {set.reps} {t('reps')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {sessions.length > 3 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAll(prev => !prev); }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    marginTop: '4px',
                    background: 'rgba(var(--theme-rgb), 0.04)',
                    border: '1px dashed rgba(var(--theme-rgb), 0.15)',
                    borderRadius: '10px',
                    color: 'var(--accent-color)',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                >
                  {showAll 
                    ? t('showFewerSessions')
                    : `${t('showOlderSessions')} (+${sessions.length - 3})`}
                </button>
              )}
          </div>
        </div>
      )}

      <button 
        onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
        style={{
          width: '100%',
          marginTop: isOpen ? '20px' : '4px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '12px',
          fontWeight: '950',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          transition: 'color 0.25s ease, background-color 0.25s ease',
          outline: 'none',
          gap: '6px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <img src="/assets/gears-custom.png" style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="Sessions" />
          {t('showSetsReps')} 
          <span style={{ color: 'var(--accent-color)', marginLeft: '4px' }}>({sessions.length})</span>
        </span>
      </button>
    </>
  );
});

const ExerciseProgressCard = React.memo(function ExerciseProgressCard({
  name,
  history,
  sessions,
  latest,
  diff,
  exerciseUnit,
  tracker,
  lang,
  t,
  isOpen,
  onToggle
}: {
  name: string;
  history: any[];
  sessions: any[];
  latest: number;
  diff: number;
  exerciseUnit: string;
  tracker: any;
  lang: string;
  t: any;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isLight = tracker.settings.themeMode === 'light';
  const isDark = tracker.settings.themeMode === 'dark';

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <div 
      id={`exercise-${name.replace(/[^a-zA-Z0-9]/g, '')}`}
      ref={cardRef}
      onClick={handleCardClick}
      style={{ 
        padding: '20px',
        background: isOpen 
          ? (isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)')
          : (isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'),
        border: isOpen
          ? '1.5px solid rgba(255, 140, 0, 0.7)'
          : (isDark ? '1.5px solid rgba(255, 255, 255, 0.08)' : '1.5px solid rgba(0, 0, 0, 0.08)'),
        boxShadow: isDark
          ? '0 8px 24px rgba(0,0,0,0.5)'
          : '0 8px 24px rgba(0, 0, 0, 0.08)',
        borderRadius: '20px',
        margin: '0 4px 16px 4px',
        position: 'relative',
        transition: 'background-color 0.22s ease, border-color 0.22s ease',
        overflow: 'hidden',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'background-color, border-color'
      }}
    >
      {/* Top-right expand/collapse control */}
      <div style={{ 
        position: 'absolute', top: '12px', right: '12px', 
        display: 'flex', alignItems: 'center', gap: '4px', zIndex: 20,
        background: 'transparent',
        padding: '4px 6px', borderRadius: '12px',
        border: isDark ? '1px dashed rgba(var(--theme-rgb), 0.2)' : '1px dashed rgba(0,0,0,0.1)',
      }}>
        <button 
          onClick={handleCardClick} 
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'var(--accent-color)', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)' 
          }}
        >
          <img src="/assets/arrow-custom.png" alt="Toggle" style={{ width: '22px', height: '22px', objectFit: 'contain', transform: 'rotate(90deg)' }} />
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        style={{ 
          cursor: 'pointer', 
          position: 'relative'
        }}
      >

        {/* Exercise Name + Latest Weight */}
        <div style={{ paddingRight: '40px' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '22px', 
            fontWeight: '950', 
            color: isDark ? '#fff' : 'var(--text-primary)', 
            letterSpacing: '-0.5px',
            lineHeight: 1.2
          }}>
            {name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ 
                fontSize: '22px', 
                fontWeight: '950', 
                color: 'var(--accent-color)', 
                fontFamily: "var(--heading-font)",
                lineHeight: 1
              }}>
                {latest}
              </span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '900', 
                color: isLight ? 'rgba(var(--theme-rgb), 0.6)' : 'rgba(var(--theme-rgb), 0.5)',
                textTransform: 'uppercase'
              }}>
                {t(exerciseUnit as any)}
              </span>
            </div>
            {history.length >= 2 && diff !== 0 && (
              <>
                <div style={{ width: '1.5px', height: '14px', background: 'rgba(var(--theme-rgb), 0.15)' }} />
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '950', 
                  color: diff > 0 ? 'var(--success-color)' : 'var(--danger-color)', 
                  fontFamily: "var(--heading-font)",
                  background: diff > 0 ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {diff > 0 ? '↑' : '↓'} {diff > 0 ? '+' : ''}{diff} {t(exerciseUnit as any)}
                </span>
              </>
            )}
            {history.length >= 2 && (
              <>
                <div style={{ width: '1.5px', height: '14px', background: 'rgba(var(--theme-rgb), 0.15)' }} />
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: '950', 
                  color: isLight ? 'rgba(var(--theme-rgb), 0.5)' : 'rgba(var(--theme-rgb), 0.4)',
                  letterSpacing: '0.5px'
                }}>
                  {history.length} {t('sessions')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart always visible in card - pre-rendered, zero cost on open */}
      {history.length >= 2 && (
        <div style={{ marginTop: '12px' }}>
          <MiniChart data={history} color="var(--accent-color)" title={name} />
        </div>
      )}

      <ExerciseHistoryDetails 
        sessions={sessions} 
        lang={lang} 
        isOpen={isOpen}
        toggleOpen={onToggle}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.lang === nextProps.lang &&
    prevProps.history === nextProps.history &&
    prevProps.sessions === nextProps.sessions &&
    prevProps.tracker.settings.themeMode === nextProps.tracker.settings.themeMode &&
    prevProps.tracker.logs === nextProps.tracker.logs
  );
});

export const ProgressPage: React.FC<Props> = ({ tracker }) => {
  const lang = tracker.settings.language;
  const t = useCallback((k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k, [lang]);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [expandedExerciseName, setExpandedExerciseName] = useState<string | null>(null);

  // Auto-scroll natively AFTER the CSS transition to avoid layout thrashing
  useEffect(() => {
    if (!expandedExerciseName) return;

    // Wait exactly 250ms for the 0.22s CSS transition to fully complete
    const timer = setTimeout(() => {
      const elementId = `exercise-${expandedExerciseName.replace(/[^a-zA-Z0-9]/g, '')}`;
      const element = document.getElementById(elementId);
      if (!element) return;

      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 250);

    return () => clearTimeout(timer);
  }, [expandedExerciseName]);

  // Memoize week calculations to avoid re-running date logic on every card toggle
  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      const day = d.getDay();
      const diff = (day + 1) % 7;
      d.setDate(d.getDate() - diff + i);
      return d.toDateString();
    });
  }, []);

  const weekCounts = React.useMemo(() => {
    return weekDays.map(day =>
      tracker.logs.filter(l => new Date(l.date).toDateString() === day).length
    );
  }, [tracker.logs, weekDays]);

  const filteredLogs = React.useMemo(() => {
    return selectedDay 
      ? tracker.logs.filter(l => new Date(l.date).toDateString() === selectedDay)
      : tracker.logs;
  }, [tracker.logs, selectedDay]);

  const totalWorkouts = filteredLogs.length;

  const weeklyCount = React.useMemo(() => {
    return tracker.getWeeklyCount();
  }, [tracker.logs]);

  const loggedMuscles = React.useMemo(() => {
    const mapping: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { mapping[ex.trim().toLowerCase()] = group; });
    });
    const allCustomSources = [
      tracker.customExercises,
      (tracker as any).hiddenExercises || {},
      (tracker as any).deletedExercises || {}
    ];
    allCustomSources.forEach(source => {
      Object.entries(source).forEach(([group, exercises]) => {
        (exercises as string[]).forEach(ex => { mapping[ex.trim().toLowerCase()] = group; });
      });
    });

    const freq: Record<string, number> = {};
    tracker.logs.forEach(log => {
      if (log.muscleGroup) {
        freq[log.muscleGroup] = (freq[log.muscleGroup] || 0) + 1;
      }
      log.exercises.forEach(ex => {
        const group = mapping[ex.name.trim().toLowerCase()] || (ex as any).muscleGroup;
        if (group) {
          freq[group] = (freq[group] || 0) + 1;
        }
      });
    });
    
    return Object.keys(freq).sort((a, b) => {
      if (freq[a] !== freq[b]) return freq[b] - freq[a]; // Highest frequency first
      const indexA = MUSCLE_GROUPS.findIndex(m => m.key === a);
      const indexB = MUSCLE_GROUPS.findIndex(m => m.key === b);
      return indexA - indexB;
    });
  }, [tracker.logs, tracker.customExercises]);

  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(loggedMuscles.length > 0 ? loggedMuscles[0] : null);

  useEffect(() => {
    if (!selectedMuscle && loggedMuscles.length > 0) {
      setSelectedMuscle(loggedMuscles[0]);
    }
  }, [tracker.logs.length]);

  // Reset expanded exercise card when changing filters
  useEffect(() => {
    setExpandedExerciseName(null);
  }, [selectedMuscle, selectedDay]);

  const { topExercises, exerciseToMuscle } = React.useMemo(() => {
    const freq: Record<string, number> = {};
    const mapping: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { mapping[ex.trim().toLowerCase()] = group; });
    });
    const allCustomSources = [
      tracker.customExercises,
      (tracker as any).hiddenExercises || {},
      (tracker as any).deletedExercises || {}
    ];
    allCustomSources.forEach(source => {
      Object.entries(source).forEach(([group, exercises]) => {
        (exercises as string[]).forEach(ex => { mapping[ex.trim().toLowerCase()] = group; });
      });
    });

    tracker.logs.forEach(log => {
      log.exercises.forEach(ex => {
        const exNameKey = ex.name.trim().toLowerCase();
        const group = mapping[exNameKey] || (ex as any).muscleGroup || log.muscleGroup;
        if (group === selectedMuscle) {
          freq[ex.name] = (freq[ex.name] ?? 0) + 1;
        }
      });
    });
    return { topExercises: Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([name]) => name), exerciseToMuscle: mapping };
  }, [tracker.logs, selectedMuscle, tracker.customExercises]);

  // Memoize history computation for all top exercises in active muscle group
  // Pre-compute EVERYTHING here (sessions, dates, sets) so clicking a card triggers ZERO computation
  const exercisesHistoryData = React.useMemo(() => {
    return topExercises.map(name => {
      const history: { date: string; value: number }[] = [];
      const sessions: { date: string; sets: any[]; displayDate: string }[] = [];
      const exerciseUnit = tracker.getDisplayUnit(name);
      
      for (const log of [...tracker.logs].reverse()) {
        const ex = log.exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
        const group = exerciseToMuscle[name.toLowerCase()] || log.muscleGroup;
        if (group !== selectedMuscle) continue;
        if (ex && ex.sets && ex.sets.length > 0) {
          const max = Math.max(...ex.sets.map(s => tracker.convertWeight(s.weight, s.unit || 'kg', exerciseUnit)));
          history.push({ date: log.date, value: Number(max.toFixed(1)) });

          const bestSet = ex.sets.reduce((best, s) => {
            const sInKg = tracker.convertWeight(s.weight, s.unit || 'kg', 'kg');
            const bestInKg = tracker.convertWeight(best.weight, best.unit || 'kg', 'kg');
            return sInKg > bestInKg ? s : best;
          }, ex.sets[0]);

          const displayDate = new Date(log.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short',
            year: '2-digit'
          });

          const precomputedSets = ex.sets.map((set, setIdx) => {
            const convertedWeight = tracker.convertWeight(set.weight, set.unit || 'kg', exerciseUnit);
            const roundedWeight = Number(convertedWeight.toFixed(1));
            
            const isThisBest = set === bestSet || (
              Math.abs(
                tracker.convertWeight(set.weight, set.unit || 'kg', 'kg') - 
                tracker.convertWeight(bestSet.weight, bestSet.unit || 'kg', 'kg')
              ) < 0.01
            );

            return {
              weightText: `${roundedWeight}`,
              unitText: t(exerciseUnit as any),
              reps: set.reps,
              isThisBest,
              setNumber: setIdx + 1
            };
          });

          sessions.push({
            date: log.date,
            displayDate,
            sets: precomputedSets
          });
        }
      }

      if (history.length === 0) return null;

      const latest = history[history.length - 1].value;
      const first = history[0].value;
      const diff = history.length >= 2 ? Number((latest - first).toFixed(1)) : 0;

      return {
        name,
        history,
        sessions,
        latest,
        diff,
        exerciseUnit
      };
    }).filter(Boolean) as { name: string; history: { date: string; value: number }[]; sessions: any[]; latest: number; diff: number; exerciseUnit: string }[];
  }, [tracker.logs, selectedMuscle, topExercises, exerciseToMuscle, lang, t]);

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', padding: '10px 4px 200px 4px' }}
    >
      <div style={{ position: 'relative' }}>
        {selectedDay && (
          <button onClick={() => setSelectedDay(null)} style={{ position: 'absolute', top: '-15px', right: '0', background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '10px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('showAll')} ✓</button>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: 'rgba(var(--theme-rgb), 0.16)', borderRadius: '24px', border: '1.5px solid rgba(var(--theme-rgb), 0.12)',  }}>
          {[
            { label: selectedDay ? t('dayLogs') : t('thisWeek'), value: selectedDay ? totalWorkouts : weeklyCount, sub: t('workouts'), icon: <img src="/assets/calendar-custom.png" style={{ width: 22, height: 22, objectFit: 'contain', margin: '0 auto' }} alt="" /> },
            { label: selectedDay ? t('logDate') : t('allTime'), value: selectedDay ? new Date(selectedDay).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }) : tracker.logs.length, sub: t('workouts'), icon: <img src="/assets/trophy-custom.png" style={{ width: 22, height: 22, objectFit: 'contain', margin: '0 auto' }} alt="" /> },
          ].map((card, index) => (
            <div key={card.label} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '24px' }}>{card.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--accent-color)', lineHeight: '1', letterSpacing: '-0.5px', fontFamily: "var(--heading-font)" }}>{card.value}</div>
              <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>{card.label}</div>
              {index < 1 && <div style={{ position: 'absolute', right: 0, top: '15%', bottom: '15%', width: '1.5px', background: 'rgba(var(--theme-rgb), 0.2)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 0', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--accent-color)', maskImage: "url('/assets/this-week-icon.png')", WebkitMaskImage: "url('/assets/this-week-icon.png')", maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center', flexShrink: 0 }} />
          <span className="section-label">{t('thisWeek')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
          {weekDays.map((day, i) => {
            const isToday = new Date().toDateString() === day;
            const isSelected = selectedDay === day;
            const count = weekCounts[i];
            const height = count > 0 ? Math.max(34, count * 25) : 24;
            const dayLabel = new Date(day).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short' });
            return (
              <div key={day} onClick={() => setSelectedDay(isSelected ? null : day)} role="button" className="day-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', cursor: 'pointer', paddingBottom: '5px', height: '100%', transition: 'transform 0.2s ease', pointerEvents: 'auto' }}>
                <div style={{ width: '16px', height: `${height}px`, background: isSelected ? 'var(--text-primary)' : (count > 0 ? 'var(--accent-color)' : (isToday ? 'rgba(255, 140, 0, 0.5)' : 'rgba(var(--theme-rgb), 0.3)')), borderRadius: '12px', border: isSelected ? '2px solid var(--text-primary)' : (isToday ? '1px solid rgba(255, 140, 0, 0.6)' : 'none'), transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: (selectedDay && !isSelected) ? 0.3 : 1 }} />
                <span style={{ fontSize: '11px', fontWeight: '950', color: isSelected ? 'var(--accent-color)' : (isToday ? '#ff8c00' : 'var(--text-primary)'), textTransform: 'uppercase', opacity: 1, letterSpacing: '0.5px' }}>{dayLabel.slice(0, 2)}</span>
              </div>
            );
          })}
        </div>
        <style>{`@keyframes pulse-orange { 0% { box-shadow: 0 0 5px rgba(255, 140, 0, 0.2); border-color: rgba(255, 140, 0, 0.3); } 50% { box-shadow: 0 0 15px rgba(255, 140, 0, 0.6); border-color: rgba(255, 140, 0, 0.8); } 100% { box-shadow: 0 0 5px rgba(255, 140, 0, 0.2); border-color: rgba(255, 140, 0, 0.3); } } .day-column:active { transform: scale(0.9); }`}</style>
      </div>


      {loggedMuscles.length > 0 && (
        <div style={{ padding: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', width: '100%' }}>
            <div style={{ 
              width: '32px', height: '32px',
              backgroundColor: 'var(--accent-color)', 
              maskImage: "url('/assets/progress-icon-custom.png')", 
              WebkitMaskImage: "url('/assets/progress-icon-custom.png')", 
              maskSize: 'contain', WebkitMaskSize: 'contain', 
              maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center', WebkitMaskPosition: 'center',
              flexShrink: 0
            }} />
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '16px', overflowX: 'auto', flex: 1, alignItems: 'center', paddingBottom: '4px' }}>
              {loggedMuscles.map(mgKey => {
                const m = MUSCLE_GROUPS.find(mg => mg.key === mgKey);
                if (!m) return null;
                const isActive = selectedMuscle === m.key;
                return (
                  <button key={m.key} onClick={() => setSelectedMuscle(m.key)} style={{ flexShrink: 0, padding: '4px', borderRadius: '14px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={m.icon} alt={m.en} style={{ 
                      width: '46px', height: '46px', 
                      objectFit: 'contain',
                      opacity: isActive ? 1 : 0.35,
                      filter: isActive ? 'none' : 'grayscale(100%)',
                      transform: isActive ? 'scale(1.15)' : 'scale(0.95)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </button>
                );
              })}
            </div>
          </div>
          <div ref={chartsContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {exercisesHistoryData.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' }}>{t('noData')}</div>
            ) : (
              (() => {
                const charts = exercisesHistoryData.map(item => {
                  return (
                    <ExerciseProgressCard
                      key={item.name}
                      name={item.name}
                      history={item.history}
                      sessions={item.sessions}
                      latest={item.latest}
                      diff={item.diff}
                      exerciseUnit={item.exerciseUnit}
                      tracker={tracker}
                      lang={lang}
                      t={t}
                      isOpen={expandedExerciseName === item.name}
                      onToggle={() => setExpandedExerciseName(expandedExerciseName === item.name ? null : item.name)}
                    />
                  );
                });
                if (charts.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '30px 20px', opacity: 0.8 }}>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>📈</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{t('moreWorkoutsNeeded')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{t('noChartDescription')}</div>
                    </div>
                  );
                }
                return charts;
              })()
            )}
          </div>
        </div>
      )}

      {tracker.logs.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px', fontSize: '14px' }}>{t('noData')}</div>
      )}
    </div>
  );
}
