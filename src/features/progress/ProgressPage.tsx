import React, { useRef, useEffect, useState } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';

import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
}

function MiniChart({ data, color, title }: { data: { date: string; value: number }[]; color: string, title: string }) {
  if (data.length < 2) return null;
  // Limit to last 8 sessions for an elite visual density
  const recentData = data.slice(-8);
  const W = 320, H = 100;
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
    <div style={{ width: '100%', background: 'transparent', borderRadius: '20px', border: '1.5px solid rgba(var(--theme-rgb), 0.1)', padding: '24px 0 4px', marginTop: '16px', overflow: 'hidden', boxShadow: 'none' }}>
      <svg width="100%" viewBox={`0 0 ${W} 125`} style={{ overflow: 'visible' }}>
        <defs>
          {/* Subtle technical grid background */}
          <pattern id={gridId} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(var(--theme-rgb), 0.15)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="100%" height={H} fill={`url(#${gridId})`} />
        
        {/* Step Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {pts.map((p, i) => {
          const isMax = p.val === max;
          const isLast = i === pts.length - 1;
          const isFirst = i === 0;
          const dateStr = p.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
          const textAnchor = isFirst ? "start" : (isLast ? "end" : "middle");

          return (
            <React.Fragment key={i}>
              {/* Connector Nodes */}
              <circle cx={p.x} cy={p.y} r={isMax || isLast ? "6" : "4"} fill="var(--primary-bg)" stroke={isMax ? '#ff9500' : color} strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r={isMax || isLast ? "2.5" : "1.5"} fill={isMax ? '#ff9500' : color} />
              
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
}

function ExerciseHistoryDetails({ exerciseName, logs, tracker, lang, t }: { exerciseName: string; logs: any[]; tracker: any; lang: string; t: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const sessions = React.useMemo(() => {
    const list: { date: string; sets: any[] }[] = [];
    logs.forEach(log => {
      const ex = log.exercises.find((e: any) => e.name.toLowerCase() === exerciseName.toLowerCase());
      if (ex && ex.sets && ex.sets.length > 0) {
        list.push({
          date: log.date,
          sets: ex.sets
        });
      }
    });
    return list;
  }, [logs, exerciseName]);

  if (sessions.length === 0) return null;

  return (
    <div style={{ marginTop: '12px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(var(--theme-rgb), 0.05)',
          border: '1px solid rgba(var(--theme-rgb), 0.1)',
          borderRadius: '12px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '11.5px',
          fontWeight: '950',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <img src="/assets/calendar-custom.png" style={{ width: '14px', height: '14px', objectFit: 'contain' }} alt="Sessions" />
          {lang === 'ar' ? 'عرض تفاصيل المجاميع والعدات' : 'SHOW SETS & REPS'} 
          <span style={{ color: 'var(--accent-color)', marginLeft: '4px' }}>({sessions.length})</span>
        </span>
        <img 
          src="/assets/arrow-custom.png" 
          alt="Toggle" 
          style={{ 
            width: '12px', 
            height: '12px', 
            objectFit: 'contain', 
            opacity: 0.8, 
            transform: isOpen ? 'rotate(270deg)' : 'rotate(90deg)', 
            transition: 'transform 0.3s ease' 
          }} 
        />
      </button>

      {isOpen && (
        <div style={{
          marginTop: '10px',
          padding: '12px 14px',
          background: 'rgba(var(--theme-rgb), 0.03)',
          border: '1.5px dashed rgba(var(--theme-rgb), 0.08)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slideDown 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
          {sessions.map((sess, sIdx) => {
            const displayDate = new Date(sess.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short',
              year: '2-digit'
            });

            return (
              <div 
                key={sIdx} 
                style={{ 
                  paddingBottom: sIdx === sessions.length - 1 ? '0' : '12px', 
                  borderBottom: sIdx === sessions.length - 1 ? 'none' : '1px solid rgba(var(--theme-rgb), 0.08)' 
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '950', 
                    color: 'var(--text-primary)',
                    opacity: 0.9
                  }}>
                    {displayDate}
                  </span>
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: '950', 
                    background: 'var(--accent-color)', 
                    color: 'var(--primary-bg)', 
                    padding: '2px 8px', 
                    borderRadius: '8px',
                    letterSpacing: '0.5px'
                  }}>
                    {sess.sets.length} {lang === 'ar' ? 'مجموعات' : 'SETS'}
                  </span>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                  gap: '6px' 
                }}>
                  {sess.sets.map((set, setIdx) => {
                    const displayUnit = tracker.getDisplayUnit(exerciseName);
                    const convertedWeight = tracker.convertWeight(set.weight, set.unit || 'kg', displayUnit);
                    const roundedWeight = Number(convertedWeight.toFixed(1));
                    return (
                      <div 
                        key={setIdx} 
                        style={{
                          background: 'rgba(var(--theme-rgb), 0.05)',
                          border: '1px solid rgba(var(--theme-rgb), 0.06)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px'
                        }}
                      >
                        <span style={{ 
                          fontSize: '8px', 
                          fontWeight: '800', 
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          {lang === 'ar' ? `مجموعة ${setIdx + 1}` : `SET ${setIdx + 1}`}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '950', 
                          color: 'var(--accent-color)',
                          fontFamily: "'Montserrat', sans-serif"
                        }}>
                          {roundedWeight} <span style={{ fontSize: '9px', fontWeight: '800' }}>{t(displayUnit as any)}</span>
                        </span>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '950', 
                          color: 'var(--text-primary)'
                        }}>
                          × {set.reps}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const ProgressPage: React.FC<Props> = ({ tracker }) => {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day + 1) % 7;
    d.setDate(d.getDate() - diff + i);
    return d.toDateString();
  });

  const weekCounts = weekDays.map(day =>
    tracker.logs.filter(l => new Date(l.date).toDateString() === day).length
  );

  const filteredLogs = selectedDay 
    ? tracker.logs.filter(l => new Date(l.date).toDateString() === selectedDay)
    : tracker.logs;

  const totalWorkouts = filteredLogs.length;
  const weeklyCount = tracker.getWeeklyCount();

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

  const getExerciseHistory = (name: string) => {
    const history: { date: string; value: number }[] = [];
    const exerciseUnit = tracker.getDisplayUnit(name);
    for (const log of [...tracker.logs].reverse()) {
      const ex = log.exercises.find(e => e.name === name);
      const group = exerciseToMuscle[name.toLowerCase()] || log.muscleGroup;
      if (group !== selectedMuscle) continue;
      if (ex && ex.sets.length > 0) {
        const max = Math.max(...ex.sets.map(s => tracker.convertWeight(s.weight, s.unit || 'kg', exerciseUnit)));
        history.push({ date: log.date, value: Number(max.toFixed(1)) });
      }
    }
    return history;
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', padding: '10px 4px' }}>
      <div style={{ position: 'relative' }}>
        {selectedDay && (
          <button onClick={() => setSelectedDay(null)} style={{ position: 'absolute', top: '-15px', right: '0', background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '10px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>{lang === 'ar' ? 'عرض الكل ✓' : 'SHOW ALL ✓'}</button>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: 'rgba(var(--theme-rgb), 0.16)', borderRadius: '24px', border: '1.5px solid rgba(var(--theme-rgb), 0.12)',  }}>
          {[
            { label: selectedDay ? (lang === 'ar' ? 'تمارين اليوم' : 'DAY LOGS') : t('thisWeek'), value: selectedDay ? totalWorkouts : weeklyCount, sub: t('workouts'), icon: <img src="/assets/calendar-custom.png" style={{ width: 22, height: 22, objectFit: 'contain', margin: '0 auto' }} alt="Calendar" /> },
            { label: selectedDay ? (lang === 'ar' ? 'تاريخ اليوم' : 'LOG DATE') : t('allTime'), value: selectedDay ? new Date(selectedDay).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }) : tracker.logs.length, sub: t('workouts'), icon: <img src="/assets/trophy-custom.png" style={{ width: 22, height: 22, objectFit: 'contain', margin: '0 auto' }} alt="Trophy" /> },
          ].map((card, index) => (
            <div key={card.label} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '24px' }}>{card.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--accent-color)', lineHeight: '1', letterSpacing: '-0.5px', fontFamily: "'Montserrat', sans-serif" }}>{card.value}</div>
              <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>{card.label}</div>
              {index < 1 && <div style={{ position: 'absolute', right: 0, top: '15%', bottom: '15%', width: '1.5px', background: 'rgba(var(--theme-rgb), 0.2)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 0', borderBottom: '1.5px solid rgba(var(--theme-rgb), 0.15)' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
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
            <span className="section-label" style={{ fontSize: '20px' }}>{t('progress')}</span>
          </div>
          <div className="hide-scroll" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px' }}>
            {loggedMuscles.map(mgKey => {
              const m = MUSCLE_GROUPS.find(mg => mg.key === mgKey);
              if (!m) return null;
              const isActive = selectedMuscle === m.key;
              return (
                <button key={m.key} onClick={() => setSelectedMuscle(m.key)} style={{ flexShrink: 0, padding: '4px', borderRadius: '14px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={m.icon} alt={m.en} style={{ 
                    width: '50px', height: '50px', 
                    objectFit: 'contain',
                    opacity: isActive ? 1 : 0.4,
                    filter: isActive ? 'none' : 'grayscale(100%)',
                    transform: isActive ? 'scale(1.15)' : 'scale(0.95)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </button>
              );
            })}
          </div>
          <div ref={chartsContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {topExercises.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' }}>{t('noData')}</div>
            ) : (
              (() => {
                const charts = topExercises.map(name => {
                  const history = getExerciseHistory(name);
                  if (history.length === 0) return null;
                  const latest = history[history.length - 1].value;
                  const first = history[0].value;
                  const diff = history.length >= 2 ? Number((latest - first).toFixed(1)) : 0;
                  const exerciseUnit = tracker.getDisplayUnit(name);
                  return (
                    <div key={name} style={{ background: 'rgba(var(--theme-rgb), 0.04)', padding: '16px 16px 20px', borderRadius: '24px', border: '1.5px solid rgba(var(--theme-rgb), 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '950', color: 'var(--text-primary)' }}>{name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '17px', fontWeight: '950', color: 'var(--accent-color)', fontFamily: "'Montserrat', sans-serif" }}>{latest} {t(exerciseUnit as any)}</span>
                          {history.length >= 2 && diff !== 0 && (
                            <span style={{ fontSize: '11px', fontWeight: '950', color: diff > 0 ? 'var(--success-color)' : 'var(--danger-color)', fontFamily: 'Inter, sans-serif' }}>{diff > 0 ? '+' : ''}{diff} {t(exerciseUnit as any)}</span>
                          )}
                        </div>
                      </div>
                      
                      {history.length >= 2 ? (
                        <MiniChart data={history} color="var(--accent-color)" title={name} />
                      ) : (
                        <div style={{ 
                          fontSize: '10px', 
                          color: 'var(--text-secondary)', 
                          fontWeight: '900', 
                          marginTop: '6px', 
                          opacity: 0.8, 
                          letterSpacing: '0.5px',
                          textAlign: 'center',
                          padding: '12px 0',
                          border: '1.5px dashed rgba(var(--theme-rgb), 0.08)',
                          borderRadius: '16px',
                          background: 'rgba(var(--theme-rgb), 0.01)'
                        }}>
                          {lang === 'ar' ? 'سجل تمرينتين على الأقل لنفس العضلة عشان تشوف الرسم البياني للتطور' : 'LOG 2+ SESSIONS FOR CHART PROGRESS'}
                        </div>
                      )}
                      <ExerciseHistoryDetails exerciseName={name} logs={tracker.logs} tracker={tracker} lang={lang} t={t} />
                    </div>
                  );
                }).filter(Boolean);
                if (charts.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '30px 20px', opacity: 0.8 }}>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>📈</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{lang === 'ar' ? 'محتاج تتمرن أكتر!' : 'More Workouts Needed!'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{lang === 'ar' ? 'سجل تمرينتين على الأقل لنفس العضلة عشان نقدر نوريك رسم بياني لتطور مستواك.' : 'Complete at least 2 sessions for this muscle group to see your progress charts.'}</div>
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
