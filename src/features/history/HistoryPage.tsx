import React, { useRef, useState, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import type { WorkoutLog } from '../../types';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';
import { translations } from '../../translations';
import { Trash2 } from 'lucide-react';
import { TransparentImage } from '../workout/components/TransparentImage';

interface HistoryPageProps {
  tracker: ReturnType<typeof useGymTracker>;
}

function formatDate(iso: string, lang: 'ar' | 'en') {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string, lang: 'ar' | 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(mins: number, t: (k: any) => string) {
  if (mins < 60) return `${mins} ${t('minutes')}`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ tracker }) => {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Auto-scroll to expanded log
  useEffect(() => {
    if (expandedLogId) {
      setTimeout(() => {
        const element = document.getElementById(`log-${expandedLogId}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 300);
    }
  }, [expandedLogId]);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const totalDays = daysInMonth(currentYear, currentMonth);

  const monthName = viewDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' });


  const monthDayMuscles = React.useMemo(() => {
    const map: Record<number, string[]> = {};
    const exerciseToMuscle: Record<string, string> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex] = group; });
    });
    Object.entries(tracker.customExercises).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex] = group; });
    });

    tracker.logs.forEach(log => {
      const d = new Date(log.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        const groups = new Set<string>();
        log.exercises.forEach(ex => {
          const group = (ex as any).muscleGroup || exerciseToMuscle[ex.name] || log.muscleGroup;
          if (group) groups.add(group);
        });
        if (!map[day]) map[day] = [];
        map[day] = Array.from(new Set([...map[day], ...Array.from(groups)]));
      }
    });
    return map;
  }, [tracker.logs, tracker.customExercises, currentYear, currentMonth]);

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === currentYear &&
           selectedDate.getMonth() === currentMonth &&
           selectedDate.getDate() === day;
  };

  const filteredLogs = selectedDate 
    ? tracker.logs.filter(l => {
        // Robust check: handles both 'YYYY-MM-DD' and full ISO timestamps
        const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        // Direct string prefix match (fastest for YYYY-MM-DD stored dates)
        if (l.date.startsWith(selectedStr)) return true;
        // Fallback: parse as local date for ISO timestamps
        const d = new Date(l.date);
        const logStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return logStr === selectedStr;
      })
    : [];

  // Consolidate multiple logs for the same day into one (fixes old split-session bug)
  const consolidatedLogs = (() => {
    if (filteredLogs.length <= 1) return filteredLogs;
    // Merge all logs for this day into one unified log
    const base = { ...filteredLogs[0] };
    const mergedExercises = [...base.exercises];
    for (let i = 1; i < filteredLogs.length; i++) {
      filteredLogs[i].exercises.forEach(ex => {
        const existing = mergedExercises.find(e => e.name === ex.name);
        if (existing) {
          existing.sets = [...existing.sets, ...ex.sets];
        } else {
          mergedExercises.push(ex);
        }
      });
    }
    base.exercises = mergedExercises;
    base.durationSeconds = filteredLogs.reduce((sum, l) => sum + (l.durationSeconds || l.durationMinutes * 60), 0);
    base.durationMinutes = Math.round(base.durationSeconds / 60);
    return [base];
  })();

  const changeMonth = (offset: number) => {
    const d = new Date(currentYear, currentMonth + offset, 1);
    setViewDate(d);
  };

  const onDeleteWorkout = (id: string) => {
    (tracker as any).setLogToDelete(id);
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '120px' }}>
      {/* Weightless Elite Calendar - Compact */}
      <div style={{ 
        padding: '5px 0 15px', 
        transformStyle: 'preserve-3d',
        animation: 'fadeIn 0.6s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 10px' }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/arrow-custom.png" alt="Previous" style={{ width: '28px', height: '28px', objectFit: 'contain', transform: 'rotate(180deg)' }} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src="/assets/calendar-custom-v3.png" 
                alt="Calendar" 
                style={{ 
                  width: '34px', 
                  height: '34px', 
                  objectFit: 'contain'
                }} 
              />
              <h2 style={{ 
                margin: 0, 
                fontSize: '16px', 
                fontWeight: '950', 
                color: 'var(--text-primary)', 
                textTransform: 'uppercase', 
                letterSpacing: '2px',
                fontFamily: "'Montserrat', sans-serif",
                transform: 'translateY(1px)'
              }}>
                {monthName}
              </h2>
            </div>
            
            {/* Elegant Monthly Summary Pill */}
            {(() => {
              const now = new Date();
              const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
              const isPastMonth = currentYear < now.getFullYear() || (currentYear === now.getFullYear() && currentMonth < now.getMonth());
              
              let monthWorkouts = 0;
              let monthRest = 0;
              for (let d = 1; d <= totalDays; d++) {
                if (monthDayMuscles[d]?.length > 0) {
                  monthWorkouts++;
                } else {
                  if (isPastMonth) {
                    monthRest++;
                  } else if (isCurrentMonth && d < now.getDate()) {
                    monthRest++;
                  }
                }
              }
              return (
                <div style={{ 
                  display: 'flex', gap: '16px', background: 'transparent', 
                  padding: '6px 16px', borderRadius: '12px', border: '1.5px dashed rgba(var(--theme-rgb), 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'var(--text-secondary)',
                      WebkitMask: 'url(/assets/dumbbell-custom.png) no-repeat center / contain',
                      mask: 'url(/assets/dumbbell-custom.png) no-repeat center / contain',
                      display: 'inline-block'
                    }} />
                    <span style={{ fontSize: '15px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: "'Montserrat', sans-serif" }}>{monthWorkouts}</span>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(var(--theme-rgb), 0.1)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'var(--text-secondary)',
                      WebkitMask: 'url(/assets/sofa-custom.png) no-repeat center / contain',
                      mask: 'url(/assets/sofa-custom.png) no-repeat center / contain',
                      display: 'inline-block'
                    }} />
                    <span style={{ fontSize: '15px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: "'Montserrat', sans-serif" }}>{monthRest}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/arrow-custom.png" alt="Next" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          justifyItems: 'center',
          gap: '16px 6px', 
          textAlign: 'center',
          padding: '0 8px', 
          boxSizing: 'border-box',
          width: '100%'
        }}>
          {/* Clear Headers: Sat, Sun, Mon, Tue, Wed, Thu, Fri */}
          {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, _idx) => (
            <div key={`${d}-${_idx}`} style={{ 
              fontSize: '11px', 
              fontWeight: '950', 
              color: 'var(--accent-color)', 
              opacity: 1, 
              letterSpacing: '1px' 
            }}>{d.toUpperCase()}</div>
          ))}

          {(() => {
            // Use NOON to prevent timezone shifts from moving the day
            const firstDayDate = new Date(currentYear, currentMonth, 1, 12, 0, 0);
            const firstDayOfWeek = firstDayDate.getDay(); // 0 (Sun) to 6 (Sat)
            
            // Explicit Index: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
            const offsetMap: Record<number, number> = {
              6: 0, // Sat
              0: 1, // Sun
              1: 2, // Mon
              2: 3, // Tue
              3: 4, // Wed
              4: 5, // Thu
              5: 6  // Fri
            };
            
            const satStartOffset = offsetMap[firstDayOfWeek];
            const dayElements = [];
            
            // 1. Initial Padding
            for (let i = 0; i < satStartOffset; i++) {
              dayElements.push(<div key={`empty-start-${i}`} />);
            }

            // 2. Actual Days
            for (let day = 1; day <= totalDays; day++) {
              const dayMuscles = monthDayMuscles[day] || [];
              const worked = dayMuscles.length > 0;
              const active = isSelected(day);
              const now = new Date();
              const isToday = now.getFullYear() === currentYear && now.getMonth() === currentMonth && now.getDate() === day;
              const isPast = new Date(currentYear, currentMonth, day) < new Date(new Date().setHours(0,0,0,0));
              
              dayElements.push(
                <div 
                  key={day}
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                  style={{
                    width: 'clamp(38px, 11vw, 46px)', 
                    height: 'clamp(38px, 11vw, 46px)', 
                    margin: '0 auto', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'clamp(14px, 4vw, 17px)', 
                    fontWeight: active ? '950' : (isToday ? '950' : '800'),
                    color: active ? 'var(--accent-color)' : (isToday ? '#E67E22' : (worked ? 'var(--text-primary)' : (isPast ? 'rgba(var(--theme-rgb), 0.45)' : 'rgba(var(--theme-rgb), 0.7)'))),
                    cursor: 'pointer', position: 'relative', borderRadius: '50%',
                    background: active ? 'var(--accent-color-alpha)' : (isToday ? 'rgba(230, 126, 34, 0.08)' : (worked ? 'rgba(var(--theme-rgb), 0.03)' : 'transparent')),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: active ? '1.5px solid var(--accent-color)' : (isToday ? '1.5px solid rgba(230, 126, 34, 0.3)' : (worked ? '1px solid rgba(var(--theme-rgb), 0.1)' : '1px solid transparent')),
                    transform: active ? 'scale(1.05)' : 'scale(1)',
                    paddingTop: dayMuscles.length > 0 ? '2px' : '0px',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{ lineHeight: 1 }}>{day}</span>
                  {dayMuscles.length > 0 ? (
                    <div style={{ display: 'flex', gap: '0px', marginTop: '1px', height: '18px', alignItems: 'center', justifyContent: 'center' }}>
                      {dayMuscles.slice(0, 3).map((g, _idx) => {
                        const mg = MUSCLE_GROUPS.find(m => m.key === g);
                        return mg?.icon ? (
                          <TransparentImage key={g} src={mg.icon} alt="" width={18} height={18} threshold={45} style={{ filter: 'none', marginLeft: _idx > 0 ? '-5px' : '0px', zIndex: 10 - _idx }} />
                        ) : <span key={g} style={{ fontSize: '12px' }}>•</span>;
                      })}
                    </div>
                  ) : (
                    isPast && !isToday && (
                      <div style={{ marginTop: '1px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.75 }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          backgroundColor: 'var(--text-primary)',
                          WebkitMask: 'url(/assets/sofa-custom.png) no-repeat center / contain',
                          mask: 'url(/assets/sofa-custom.png) no-repeat center / contain',
                          display: 'inline-block'
                        }} />
                      </div>
                    )
                  )}
                  {isToday && !active && (
                     <div style={{ 
                       position: 'absolute', inset: '-2px', borderRadius: '50%', 
                       border: '2px solid #E67E22', 
                       
                     }} />
                  )}
                </div>
              );
            }

            return dayElements;
          })()}
        </div>

        {/* Premium Training Frequency Card */}
        {/* Weekly Summary Card */}
        {/* Weekly Summary Container */}
        <div style={{ 
          marginTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '14px', borderRadius: '4px', background: 'var(--accent-color)' }} />
              <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '3px' }}>TRAINING FREQUENCY</span>
            </div>
          </div>
          
          {/* Horizontal Divider */}
          <div style={{ height: '1px', background: 'rgba(var(--theme-rgb), 0.05)', width: '100%' }} />

          <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            {(() => {
              const weeksData = [];
              let weekCount = 0;
              let weekStartDay = 1;
              
              for (let d = 1; d <= totalDays; d++) {
                if (monthDayMuscles[d]?.length > 0) weekCount++;
                
                if (d % 7 === 0 || d === totalDays) {
                  weeksData.push({
                    label: `W${weeksData.length + 1}`,
                    count: weekCount,
                    start: weekStartDay,
                    end: d
                  });
                  weekCount = 0;
                  weekStartDay = d + 1;
                }
              }

              const now = new Date();
              const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
              const isPastMonth = currentYear < now.getFullYear() || (currentYear === now.getFullYear() && currentMonth < now.getMonth());
              const isFutureMonth = currentYear > now.getFullYear() || (currentYear === now.getFullYear() && currentMonth > now.getMonth());
              
              let displayWeeks = weeksData;
              if (!isCurrentMonth && !isFutureMonth) {
                while(displayWeeks.length > 0 && displayWeeks[displayWeeks.length - 1].count === 0 && (displayWeeks[displayWeeks.length - 1].end - displayWeeks[displayWeeks.length - 1].start) < 3) {
                   displayWeeks.pop();
                }
              }

              return displayWeeks.map((week, idx) => {
                const isThisWeek = isCurrentMonth && now.getDate() >= week.start && now.getDate() <= week.end;
                
                // Intelligent Rest Days Calculation
                let restDays = 0;
                if (isFutureMonth) {
                  restDays = 0;
                } else if (isPastMonth) {
                  restDays = (week.end - week.start + 1) - week.count;
                } else {
                  // isCurrentMonth
                  if (now.getDate() < week.start) {
                    restDays = 0; // Future week
                  } else if (isThisWeek) {
                    // Current week: only count a day as "rest" if it has fully passed without a workout
                    let workoutsBeforeToday = 0;
                    for (let d = week.start; d < now.getDate(); d++) {
                      if (monthDayMuscles[d]?.length > 0) workoutsBeforeToday++;
                    }
                    let elapsed = now.getDate() - week.start;
                    restDays = elapsed - workoutsBeforeToday;
                  } else {
                    // Past week in current month
                    restDays = (week.end - week.start + 1) - week.count;
                  }
                }
                restDays = Math.max(0, restDays);

                return (
                  <div key={idx} style={{ flex: '1', display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      flex: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '45px'
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: '950', opacity: isThisWeek ? 1 : 0.4, marginBottom: '4px', letterSpacing: '1.5px', color: isThisWeek ? 'var(--accent-color)' : 'var(--text-primary)' }}>{week.label}</span>
                      <span style={{ fontSize: '20px', fontWeight: '950', color: isThisWeek ? 'var(--accent-color)' : (week.count > 0 ? 'var(--text-primary)' : 'rgba(150,150,150,0.3)'), fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{week.count}</span>
                      
                      {/* Rest Days Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: isThisWeek ? 'var(--text-primary)' : 'var(--text-secondary)',
                          WebkitMask: 'url(/assets/sofa-custom.png) no-repeat center / contain',
                          mask: 'url(/assets/sofa-custom.png) no-repeat center / contain',
                          display: 'inline-block',
                          opacity: restDays > 0 ? 1 : 0.4
                        }} />
                        <span style={{ fontSize: '11px', fontWeight: '950', color: isThisWeek ? "var(--text-primary)" : "var(--text-secondary)", opacity: restDays > 0 ? 1 : 0.4 }}>{restDays}</span>
                      </div>
                    </div>
                    {/* Vertical Divider */}
                    {idx < displayWeeks.length - 1 && (
                      <div style={{ width: '1px', height: '40px', background: 'rgba(var(--theme-rgb), 0.05)' }} />
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Selected Day Logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.7, color: 'var(--text-secondary)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'currentColor',
              WebkitMask: 'url(/assets/dumbbell-custom.png) no-repeat center / contain',
              mask: 'url(/assets/dumbbell-custom.png) no-repeat center / contain',
              display: 'inline-block',
              marginBottom: '16px'
            }} />
            <div style={{ fontSize: '11px', fontWeight: '950', letterSpacing: '3px' }}>{t('noHistory').toUpperCase()}</div>
          </div>
        ) : (
          consolidatedLogs.map((log: WorkoutLog) => {
            const exerciseToMuscle: Record<string, string> = {};
            Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
              exercises.forEach(ex => { exerciseToMuscle[ex] = group; });
            });

            const involvedGroups = new Set<string>();
            log.exercises.forEach(ex => {
              const group = (ex as any).muscleGroup || exerciseToMuscle[ex.name];
              if (group) involvedGroups.add(group);
              else involvedGroups.add(log.muscleGroup);
            });

            const sortedGroups = Array.from(involvedGroups).sort();
            const displayTitle = sortedGroups.map(g => {
              const mg = MUSCLE_GROUPS.find(m => m.key === g);
              return mg?.[lang === 'ar' ? 'ar' : 'en'] ?? g;
            }).join(' & ');

            const totalSets = log.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
            
            return (
              <div 
                key={log.id} id={`log-${log.id}`}
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                role="button"
                style={{ 
                  padding: '24px 16px 24px 32px', cursor: 'pointer',
                  background: tracker.settings.themeMode === 'dark' ? '#0a0a0a' : '#ffffff',
                  border: tracker.settings.themeMode === 'dark' ? '1px solid rgba(230, 126, 34, 0.3)' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '20px', margin: '0 0px 12px 0px', position: 'relative',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '4px', background: '#E67E22', borderRadius: '0 2px 2px 0',  zIndex: 10 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <img src="/assets/flame-custom.png" alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: "'Montserrat', sans-serif" }}>{t('session')}</span>
                </div>
                <div style={{ 
                  position: 'absolute', top: '12px', right: '12px', 
                  display: 'flex', alignItems: 'center', gap: '4px', zIndex: 20,
                  background: 'transparent',
                  padding: '4px 6px', borderRadius: '12px',
                  border: tracker.settings.themeMode === 'dark' ? '1px dashed rgba(var(--theme-rgb), 0.2)' : '1px dashed rgba(0,0,0,0.1)',
                }}>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteWorkout(log.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,51,102,0.6)', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                  <div style={{ width: '1px', height: '12px', background: 'rgba(var(--theme-rgb), 0.1)', margin: '0 2px' }} />
                  <button onClick={(e) => { e.stopPropagation(); setExpandedLogId(expandedLogId === log.id ? null : log.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', transform: expandedLogId === log.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <img src="/assets/arrow-custom.png" alt="Toggle" style={{ width: '22px', height: '22px', objectFit: 'contain', transform: 'rotate(90deg)' }} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: expandedLogId === log.id ? '15px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none' }}>
                      {Array.from(involvedGroups).sort().map(g => {
                        const mg = MUSCLE_GROUPS.find(m => m.key === g);
                        return mg?.icon ? (
                          <TransparentImage key={g} src={mg.icon} alt="" width={54} height={54} threshold={45} style={{ filter: 'none' }} />
                        ) : <span key={g} style={{ fontSize: '24px' }}>💪</span>;
                      })}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', letterSpacing: '-0.5px' }}>{displayTitle}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img src="/assets/calendar-custom.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                          <span style={{ fontSize: '14px', color: 'rgba(var(--theme-rgb), 0.8)', fontWeight: '950', letterSpacing: '-0.3px' }}>{formatDate(log.date, lang)}</span>
                        </div>
                        {log.startTime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '1.5px', height: '12px', background: 'rgba(var(--theme-rgb), 0.2)', margin: '0 2px' }} />
                            <img src="/assets/clock-custom.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                            <span style={{ fontSize: '14px', color: 'rgba(var(--theme-rgb), 0.8)', fontWeight: '950', opacity: 1, letterSpacing: '-0.3px' }}>{formatTime(log.startTime, lang)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateRows: expandedLogId === log.id ? '1fr' : '0fr', transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' }}>
                  <div style={{ minHeight: 0 }}>
                    <div style={{ paddingTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: tracker.settings.themeMode === 'dark' ? '1px solid rgba(var(--theme-rgb), 0.08)' : '1px solid rgba(0,0,0,0.08)', borderBottom: tracker.settings.themeMode === 'dark' ? '1px solid rgba(var(--theme-rgb), 0.08)' : '1px solid rgba(0,0,0,0.08)', marginBottom: '24px', gap: '4px', opacity: expandedLogId === log.id ? 1 : 0, transform: expandedLogId === log.id ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.4s ease' }}>
                        {[
                          { label: t('exercises'), value: log.exercises.length },
                          { label: t('totalSets'), value: totalSets },
                          { label: t('duration'), value: formatDuration(log.durationMinutes, t) },
                        ].map((stat, idx) => (
                          <React.Fragment key={stat.label}>
                            {idx > 0 && <div style={{ width: '1px', height: '24px', background: 'rgba(var(--theme-rgb), 0.1)' }} />}
                            <div style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ fontSize: '20px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', fontFamily: "'Montserrat', sans-serif" }}>{stat.value}</div>
                              <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.5)', fontWeight: '950', letterSpacing: '2px', marginTop: '6px', textTransform: 'uppercase' }}>{stat.label}</div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '0' }}>
                        {(() => {
                          const groups: Record<string, typeof log.exercises> = {};
                          log.exercises.forEach(ex => {
                            const mgKey = (ex as any).muscleGroup || exerciseToMuscle[ex.name] || log.muscleGroup;
                            if (!groups[mgKey]) groups[mgKey] = [];
                            groups[mgKey].push(ex);
                          });

                          const sortedExercises: (typeof log.exercises[0] & { groupKey: string, isFirstInGroup: boolean })[] = [];
                          Object.keys(groups).sort().forEach(groupKey => {
                            groups[groupKey].forEach((ex, idx) => {
                              sortedExercises.push({ ...ex, groupKey, isFirstInGroup: idx === 0 });
                            });
                          });

                          return sortedExercises.map((ex, exIdx) => {
                            const bestSet = ex.sets.reduce((best, s) => {
                              const sInKg = tracker.convertWeight(s.weight, s.unit || 'kg', 'kg');
                              const bestInKg = tracker.convertWeight(best.weight, (best as any).unit || 'kg', 'kg');
                              return sInKg > bestInKg ? s : best;
                            }, ex.sets[0] ?? { weight: 0, reps: 0 });

                            const isPR = (() => {
                              const pr = tracker.getExercisePR(ex.name);
                              if (!pr) return false;
                              const prInKg = tracker.convertWeight(pr.weight, (pr as any).unit || 'kg', 'kg');
                              const bestInKg = tracker.convertWeight(bestSet.weight, (bestSet as any).unit || 'kg', 'kg');
                              return Math.abs(prInKg - bestInKg) < 0.01;
                            })();
                            const mg = MUSCLE_GROUPS.find(m => m.key === ex.groupKey);
                            
                            return (
                              <React.Fragment key={`${ex.name}-${exIdx}`}>
                                {ex.isFirstInGroup && exIdx > 0 && (
                                  <div style={{ height: '8px' }} />
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: expandedLogId === log.id ? 1 : 0, transform: expandedLogId === log.id ? 'translateX(0)' : 'translateX(-10px)', transition: `all 0.4s ease ${0.1 + exIdx * 0.05}s`, background: 'rgba(var(--theme-rgb), 0.03)', padding: '10px 12px', borderRadius: '12px', borderLeft: ex.isFirstInGroup ? '2px solid var(--accent-color)' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E67E22',  }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '15px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000' }}>{ex.name}</span>
                                      <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent-color)', opacity: 0.95, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>{lang === 'ar' ? mg?.ar : mg?.en}</span>
                                    </div>
                                    {isPR && (
                                      <div style={{ fontSize: '8px', fontWeight: '950', color: '#E67E22', background: 'rgba(230, 126, 34, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>PR</div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontSize: '16px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000' }}>{ex.sets.length}</span>
                                      <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--text-secondary)', opacity: 0.9, marginLeft: '4px' }}>SETS</span>
                                    </div>
                                    <div style={{ width: '1px', height: '12px', background: 'rgba(var(--theme-rgb), 0.1)' }} />
                                    <div style={{ textAlign: 'right' }}>
                                       <span style={{ fontSize: '16px', fontWeight: '950', color: 'var(--accent-color)' }}>{bestSet.weight}</span>
                                       <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-color)', marginLeft: '2px' }}> {t((bestSet as any).unit as any)}</span>
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          });
                        })() }
                      </div>

                      {(() => {
                        const logDate = new Date(log.date);
                        const dayNutrition = tracker.nutritionLogs.filter((l: any) => {
                          const d = new Date(l.date);
                          return d.getFullYear() === logDate.getFullYear() && d.getMonth() === logDate.getMonth() && d.getDate() === logDate.getDate();
                        });
                        
                        if (dayNutrition.length === 0) return null;

                        const totalCal = dayNutrition.reduce((sum: number, l: any) => sum + l.calories, 0);
                        const totalPro = dayNutrition.reduce((sum: number, l: any) => sum + l.protein, 0);
                        const totalCarb = dayNutrition.reduce((sum: number, l: any) => sum + l.carbs, 0);
                        const totalFat = dayNutrition.reduce((sum: number, l: any) => sum + l.fats, 0);

                        return (
                          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: tracker.settings.themeMode === 'dark' ? '1px solid rgba(var(--theme-rgb), 0.1)' : '1px solid rgba(0,0,0,0.1)', opacity: expandedLogId === log.id ? 1 : 0, transform: expandedLogId === log.id ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.4s ease 0.2s' }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '950', color: 'var(--accent-color)', letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>Daily Nutrition Log</div>
                              <div style={{ width: '30px', height: '2px', background: 'var(--accent-color)', margin: '0 auto', opacity: 0.3, borderRadius: '2px' }} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '4px' }}>
                              {[
                                { label: 'KCAL', value: totalCal },
                                { label: 'PROTEIN', value: `${totalPro.toFixed(0)}g` },
                                { label: 'CARBS', value: `${totalCarb.toFixed(0)}g` },
                                { label: 'FATS', value: `${totalFat.toFixed(0)}g` },
                              ].map((stat, idx) => (
                                <React.Fragment key={stat.label}>
                                  {idx > 0 && <div style={{ width: '1px', height: '16px', background: 'rgba(var(--theme-rgb), 0.1)' }} />}
                                  <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontSize: '15px', fontWeight: '950', color: idx === 0 ? 'var(--accent-color)' : (tracker.settings.themeMode === 'dark' ? '#fff' : '#000'), fontFamily: 'Inter, sans-serif' }}>{stat.value}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.5)', fontWeight: '950', letterSpacing: '2px', marginTop: '6px', textTransform: 'uppercase' }}>{stat.label}</div>
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0 10px 0' }}>
                              {dayNutrition.map((food: any, fIdx: number) => (
                                <div key={fIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(var(--theme-rgb), 0.03)', padding: '8px 12px', borderRadius: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#E67E22' }} />
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', opacity: 0.9 }}>{food.nameAr || food.name}</span>
                                    {food.servingSize && <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(var(--theme-rgb), 0.5)' }}>x{food.servingSize}</span>}
                                  </div>
                                  <div style={{ textAlign: 'right', minWidth: '60px' }}>
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '800', color: 'var(--accent-color)' }}>{food.calories}</span>
                                    <span style={{ fontSize: '9px', fontWeight: '950', color: 'var(--accent-color)', marginLeft: '2px', opacity: 1 }}>KCAL</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
