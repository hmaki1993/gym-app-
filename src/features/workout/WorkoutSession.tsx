import React, { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import type { MuscleGroup, SetLog, ExerciseLog, WorkoutLog } from '../../types';
import { DEFAULT_EXERCISES } from '../../data/exercises';
import { translations } from '../../translations';
import { ExerciseCard } from './ExerciseCard';
import {
  Clock, Play, X, ArrowLeft
} from 'lucide-react';
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

  const [phase, setPhase] = useState<'exercises' | 'logging'>('exercises');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>(tracker.logs[0]?.muscleGroup || 'chest');
  const [activeExercises, setActiveExercises] = useState<string[]>([]);
  const [loggedData, setLoggedData] = useState<Record<string, SetLog[]>>({});
  const [draftData, setDraftData] = useState<Record<string, any[]>>({});
  const [dirtyExercises, setDirtyExercises] = useState<Record<string, boolean>>({});
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hasStartedSession, setHasStartedSession] = useState(false);
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
      setHasStartedSession(true);
      if (savedElapsedRef.current !== null) {
        baseSecondsRef.current = savedElapsedRef.current;
        sessionStartTimeRef.current = Date.now();
        savedElapsedRef.current = null;
      } else {
        const today = new Date().toISOString().split('T')[0];
        const todayMuscleLogs = tracker.logs.filter(l => l.date.startsWith(today) && l.muscleGroup === selectedMuscle);
        const totalSeconds = todayMuscleLogs.reduce((sum, l) => sum + (l.durationSeconds || (l.durationMinutes * 60)), 0);
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

  // Restore today's session on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLog = tracker.logs.find(l => l.date.startsWith(today));
    
    if (todayLog && activeExercises.length === 0) {
      if (todayLog.muscleGroup) {
        setSelectedMuscle(todayLog.muscleGroup as MuscleGroup);
      }
      setActiveExercises(todayLog.exercises.map(e => e.name));
      const initialLogged: Record<string, SetLog[]> = {};
      todayLog.exercises.forEach(e => {
        initialLogged[e.name] = e.sets;
      });
      setLoggedData(initialLogged);
      setHasStartedSession(true);
      setPhase('logging');
    }
  }, []);

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

  useEffect(() => {
    if (openExercise && swipeContainerRef.current) {
      gsap.fromTo(swipeContainerRef.current,
        { opacity: 0, scale: 0.95, x: 0 },
        { opacity: 1, scale: 1, x: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, [openExercise]);

  const toggleExercise = (name: string) => {
    setActiveExercises(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

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
      date: new Date().toISOString(),
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
    gsap.set(swipeContainerRef.current, { 
      xPercent, 
      opacity: 1 - Math.abs(xPercent / 150),
      scale: 1 - Math.abs(xPercent / 1000) 
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
          gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, scale: 1, duration: 0.25, ease: 'power4.out', onComplete: () => { touchState.current.isAnimating = false; } });
        }
      } else {
        if (currentIdx < activeExercises.length - 1) handleSwipeTransition('left', activeExercises[currentIdx + 1]);
        else handleSwipeTransition('left', activeExercises[0]);
      }
    } else {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, scale: 1, duration: 0.2, ease: 'power4.out' });
    }
  };

  const handleOverlayPointerCancel = () => {
    if (swipeContainerRef.current) {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
      touchState.current.isAnimating = false;
    }
  };

  const handleSwipeTransition = (direction: 'left' | 'right', nextEx: string) => {
    if (!swipeContainerRef.current || !nextEx) {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.15, ease: 'power2.out' });
      touchState.current.isAnimating = false;
      return;
    }
    const xDist = direction === 'left' ? -100 : 100;
    gsap.killTweensOf(swipeContainerRef.current);
    gsap.to(swipeContainerRef.current, {
      xPercent: xDist,
      opacity: 0,
      duration: 0.1,
      ease: 'power2.in',
      force3D: true,
      onComplete: () => {
        setOpenExercise(nextEx);
        gsap.fromTo(swipeContainerRef.current,
          { xPercent: direction === 'left' ? 100 : -100, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.15, ease: 'power3.out', force3D: true, onComplete: () => { touchState.current.isAnimating = false; } }
        );
      }
    });
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
      padding: 'calc(env(safe-area-inset-top) + 25px) 20px 0', 
      touchAction: 'auto', 
      overscrollBehavior: 'none' 
    }}>
      {openExercise && (
        <div style={{
          position: 'fixed', top: 0, bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 2000,
          display: 'flex', justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          touchAction: 'none',
          overscrollBehavior: 'none',
          boxSizing: 'border-box'
        }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            width: '100%', maxWidth: '480px', 
            background: 'var(--primary-bg)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            touchAction: 'none',
            overscrollBehavior: 'none',
            boxSizing: 'border-box',
            border: 'none'
          }}>
            <div style={{ height: '40px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', background: 'transparent' }}>
              {activeExercises.map((name, i) => (
                <div key={i} style={{
                  width: name === openExercise ? '20px' : '6px', height: '6px', borderRadius: '3px',
                  background: name === openExercise ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
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
                overflow: 'hidden', position: 'relative'
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
                  key={openExercise} exerciseName={openExercise} muscleGroup={selectedMuscle!}
                  tracker={tracker} 
                  initialSets={draftData[openExercise] || loggedData[openExercise]}
                  isCompleted={!!loggedData[openExercise]}
                  elapsedSeconds={elapsedSeconds}
                  onDone={(sets) => handleSetsDone(openExercise, sets)}
                  onChange={(sets, isDirty) => handleDraftChange(openExercise, sets, isDirty)}
                  onClose={() => setOpenExercise(null)} fullPage={true}
                  isDirty={dirtyExercises[openExercise]}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '32px', 
        transformStyle: 'preserve-3d',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          transform: 'translateZ(20px)',
          flex: 1,
          minWidth: 0
        }}>
          <div style={{ 
            width: '6px', 
            height: '32px', 
            background: 'var(--accent-color)', 
            borderRadius: '3px',
            boxShadow: '0 0 15px var(--accent-color-alpha)',
            flexShrink: 0
          }} />
          <h1 className="heading-font" style={{ 
            margin: 0, 
            fontSize: 'min(32px, 8vw)', 
            background: 'linear-gradient(to bottom, var(--text-primary) 50%, var(--accent-color) 150%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.1,
            flex: 1
          }}>
            {phase === 'exercises' ? t('startWorkout') : t('finishSession')}
          </h1>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          flexShrink: 0,
          background: 'rgba(var(--theme-rgb), 0.05)',
          border: '1px dashed rgba(var(--theme-rgb), 0.2)',
          borderRadius: '10px',
          padding: '6px 10px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          {phase === 'logging' && (
            <div ref={timerRef} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '0 8px',
              minWidth: '75px',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={14} color="var(--accent-color)" strokeWidth={2.5} />
              <span style={{ 
                fontFamily: 'Outfit, sans-serif', 
                fontSize: '17px', 
                fontWeight: '900', 
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
          )}

          {phase === 'logging' && (
            <button 
              onClick={() => {
                const now = Date.now();
                const currentSessionSeconds = Math.floor((now - sessionStartTimeRef.current) / 1000);
                savedElapsedRef.current = baseSecondsRef.current + currentSessionSeconds;
                setPhase('exercises');
              }} 
              style={{ 
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          
          <button 
            onClick={onClose} 
            style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ff0000', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
        {phase === 'exercises' && (
          <>
            <MuscleSelector 
              selectedMuscle={selectedMuscle} 
              onSelect={(m) => setSelectedMuscle(m as MuscleGroup)} 
              lang={lang} 
              musclesWithExercises={musclesWithExercises}
            />
            <ExercisePicker
              search={search}
              onSearchChange={setSearch}
              activeExercises={activeExercises}
              onToggle={toggleExercise}
              muscleGroup={selectedMuscle}
              tracker={tracker}
              t={t as any}
            />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', marginTop: '4px' }}>
              <button 
                onClick={() => setPhase('logging')} 
                disabled={activeExercises.length === 0} 
                style={{ 
                  background: hasStartedSession ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent',
                  border: '1px solid var(--accent-color)',
                  color: 'var(--accent-color)',
                  padding: '12px 30px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '900',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: activeExercises.length === 0 ? 0.3 : 1,
                  boxShadow: '0 0 15px var(--accent-color-alpha)',
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  touchAction: 'manipulation'
                }}
              >
                <Play size={16} strokeWidth={3} fill="currentColor" />
                {hasStartedSession 
                  ? (lang === 'ar' ? 'استكمال التمرين' : 'RESUME SESSION')
                  : (Object.keys(loggedData).length > 0 
                    ? (lang === 'ar' ? 'استكمال التمرين' : 'RESUME WORKOUT') 
                    : t('startWorkout').toUpperCase())
                }
              </button>
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
            t={t}
          />
        )}
      </div>
    </div>
  );
}

export default WorkoutSession;
