import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { 
  Award, TrendingUp, BarChart3, Calendar, ChevronDown
} from 'lucide-react';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';

interface ProgressPageProps {
  tracker: ReturnType<typeof useGymTracker>;
}

// Chart Component from Bundle (ao function)
const LineChart: React.FC<{ data: any[], color: string, title: string, accentColor: string }> = ({ data, color, title, accentColor }) => {
  if (data.length < 2) return null;
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max > min ? max - min : 1;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 260 + 10,
    y: max > min ? 65 - ((d.value - min) / range) * 50 : 40,
    val: d.value
  }));

  const linePath = ((pts) => {
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const cp = (p0.x + p1.x) / 2;
      d += ` C ${cp},${p0.y} ${cp},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  })(points);

  const areaPath = `${linePath} L ${points[points.length - 1].x},90 L ${points[0].x},90 Z`;
  const gradId = `grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div style={{ position: 'relative', width: '100%', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid rgba(var(--theme-rgb), 0.1)', padding: '20px 0 10px', marginTop: '12px' }}>
      <svg width="100%" viewBox="0 0 280 80" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="10" y1="8" x2="270" y2="8" stroke="rgba(var(--theme-rgb), 0.1)" strokeDasharray="4 4" strokeWidth="1" />
        <line x1="10" y1="40" x2="270" y2="40" stroke="rgba(var(--theme-rgb), 0.1)" strokeDasharray="4 4" strokeWidth="1" />
        <line x1="10" y1="72" x2="270" y2="72" stroke="rgba(var(--theme-rgb), 0.1)" strokeDasharray="4 4" strokeWidth="1" />
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 2.5} fill={i === points.length - 1 ? color : 'var(--text-primary)'} stroke={color} strokeWidth="2" />
            { (i === 0 || i === points.length - 1) && (
              <text x={p.x} y={p.y - 12} fill={i === points.length - 1 ? color : 'var(--text-secondary)'} fontSize={i === points.length - 1 ? "11" : "9"} fontWeight="900" textAnchor={i === 0 ? "start" : "end"}>{p.val}</text>
            )}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};

export const ProgressPage: React.FC<ProgressPageProps> = ({ tracker }) => {
  const lang = tracker.settings.language;
  const t = (key: string) => (translations[lang] as any)[key] ?? key;
  const weightUnit = tracker.settings.weightUnit;
  
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    const diff = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - diff + i);
    return d.toDateString();
  });

  const dailyCounts = weekDays.map(date => 
    tracker.logs.filter(log => new Date(log.date).toDateString() === date).length
  );

  const displayedLogs = activeDay 
    ? tracker.logs.filter(log => new Date(log.date).toDateString() === activeDay)
    : tracker.logs;

  const weeklyCount = tracker.getWeeklyCount();
  const totalVolume = displayedLogs.reduce((acc, log) => acc + tracker.getTotalVolume(log), 0);

  const availableMuscles = useMemo(() => {
    const groups = new Set<string>();
    const exToMuscle: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([m, exs]) => exs.forEach(e => exToMuscle[e.toLowerCase()] = m));
    Object.entries(tracker.customExercises).forEach(([m, exs]) => exs.forEach(e => exToMuscle[e.toLowerCase()] = m));

    tracker.logs.forEach(log => {
      if (log.muscleGroup) groups.add(log.muscleGroup);
      log.exercises.forEach(ex => {
        const m = exToMuscle[ex.name.toLowerCase()];
        if (m) groups.add(m);
      });
    });
    return Array.from(groups);
  }, [tracker.logs, tracker.customExercises]);

  useEffect(() => {
    if (!activeMuscle && availableMuscles.length > 0) setActiveMuscle(availableMuscles[0]);
  }, [availableMuscles, activeMuscle]);

  const exerciseFreq = useMemo(() => {
    if (!activeMuscle) return [];
    const freq: Record<string, number> = {};
    const exToMuscle: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([m, exs]) => exs.forEach(e => exToMuscle[e.toLowerCase()] = m));
    Object.entries(tracker.customExercises).forEach(([m, exs]) => exs.forEach(e => exToMuscle[e.toLowerCase()] = m));

    tracker.logs.forEach(log => {
      log.exercises.forEach(ex => {
        const m = exToMuscle[ex.name.toLowerCase()] || log.muscleGroup;
        if (m === activeMuscle) {
          freq[ex.name] = (freq[ex.name] || 0) + 1;
        }
      });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  }, [tracker.logs, activeMuscle, tracker.customExercises]);

  const getExerciseHistory = (name: string) => {
    const history: any[] = [];
    const exToMuscle: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([m, exs]) => exs.forEach(e => exToMuscle[e.toLowerCase()] = m));
    Object.entries(tracker.customExercises).forEach(([m, exs]) => exs.forEach(e => exToMuscle[e.toLowerCase()] = m));

    [...tracker.logs].reverse().forEach(log => {
      const ex = log.exercises.find(e => e.name === name);
      if (ex && ex.sets.length > 0) {
        const m = exToMuscle[ex.name.toLowerCase()] || log.muscleGroup;
        if (m === activeMuscle) {
          const maxW = Math.max(...ex.sets.map(s => s.weight));
          history.push({ date: log.date, value: maxW });
        }
      }
    });
    return history;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 4px' }}>
      
      {/* 1. TOP STATS CARDS */}
      <div style={{ position: 'relative' }}>
        {activeDay && (
          <button 
            onClick={() => setActiveDay(null)}
            style={{ position: 'absolute', top: '-15px', right: '0', background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '10px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
          >
            {lang === 'ar' ? 'عرض الكل ✕' : 'SHOW ALL ✕'}
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: 'rgba(var(--theme-rgb), 0.02)', borderRadius: '24px', border: '1.5px solid rgba(var(--theme-rgb), 0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          {[
            { label: activeDay ? (lang === 'ar' ? 'تمارين اليوم' : 'DAY LOGS') : t('thisWeek'), value: activeDay ? displayedLogs.length : weeklyCount, sub: t('workouts'), icon: '📅' },
            { label: activeDay ? (lang === 'ar' ? 'تاريخ اليوم' : 'LOG DATE') : t('allTime'), value: activeDay ? new Date(activeDay).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }) : tracker.logs.length, sub: t('workouts'), icon: '🏆' },
            { label: t('totalVolume'), value: totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}T` : `${totalVolume.toFixed(0)}`, sub: t(weightUnit), icon: '📈' }
          ].map((stat, idx) => (
            <div key={stat.label} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--accent-color)', lineHeight: '1', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif' }}>{stat.value}</div>
              <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>{stat.label}</div>
              {idx < 2 && <div style={{ position: 'absolute', right: 0, top: '15%', bottom: '15%', width: '1.5px', background: 'rgba(var(--theme-rgb), 0.2)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* 2. WEEK BAR CHART */}
      <div style={{ padding: '24px 0', borderBottom: '1.5px solid rgba(var(--theme-rgb), 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart3 size={16} color="var(--accent-color)" />
          <span style={{ fontSize: '12px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.5 }}>
            {t('thisWeek').toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
          {weekDays.map((day, idx) => {
            const isToday = new Date().toDateString() === day;
            const isActive = activeDay === day;
            const count = dailyCounts[idx];
            const height = count > 0 ? Math.max(34, count * 25) : 24;
            const label = new Date(day).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short' });

            return (
              <div 
                key={day}
                onClick={() => setActiveDay(isActive ? null : day)}
                className="day-column"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', cursor: 'pointer', height: '100%' }}
              >
                <div style={{ 
                  width: '16px', height: `${height}px`, 
                  background: isActive ? 'linear-gradient(180deg, var(--text-primary), var(--accent-color))' : count > 0 ? 'linear-gradient(180deg, var(--accent-color), var(--accent-secondary, var(--accent-color)))' : isToday ? 'rgba(255, 140, 0, 0.5)' : 'rgba(var(--theme-rgb), 0.3)',
                  borderRadius: '12px', boxShadow: isActive ? '0 0 20px var(--accent-color)' : isToday ? '0 0 10px rgba(255, 140, 0, 0.4)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: activeDay && !isActive ? 0.3 : 1
                }} />
                <span style={{ fontSize: '11px', fontWeight: '950', color: isActive ? 'var(--accent-color)' : isToday ? '#ff8c00' : 'var(--text-primary)', textTransform: 'uppercase' }}>
                  {label.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. WINS SECTION */}
      {tracker.prs.length > 0 && (
        <div style={{ padding: '24px 0', borderBottom: '1.5px solid rgba(var(--theme-rgb), 0.15)' }}>
           {/* Reusing logic from J component */}
           {(() => {
              const todayStr = new Date().toDateString();
              const hasTodayWin = tracker.prs.some(p => new Date(p.date).toDateString() === todayStr);
              const [isWinsExpanded, setIsWinsExpanded] = useState(hasTodayWin);

              return (
                <div style={{ position: 'relative' }}>
                  <div onClick={() => setIsWinsExpanded(!isWinsExpanded)} style={{ background: hasTodayWin ? 'linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 61, 0, 0.1) 100%)' : 'rgba(var(--theme-rgb), 0.03)', borderRadius: '20px', padding: '18px 20px', border: hasTodayWin ? '1px solid rgba(255, 149, 0, 0.3)' : '1px solid rgba(var(--theme-rgb), 0.1)', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Award size={20} color={hasTodayWin ? '#ff9500' : 'var(--accent-color)'} />
                        <div>
                           <div style={{ fontSize: '11px', fontWeight: '950', color: hasTodayWin ? '#ff3d00' : 'var(--text-primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>{hasTodayWin ? (lang === 'ar' ? 'إنجازات اليوم! 🔥' : "TODAY'S WINS! 🔥") : t('personalRecord')}</div>
                           {!hasTodayWin && <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '800', marginTop: '2px' }}>{lang === 'ar' ? 'اضغط لعرض الأرقام القياسية' : 'TAP TO VIEW ALL RECORDS'}</div>}
                        </div>
                      </div>
                      <ChevronDown size={20} style={{ transform: isWinsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: hasTodayWin ? '#ff3d00' : 'var(--accent-color)' }} />
                    </div>
                  </div>
                  {isWinsExpanded && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {/* Chronological Wins rendering */}
                       {(() => {
                          const prsByDate: Record<string, typeof tracker.prs> = {};
                          tracker.prs.forEach(pr => {
                            const d = new Date(pr.date).toDateString();
                            if (!prsByDate[d]) prsByDate[d] = [];
                            prsByDate[d].push(pr);
                          });

                          return Object.keys(prsByDate).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(dateKey => (
                                <div key={dateKey} style={{ background: 'rgba(var(--theme-rgb), 0.03)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(var(--theme-rgb), 0.1)', marginBottom: '10px' }}>
                                   <div style={{ fontSize: '11px', fontWeight: '950', color: 'var(--accent-color)', marginBottom: '16px', opacity: 0.8, letterSpacing: '2px' }}>{new Date(dateKey).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}</div>
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {prsByDate[dateKey].map(pr => (
                                        <div key={pr.exerciseName} style={{ 
                                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                          background: tracker.settings.themeMode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)', 
                                          padding: '16px 20px', borderRadius: '18px',
                                          border: '1px solid rgba(var(--theme-rgb), 0.05)'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary, var(--accent-color))', boxShadow: '0 0 10px var(--accent-secondary, var(--accent-color))' }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                              <span style={{ fontSize: '17px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{pr.exerciseName}</span>
                                              <span style={{ 
                                                fontSize: '9px', fontWeight: '950', color: '#000', 
                                                background: 'var(--accent-secondary, var(--accent-color))', 
                                                padding: '2px 8px', borderRadius: '6px', width: 'fit-content'
                                              }}>PR</span>
                                            </div>
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                             <span style={{ fontSize: '22px', fontWeight: '950', color: 'var(--accent-secondary, var(--accent-color))', fontFamily: 'Outfit, sans-serif' }}>{pr.weight}</span>
                                             <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent-secondary, var(--accent-color))', marginLeft: '4px', opacity: 0.8 }}>{t(weightUnit)}</span>
                                             <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', opacity: 0.5, letterSpacing: '1px' }}>{pr.reps} REPS</div>
                                          </div>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                          ));
                       })()}
                    </div>
                  )}
                </div>
              );
           })()}
        </div>
      )}

      {/* 4. PROGRESS CHARTS SECTION */}
      {availableMuscles.length > 0 && (
        <div style={{ padding: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="var(--accent-color)" />
            <span style={{ fontSize: '12px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.5 }}>{t('progress').toUpperCase()}</span>
          </div>

          <div className="hide-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px' }}>
            {MUSCLE_GROUPS.filter(m => availableMuscles.includes(m.key)).map(m => {
              const isActive = activeMuscle === m.key;
              return (
                <button key={m.key} onClick={() => setActiveMuscle(m.key)} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: '6px', background: 'transparent', border: '1px solid', borderColor: isActive ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.05)', color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase' }}>
                  {lang === 'ar' ? m.ar : m.en}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             {exerciseFreq.length === 0 ? (
               <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>{t('noData')}</div>
             ) : (
               exerciseFreq.map(name => {
                 const chartData = getExerciseHistory(name);
                 if (chartData.length < 2) return null;
                 const lastW = chartData[chartData.length - 1].value;
                 const diff = lastW - chartData[0].value;

                 return (
                   <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                         <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{name}</span>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-color)' }}>{lastW} {t(weightUnit)}</span>
                            {diff !== 0 && (
                              <span style={{ fontSize: '11px', fontWeight: '800', color: diff > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{diff > 0 ? '+' : ''}{diff} {t(weightUnit)}</span>
                            )}
                         </div>
                      </div>
                      <LineChart data={chartData} color="var(--accent-color)" title={name} accentColor={tracker.settings.accentColor || '#ff3d00'} />
                   </div>
                 );
               })
             )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProgressPage;
