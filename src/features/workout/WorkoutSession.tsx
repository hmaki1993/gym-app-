import React, { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import type { MuscleGroup, SetLog, ExerciseLog, WorkoutLog } from '../../types';
import { DEFAULT_EXERCISES } from '../../data/exercises';
import { translations } from '../../translations';
import { ExerciseCard } from './ExerciseCard';
import gsap from 'gsap';

import { MuscleSelector } from './components/MuscleSelector';
import { ExercisePicker } from './components/ExercisePicker';
import { SessionLogger } from './components/SessionLogger';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onClose: () => void;
  onSaved: () => void;
}

export function WorkoutSession({ tracker, onClose, onSaved }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  // const isRtl = lang === 'ar';

  // Synchronously compute today's session logs on initial render to prevent UI flickering
  const { initialPhase, initialMuscle, initialActiveExercises, initialLoggedData, initialStarted } = React.useMemo(() => {
    const freq: Record<string, number> = {};
    tracker.logs.forEach(log => {
      if (log.muscleGroup) { freq[log.muscleGroup] = (freq[log.muscleGroup] || 0) + 1; }
      log.exercises.forEach(ex => {
        const group = (ex as any).muscleGroup || log.muscleGroup;
        if (group) { freq[group] = (freq[group] || 0) + 1; }
      });
    });
    
    const MUSCLE_KEYS = Object.keys(DEFAULT_EXERCISES) as MuscleGroup[];
    let bestMuscle = 'chest' as MuscleGroup;

    // 1. Calculate when each muscle was last trained
    const lastTrainedByMuscle: Record<string, string | null> = {};
    MUSCLE_KEYS.forEach(muscle => {
      const lastLog = tracker.logs.find(l => l.muscleGroup === muscle);
      lastTrainedByMuscle[muscle] = lastLog ? lastLog.date : null;
    });

    // Fallback sort: never trained first, then oldest date first
    const sortedByNeeded = [...MUSCLE_KEYS].sort((a, b) => {
      const dateA = lastTrainedByMuscle[a];
      const dateB = lastTrainedByMuscle[b];
      if (!dateA && !dateB) return 0;
      if (!dateA) return -1; // never trained → comes first
      if (!dateB) return 1;
      return dateA < dateB ? -1 : 1; // older date → comes first
    });

    // 2. Try sequence prediction based on historical transition patterns
    let predictedNextMuscle: MuscleGroup | null = null;
    if (tracker.logs && tracker.logs.length > 0) {
      // Sort logs chronologically (oldest to newest)
      const sortedLogs = [...tracker.logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Extract sequence of trained muscle groups, collapsing consecutive duplicates
      const trainedSequence: MuscleGroup[] = [];
      sortedLogs.forEach(log => {
        if (log.muscleGroup) {
          if (trainedSequence.length === 0 || trainedSequence[trainedSequence.length - 1] !== log.muscleGroup) {
            trainedSequence.push(log.muscleGroup as MuscleGroup);
          }
        }
      });

      if (trainedSequence.length > 0) {
        const lastMuscle = trainedSequence[trainedSequence.length - 1];
        
        // Build transition frequency counts
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
          let candidates: MuscleGroup[] = [];
          
          (Object.keys(nextMuscleCandidates) as MuscleGroup[]).forEach(muscle => {
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
            // Tie breaker: pick the one not trained for the longest time
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
    }

    bestMuscle = predictedNextMuscle || sortedByNeeded[0];

    const today = tracker.getLocalDateStr();
    const todayLogs = tracker.logs.filter(l => tracker.isLogFromLocalDate(l.date, today));
    
    if (todayLogs.length > 0) {
      const latestLog = todayLogs[0];
      const muscle = (latestLog.muscleGroup as MuscleGroup) || bestMuscle;
      
      const allExerciseNames: string[] = [];
      const logged: Record<string, SetLog[]> = {};
      
      todayLogs.forEach(log => {
        log.exercises.forEach(e => {
          if (!logged[e.name]) {
            allExerciseNames.push(e.name);
            logged[e.name] = e.sets;
          }
        });
      });
      
      return {
        initialPhase: 'logging' as const,
        initialMuscle: muscle,
        initialActiveExercises: allExerciseNames,
        initialLoggedData: logged,
        initialStarted: true
      };
    }
    
    return {
      initialPhase: 'exercises' as const,
      initialMuscle: bestMuscle,
      initialActiveExercises: [] as string[],
      initialLoggedData: {} as Record<string, SetLog[]>,
      initialStarted: false
    };
  }, [tracker.logs]);

  const [phase, setPhase] = useState<'exercises' | 'logging'>(initialPhase);
  const [hasStartedSession, setHasStartedSession] = useState(initialStarted);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>(initialMuscle);
  const [activeExercises, setActiveExercises] = useState<string[]>(initialActiveExercises);
  const [loggedData, setLoggedData] = useState<Record<string, SetLog[]>>(initialLoggedData);
  const [draftData, setDraftData] = useState<Record<string, any[]>>({});
  const [dirtyExercises, setDirtyExercises] = useState<Record<string, boolean>>({});
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const baseSecondsRef = useRef<number>(0);
  const savedElapsedRef = useRef<number | null>(null);

  // Initialize base time
  useEffect(() => {
    if (phase === 'logging' && selectedMuscle) {
      if (savedElapsedRef.current !== null) {
        baseSecondsRef.current = savedElapsedRef.current;
        sessionStartTimeRef.current = Date.now();
        savedElapsedRef.current = null;
      } else {
        const today = tracker.getLocalDateStr();
        // Count ALL today's workout duration, not just same muscle group
        const todayLogs = tracker.logs.filter(l => tracker.isLogFromLocalDate(l.date, today));
        const totalSeconds = todayLogs.reduce((sum, l) => sum + (l.durationSeconds || (l.durationMinutes * 60)), 0);
        baseSecondsRef.current = totalSeconds;
        sessionStartTimeRef.current = Date.now();
      }
    }
  }, [phase, selectedMuscle]);

  useEffect(() => {
    if (phase === 'logging') {
      const updateTimer = () => {
        const now = Date.now();
        const currentSessionSeconds = Math.floor((now - sessionStartTimeRef.current) / 1000);
        setElapsedSeconds(baseSecondsRef.current + currentSessionSeconds);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = [
      h > 0 ? h.toString().padStart(2, '0') : null,
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].filter(p => p !== null);
    return parts.join(':');
  };

  const prevOpenExRef = useRef<string | null>(null);
  useEffect(() => {
    if (openExercise && !prevOpenExRef.current) {
      // Initial open animation
      gsap.fromTo('#exercise-overlay', { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo('#exercise-modal-content', { y: '100%' }, { y: 0, duration: 0.3, ease: 'power3.out' });
    }
    prevOpenExRef.current = openExercise;
  }, [openExercise]);

  const closeExercise = () => {
    gsap.to('#exercise-modal-content', { y: '100%', duration: 0.22, ease: 'power2.in' });
    gsap.to('#exercise-overlay', { opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: () => setOpenExercise(null) });
  };

  useEffect(() => {
    if (containerRef.current && containerRef.current.children.length > 0) {
      gsap.fromTo(containerRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power3.out' }
      );
    }
    if (phase === 'logging' && timerRef.current) {
      gsap.fromTo(timerRef.current,
        { y: -30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 0.2 }
      );
    }
  }, [phase]);

  // Removed redundant openExercise animation to fix swipe stutter

  const toggleExercise = (name: string) => {
    setActiveExercises(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const handleRename = React.useCallback((oldName: string, newName: string) => {
    setActiveExercises(prev => prev.map(e => e === oldName ? newName : e));
    setDraftData(prev => {
      if (prev[oldName]) {
        const { [oldName]: oldData, ...rest } = prev;
        return { ...rest, [newName]: oldData };
      }
      return prev;
    });
    setLoggedData(prev => {
      if (prev[oldName]) {
        const { [oldName]: oldData, ...rest } = prev;
        return { ...rest, [newName]: oldData };
      }
      return prev;
    });
    if (openExercise === oldName) setOpenExercise(newName);
  }, [openExercise]);

  const handleSetsDone = (exerciseName: string, sets: SetLog[]) => {
    setLoggedData(prev => ({ ...prev, [exerciseName]: sets }));
    setDirtyExercises(prev => {
      const { [exerciseName]: removed, ...rest } = prev;
      return rest;
    });
    setDraftData(prev => {
      const next = { ...prev };
      delete next[exerciseName];
      return next;
    });
    setOpenExercise(null);
  };

  const handleDraftChange = React.useCallback((exerciseName: string, sets: any[], isManualChange: boolean) => {
    setDraftData(prev => {
      if (JSON.stringify(prev[exerciseName]) === JSON.stringify(sets)) return prev;
      return { ...prev, [exerciseName]: sets };
    });
    if (isManualChange) {
      setDirtyExercises(prev => ({ ...prev, [exerciseName]: true }));
    }
  }, []);

  const handleSave = () => {
    if (!selectedMuscle) return;

    const mergedData: Record<string, SetLog[]> = { ...loggedData };
    Object.entries(draftData).forEach(([name, sets]) => {
      const validSets = (sets as SetLog[]).filter(s => s.reps > 0);
      if (validSets.length > 0) {
        if (!mergedData[name] || mergedData[name].length === 0) {
          mergedData[name] = validSets;
        }
      }
    });

    const exercises: ExerciseLog[] = activeExercises
      .filter(name => mergedData[name] && mergedData[name].length > 0)
      .map(name => {
        // FUNCTION PRESERVATION: Determine specific muscle group for this exercise
        let mg = selectedMuscle;
        for (const [k, v] of Object.entries(DEFAULT_EXERCISES)) {
          if ((v as string[]).includes(name)) { mg = k as MuscleGroup; break; }
        }
        for (const [k, v] of Object.entries(tracker.customExercises)) {
          if (v.includes(name)) { mg = k as MuscleGroup; break; }
        }
        
        return {
          name,
          sets: mergedData[name],
          restSeconds: tracker.settings.defaultRestSeconds,
          muscleGroup: mg // preserved logic
        };
      });

    if (exercises.length === 0) { onClose(); return; }

    const log: Omit<WorkoutLog, 'id' | 'durationMinutes' | 'startTime' | 'endTime'> = {
      date: new Date(tracker.sessionStartTime).toISOString(),
      muscleGroup: selectedMuscle,
      exercises: exercises as any,
    };
    tracker.saveWorkout(log as any, elapsedSeconds);
    setDirtyExercises({});
    onSaved();
  };

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const handleTouchStart = (index: number) => {
    setDraggingIndex(index);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingIndex === null) return;
    const touchY = e.touches[0].clientY;
    const targetElement = document.elementFromPoint(e.touches[0].clientX, touchY);
    const targetItem = targetElement?.closest('[data-index]');
    if (targetItem) {
      const targetIndex = parseInt(targetItem.getAttribute('data-index') || '-1');
      if (targetIndex !== -1 && targetIndex !== draggingIndex) {
        const newOrder = [...activeExercises];
        const item = newOrder[draggingIndex];
        newOrder.splice(draggingIndex, 1);
        newOrder.splice(targetIndex, 0, item);
        setActiveExercises(newOrder);
        setDraggingIndex(targetIndex);
      }
    }
  };
  const handleTouchEnd = () => setDraggingIndex(null);

  const touchState = useRef({ startX: 0, startY: 0, isAnimating: false });

  // Swipe blocker
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let targetIsScroller = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touchState.current.startX = startX;
      touchState.current.startY = startY;
      targetIsScroller = !!(e.target as HTMLElement).closest?.('.allow-swipe');
    };

    const handleTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = Math.abs(x - startX);
      const dy = Math.abs(y - startY);
      if (targetIsScroller) return;
      const EDGE = 30;
      const isEdge = startX < EDGE || startX > window.innerWidth - EDGE;
      if (isEdge && dx > dy && dx > 8) {
        if (e.cancelable) e.preventDefault();
      }
      if (openExercise && dx > dy && dx > 5) {
        if (e.cancelable) e.preventDefault();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart, { capture: true } as any);
      window.removeEventListener('touchmove', handleTouchMove, { capture: true } as any);
    };
  }, [openExercise]);

  const handleOverlayPointerStart = (e: React.PointerEvent) => {
    if (touchState.current.isAnimating) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    touchState.current.startX = e.clientX;
  };

  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (touchState.current.isAnimating || !swipeContainerRef.current) return;
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const diff = e.clientX - touchState.current.startX;
    const xPercent = (diff / e.currentTarget.clientWidth) * 100;
    
    // Performance: Only update transform, avoid opacity/scale during active drag for max FPS
    gsap.set(swipeContainerRef.current, { 
      xPercent,
      force3D: true 
    });
  };

  const handleOverlayPointerEnd = (e: React.PointerEvent) => {
    if (touchState.current.isAnimating || !swipeContainerRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const diff = e.clientX - touchState.current.startX;
    const xPercent = (diff / e.currentTarget.clientWidth) * 100;
    const currentIdx = activeExercises.indexOf(openExercise!);

    if (Math.abs(xPercent) > 15) {
      touchState.current.isAnimating = true;
      if (xPercent > 15) {
        if (currentIdx > 0) handleSwipeTransition('right', activeExercises[currentIdx - 1]);
        else {
          gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.1, ease: 'power3.out', onComplete: () => { touchState.current.isAnimating = false; } });
        }
      } else {
        if (currentIdx < activeExercises.length - 1) handleSwipeTransition('left', activeExercises[currentIdx + 1]);
        else handleSwipeTransition('left', activeExercises[0]);
      }
    } else {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.1, ease: 'power3.out' });
    }
  };

  const handleOverlayPointerCancel = () => {
    if (swipeContainerRef.current) {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.1, ease: 'power2.out' });
      touchState.current.isAnimating = false;
    }
  };

  const handleSwipeTransition = (direction: 'left' | 'right', nextEx: string) => {
    if (!swipeContainerRef.current || !nextEx) {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.05, ease: 'power2.out' });
      touchState.current.isAnimating = false;
      return;
    }
    const xDist = direction === 'left' ? -100 : 100;
    gsap.killTweensOf(swipeContainerRef.current);
    gsap.to(swipeContainerRef.current, {
      xPercent: xDist,
      opacity: 0,
      duration: 0.06,
      ease: 'power2.in',
      force3D: true,
      onComplete: () => {
        setOpenExercise(nextEx);
        // Instant reset and slide in
        gsap.fromTo(swipeContainerRef.current,
          { xPercent: direction === 'left' ? 100 : -100, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.1, ease: 'power3.out', force3D: true, onComplete: () => { touchState.current.isAnimating = false; } }
        );
      }
    });
  };

  const getExerciseMuscleGroup = (name: string): MuscleGroup => {
    for (const [k, v] of Object.entries(DEFAULT_EXERCISES)) {
      if ((v as string[]).includes(name)) return k as MuscleGroup;
    }
    for (const [k, v] of Object.entries(tracker.customExercises)) {
      if (v.includes(name)) return k as MuscleGroup;
    }
    return selectedMuscle;
  };

  const musclesWithExercises = React.useMemo(() => {
    const set = new Set<MuscleGroup>();
    const exerciseToMuscle: Record<string, MuscleGroup> = {};
    Object.entries(DEFAULT_EXERCISES).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex] = group as MuscleGroup; });
    });
    Object.entries(tracker.customExercises).forEach(([group, exercises]) => {
      exercises.forEach(ex => { exerciseToMuscle[ex] = group as MuscleGroup; });
    });
    activeExercises.forEach(exName => {
      const group = exerciseToMuscle[exName];
      if (group) set.add(group);
    });
    return set;
  }, [activeExercises, tracker.customExercises]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--primary-bg)',
      zIndex: 1000,
      overflowX: 'hidden', 
      overflowY: 'auto', 
      padding: 'calc(env(safe-area-inset-top) + 12px) 16px 0', 
      touchAction: 'auto', 
      overscrollBehavior: 'none' 
    }}>
      {openExercise && (
        <div 
          id="exercise-overlay"
          style={{
            position: 'fixed', top: 0, bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 2000,
            display: 'flex', justifyContent: 'center',
            touchAction: 'none',
            overscrollBehavior: 'none',
            boxSizing: 'border-box',
            opacity: 0,
            willChange: 'opacity'
          }}
        >
          <div 
            id="exercise-modal-content"
            style={{
              position: 'absolute', top: 0, bottom: 0,
              width: '100%', maxWidth: '480px', 
              background: 'var(--primary-bg)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              touchAction: 'none',
              overscrollBehavior: 'none',
              boxSizing: 'border-box',
              border: 'none',
              transform: 'translateY(100%)',
              willChange: 'transform'
            }}
          >
            <div style={{ height: '40px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', background: 'transparent' }}>
              {activeExercises.map((name, i) => (
                <div key={i} style={{
                  width: name === openExercise ? '20px' : '6px', height: '6px', borderRadius: '3px',
                  background: name === openExercise ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.1)',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>

            <div
              ref={swipeContainerRef}
              className="swipe-container"
              style={{
                touchAction: 'pan-y', userSelect: 'none',
                flex: 1, minHeight: 0, width: '100%',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', position: 'relative',
                willChange: 'transform, opacity'
              }}
              onPointerDown={handleOverlayPointerStart}
              onPointerMove={handleOverlayPointerMove}
              onPointerUp={handleOverlayPointerEnd}
              onPointerCancel={handleOverlayPointerCancel}
            >
              <div className="swipe-slide" style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                width: '100%'
              }}>
                <ExerciseCard
                  key={openExercise} exerciseName={openExercise} muscleGroup={getExerciseMuscleGroup(openExercise)}
                  tracker={tracker} 
                  initialSets={draftData[openExercise] || loggedData[openExercise]}
                  isCompleted={!!loggedData[openExercise]}
                  elapsedSeconds={elapsedSeconds}
                  onDone={(sets) => { handleSetsDone(openExercise, sets); closeExercise(); }}
                  onChange={(sets, isDirty) => handleDraftChange(openExercise, sets, isDirty)}
                  onClose={closeExercise} fullPage={true}
                  isDirty={dirtyExercises[openExercise]}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'exercises' ? (
        // Exercises Phase: Absolute Header Layout to give Title maximum width without shrinking
        <div style={{ 
          position: 'relative',
          width: '100%',
          minHeight: '48px',
          marginBottom: '16px', 
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            paddingRight: '60px',
            boxSizing: 'border-box',
            width: '100%'
          }}>
            <div style={{ 
              width: '6px', 
              height: '32px', 
              background: 'var(--accent-color)', 
              borderRadius: '3px',
              flexShrink: 0
            }} />
            <h1 className="heading-font" style={{ 
              margin: 0, 
              fontSize: 'min(32px, 8vw)', 
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
              flexShrink: 0
            }}>
              {t('startWorkout')}
            </h1>
          </div>

          <button 
            onClick={onClose} 
            style={{ 
              position: 'absolute',
              top: '50%',
              right: '0px',
              transform: 'translateY(-50%)',
              width: '48px', height: '48px', borderRadius: '50%', 
              background: 'none', border: 'none', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ff0000', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
          >
            <img src="/assets/close-custom.png" alt="Close" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
          </button>
        </div>
      ) : (
        // Logging Phase: Multi-Row Column Layout with Centered Dashed Controls Container below
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px', 
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Row 1: Title */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            width: '100%'
          }}>
            <div style={{ 
              width: '6px', 
              height: '32px', 
              background: 'var(--accent-color)', 
              borderRadius: '3px',
              flexShrink: 0
            }} />
            <h1 className="heading-font" style={{ 
              margin: 0, 
              fontSize: 'min(32px, 8vw)', 
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}>
              {t('finishSession')}
            </h1>
          </div>

          {/* Row 2: Controls Container */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            width: '100%',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              flexShrink: 0,
              background: 'transparent',
              border: '1.5px dashed rgba(var(--theme-rgb), 0.2)',
              borderRadius: '10px',
              padding: '6px 10px',
            }}>
              <div ref={timerRef} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '0 8px',
                minWidth: '75px',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img src="/assets/clock-custom.png" alt="timer" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <span style={{ 
                  fontFamily: "var(--heading-font)", 
                  fontSize: '17px', 
                  fontWeight: '900', 
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {formatElapsed(elapsedSeconds)}
                </span>
              </div>

              <button 
                onClick={() => {
                  const now = Date.now();
                  const currentSessionSeconds = Math.floor((now - sessionStartTimeRef.current) / 1000);
                  savedElapsedRef.current = baseSecondsRef.current + currentSessionSeconds;
                  setPhase('exercises');
                }} 
                 style={{ 
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'none', border: 'none', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <img src="/assets/arrow-custom.png" alt="Back" style={{ width: '26px', height: '26px', objectFit: 'contain', transform: 'rotate(180deg)' }} />
              </button>
              
              <button 
                onClick={onClose} 
                style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: 'none', border: 'none', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ff0000', cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <img src="/assets/close-custom.png" alt="Close" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
        {phase === 'exercises' && (
          <>
            <MuscleSelector 
              selectedMuscle={selectedMuscle} 
              onSelect={(m) => setSelectedMuscle(m as MuscleGroup)} 
              lang={lang} 
              musclesWithExercises={musclesWithExercises}
              logs={tracker.logs}
            />
            <ExercisePicker
              search={search}
              onSearchChange={setSearch}
              activeExercises={activeExercises}
              onToggle={toggleExercise}
              onRename={handleRename}
              muscleGroup={selectedMuscle}
              tracker={tracker}
              t={t as any}
            />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'max(12px, env(safe-area-inset-bottom))', marginTop: '8px' }}>
               <img
                 src={hasStartedSession ? "/assets/button-resume-rect.png" : "/assets/button-start-rect.png"}
                 alt={hasStartedSession ? "Resume Workout" : "Start Workout"}
                 onClick={() => {
                   if (activeExercises.length > 0) {
                     setHasStartedSession(true);
                     setPhase('logging');
                   }
                 }}
                 style={{
                   height: hasStartedSession ? '55px' : '47px',
                   width: 'auto',
                   objectFit: 'contain',
                   cursor: activeExercises.length > 0 ? 'pointer' : 'default',
                   opacity: activeExercises.length === 0 ? 0.6 : 1,
                   transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                   userSelect: 'none',
                   WebkitUserSelect: 'none'
                 }}
                 onMouseDown={e => activeExercises.length > 0 && (e.currentTarget.style.transform = 'scale(0.94)')}
                 onMouseUp={e => activeExercises.length > 0 && (e.currentTarget.style.transform = 'scale(1)')}
                 onTouchStart={e => activeExercises.length > 0 && (e.currentTarget.style.transform = 'scale(0.94)')}
                 onTouchEnd={e => activeExercises.length > 0 && (e.currentTarget.style.transform = 'scale(1)')}
               />
             </div>
          </>
        )}

        {phase === 'logging' && (
          <SessionLogger
            activeExercises={activeExercises}
            loggedData={loggedData}
            weightUnit={tracker.settings.weightUnit}
            onOpenExercise={setOpenExercise}
            onSave={handleSave}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            draggingIndex={draggingIndex}
            customExercises={tracker.customExercises}
          />
        )}
      </div>
    </div>
  );
}

export default WorkoutSession;
