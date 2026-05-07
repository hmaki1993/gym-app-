import React, { useRef, useEffect, useState } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { TrendingUp, Award, BarChart2 } from 'lucide-react';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
}

function MiniChart({ data, color, title, accentColor }: { data: { date: string; value: number }[]; color: string, title: string, accentColor: string }) {
  if (data.length < 2) return null;
  const W = 280, H = 80;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max > min ? max - min : 1;

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (W - 20) + 10;
    const y = max > min 
      ? H - 15 - ((d.value - min) / range) * (H - 30)
      : H / 2; // Render in the middle if no progress change yet
    return { x, y, val: d.value };
  });

  const getSmoothPath = (points: {x: number, y: number}[]) => {
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  };

  const pathD = getSmoothPath(pts);
  const areaD = `${pathD} L ${pts[pts.length-1].x},${H+10} L ${pts[0].x},${H+10} Z`;

  // Make ID unique per exercise to avoid multiple charts sharing the same gradient ID
  const gradId = `grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div style={{ position: 'relative', width: '100%', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '20px 0 10px', marginTop: '12px' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        <line x1="10" y1={H*0.1} x2={W-10} y2={H*0.1} stroke="var(--glass-border)" strokeDasharray="4 4" strokeWidth="1" />
        <line x1="10" y1={H*0.5} x2={W-10} y2={H*0.5} stroke="var(--glass-border)" strokeDasharray="4 4" strokeWidth="1" />
        <line x1="10" y1={H*0.9} x2={W-10} y2={H*0.9} stroke="var(--glass-border)" strokeDasharray="4 4" strokeWidth="1" />

        {/* Area */}
        <path d={areaD} fill={`url(#${gradId})`} />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        
        {/* Dots */}
        {pts.map((p, i) => (
          <React.Fragment key={i}>
            <circle 
              cx={p.x} cy={p.y} 
              r={i === pts.length - 1 ? "5" : "2.5"} 
              fill={i === pts.length - 1 ? color : 'var(--text-primary)'} 
              stroke={i === pts.length - 1 ? 'var(--primary-bg)' : 'none'}
              strokeWidth={i === pts.length - 1 ? "2" : "0"}
              style={i === pts.length - 1 ? { filter: `drop-shadow(0 0 8px ${color})` } : { opacity: 0.5 }} 
            />
            {/* Show value for first and last point */}
            {(i === 0 || i === pts.length - 1) && (
              <text 
                x={p.x} 
                y={p.y - 12} 
                fill={i === pts.length - 1 ? color : "var(--text-secondary)"} 
                fontSize={i === pts.length - 1 ? "11" : "9"} 
                fontWeight="900" 
                textAnchor={i === 0 ? "start" : (i === pts.length - 1 ? "end" : "middle")}
                style={i === pts.length - 1 ? { filter: `drop-shadow(0 0 4px rgba(0,0,0,0.5))` } : {}}
              >
                {p.val}
              </text>
            )}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
}

function RecordDateAccordion({ dateStr, prs, today, lang, t, unit }: { dateStr: string, prs: any[], today: string, lang: string, t: any, unit: any }) {
  const [isDateOpen, setIsDateOpen] = useState(dateStr === today);
  const displayDate = new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  
  return (
    <div style={{ 
      background: 'rgba(var(--theme-rgb), 0.03)', 
      borderRadius: '12px', 
      overflow: 'hidden',
      border: '1px solid rgba(var(--theme-rgb), 0.05)'
    }}>
      <button 
        onClick={() => setIsDateOpen(!isDateOpen)}
        style={{
          width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: '950', color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase' }}>
          {dateStr === today ? (lang === 'ar' ? 'اليوم' : 'TODAY') : displayDate}
          <span style={{ marginLeft: '8px', opacity: 0.4 }}>({prs.length})</span>
        </div>
        <div style={{ transform: isDateOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', fontSize: '10px', color: 'var(--accent-color)' }}>▼</div>
      </button>
      {isDateOpen && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {(() => {
            // Group PRs by muscle group
            const groups: Record<string, any[]> = {};
            prs.forEach(pr => {
              const mgKey = pr.muscleGroup || 'other';
              if (!groups[mgKey]) groups[mgKey] = [];
              groups[mgKey].push(pr);
            });

            const sortedEntries = Object.entries(groups).sort();
            return sortedEntries.map(([mgKey, items], groupIdx) => {
              const mg = MUSCLE_GROUPS.find(m => m.key === mgKey);
              const groupName = mg ? (lang === 'ar' ? mg.ar : mg.en) : (lang === 'ar' ? 'أخرى' : 'OTHER');
              
              return (
                <React.Fragment key={mgKey}>
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: '950', 
                    color: 'var(--accent-color)', 
                    letterSpacing: '3px', 
                    textTransform: 'uppercase',
                    marginTop: groupIdx === 0 ? '12px' : '24px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{groupName}</span>
                    <div style={{ flex: 1, height: '1.5px', background: 'var(--accent-color)', opacity: 0.15, borderRadius: '1px' }} />
                  </div>
                  {items.map((pr, idx) => (
                    <div key={pr.exerciseName} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '12px 0', 
                      borderBottom: idx === items.length - 1 ? 'none' : '1px solid rgba(var(--theme-rgb), 0.03)',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '15px', fontWeight: '950', color: 'var(--text-primary)', opacity: 1 }}>{pr.exerciseName}</span>
                        <span style={{ fontSize: '9px', color: 'var(--accent-color)', fontWeight: '950', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                          {groupName}
                        </span>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '950', color: 'var(--accent-color)', fontFamily: 'Outfit, sans-serif' }}>{pr.weight} {t(unit as any)} × {pr.reps}</span>
                    </div>
                  ))}
                </React.Fragment>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}


export function ProgressPage({ tracker }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const unit = tracker.settings.weightUnit;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Weekly bar data (Saturday to Friday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    // Adjust to get the most recent Saturday (JS: Sunday=0, Monday=1... Saturday=6)
    const day = d.getDay();
    const diff = (day + 1) % 7; // Distance to previous Saturday
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
  const totalVolume = filteredLogs.reduce((s, l) => s + tracker.getTotalVolume(l), 0);

  // Accurate muscle detection based on exercises performed
  const loggedMuscles = React.useMemo(() => {
    const muscles = new Set<string>();
    const exerciseToMuscle: Record<string, string> = {};
    
    // Map defaults
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex.toLowerCase()] = group; });
    });
    // Map customs
    Object.entries(tracker.customExercises).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex.toLowerCase()] = group; });
    });

    tracker.logs.forEach(log => {
      // Always include the primary muscle group of the session
      if (log.muscleGroup) muscles.add(log.muscleGroup);
      
      // Also include any muscles from specific exercises
      log.exercises.forEach(ex => {
        const group = exerciseToMuscle[ex.name.toLowerCase()];
        if (group) muscles.add(group);
      });
    });
    return Array.from(muscles);
  }, [tracker.logs, tracker.customExercises]);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(loggedMuscles.length > 0 ? loggedMuscles[0] : null);

  useEffect(() => {
    if (!selectedMuscle && loggedMuscles.length > 0) {
      setSelectedMuscle(loggedMuscles[0]);
    }
  }, [tracker.logs.length]);

  // Chart entrance animation removed for rocket-speed feel
  /*
  useEffect(() => {
    if (chartsContainerRef.current && chartsContainerRef.current.children.length > 0) {
      gsap.fromTo(chartsContainerRef.current.children,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [selectedMuscle]);
  */

  // Exercise progress data for selected muscle
  const { topExercises, exerciseToMuscle } = React.useMemo(() => {
    const freq: Record<string, number> = {};
    const mapping: Record<string, string> = {};
    
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { mapping[ex.toLowerCase()] = group; });
    });
    Object.entries(tracker.customExercises).forEach(([group, exercises]) => {
      exercises.forEach(ex => { mapping[ex.toLowerCase()] = group; });
    });

    tracker.logs.forEach(log => {
      log.exercises.forEach(ex => {
        const group = mapping[ex.name.toLowerCase()] || log.muscleGroup;
        if (group === selectedMuscle) {
          freq[ex.name] = (freq[ex.name] ?? 0) + 1;
        }
      });
    });

    const top = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    return { exerciseFreq: freq, topExercises: top, exerciseToMuscle: mapping };
  }, [tracker.logs, selectedMuscle, tracker.customExercises]);

  const getExerciseHistory = (name: string) => {
    const history: { date: string; value: number }[] = [];
    for (const log of [...tracker.logs].reverse()) {
      const ex = log.exercises.find(e => e.name === name);
      // Verify this exercise belongs to the selected muscle
      const group = exerciseToMuscle[name.toLowerCase()] || log.muscleGroup;
      if (group !== selectedMuscle) continue;
      
      if (ex && ex.sets.length > 0) {
        const max = Math.max(...ex.sets.map(s => s.weight));
        history.push({ date: log.date, value: max });
      }
    }
    return history;
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', padding: '10px 4px' }}>

      {/* Overview Cards */}
      <div style={{ position: 'relative' }}>
        {selectedDay && (
          <button 
            onClick={() => setSelectedDay(null)}
            style={{ 
              position: 'absolute', top: '-15px', right: '0', background: 'none', border: 'none', 
              color: 'var(--accent-color)', fontSize: '10px', fontWeight: '900', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}
          >
            {lang === 'ar' ? 'عرض الكل ✕' : 'SHOW ALL ✕'}
          </button>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '24px', 
          background: 'rgba(var(--theme-rgb), 0.02)',
          borderRadius: '24px',
          border: '1.5px solid rgba(var(--theme-rgb), 0.12)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
        }}>
          {[
            { label: selectedDay ? (lang === 'ar' ? 'تمارين اليوم' : 'DAY LOGS') : t('thisWeek'), value: selectedDay ? totalWorkouts : weeklyCount, sub: t('workouts'), icon: '📅' },
            { label: selectedDay ? (lang === 'ar' ? 'تاريخ اليوم' : 'LOG DATE') : t('allTime'), value: selectedDay ? new Date(selectedDay).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }) : tracker.logs.length, sub: t('workouts'), icon: '🏆' },
            { label: t('totalVolume'), value: totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}T` : `${totalVolume.toFixed(0)}`, sub: t(unit as any), icon: '📈' },
          ].map((card, index) => (
            <div key={card.label} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '950', 
                color: 'var(--accent-color)', 
                lineHeight: '1', 
                letterSpacing: '-0.5px',
                fontFamily: 'Outfit, sans-serif'
              }}>{card.value}</div>
              <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>{card.label}</div>
              {index < 2 && <div style={{ position: 'absolute', right: 0, top: '15%', bottom: '15%', width: '1.5px', background: 'rgba(var(--theme-rgb), 0.2)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity Bar Chart */}
      <div style={{ padding: '24px 0', borderBottom: '1.5px solid rgba(var(--theme-rgb), 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart2 size={16} color="var(--accent-color)" />
          <span className="section-label">{t('thisWeek')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
          {weekDays.map((day, i) => {
            const isToday = new Date().toDateString() === day;
            const isSelected = selectedDay === day;
            const count = weekCounts[i];
            // Increased min height for better touch/visibility
            const height = count > 0 ? Math.max(34, count * 25) : 24; 
            const dayLabel = new Date(day).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short' });
            
            return (
              <div 
                key={day} 
                onClick={() => setSelectedDay(isSelected ? null : day)}
                onPointerDown={(e) => e.stopPropagation()}
                role="button"
                className="day-column"
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  gap: '10px', 
                  cursor: 'pointer',
                  paddingBottom: '5px',
                  height: '100%',
                  transition: 'transform 0.2s ease',
                  pointerEvents: 'auto'
                }}
              >
                <div style={{
                  width: '16px', 
                  height: `${height}px`,
                  background: isSelected
                    ? `linear-gradient(180deg, var(--text-primary), var(--accent-color))`
                    : (count > 0 
                        ? `linear-gradient(180deg, var(--accent-color), var(--danger-color))` 
                        : (isToday ? 'rgba(255, 140, 0, 0.5)' : 'rgba(var(--theme-rgb), 0.3)')),
                  borderRadius: '12px',
                  boxShadow: isSelected
                    ? `0 0 20px var(--accent-color)`
                    : (isToday ? '0 0 10px rgba(255, 140, 0, 0.4)' : 'none'),
                  border: isSelected ? '2px solid var(--text-primary)' : (isToday ? '1px solid rgba(255, 140, 0, 0.6)' : 'none'),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: (selectedDay && !isSelected) ? 0.3 : 1,
                  animation: isToday && !isSelected ? 'pulse-orange 2s infinite ease-in-out' : 'none'
                }} />
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: '950', 
                  color: isSelected ? 'var(--accent-color)' : (isToday ? '#ff8c00' : 'var(--text-primary)'), 
                  textTransform: 'uppercase',
                  opacity: 1,
                  letterSpacing: '0.5px'
                }}>
                  {dayLabel.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes pulse-orange {
            0% { box-shadow: 0 0 5px rgba(255, 140, 0, 0.2); border-color: rgba(255, 140, 0, 0.3); }
            50% { box-shadow: 0 0 15px rgba(255, 140, 0, 0.6); border-color: rgba(255, 140, 0, 0.8); }
            100% { box-shadow: 0 0 5px rgba(255, 140, 0, 0.2); border-color: rgba(255, 140, 0, 0.3); }
          }
          .day-column:active {
            transform: scale(0.9);
          }
        `}</style>
      </div>

      {/* Master Records Card (The "Curtain") */}
      {tracker.prs.length > 0 && (
        <div style={{ padding: '24px 0', borderBottom: '1.5px solid rgba(var(--theme-rgb), 0.15)' }}>
          {(() => {
            const today = new Date().toDateString();
            const todayPRs = tracker.prs.filter(pr => new Date(pr.date).toDateString() === today);
            const hasWinsToday = todayPRs.length > 0;
            const [isMasterOpen, setIsMasterOpen] = useState(hasWinsToday);

            return (
              <div style={{ position: 'relative' }}>
                {/* The Trigger Card */}
                <div 
                  onClick={() => setIsMasterOpen(!isMasterOpen)}
                  style={{ 
                    background: hasWinsToday 
                      ? 'linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 61, 0, 0.1) 100%)'
                      : 'rgba(var(--theme-rgb), 0.03)',
                    borderRadius: '20px', 
                    padding: '18px 20px', 
                    border: hasWinsToday ? '1px solid rgba(255, 149, 0, 0.3)' : '1px solid rgba(var(--theme-rgb), 0.1)',
                    boxShadow: hasWinsToday ? '0 10px 30px rgba(255, 149, 0, 0.1)' : 'none',
                    cursor: 'pointer',
                    animation: hasWinsToday ? 'pulse-glow 2s infinite' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Award size={20} color={hasWinsToday ? "#ff9500" : "var(--accent-color)"} />
                      <div>
                        <div style={{ 
                          fontSize: '11px', fontWeight: '950', 
                          color: hasWinsToday ? '#ff3d00' : 'var(--text-primary)', 
                          letterSpacing: '2px', textTransform: 'uppercase' 
                        }}>
                          {hasWinsToday ? (lang === 'ar' ? 'إنجازات اليوم! 🔥' : "TODAY'S WINS! 🔥") : t('personalRecord')}
                        </div>
                        {!hasWinsToday && <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '800', marginTop: '2px' }}>{lang === 'ar' ? 'اضغط لعرض الأرقام القياسية' : 'TAP TO VIEW ALL RECORDS'}</div>}
                      </div>
                    </div>
                    <div style={{ 
                      transform: isMasterOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.3s ease',
                      color: hasWinsToday ? '#ff3d00' : 'var(--accent-color)',
                      opacity: 1
                    }}>▼</div>
                  </div>
                </div>

                {/* The Curtain Content */}
                {isMasterOpen && (
                  <div style={{ 
                    marginTop: '12px', 
                    animation: 'slideDown 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                  }}>
                    {/* All Records Grouped by Date (Latest First) */}
                    <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '5px', paddingLeft: '10px' }}>
                      {lang === 'ar' ? 'سجل الإنجازات الزمني' : 'CHRONOLOGICAL RECORDS'}
                    </div>
                    
                    {(() => {
                      // Group PRs by Date
                      const dateGroups: Record<string, typeof tracker.prs> = {};
                      tracker.prs.forEach(pr => {
                        const dateStr = new Date(pr.date).toDateString();
                        if (!dateGroups[dateStr]) dateGroups[dateStr] = [];
                        dateGroups[dateStr].push(pr);
                      });

                      // Sort dates latest first
                      const sortedDates = Object.keys(dateGroups).sort((a, b) => 
                        new Date(b).getTime() - new Date(a).getTime()
                      );

                      return sortedDates.map(dateStr => (
                        <RecordDateAccordion 
                          key={dateStr}
                          dateStr={dateStr}
                          prs={dateGroups[dateStr]}
                          today={today}
                          lang={lang}
                          t={t}
                          unit={unit}
                        />
                      ));
                    })()}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Progress Charts */}
      {loggedMuscles.length > 0 && (
        <div style={{ padding: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="var(--accent-color)" />
            <span className="section-label">{t('progress')}</span>
          </div>

          {/* Muscle Selector */}
          <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px' }}>
            {MUSCLE_GROUPS.filter(m => loggedMuscles.includes(m.key)).map(m => {
              const isActive = selectedMuscle === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedMuscle(m.key)}
                  style={{
                    flexShrink: 0,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.05)',
                    color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                    fontWeight: '800',
                    fontSize: '13px',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(255,140,0,0.15)' : 'none',
                    textTransform: 'uppercase'
                  }}
                >
                  {lang === 'ar' ? m.ar : m.en}
                </button>
              );
            })}
          </div>

          <div ref={chartsContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {topExercises.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' }}>
                {t('noData')}
              </div>
            ) : (
              (() => {
                const charts = topExercises.map(name => {
                  const history = getExerciseHistory(name);
                  if (history.length < 2) return null;
                  const latest = history[history.length - 1].value;
                  const first = history[0].value;
                  const diff = latest - first;
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: '800', 
                            color: 'var(--accent-color)',
                            fontFamily: 'Inter, sans-serif'
                          }}>{latest} {t(unit as any)}</span>
                          {diff !== 0 && (
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: '800', 
                              color: diff > 0 ? 'var(--success-color)' : 'var(--danger-color)',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {diff > 0 ? '+' : ''}{diff} {t(unit as any)}
                            </span>
                          )}
                        </div>
                      </div>
                      <MiniChart data={history} color="var(--accent-color)" title={name} accentColor={tracker.settings.accentColor} />
                    </div>
                  );
                }).filter(Boolean);

                if (charts.length === 0) {
                  return (
                    <div style={{ 
                      textAlign: 'center', padding: '30px 20px',
                      opacity: 0.8
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>📈</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {lang === 'ar' ? 'محتاج تتمرن أكتر!' : 'More Workouts Needed!'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {lang === 'ar' 
                          ? 'سجل تمرينتين على الأقل لنفس العضلة عشان نقدر نوريكم رسم بياني لتطور مستواك.' 
                          : 'Complete at least 2 sessions for this muscle group to see your progress charts.'}
                      </div>
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
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px', fontSize: '14px' }}>
          {t('noData')}
        </div>
      )}
    </div>
  );
}
