import React, { useRef, useState } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import type { WorkoutLog } from '../../types';
import { MUSCLE_GROUPS } from '../../data/exercises';
import { translations } from '../../translations';
import { Dumbbell, Calendar, Trash2, Clock, ChevronDown } from 'lucide-react';

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

  const containerRef = useRef<HTMLDivElement>(null);

  if (tracker.logs.length === 0) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '24px', 
        opacity: 0.3,
        paddingBottom: '20%' // Visual adjustment to feel more centered in the viewport
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'var(--glass-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--glass-border)'
        }}>
          <Dumbbell size={32} color="var(--text-secondary)" strokeWidth={1.5} />
        </div>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: '950', 
          color: 'var(--text-secondary)', 
          textAlign: 'center',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          {t('noHistory')}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column' }}>
      {tracker.logs.map((log: WorkoutLog) => {
        const mg = MUSCLE_GROUPS.find(m => m.key === log.muscleGroup);
        const volume = tracker.getTotalVolume(log);
        const totalSets = log.exercises.reduce((s, ex) => s + ex.sets.length, 0);

        return (
          <div key={log.id} style={{ 
            padding: '32px 0', 
            borderBottom: '2px solid var(--glass-border)'
          }}>
            {/* 1. Header: Muscle Group & Date */}
          {/* 1. Header: Muscle Group & Date (Toggle Trigger) */}
          <div 
            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingBottom: expandedLogId === log.id ? '15px' : '0' }}
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
                        {formatTime(log.startTime, lang)} — {formatTime(log.endTime, lang)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteWorkout(log.id); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,51,102,0.3)', padding: '6px' }}
              >
                <Trash2 size={18} />
              </button>
              <div style={{ transform: expandedLogId === log.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', opacity: 0.3 }}>
                <ChevronDown size={18} />
              </div>
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
                  padding: '4px 0 10px 12px', borderLeft: '2px solid rgba(255, 107, 0, 0.2)' 
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
      })}
    </div>
  );
}
