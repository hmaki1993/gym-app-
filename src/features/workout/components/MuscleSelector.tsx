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

const areSetsEqual = (a?: Set<string>, b?: Set<string>) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
};

const MuscleSelector = React.memo<Props>(({ selectedMuscle, onSelect, lang, musclesWithExercises, logs }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isFirstRender = React.useRef(true);



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

    // 2. Try sequence prediction based on historical transition patterns (limit to recent logs for speed)
    let predictedNextMuscle: string | null = null;
    const recentLogsForPrediction = logs.slice(0, 50);
    const sortedLogs = [...recentLogsForPrediction].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
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

  React.useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        scrollRef.current.scrollTo({ left: activeBtn.offsetLeft - 10, behavior: 'instant' as ScrollBehavior });
      } else {
        scrollRef.current.scrollTo({ left: activeBtn.offsetLeft - 10, behavior: 'smooth' });
      }
    }
  }, [selectedMuscle]);

  return (
    <div ref={scrollRef} className="hide-scrollbar allow-swipe" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 25, overflowX: 'scroll', width: '100%', padding: '10px 10px 16px', marginBottom: 10, touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', gap: 25, minWidth: 'max-content' }}>
        {sortedMuscleGroups.map(mg => {
          const isActive = selectedMuscle === mg.key;
          const hasExercises = musclesWithExercises?.has(mg.key);
          
          return (
            <button 
              key={mg.key} 
              data-active={isActive} 
              onClick={() => {
                if (mg.key !== selectedMuscle) {
                  onSelect(mg.key);
                }
              }} 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, flexShrink: 0, minWidth: 60, cursor: 'pointer', transition: 'all 0.1s ease', opacity: isActive ? 1 : hasExercises ? 0.9 : 0.5, position: 'relative', outline: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              <div style={{ width: 75, height: 75, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `2px solid ${isActive ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.18)'}`, boxShadow: isActive ? '0 0 25px -4px var(--accent-color-alpha)' : 'none', transition: 'all 0.1s ease', transform: isActive ? 'translateY(-2px)' : 'none', overflow: 'hidden', position: 'relative' }}>
                <TransparentImage src={mg.icon} alt={mg.en} width={55} height={55} threshold={45} style={{ filter: isActive ? 'grayscale(0) brightness(1.1)' : 'grayscale(1) brightness(1.1)', transition: 'all 0.1s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 950, color: isActive ? 'var(--accent-color)' : hasExercises ? 'var(--accent-secondary)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, transition: 'all 0.1s ease' }}>
                {(mg as any)[lang] || mg.en}
              </span>
              {isActive && <div style={{ width: 16, height: 2, borderRadius: 1, background: 'var(--accent-color)', marginTop: 4  }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.selectedMuscle === nextProps.selectedMuscle &&
    prevProps.lang === nextProps.lang &&
    prevProps.onSelect === nextProps.onSelect &&
    areSetsEqual(prevProps.musclesWithExercises, nextProps.musclesWithExercises) &&
    prevProps.logs === nextProps.logs
  );
});

export default MuscleSelector;
export { MuscleSelector };
