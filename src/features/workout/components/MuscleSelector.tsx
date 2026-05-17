import React from 'react';
import TransparentImage from './TransparentImage';
import { MUSCLE_GROUPS } from '../../../data/exercises';
import type { WorkoutLog } from '../../../types';

interface Props {
  selectedMuscle: string;
  onSelect: (key: string) => void;
  lang: string;
  musclesWithExercises?: Set<string>;
  themeMode?: string;
  logs?: WorkoutLog[];
}

const MuscleSelector: React.FC<Props> = ({ selectedMuscle, onSelect, lang, musclesWithExercises, logs }) => {
  const sortedMuscles = React.useMemo(() => {
    if (!logs || logs.length === 0) return MUSCLE_GROUPS;
    
    const freq: Record<string, number> = {};
    logs.forEach(log => {
      // Weight the frequency slightly by recency (later logs have higher index)
      if (log.muscleGroup) {
        freq[log.muscleGroup] = (freq[log.muscleGroup] || 0) + 1;
      }
      log.exercises.forEach(ex => {
        // Also count individual exercises if they have a mapped muscle group
        const group = (ex as any).muscleGroup || log.muscleGroup;
        if (group) {
          freq[group] = (freq[group] || 0) + 1;
        }
      });
    });

    return [...MUSCLE_GROUPS].sort((a, b) => {
      const freqA = freq[a.key] || 0;
      const freqB = freq[b.key] || 0;
      if (freqA !== freqB) return freqB - freqA; // Higher frequency first
      
      // Secondary sort: default order (to keep it deterministic)
      return MUSCLE_GROUPS.indexOf(a) - MUSCLE_GROUPS.indexOf(b);
    });
  }, [logs]);

  return (
    <div className="hide-scrollbar allow-swipe" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 25, overflowX: 'scroll', width: '100%', padding: '10px 10px 16px', marginBottom: 10, touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', gap: 25, minWidth: 'max-content' }}>
        {sortedMuscles.map(mg => {
          const isActive = selectedMuscle === mg.key;
          const hasExercises = musclesWithExercises?.has(mg.key);
          return (
            <button key={mg.key} onClick={() => onSelect(mg.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, flexShrink: 0, minWidth: 60, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', opacity: isActive ? 1 : hasExercises ? 0.9 : 0.5, position: 'relative' }}>
              <div style={{ width: 75, height: 75, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `2px solid ${isActive ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.08)'}`, boxShadow: isActive ? '0 0 25px -4px var(--accent-color-alpha)' : 'none', transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', transform: isActive ? 'translateY(-2px)' : 'none', overflow: 'hidden', position: 'relative' }}>
                <TransparentImage src={mg.icon} alt={mg.en} width={55} height={55} threshold={45} style={{ filter: isActive ? 'grayscale(0) brightness(1.1)' : 'grayscale(1) brightness(1.1)', transition: 'all 0.4s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 950, color: isActive ? 'var(--accent-color)' : hasExercises ? 'var(--accent-secondary)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                {(mg as any)[lang] || mg.en}
              </span>
              {isActive && <div style={{ width: 16, height: 2, borderRadius: 1, background: 'var(--accent-color)', marginTop: 4,  }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MuscleSelector;
export { MuscleSelector };
