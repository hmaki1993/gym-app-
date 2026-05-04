import React, { useRef, useState } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import type { WorkoutLog } from '../../types';
import { MUSCLE_GROUPS } from '../../data/exercises';
import { translations } from '../../translations';
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
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {/* Weightless Elite Calendar - Compact */}
      <div style={{ 
        padding: '5px 0 15px', 
        transformStyle: 'preserve-3d',
        animation: 'fadeIn 0.6s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 20px' }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '6px', opacity: 0.5 }}>
            <Calendar size={16} />
          </button>
          <h2 style={{ 
            margin: 0, 
            fontSize: '15px', 
            fontWeight: '950', 
            color: 'var(--text-primary)', 
            textTransform: 'uppercase', 
            letterSpacing: '2px',
            fontFamily: 'Outfit, sans-serif',
            background: 'linear-gradient(to bottom, #fff, var(--accent-color))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {monthName}
          </h2>
          <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '6px', opacity: 0.5 }}>
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
            <div key={`${d}-${idx}`} style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-color)', opacity: 0.4, letterSpacing: '1px' }}>{d}</div>
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
            return (
              <div 
                key={day}
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                style={{
                  height: '32px',
                  width: '32px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: active ? '950' : '800',
                  color: active ? 'var(--accent-color)' : (worked ? 'var(--text-primary)' : 'rgba(255,255,255,0.4)'),
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: '50%',
                  background: active ? 'var(--accent-color-alpha)' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: active ? '1px solid var(--accent-color-alpha)' : '1px solid transparent',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: active ? '0 0 15px var(--accent-color-alpha)' : 'none'
                }}
              >
                {day}
                {worked && !active && (
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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.1 }}>
            <Dumbbell size={40} style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '11px', fontWeight: '950', letterSpacing: '3px' }}>{t('noHistory').toUpperCase()}</div>
          </div>
        ) : (
          filteredLogs.map((log: WorkoutLog) => {
            const mg = MUSCLE_GROUPS.find(m => m.key === log.muscleGroup);
            const volume = tracker.getTotalVolume(log);
            const totalSets = log.exercises.reduce((s, ex) => s + ex.sets.length, 0);

            return (
              <div 
                key={log.id} 
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                role="button"
                style={{ 
                  padding: '24px 0', 
                  borderBottom: '2px solid var(--glass-border)',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              >
                {/* 1. Header: Muscle Group & Date */}
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: expandedLogId === log.id ? '15px' : '0' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {mg?.icon ? (
                        <img src={mg.icon} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                      ) : (
                        <span style={{ fontSize: '28px' }}>💪</span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                        {mg?.[lang] ?? log.muscleGroup}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={10} color="var(--accent-color)" />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>{formatDate(log.date, lang)}</span>
                        </div>
                        {log.startTime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '1px', height: '10px', background: 'var(--glass-border)', margin: '0 2px' }} />
                            <Clock size={10} color="var(--accent-color)" />
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', opacity: 0.8 }}>
                              {formatTime(log.startTime, lang)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteWorkout(log.id); }}
                      style={{ 
                        background: 'transparent', border: 'none', cursor: 'pointer', 
                        color: 'rgba(255,51,102,0.3)', padding: '10px',
                        touchAction: 'manipulation'
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
                        touchAction: 'manipulation',
                        color: 'var(--accent-color)',
                        filter: 'drop-shadow(0 0 6px var(--accent-color-alpha))',
                        transform: expandedLogId === log.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease'
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
                        padding: '10px 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)',
                        marginBottom: '20px', gap: '4px',
                        opacity: expandedLogId === log.id ? 1 : 0,
                        transform: expandedLogId === log.id ? 'translateY(0)' : 'translateY(-10px)',
                        transition: 'all 0.4s ease 0.1s'
                      }}>
                        {[
                          { label: t('exercises'), value: log.exercises.length },
                          { label: t('totalSets'), value: totalSets },
                          { label: t('totalVolume'), value: `${volume.toFixed(0)}${unit}` },
                          { label: t('duration'), value: formatDuration(log.durationMinutes, t) },
                        ].map((stat, idx) => (
                          <React.Fragment key={stat.label}>
                            {idx > 0 && <div style={{ width: '1px', height: '16px', background: 'var(--glass-border)' }} />}
                            <div style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '13px', 
                                fontWeight: '800', 
                                color: 'var(--text-primary)', 
                                whiteSpace: 'nowrap',
                                fontFamily: 'Inter, sans-serif',
                                letterSpacing: '0.5px'
                              }}>{stat.value}</div>
                              <div style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', opacity: 0.5 }}>{stat.label}</div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Exercises List */}
                      <div style={{ 
                        display: 'flex', flexDirection: 'column', gap: '14px', 
                        padding: '4px 0 10px 12px', borderLeft: '2px solid var(--accent-color-alpha)' 
                      }}>
                        {log.exercises.map((ex, exIdx) => {
                          const bestSet = ex.sets.reduce((best, s) => s.weight > best.weight ? s : best, ex.sets[0] ?? { weight: 0, reps: 0 });
                          const isPR = tracker.getExercisePR(ex.name)?.weight === bestSet.weight;
                          return (
                            <div 
                              key={ex.name} 
                              style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                opacity: expandedLogId === log.id ? 1 : 0,
                                transform: expandedLogId === log.id ? 'translateX(0)' : 'translateX(-10px)',
                                transition: `all 0.3s ease ${0.2 + exIdx * 0.05}s`
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', opacity: 0.95 }}>{ex.name}</span>
                                {isPR && (
                                  <div style={{ 
                                    fontSize: '8px', fontWeight: '900', color: 'var(--accent-color)', 
                                    background: 'rgba(255, 107, 0, 0.08)', padding: '2px 6px', 
                                    borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'
                                  }}>PR</div>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '110px', justifyContent: 'flex-end' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{ex.sets.length}</span>
                                  <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-secondary)', marginLeft: '3px', opacity: 0.5 }}>SETS</span>
                                </div>
                                <div style={{ width: '1px', height: '10px', background: 'var(--glass-border)' }} />
                                <div style={{ textAlign: 'right', minWidth: '45px' }}>
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '800', color: 'var(--accent-color)' }}>{bestSet.weight}</span>
                                  <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-color)', marginLeft: '2px', opacity: 0.7 }}>{unit}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
