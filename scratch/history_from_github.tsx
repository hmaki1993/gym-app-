import React, { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { 
  ChevronLeft, ChevronRight, History as HistoryIcon, 
  Flame, Clock, Trash2, ChevronDown, Award, Calendar
} from 'lucide-react';
import { TransparentImage } from '../workout/components/TransparentImage';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../../data/exercises';

interface HistoryPageProps {
  tracker: ReturnType<typeof useGymTracker>;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ tracker }) => {
  const lang = tracker.settings.language;
  const t = (key: string) => (translations[lang] as any)[key] ?? key;
  const weightUnit = tracker.settings.weightUnit;
  
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  
  useEffect(() => {
    if (activeLogId) {
      setTimeout(() => {
        const el = document.getElementById(`log-${activeLogId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [activeLogId]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthLabel = currentMonth.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' });

  const hasLogOnDay = (day: number) => tracker.logs.some(log => {
    const d = new Date(log.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });

  const isSelected = (day: number) => selectedDate ? 
    selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day : false;

  const dayLogs = selectedDate ? tracker.logs.filter(log => {
    const d = new Date(log.date);
    return d.getFullYear() === selectedDate.getFullYear() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getDate() === selectedDate.getDate();
  }) : [];

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(year, month + offset, 1));
  };

  const formatDate = (dateStr: string, language: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
  };

  const formatTime = (timeStr: string, language: string) => {
    const d = new Date(timeStr);
    return d.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '120px' }}>
      
      {/* 1. CALENDAR SECTION */}
      <div style={{ padding: '5px 0 15px', animation: 'fadeIn 0.6s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 20px' }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '6px' }}>
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '950', color: 'var(--text-primary)', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'Outfit, sans-serif' }}>
            {monthLabel}
          </h2>
          <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '6px' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={`${d}-${i}`} style={{ fontSize: '13px', fontWeight: '950', color: 'var(--accent-color)', opacity: 1, letterSpacing: '1px' }}>{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`off-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const hasLog = hasLogOnDay(dayNum);
            const active = isSelected(dayNum);
            const today = new Date();
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayNum;
            const isPast = new Date(year, month, dayNum) < new Date(new Date().setHours(0,0,0,0));

            return (
              <div 
                key={dayNum}
                onClick={() => setSelectedDate(new Date(year, month, dayNum))}
                style={{ 
                  height: '40px', width: '40px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: active || isToday ? '950' : '800',
                  color: active || isToday ? 'var(--accent-color)' : hasLog ? 'var(--text-primary)' : isPast ? 'rgba(var(--theme-rgb), 0.3)' : 'rgba(var(--theme-rgb), 0.5)',
                  cursor: 'pointer', position: 'relative', borderRadius: '50%',
                  background: active ? 'var(--accent-color-alpha)' : isToday ? 'rgba(var(--theme-rgb), 0.05)' : (isPast && !hasLog) ? 'rgba(var(--theme-rgb), 0.02)' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: active ? '1.5px solid var(--accent-color)' : isToday ? '1.5px solid var(--accent-color-alpha)' : '1px solid transparent',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: active ? '0 0 15px var(--accent-color-alpha)' : isToday ? '0 0 10px var(--accent-color-alpha)' : 'none'
                }}
              >
                {dayNum}
                {isToday && !active && (
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-color)' }} />
                )}
                {hasLog && !active && !isToday && (
                  <div style={{ position: 'absolute', bottom: '2px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-color)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. LOGS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {dayLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.7, color: 'var(--text-secondary)' }}>
            <HistoryIcon size={40} style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '11px', fontWeight: '950', letterSpacing: '3px' }}>{t('noHistory').toUpperCase()}</div>
          </div>
        ) : (
          dayLogs.map(log => {
            const muscles = new Set<string>();
            log.exercises.forEach(ex => {
              let mg = (ex as any).muscleGroup;
              if (!mg) {
                for (const [group, list] of Object.entries(DEFAULT_EXERCISES)) {
                  if (list.includes(ex.name)) { mg = group; break; }
                }
              }
              muscles.add(mg || log.muscleGroup);
            });

            const muscleLabel = Array.from(muscles).sort().map(m => MUSCLE_GROUPS.find(g => g.key === m)?.[lang === 'ar' ? 'ar' : 'en'] ?? m).join(' & ');
            const logVolume = tracker.getTotalVolume(log);
            const totalSets = log.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

            return (
              <div 
                key={log.id} id={`log-${log.id}`} 
                onClick={() => setActiveLogId(activeLogId === log.id ? null : log.id)}
                role="button"
                style={{ 
                  padding: '24px 20px', cursor: 'pointer',
                  background: tracker.settings.themeMode === 'dark' ? '#0a0a0a' : '#ffffff',
                  border: tracker.settings.themeMode === 'dark' ? '1px solid rgba(var(--accent-rgb), 0.15)' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '28px', margin: '0 12px 12px', position: 'relative',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeLogId === log.id ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '20px', width: '3px', background: 'var(--accent-secondary, var(--accent-color))', borderRadius: '0 4px 4px 0', boxShadow: '0 0 15px var(--accent-color-alpha)' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingLeft: '8px' }}>
                  <Flame size={12} color="var(--accent-secondary, var(--accent-color))" fill="var(--accent-secondary, var(--accent-color))" />
                  <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-secondary, var(--accent-color))', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'Outfit, sans-serif' }}>
                    {t('session').toUpperCase()}
                  </span>
                </div>
 
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '8px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ opacity: 0.9 }}>
                      {Array.from(muscles).sort().slice(0, 1).map(mKey => {
                        const mInfo = MUSCLE_GROUPS.find(mg => mg.key === mKey);
                        return mInfo?.icon ? (
                          <TransparentImage key={mKey} src={mInfo.icon} alt="" width={56} height={56} threshold={45} style={{ filter: tracker.settings.themeMode === 'dark' ? 'grayscale(1) brightness(1.3)' : 'grayscale(1) brightness(0.7)' }} />
                        ) : <span key={mKey} style={{ fontSize: '32px' }}>💪</span>;
                      })}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', letterSpacing: '-1px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{muscleLabel}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                           <Calendar size={11} color="var(--accent-secondary, var(--accent-color))" />
                           <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '900', opacity: 0.6 }}>{formatDate(log.date, lang)} {new Date(log.date).getFullYear()}</span>
                         </div>
                         {log.startTime && (
                           <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                             <div style={{ width: '1px', height: '10px', background: 'rgba(var(--theme-rgb), 0.1)' }} />
                             <Clock size={11} color="var(--accent-secondary, var(--accent-color))" />
                             <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '900', opacity: 0.6 }}>{formatTime(log.startTime, lang)}</span>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={(e) => { e.stopPropagation(); tracker.deleteWorkout(log.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,51,102,0.4)', padding: '8px' }}>
                      <Trash2 size={20} />
                    </button>
                    <ChevronDown size={22} color="var(--text-secondary)" style={{ transform: activeLogId === log.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.35s ease', opacity: 0.4 }} />
                  </div>
                </div>
 
                {/* Always visible stats row if not expanded, or different view? 
                    In the screenshot, the stats row is part of the collapsed view too. */}
                <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(var(--theme-rgb), 0.05)', marginTop: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      {[
                        { label: 'EXERCISES', value: log.exercises.length },
                        { label: 'TOTAL SETS', value: totalSets },
                        { label: 'TOTAL VOLUME', value: `${logVolume.toFixed(0)}`, unit: t(weightUnit) },
                        { label: 'DURATION', value: `${log.durationMinutes}`, unit: 'min' }
                      ].map((item, idx) => (
                        <React.Fragment key={item.label}>
                          {idx > 0 && <div style={{ width: '1px', height: '30px', background: 'rgba(var(--theme-rgb), 0.08)' }} />}
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px' }}>
                              <span style={{ fontSize: '24px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{item.value}</span>
                              {item.unit && <span style={{ fontSize: '12px', fontWeight: '950', color: 'var(--text-primary)', opacity: 0.8 }}>{item.unit}</span>}
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '950', letterSpacing: '1.5px', marginTop: '4px', textTransform: 'uppercase', opacity: 0.5 }}>{item.label}</div>
                          </div>
                        </React.Fragment>
                      ))}
                   </div>
                </div>
 
                {/* Collapsible Details */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateRows: activeLogId === log.id ? '1fr' : '0fr', 
                  transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ minHeight: 0 }}>
                    <div style={{ paddingTop: '24px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(() => {
                             const grouped: Record<string, any[]> = {};
                             log.exercises.forEach(ex => {
                               let mg = (ex as any).muscleGroup;
                               if (!mg) {
                                 for (const [group, list] of Object.entries(DEFAULT_EXERCISES)) {
                                   if (list.includes(ex.name)) { mg = group; break; }
                                 }
                               }
                               mg ||= log.muscleGroup;
                               if (!grouped[mg]) grouped[mg] = [];
                               grouped[mg].push(ex);
                             });

                             const sortedGroups = Object.keys(grouped).sort();
                             let totalIdx = 0;
                             
                             return sortedGroups.map(groupKey => (
                               <div key={groupKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                 {grouped[groupKey].map((ex, idx) => {
                                    const currentIdx = totalIdx++;
                                    const bestSet = ex.sets.reduce((prev: any, curr: any) => curr.weight > prev.weight ? curr : prev, ex.sets[0] || { weight: 0, reps: 0 });
                                    const isPR = tracker.getExercisePR(ex.name)?.weight === bestSet.weight;
                                    const mInfo = MUSCLE_GROUPS.find(g => g.key === groupKey);
                                    const mLabel = lang === 'ar' ? mInfo?.ar : mInfo?.en;

                                    return (
                                      <div key={`${ex.name}-${idx}`} style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        background: tracker.settings.themeMode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)', 
                                        padding: '16px 20px', borderRadius: '18px',
                                        border: '1px solid rgba(var(--theme-rgb), 0.05)',
                                        borderLeft: idx === 0 ? '3px solid var(--accent-color)' : '1px solid rgba(var(--theme-rgb), 0.05)',
                                        opacity: activeLogId === log.id ? 1 : 0,
                                        transform: activeLogId === log.id ? 'translateX(0)' : 'translateX(-10px)',
                                        transition: `all 0.4s ease ${0.1 + currentIdx * 0.05}s`
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary, var(--accent-color))', boxShadow: '0 0 10px var(--accent-secondary, var(--accent-color))' }} />
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                             <span style={{ fontSize: '17px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{ex.name}</span>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', opacity: 0.4 }}>{mLabel}</span>
                                                {isPR && (
                                                  <span style={{ 
                                                    fontSize: '8px', fontWeight: '950', color: '#000', 
                                                    background: 'var(--accent-secondary, var(--accent-color))', 
                                                    padding: '1px 6px', borderRadius: '4px', width: 'fit-content'
                                                  }}>PR</span>
                                                )}
                                             </div>
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                           <div style={{ textAlign: 'right' }}>
                                              <span style={{ fontSize: '20px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{ex.sets.length}</span>
                                              <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', marginLeft: '4px', opacity: 0.5 }}>SETS</span>
                                           </div>
                                           <div style={{ width: '1px', height: '20px', background: 'rgba(var(--theme-rgb), 0.1)' }} />
                                           <div style={{ textAlign: 'right' }}>
                                              <span style={{ fontSize: '20px', fontWeight: '950', color: 'var(--accent-secondary, var(--accent-color))', fontFamily: 'Outfit, sans-serif' }}>{bestSet.weight}</span>
                                              <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-secondary, var(--accent-color))', marginLeft: '4px', opacity: 0.8 }}>{t(weightUnit)}</span>
                                           </div>
                                        </div>
                                      </div>
                                    );
                                 })}
                               </div>
                             ));
                          })()}
                       </div>

                       {/* Daily Nutrition Integration (Missing piece from APK) */}
                       {(() => {
                          const logDate = new Date(log.date);
                          const nutritionForDay = tracker.nutritionLogs.filter(n => {
                            const d = new Date(n.date);
                            return d.getFullYear() === logDate.getFullYear() && d.getMonth() === logDate.getMonth() && d.getDate() === logDate.getDate();
                          });

                          if (nutritionForDay.length === 0) return null;

                          const totals = nutritionForDay.reduce((acc, n) => ({
                            kcal: acc.kcal + n.calories,
                            protein: acc.protein + n.protein,
                            carbs: acc.carbs + n.carbs,
                            fats: acc.fats + n.fats
                          }), { kcal: 0, protein: 0, carbs: 0, fats: 0 });

                          return (
                            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(var(--theme-rgb), 0.1)', opacity: activeLogId === log.id ? 1 : 0, transform: activeLogId === log.id ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.4s ease 0.2s' }}>
                               <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: '950', color: 'var(--accent-color)', letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>Daily Nutrition Log</div>
                                  <div style={{ width: '30px', height: '2px', background: 'var(--accent-color)', margin: '0 auto', opacity: 0.3, borderRadius: '2px' }} />
                               </div>

                               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '4px' }}>
                                  {[
                                    { label: 'KCAL', value: Math.round(totals.kcal) },
                                    { label: 'PROTEIN', value: `${Math.round(totals.protein)}g` },
                                    { label: 'CARBS', value: `${Math.round(totals.carbs)}g` },
                                    { label: 'FATS', value: `${Math.round(totals.fats)}g` }
                                  ].map((stat, idx) => (
                                    <React.Fragment key={stat.label}>
                                      {idx > 0 && <div style={{ width: '1px', height: '16px', background: 'rgba(var(--theme-rgb), 0.1)' }} />}
                                      <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: '15px', fontWeight: '950', color: idx === 0 ? 'var(--accent-color)' : 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>{stat.value}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '950', letterSpacing: '2px', marginTop: '6px', textTransform: 'uppercase' }}>{stat.label}</div>
                                      </div>
                                    </React.Fragment>
                                  ))}
                               </div>

                               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {nutritionForDay.map((n, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(var(--theme-rgb), 0.02)', padding: '10px 14px', borderRadius: '12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--accent-color)' }} />
                                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', opacity: 0.9 }}>{lang === 'ar' ? (n as any).nameAr || n.name : n.name}</span>
                                        {n.servingSize && <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-secondary)', opacity: 0.5 }}>x{n.servingSize}</span>}
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-color)' }}>{Math.round(n.calories)}</span>
                                        <span style={{ fontSize: '9px', fontWeight: '950', color: 'var(--accent-color)', marginLeft: '2px' }}>KCAL</span>
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
};

