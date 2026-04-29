import React, { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import type { MuscleGroup, SetLog, ExerciseLog, WorkoutLog } from '../../types';
import { DEFAULT_EXERCISES } from '../../data/exercises';
import { translations } from '../../translations';
import { ExerciseCard } from './ExerciseCard';
import {
  LogOut, Clock, Activity
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
  const isRtl = lang === 'ar';

  const [phase, setPhase] = useState<'exercises' | 'logging'>('exercises');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>(tracker.logs[0]?.muscleGroup || 'chest');
  const [activeExercises, setActiveExercises] = useState<string[]>([]);
  const [loggedData, setLoggedData] = useState<Record<string, SetLog[]>>({});
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const workoutStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (phase === 'logging') {
      if (!workoutStartTime.current) {
        workoutStartTime.current = Date.now();
      }
      const interval = setInterval(() => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - workoutStartTime.current!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      workoutStartTime.current = null;
      setElapsedSeconds(0);
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

  useEffect(() => {
    if (containerRef.current && containerRef.current.children.length > 0) {
      gsap.fromTo(containerRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power3.out' }
      );
    }

    // Timer Curtain Drop Effect
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

  const customExercises = tracker.customExercises[selectedMuscle] || [];
  const hiddenExercises = tracker.hiddenExercises?.[selectedMuscle] || [];
  const defaultExercises = (DEFAULT_EXERCISES[selectedMuscle] || []).filter(e => !hiddenExercises.includes(e));

  const allExercises = selectedMuscle
    ? [...defaultExercises, ...customExercises]
    : [];

  const filtered = allExercises.filter(e => e.toLowerCase().includes(search.toLowerCase()));

  const toggleExercise = (name: string) => {
    setActiveExercises(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const handleSetsDone = (exerciseName: string, sets: SetLog[]) => {
    setLoggedData(prev => ({ ...prev, [exerciseName]: sets }));
    setOpenExercise(null);
  };

  const handleSave = () => {
    if (!selectedMuscle) return;
    const exercises: ExerciseLog[] = activeExercises
      .filter(name => loggedData[name] && loggedData[name].length > 0)
      .map(name => ({
        name,
        sets: loggedData[name],
        restSeconds: tracker.settings.defaultRestSeconds,
      }));
    if (exercises.length === 0) { onClose(); return; }

    const log: Omit<WorkoutLog, 'id' | 'durationMinutes' | 'startTime' | 'endTime'> = {
      date: new Date().toISOString(),
      muscleGroup: selectedMuscle,
      exercises,
    };
    tracker.saveWorkout(log);
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

  // Smart edge-swipe blocker: exempts .allow-swipe scrollers (MuscleSelector)
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let targetIsScroller = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touchState.current.startX = startX;
      touchState.current.startY = startY;
      // Flag if the touch started inside an allowed horizontal scroller
      targetIsScroller = !!(e.target as HTMLElement).closest?.('.allow-swipe');
    };

    const handleTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = Math.abs(x - startX);
      const dy = Math.abs(y - startY);

      // If inside the muscle selector or any allowed scroller → never block
      if (targetIsScroller) return;

      // Block edge-swipe (back/forward navigation) - tighter 30px threshold
      const EDGE = 30;
      const isEdge = startX < EDGE || startX > window.innerWidth - EDGE;
      if (isEdge && dx > dy && dx > 5) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      // While exercise overlay is open → block ALL horizontal swipes (for card swiping)
      if (!openExercise) return;
      if (dx > 5) {
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
    gsap.set(swipeContainerRef.current, { xPercent, opacity: 1 - Math.abs(xPercent / 150) });
  };

  const handleOverlayPointerEnd = (e: React.PointerEvent) => {
    if (touchState.current.isAnimating || !swipeContainerRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const diff = e.clientX - touchState.current.startX;
    const xPercent = (diff / e.currentTarget.clientWidth) * 100;
    const currentIdx = activeExercises.indexOf(openExercise!);

    if (Math.abs(xPercent) > 15) {
      touchState.current.isAnimating = true; // Lock
      if (xPercent > 15) {
        if (currentIdx > 0) handleSwipeTransition('right', activeExercises[currentIdx - 1]);
        else {
          gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.25, ease: 'power4.out', onComplete: () => { touchState.current.isAnimating = false; } });
        }
      } else {
        if (currentIdx < activeExercises.length - 1) handleSwipeTransition('left', activeExercises[currentIdx + 1]);
        else handleSwipeTransition('left', activeExercises[0]); // Loop back to first
      }
    } else {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.2, ease: 'power4.out' });
    }
  };

  const handleOverlayPointerCancel = () => {
    if (swipeContainerRef.current) {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
      touchState.current.isAnimating = false;
    }
  };

  const handleSwipeTransition = (direction: 'left' | 'right', nextEx: string) => {
    if (!swipeContainerRef.current || !nextEx) {
      gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
      touchState.current.isAnimating = false;
      return;
    }

    const xDist = direction === 'left' ? -100 : 100;
    gsap.killTweensOf(swipeContainerRef.current);

    gsap.to(swipeContainerRef.current, {
      xPercent: xDist,
      opacity: 0,
      duration: 0.12,
      ease: 'power4.in',
      onComplete: () => {
        setOpenExercise(nextEx);
        // Animate back in from the opposite side
        gsap.fromTo(swipeContainerRef.current,
          { xPercent: direction === 'left' ? 100 : -100, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.18, ease: 'power4.out', onComplete: () => { touchState.current.isAnimating = false; } }
        );
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', overflowX: 'hidden', overflowY: 'auto', padding: '16px 20px 0', touchAction: 'auto', overscrollBehaviorX: 'none' }}>
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
            width: '100%', maxWidth: '480px', background: '#000',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            touchAction: 'none',
            overscrollBehavior: 'none',
            boxSizing: 'border-box'
          }}>
            {/* Dots */}
            <div style={{ height: '40px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', background: 'var(--primary-bg)' }}>
              {activeExercises.map((name, i) => (
                <div key={i} style={{
                  width: name === openExercise ? '20px' : '6px', height: '6px', borderRadius: '3px',
                  background: name === openExercise ? 'var(--accent-color)' : 'var(--glass-border)',
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
                  tracker={tracker} initialSets={loggedData[openExercise]}
                  elapsedSeconds={elapsedSeconds}
                  onDone={(sets) => handleSetsDone(openExercise, sets)}
                  onClose={() => setOpenExercise(null)} fullPage={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', transformStyle: 'preserve-3d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', transform: 'translateZ(20px)' }}>
          <div style={{ 
            width: '4px', 
            height: '20px', 
            background: 'var(--accent-color)', 
            borderRadius: '2px',
            boxShadow: '0 0 15px var(--accent-color-alpha)'
          }} />
          <h1 className="heading-font" style={{ 
            margin: 0, 
            fontSize: '24px',
            background: 'linear-gradient(to bottom, var(--text-primary) 50%, var(--accent-color) 150%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
            textTransform: 'uppercase'
          }}>
            {phase === 'exercises' ? t('startWorkout') : t('finishSession')}
          </h1>
          
          {/* Live Timer Badge */}
          {phase === 'logging' && (
            <div ref={timerRef} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              animation: 'pulse-glow 2s infinite ease-in-out',
              marginLeft: '10px'
            }}>
              <Clock size={16} color="var(--accent-color)" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 5px var(--accent-color-alpha))' }} />
              <span style={{ 
                fontFamily: 'Outfit, sans-serif', 
                fontSize: '20px', 
                fontWeight: '900', 
                color: 'var(--text-primary)',
                textShadow: '0 0 10px var(--accent-color-alpha)'
              }}>
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="exit-btn-premium"
          style={{ 
            background: 'rgba(255, 51, 102, 0.05)', 
            border: '1px solid rgba(255, 51, 102, 0.1)', 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            color: '#ff3366', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
        {phase === 'exercises' && (
          <>
            <MuscleSelector 
              selectedMuscle={selectedMuscle} 
              onSelect={setSelectedMuscle} 
              lang={lang} 
            />
            <ExercisePicker
              search={search}
              onSearchChange={setSearch}
              filteredExercises={filtered}
              activeExercises={activeExercises}
              onToggle={toggleExercise}
              onAddCustom={(name) => tracker.addCustomExercise(selectedMuscle, name)}
              onRemove={(name, isCustom) => {
                if (isCustom) tracker.removeCustomExercise(selectedMuscle, name);
                else tracker.hideDefaultExercise(selectedMuscle, name);
                if (activeExercises.includes(name)) toggleExercise(name);
              }}
              isRtl={isRtl}
              t={t}
              weightUnit={tracker.settings.weightUnit}
              getLastSession={(name) => tracker.getLastSession(name)}
              customExercises={tracker.customExercises[selectedMuscle]}
            />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', marginTop: '4px' }}>
              <button 
                onClick={() => setPhase('logging')} 
                disabled={activeExercises.length === 0} 
                style={{ 
                  background: 'transparent',
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
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                <Activity size={16} strokeWidth={3} /> {t('startWorkout').toUpperCase()}
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
