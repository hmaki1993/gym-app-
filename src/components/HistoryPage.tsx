import React, { useRef, useEffect } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import type { WorkoutLog } from '../types';
import { MUSCLE_GROUPS } from '../data/exercises';
import { translations } from '../translations';
import { Dumbbell, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onDeleteWorkout: (id: string) => void;
}

function formatDate(iso: string, lang: 'ar' | 'en') {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(mins: number, t: (k: any) => string) {
  if (mins < 60) return `${mins} ${t('minutes')}`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function HistoryPage({ tracker, onDeleteWorkout }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const unit = tracker.settings.weightUnit;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, []);

  if (tracker.logs.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px', opacity: 0.6 }}>
        <Dumbbell size={48} color="var(--text-secondary)" strokeWidth={1.5} />
        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'center' }}>{t('noHistory')}</div>
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
            borderBottom: '2px solid rgba(255,255,255,0.03)',
            animation: 'fadeIn 0.5s ease'
          }}>
            {/* 1. Header: Muscle Group & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                    <Calendar size={10} color="var(--accent-color)" opacity={0.6} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>{formatDate(log.date, lang)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDeleteWorkout(log.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,51,102,0.3)', padding: '6px' }}
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* 2. Stats: Clean Linear Row - Optimized for Mobile */}
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '20px', gap: '4px'
            }}>
              {[
                { label: t('exercises'), value: log.exercises.length },
                { label: t('totalSets'), value: totalSets },
                { label: t('totalVolume'), value: `${volume.toFixed(0)}${unit}` },
                { label: t('duration'), value: formatDuration(log.durationMinutes, t) },
              ].map((stat, idx) => (
                <React.Fragment key={stat.label}>
                  {idx > 0 && <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{stat.value}</div>
                    <div style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', opacity: 0.5 }}>{stat.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* 3. Exercises: Plain List with side-marker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '14px', borderLeft: '2px solid var(--accent-color-alpha)' }}>
              {log.exercises.map(ex => {
                const bestSet = ex.sets.reduce((best, s) => s.weight > best.weight ? s : best, ex.sets[0] ?? { weight: 0, reps: 0 });
                const isPR = tracker.getExercisePR(ex.name)?.weight === bestSet.weight;
                return (
                  <div key={ex.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', opacity: 0.9 }}>{ex.name}</span>
                      {isPR && <span style={{ fontSize: '8px', fontWeight: '950', color: 'var(--accent-color)', background: 'rgba(0,229,160,0.1)', padding: '2px 5px', borderRadius: '4px' }}>PR</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '900' }}>
                      {ex.sets.length} <span style={{ fontSize: '9px', opacity: 0.5 }}>SETS</span> × <span style={{ color: 'var(--text-primary)' }}>{bestSet.weight}{unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
