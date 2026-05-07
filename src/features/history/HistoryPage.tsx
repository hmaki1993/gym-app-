import React, { useRef, useState, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import type { WorkoutLog } from '../../types';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';
import { translations } from '../../translations';
import { Dumbbell, Calendar, Trash2, Clock, ChevronDown, Flame } from 'lucide-react';
import { TransparentImage } from '../workout/components/TransparentImage';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onDeleteWorkout: (id: string) => void;
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

export function HistoryPage({ tracker, onDeleteWorkout }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const unit = tracker.settings.weightUnit;
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Auto-scroll to expanded log
  useEffect(() => {
    if (expandedLogId) {
      // Wait for the expansion animation to progress
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
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const totalDays = daysInMonth(currentYear, currentMonth);
  const startOffset = firstDayOfMonth(currentYear, currentMonth);

  const monthName = viewDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' });

  const hasWorkout = (day: number) => {
    return tracker.logs.some(l => {
      const d = new Date(l.date);
      return d.getFullYear() === currentYear &&
             d.getMonth() === currentMonth &&
             d.getDate() === day;
    });
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === currentYear &&
           selectedDate.getMonth() === currentMonth &&
           selectedDate.getDate() === day;
  };

  const filteredLogs = selectedDate 
    ? tracker.logs.filter(l => {
        const d = new Date(l.date);
        return d.getFullYear() === selectedDate.getFullYear() &&
               d.getMonth() === selectedDate.getMonth() &&
               d.getDate() === selectedDate.getDate();
      })
    : [];

  const changeMonth = (offset: number) => {
    const d = new Date(currentYear, currentMonth + offset, 1);
    setViewDate(d);
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '120px' }}>
      {/* Weightless Elite Calendar - Compact */}
      <div style={{ 
        padding: '5px 0 15px', 
        transformStyle: 'preserve-3d',
        animation: 'fadeIn 0.6s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 20px' }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '6px' }}>
            <Calendar size={16} />
          </button>
          <h2 style={{ 
            margin: 0, 
            fontSize: '15px', 
            fontWeight: '950', 
            color: 'rgba(255,255,255,0.85)', 
            textTransform: 'uppercase', 
            letterSpacing: '2px',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {monthName}
          </h2>
          <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '6px' }}>
            <Calendar size={16} />
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '6px', 
          textAlign: 'center' 
        }}>
          {/* Day Headers - More Visible */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
            <div key={`${d}-${idx}`} style={{ fontSize: '13px', fontWeight: '950', color: 'var(--accent-color)', opacity: 1, letterSpacing: '1px' }}>{d}</div>
          ))}

          {/* Empty spaces for offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`off-${i}`} />
          ))}

          {/* Actual Days - More Visible */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const worked = hasWorkout(day);
            const active = isSelected(day);
            const now = new Date();
            const isToday = now.getFullYear() === currentYear && now.getMonth() === currentMonth && now.getDate() === day;

            const isPast = new Date(currentYear, currentMonth, day) < new Date(new Date().setHours(0,0,0,0));

            return (
              <div 
                key={day}
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                style={{
                  height: '40px',
                  width: '40px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: active ? '950' : (isToday ? '950' : '800'),
                  color: active ? 'var(--accent-color)' : (isToday ? 'var(--accent-color)' : (worked ? 'var(--text-primary)' : (isPast ? 'rgba(var(--theme-rgb), 0.3)' : 'rgba(var(--theme-rgb), 0.7)'))),
                  cursor: 'pointer', position: 'relative',
                  borderRadius: '50%',
                  background: active ? 'var(--accent-color-alpha)' : (isToday ? 'rgba(var(--theme-rgb), 0.05)' : (isPast && !worked ? 'rgba(255, 94, 0, 0.04)' : 'transparent')),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: active ? '1.5px solid var(--accent-color)' : (isToday ? '1.5px solid var(--accent-color-alpha)' : '1px solid transparent'),
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: active ? '0 0 15px var(--accent-color-alpha)' : (isToday ? '0 0 10px var(--accent-color-alpha)' : 'none'),
                  animation: isToday ? 'pulseToday 2s infinite' : 'none'
                }}
              >
                {day}
                {isToday && !active && (
                   <div style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-2px',
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-color)',
                    boxShadow: '0 0 8px var(--accent-color)'
                  }} />
                )}
                {worked && !active && !isToday && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '2px', 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-color)',
                    boxShadow: '0 0 8px var(--accent-color)'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.7, color: 'var(--text-secondary)' }}>
            <Dumbbell size={40} style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '11px', fontWeight: '950', letterSpacing: '3px' }}>{t('noHistory').toUpperCase()}</div>
          </div>
        ) : (
          filteredLogs.map((log: WorkoutLog) => {
            // Derive muscle groups from exercises
            const exerciseToMuscle: Record<string, string> = {};
            Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
              exercises.forEach(ex => { exerciseToMuscle[ex] = group; });
            });

            const involvedGroups = new Set<string>();
            log.exercises.forEach(ex => {
              const group = exerciseToMuscle[ex.name];
              if (group) involvedGroups.add(group);
              else involvedGroups.add(log.muscleGroup); // Fallback to primary
            });

            const sortedGroups = Array.from(involvedGroups).sort();
            const displayTitle = sortedGroups.map(g => {
              const mg = MUSCLE_GROUPS.find(m => m.key === g);
              return mg?.[lang] ?? g;
            }).join(' & ');


            const volume = tracker.getTotalVolume(log);
            const totalSets = log.exercises.reduce((s, ex) => s + ex.sets.length, 0);

            return (
              <div 
                key={log.id} 
                id={`log-${log.id}`}
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                role="button"
                style={{ 
                  padding: '24px 16px 24px 32px', 
                  cursor: 'pointer',
                  background: tracker.settings.themeMode === 'dark' ? '#0a0a0a' : '#ffffff',
                  border: tracker.settings.themeMode === 'dark' 
                    ? '1px solid rgba(255, 61, 0, 0.3)' 
                    : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '20px',
                  margin: '0 0px 12px 0px',
                  position: 'relative',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Premium Neon Pillar */}
                <div style={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: '15%', 
                  bottom: '15%', 
                  width: '4px', 
                  background: '#ff3d00', 
                  borderRadius: '0 2px 2px 0',
                  boxShadow: '0 0 15px rgba(255, 61, 0, 0.6)',
                  zIndex: 10
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Flame size={12} color="var(--accent-secondary)" fill="var(--accent-secondary)" />
                  <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'Outfit, sans-serif' }}>
                    {t('session')}
                  </span>
                </div>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: expandedLogId === log.id ? '15px' : '0' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      background: 'none'
                    }}>
                      {Array.from(involvedGroups).sort().map(g => {
                        const mg = MUSCLE_GROUPS.find(m => m.key === g);
                        return mg?.icon ? (
                          <TransparentImage 
                            key={g}
                            src={mg.icon} 
                            alt="" 
                            width={42} 
                            height={42} 
                            threshold={45}
                            style={{ filter: tracker.settings.themeMode === 'dark' ? 'grayscale(1) brightness(1.2)' : 'grayscale(1) brightness(0.8)' }}
                          />
                        ) : <span key={g} style={{ fontSize: '24px' }}>💪</span>;
                      })}
                    </div>
                    <div>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '22px', 
                        fontWeight: '950', 
                        color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', 
                        letterSpacing: '-0.5px' 
                      }}>
                        {displayTitle}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={10} color="var(--accent-color)" />
                          <span style={{ 
                            fontSize: '12px', 
                            color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', 
                            fontWeight: '900' 
                          }}>{formatDate(log.date, lang)}</span>
                        </div>
                        {log.startTime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ 
                              width: '1.5px', 
                              height: '10px', 
                              background: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', 
                              margin: '0 2px' 
                            }} />
                            <Clock size={10} color="var(--accent-color)" />
                            <span style={{ 
                              fontSize: '10px', 
                              color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', 
                              fontWeight: '900', 
                              opacity: 1 
                            }}>
                              {formatTime(log.startTime, lang)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteWorkout(log.id); }}
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', 
                        color: 'rgba(255,51,102,0.6)', padding: '8px',
                        marginRight: '-4px'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedLogId(expandedLogId === log.id ? null : log.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-color)',
                        transform: expandedLogId === log.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <ChevronDown size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* 2 & 3. Collapsible Details with Smooth Animation */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateRows: expandedLogId === log.id ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}>
                  <div style={{ minHeight: 0 }}>
                    <div style={{ paddingTop: '10px' }}>
                      {/* Stats Row */}
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 0', 
                        borderTop: tracker.settings.themeMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', 
                        borderBottom: tracker.settings.themeMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                        marginBottom: '24px', gap: '4px',
                        opacity: expandedLogId === log.id ? 1 : 0,
                        transform: expandedLogId === log.id ? 'translateY(0)' : 'translateY(-10px)',
                        transition: 'all 0.4s ease'
                      }}>
                        {[
                          { label: t('exercises'), value: log.exercises.length },
                          { label: t('totalSets'), value: totalSets },
                          { label: t('totalVolume'), value: `${volume.toFixed(0)} ${t(unit as any)}` },
                          { label: t('duration'), value: formatDuration(log.durationMinutes, t) },
                        ].map((stat, idx) => (
                          <React.Fragment key={stat.label}>
                            {idx > 0 && <div style={{ width: '1px', height: '24px', background: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />}
                            <div style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '20px', 
                                fontWeight: '950', 
                                color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', 
                                fontFamily: 'Outfit, sans-serif'
                              }}>{stat.value}</div>
                              <div style={{ 
                                fontSize: '10px', 
                                color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', 
                                fontWeight: '950', 
                                letterSpacing: '2px', 
                                marginTop: '6px', 
                                textTransform: 'uppercase' 
                              }}>{stat.label}</div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Exercises List - Grouped by Muscle Group */}
                      <div style={{ 
                        display: 'flex', flexDirection: 'column', gap: '8px', 
                        paddingLeft: '0' 
                      }}>
                        {(() => {
                          // Group exercises by muscle group
                          const groups: Record<string, typeof log.exercises> = {};
                          log.exercises.forEach(ex => {
                            const mgKey = exerciseToMuscle[ex.name] || log.muscleGroup;
                            if (!groups[mgKey]) groups[mgKey] = [];
                            groups[mgKey].push(ex);
                          });

                          // Flatten the grouped exercises to maintain a list but with grouping
                          const sortedExercises: (typeof log.exercises[0] & { groupKey: string, isFirstInGroup: boolean })[] = [];
                          Object.keys(groups).sort().forEach(groupKey => {
                            groups[groupKey].forEach((ex, idx) => {
                              sortedExercises.push({ ...ex, groupKey, isFirstInGroup: idx === 0 });
                            });
                          });

                          return sortedExercises.map((ex, exIdx) => {
                            const bestSet = ex.sets.reduce((best, s) => s.weight > best.weight ? s : best, ex.sets[0] ?? { weight: 0, reps: 0 });
                            const isPR = tracker.getExercisePR(ex.name)?.weight === bestSet.weight;
                            const mg = MUSCLE_GROUPS.find(m => m.key === ex.groupKey);
                            
                            return (
                              <React.Fragment key={`${ex.name}-${exIdx}`}>
                                {ex.isFirstInGroup && exIdx > 0 && (
                                  <div style={{ height: '8px' }} />
                                )}
                                <div 
                                  style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    opacity: expandedLogId === log.id ? 1 : 0,
                                    transform: expandedLogId === log.id ? 'translateX(0)' : 'translateX(-10px)',
                                    transition: `all 0.4s ease ${0.1 + exIdx * 0.05}s`,
                                    background: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    borderLeft: ex.isFirstInGroup ? '2px solid var(--accent-color)' : 'none'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '15px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000' }}>{ex.name}</span>
                                      <span style={{ 
                                        fontSize: '9px', 
                                        fontWeight: '900', 
                                        color: 'var(--accent-color)', 
                                        opacity: 0.7, 
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginTop: '1px'
                                      }}>
                                        {lang === 'ar' ? mg?.ar : mg?.en}
                                      </span>
                                    </div>
                                    {isPR && (
                                      <div style={{ 
                                        fontSize: '8px', fontWeight: '950', color: '#ff3d00', 
                                        background: 'rgba(255, 61, 0, 0.1)', padding: '2px 6px', 
                                        borderRadius: '4px'
                                      }}>PR</div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontSize: '16px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000' }}>{ex.sets.length}</span>
                                      <span style={{ fontSize: '10px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginLeft: '4px' }}>SETS</span>
                                    </div>
                                    <div style={{ width: '1px', height: '12px', background: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontSize: '16px', fontWeight: '950', color: 'var(--accent-color)' }}>{bestSet.weight}</span>
                                      <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-color)', marginLeft: '2px' }}> {t(unit as any)}</span>
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          });
                        })()}
                      </div>

                      {/* ── STANDARDIZED NUTRITION (Same as Workout Style) ── */}
                      {(() => {
                        const logDate = new Date(log.date);
                        const dayNutrition = tracker.nutritionLogs.filter((l: any) => {
                          const d = new Date(l.date);
                          return d.getFullYear() === logDate.getFullYear() &&
                                 d.getMonth() === logDate.getMonth() &&
                                 d.getDate() === logDate.getDate();
                        });
                        
                        if (dayNutrition.length === 0) return null;

                        const totalCal = dayNutrition.reduce((sum: number, l: any) => sum + l.calories, 0);
                        const totalPro = dayNutrition.reduce((sum: number, l: any) => sum + l.protein, 0);
                        const totalCarb = dayNutrition.reduce((sum: number, l: any) => sum + l.carbs, 0);
                        const totalFat = dayNutrition.reduce((sum: number, l: any) => sum + l.fats, 0);

                        return (
                          <div style={{ 
                            marginTop: '24px',
                            paddingTop: '20px',
                            borderTop: tracker.settings.themeMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                            opacity: expandedLogId === log.id ? 1 : 0,
                            transform: expandedLogId === log.id ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'all 0.4s ease 0.2s'
                          }}>
                            {/* Premium Centered Title */}
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                              <div style={{ 
                                fontSize: '11px', 
                                fontWeight: '950', 
                                color: 'var(--accent-color)', 
                                letterSpacing: '4px', 
                                textTransform: 'uppercase', 
                                opacity: 0.8,
                                marginBottom: '8px'
                              }}>Daily Nutrition Log</div>
                              <div style={{ width: '30px', height: '2px', background: 'var(--accent-color)', margin: '0 auto', opacity: 0.3, borderRadius: '2px' }} />
                            </div>

                            {/* Stats Row (Same as Workout Stats) */}
                            <div style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              marginBottom: '24px', gap: '4px'
                            }}>
                              {[
                                { label: 'KCAL', value: totalCal },
                                { label: 'PROTEIN', value: `${totalPro.toFixed(0)}g` },
                                { label: 'CARBS', value: `${totalCarb.toFixed(0)}g` },
                                { label: 'FATS', value: `${totalFat.toFixed(0)}g` },
                              ].map((stat, idx) => (
                                <React.Fragment key={stat.label}>
                                  {idx > 0 && <div style={{ width: '1px', height: '16px', background: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />}
                                  <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ 
                                      fontSize: '15px', 
                                      fontWeight: '950', 
                                      color: idx === 0 ? 'var(--accent-color)' : (tracker.settings.themeMode === 'dark' ? '#fff' : '#000'), 
                                      fontFamily: 'Inter, sans-serif'
                                    }}>{stat.value}</div>
                                    <div style={{ fontSize: '10px', color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontWeight: '950', letterSpacing: '2px', marginTop: '6px', textTransform: 'uppercase' }}>{stat.label}</div>
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>

                            {/* Food List (Same as Exercise List) */}
                            <div style={{ 
                              display: 'flex', flexDirection: 'column', gap: '8px', 
                              padding: '4px 0 10px 0' 
                            }}>
                              {dayNutrition.map((food: any, fIdx: number) => (
                                <div key={fIdx} style={{ 
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  background: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                  padding: '8px 12px',
                                  borderRadius: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#ff3d00' }} />
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', opacity: 0.9 }}>{food.nameAr || food.name}</span>
                                    {food.servingSize && <span style={{ fontSize: '10px', fontWeight: '900', color: tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>x{food.servingSize}</span>}
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
