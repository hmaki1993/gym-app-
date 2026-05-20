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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Dynamically sort muscle groups based on training history
  const sortedMuscleGroups = React.useMemo(() => {
    if (!logs || logs.length === 0) {
      return MUSCLE_GROUPS;
    }

    const keys = MUSCLE_GROUPS.map(mg => mg.key);
    
    // 1. Calculate when each muscle was last trained
    const lastTrainedByMuscle: Record<string, string | null> = {};
    keys.forEach(muscle => {
      const matchLogs = logs.filter(l => l.muscleGroup === muscle);
      if (matchLogs.length > 0) {
        let newestDate = matchLogs[0].date;
        matchLogs.forEach(l => {
          if (l.date > newestDate) newestDate = l.date;
        });
        lastTrainedByMuscle[muscle] = newestDate;
      } else {
        lastTrainedByMuscle[muscle] = null;
      }
    });

    // Fallback sort: never trained first, then oldest date first
    const sortedByNeeded = [...keys].sort((a, b) => {
      const dateA = lastTrainedByMuscle[a];
      const dateB = lastTrainedByMuscle[b];
      if (!dateA && !dateB) return 0;
      if (!dateA) return -1;
      if (!dateB) return 1;
      return dateA < dateB ? -1 : 1;
    });

    // 2. Try sequence prediction based on historical transition patterns
    let predictedNextMuscle: string | null = null;
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const trainedSequence: string[] = [];
    sortedLogs.forEach(log => {
      if (log.muscleGroup) {
        if (trainedSequence.length === 0 || trainedSequence[trainedSequence.length - 1] !== log.muscleGroup) {
          trainedSequence.push(log.muscleGroup);
        }
      }
    });

    if (trainedSequence.length > 0) {
      const lastMuscle = trainedSequence[trainedSequence.length - 1];
      
      const transitions: Record<string, Record<string, number>> = {};
      for (let i = 0; i < trainedSequence.length - 1; i++) {
        const current = trainedSequence[i];
        const next = trainedSequence[i + 1];
        if (!transitions[current]) {
          transitions[current] = {};
        }
        transitions[current][next] = (transitions[current][next] || 0) + 1;
      }

      const nextMuscleCandidates = transitions[lastMuscle];
      if (nextMuscleCandidates) {
        let maxCount = 0;
        let candidates: string[] = [];
        
        Object.keys(nextMuscleCandidates).forEach(muscle => {
          const count = nextMuscleCandidates[muscle];
          if (count > maxCount) {
            maxCount = count;
            candidates = [muscle];
          } else if (count === maxCount) {
            candidates.push(muscle);
          }
        });

        if (candidates.length === 1) {
          predictedNextMuscle = candidates[0];
        } else if (candidates.length > 1) {
          let oldestTime = Infinity;
          let chosen = candidates[0];
          candidates.forEach(muscle => {
            const lastLogTime = lastTrainedByMuscle[muscle] ? new Date(lastTrainedByMuscle[muscle]!).getTime() : 0;
            if (lastLogTime < oldestTime) {
              oldestTime = lastLogTime;
              chosen = muscle;
            }
          });
          predictedNextMuscle = chosen;
        }
      }
    }

    const bestMuscle = predictedNextMuscle || sortedByNeeded[0];

    return [...MUSCLE_GROUPS].sort((a, b) => {
      if (a.key === bestMuscle) return -1;
      if (b.key === bestMuscle) return 1;

      const idxA = sortedByNeeded.indexOf(a.key);
      const idxB = sortedByNeeded.indexOf(b.key);
      return idxA - idxB;
    });
  }, [logs]);

  // Scroll selected muscle to the very beginning (left edge)
  React.useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      scrollRef.current.scrollTo({ left: activeBtn.offsetLeft - 10, behavior: 'smooth' });
    }
  }, [selectedMuscle]);

  // On first mount, instantly jump (no animation) to the selected muscle
  React.useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      scrollRef.current.scrollTo({ left: activeBtn.offsetLeft - 10, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  return (
    <div ref={scrollRef} className="hide-scrollbar allow-swipe" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 25, overflowX: 'scroll', width: '100%', padding: '10px 10px 16px', marginBottom: 10, touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', gap: 25, minWidth: 'max-content' }}>
        {sortedMuscleGroups.map(mg => {
          const isActive = selectedMuscle === mg.key;
          const hasExercises = musclesWithExercises?.has(mg.key);
          return (
            <button key={mg.key} data-active={isActive} onClick={() => onSelect(mg.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, flexShrink: 0, minWidth: 60, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', opacity: isActive ? 1 : hasExercises ? 0.9 : 0.5, position: 'relative' }}>
              <div style={{ width: 75, height: 75, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `2px solid ${isActive ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.18)'}`, boxShadow: isActive ? '0 0 25px -4px var(--accent-color-alpha)' : 'none', transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', transform: isActive ? 'translateY(-2px)' : 'none', overflow: 'hidden', position: 'relative' }}>
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
