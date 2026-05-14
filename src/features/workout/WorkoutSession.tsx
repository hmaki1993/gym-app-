import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { DEFAULT_EXERCISES } from '../../data/exercises';
import type { MuscleGroup } from '../../types';
import { ChevronLeft, Clock, Play, X } from 'lucide-react';
import gsap from 'gsap';
import MuscleSelector from './components/MuscleSelector';
import ExercisePicker from './components/ExercisePicker';
import SessionLogger from './components/SessionLogger';
import ExerciseCard from './ExerciseCard';

const b = DEFAULT_EXERCISES;

const translations: any = {
  en: {
    appName: 'POWER GRID', startWorkout: 'Start Workout', finishSession: 'Finish Session',
    addSet: 'Add Set', removeSet: 'Remove Set', weight: 'Weight', reps: 'Reps', sets: 'Sets',
    saveWorkout: 'Save Workout', restTimer: 'Rest Timer', restDone: "Let's go! 💪",
    skip: 'Skip', exercises: 'Exercises', totalVolume: 'Total Volume', done: 'Done',
    addExercise: 'Add Exercise', customExercise: 'Custom Exercise Name', add: 'Add',
    session: 'Session', duration: 'Duration', noExercises: 'No exercises added yet',
    sessionSaved: 'Session Saved! 💪', addCustom: 'Add Custom', searchExercise: 'Search exercise...',
    pr_badge: 'PR', improved: 'Improved vs last', same: 'Same as last', decreased: 'Less than last',
    cancel: 'Cancel', confirm: 'Confirm', totalSets: 'Total Sets', bestSet: 'Best Set',
    lastSession: 'Last Session', kg: 'kg', lbs: 'lbs', balata: 'plate', seconds: 'sec',
    minutes: 'min', todaySummary: "TODAY'S SUMMARY", weightUnit: 'Weight Unit',
  },
  ar: {
    appName: 'باور جريد', startWorkout: 'ابدأ تمرين', finishSession: 'خلص الجلسة',
    addSet: 'أضف سيت', removeSet: 'شيل سيت', weight: 'الوزن', reps: 'عدات', sets: 'السيتات',
    saveWorkout: 'احفظ الجلسة', restTimer: 'تايمر الراحة', restDone: 'يالا! 💪',
    skip: 'تخطى', exercises: 'تمارين', totalVolume: 'الحجم الكلي', done: 'تمام',
    addExercise: 'أضف تمرين', customExercise: 'اسم التمرين المخصص', add: 'أضف',
    session: 'جلسة', duration: 'المدة', noExercises: 'مفيش تمارين لسه',
    sessionSaved: 'اتحفظت الجلسة! 💪', addCustom: 'أضف مخصص', searchExercise: 'ابحث عن تمرين...',
    pr_badge: 'PR', improved: 'أحسن من آخر مرة', same: 'نفس آخر مرة', decreased: 'أقل من آخر مرة',
    cancel: 'إلغاء', confirm: 'تأكيد', totalSets: 'مجموع السيتات', bestSet: 'أحسن سيت',
    lastSession: 'آخر جلسة', kg: 'كج', lbs: 'رطل', balata: 'بلاطة', seconds: 'ثانية',
    minutes: 'دقيقة', todaySummary: 'ملخص اليوم', weightUnit: 'وحدة الوزن',
  },
};

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onClose: () => void;
  onSaved: () => void;
}

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h > 0 ? h.toString().padStart(2, '0') : null, m.toString().padStart(2, '0'), s.toString().padStart(2, '0')]
    .filter(Boolean).join(':');
}

const WorkoutSession: React.FC<Props> = ({ tracker, onClose, onSaved }) => {
  const lang = tracker.settings.language as 'en' | 'ar';
  const t = (k: string) => (translations[lang] as any)[k] ?? k;

  const [view, setView] = useState<'exercises' | 'logging'>('exercises');
  const [muscle, setMuscle] = useState<string>(tracker.logs[0]?.muscleGroup || 'chest');
  const [activeExercises, setActiveExercises] = useState<string[]>([]);
  const [loggedData, setLoggedData] = useState<Record<string, any[]>>({});
  const [pendingData, setPendingData] = useState<Record<string, any[]>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hasSession, setHasSession] = useState(false);

  // Timers
  const [elapsed, setElapsed] = useState(0);
  const sessionStartRef = useRef(Date.now());
  const sessionBaseRef = useRef(0);
  const pausedElapsedRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);

  // Drag
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Swipe
  const swipeState = useRef({ startX: 0, isAnimating: false });

  // Animation refs
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timerBadgeRef = useRef<HTMLDivElement>(null);
  const exerciseCardRef = useRef<HTMLDivElement>(null);

  // Restore today's session on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const existing = tracker.logs.find(l => l.date.startsWith(today));
    if (existing && activeExercises.length === 0) {
      if (existing.muscleGroup) setMuscle(existing.muscleGroup);
      setActiveExercises(existing.exercises.map((e: any) => e.name));
      const data: Record<string, any[]> = {};
      existing.exercises.forEach((ex: any) => { data[ex.name] = ex.sets; });
      setLoggedData(data);
      setHasSession(true);
      setView('logging');
    }
  }, []);

  // Timer: start/stop based on view
  useEffect(() => {
    if (view === 'logging') {
      setHasSession(true);
      if (pausedElapsedRef.current !== null) {
        sessionBaseRef.current = pausedElapsedRef.current;
        pausedElapsedRef.current = null;
      } else {
        // Calculate today's existing session duration
        const today = new Date().toISOString().split('T')[0];
        const todayDuration = tracker.logs
          .filter(l => l.date.startsWith(today) && l.muscleGroup === muscle)
          .reduce((sum: number, l: any) => sum + (l.durationSeconds || l.durationMinutes * 60 || 0), 0);
        sessionBaseRef.current = todayDuration;
      }
      sessionStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const add = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        setElapsed(sessionBaseRef.current + add);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        pausedElapsedRef.current = elapsed;
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

  // GSAP entry animations
  useEffect(() => {
    if (contentRef.current && contentRef.current.children.length > 0) {
      gsap.fromTo(contentRef.current.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power3.out' });
    }
    if (view === 'logging' && timerBadgeRef.current) {
      gsap.fromTo(timerBadgeRef.current, { y: -30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 0.2 });
    }
  }, [view]);

  useEffect(() => {
    if (openExercise && exerciseCardRef.current) {
      gsap.fromTo(exerciseCardRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out', clearProps: 'all' });
    }
  }, [openExercise]);

  // Build exercise list


  const musclesWithExercises = useMemo(() => {
    const exerciseMap: Record<string, string> = {};
    Object.entries(b).forEach(([mg, exs]) => exs.forEach((ex: string) => { exerciseMap[ex] = mg; }));
    Object.entries(tracker.customExercises).forEach(([mg, exs]) => exs.forEach((ex: string) => { exerciseMap[ex] = mg; }));
    const set = new Set<string>();
    activeExercises.forEach(ex => { const mg = exerciseMap[ex]; if (mg) set.add(mg); });
    return set;
  }, [activeExercises, tracker.customExercises]);

  const toggleExercise = (name: string) => {
    setActiveExercises(prev => {
      if (prev.includes(name)) return prev.filter(e => e !== name);
      // If toggling ON, check if it was hidden and restore it
      const hidden = tracker.hiddenExercises[muscle as MuscleGroup] || [];
      if (hidden.includes(name)) {
        tracker.restoreExercise(muscle as MuscleGroup, name);
      }
      return [...prev, name];
    });
  };

  const handleExerciseDone = (name: string, sets: any[]) => {
    setLoggedData(prev => ({ ...prev, [name]: sets }));
    setDirtyMap(prev => { const { [name]: _, ...rest } = prev; return rest; });
    setPendingData(prev => { const n = { ...prev }; delete n[name]; return n; });
    setOpenExercise(null);
  };

  const handleExerciseChange = useCallback((name: string, sets: any[], dirty: boolean) => {
    setPendingData(prev => JSON.stringify(prev[name]) === JSON.stringify(sets) ? prev : { ...prev, [name]: sets });
    if (dirty) setDirtyMap(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSave = () => {
    if (!muscle) return;
    const combined = { ...loggedData };
    Object.entries(pendingData).forEach(([name, sets]) => {
      const valid = sets.filter((s: any) => s.reps > 0);
      if (valid.length > 0 && (!combined[name] || combined[name].length === 0)) combined[name] = valid;
    });
    const exercises = activeExercises
      .filter(name => combined[name] && combined[name].length > 0)
      .map(name => {
        let mg = muscle;
        for (const [k, v] of Object.entries(b)) if ((v as string[]).includes(name)) { mg = k; break; }
        for (const [k, v] of Object.entries(tracker.customExercises)) if (v.includes(name)) { mg = k; break; }
        return { name, sets: combined[name], restSeconds: tracker.settings.defaultRestSeconds, muscleGroup: mg };
      });
    if (exercises.length === 0) { onClose(); return; }
    const workout = { date: new Date().toISOString(), muscleGroup: muscle as MuscleGroup, exercises: exercises as any[] };
    tracker.saveWorkout(workout as any, elapsed);
    setDirtyMap({});
    onSaved();
  };

  // Swipe navigation
  const handlePointerDown = (e: React.PointerEvent) => {
    swipeState.current.startX = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (swipeState.current.isAnimating || !exerciseCardRef.current) return;
    const dx = (e.clientX - swipeState.current.startX) / (e.currentTarget as HTMLElement).clientWidth * 100;
    gsap.set(exerciseCardRef.current, { xPercent: dx, opacity: 1 - Math.abs(dx / 150), scale: 1 - Math.abs(dx / 1000) });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (swipeState.current.isAnimating || !exerciseCardRef.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const dx = (e.clientX - swipeState.current.startX) / (e.currentTarget as HTMLElement).clientWidth * 100;
    const idx = activeExercises.indexOf(openExercise!);
    if (Math.abs(dx) > 15) { // Increased threshold slightly for better stability
      swipeState.current.isAnimating = true;
      let nextIndex;
      if (dx > 0) { // Swipe Right -> Previous
        nextIndex = idx > 0 ? idx - 1 : activeExercises.length - 1;
      } else { // Swipe Left -> Next
        nextIndex = idx < activeExercises.length - 1 ? idx + 1 : 0;
      }
      const next = activeExercises[nextIndex];
      swipeToExercise(dx > 0 ? 'right' : 'left', next);
    } else {
      gsap.to(exerciseCardRef.current, { xPercent: 0, opacity: 1, scale: 1, duration: 0.1, ease: 'power4.out' });
    }
  };
  const swipeToExercise = (dir: 'left' | 'right', next: string | null) => {
    if (!exerciseCardRef.current || !next) {
      gsap.to(exerciseCardRef.current!, { xPercent: 0, opacity: 1, duration: 0.15, ease: 'power2.out' });
      swipeState.current.isAnimating = false;
      return;
    }
    const out = dir === 'left' ? -100 : 100;
    gsap.killTweensOf(exerciseCardRef.current);
    gsap.to(exerciseCardRef.current, {
      xPercent: out, opacity: 0, duration: 0.1, ease: 'power2.in', force3D: true,
      onComplete: () => {
        setOpenExercise(next);
        gsap.fromTo(exerciseCardRef.current!, { xPercent: dir === 'left' ? 80 : -80, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.12, ease: 'power4.out', force3D: true, onComplete: () => { swipeState.current.isAnimating = false; } });
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--primary-bg)', zIndex: 1000, overflowX: 'hidden', overflowY: 'auto', padding: 'calc(env(safe-area-inset-top) + 25px) 20px 0', touchAction: 'auto', overscrollBehavior: 'none' }}>

      {/* Exercise Card Full Screen */}
      {openExercise && (
        <div style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', justifyContent: 'center', touchAction: 'none', overscrollBehavior: 'none', boxSizing: 'border-box' }}>
          <div 
            style={{ position: 'absolute', top: 0, bottom: 0, width: '100%', maxWidth: 480, background: 'var(--primary-bg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'none', overscrollBehavior: 'none', boxSizing: 'border-box', transform: 'translateZ(0)' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { if (exerciseCardRef.current) gsap.to(exerciseCardRef.current, { xPercent: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }); swipeState.current.isAnimating = false; }}
          >
            {/* Dot indicators */}
            <div style={{ height: 40, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', background: 'transparent' }}>
              {activeExercises.map((ex, i) => (
                <div key={i} style={{ width: ex === openExercise ? 20 : 6, height: 6, borderRadius: 3, background: ex === openExercise ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.1)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              ))}
            </div>
            
            {/* Main Content Area */}
            <div ref={exerciseCardRef} style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
                <ExerciseCard
                  exerciseName={openExercise}
                  muscleGroup={muscle}
                  tracker={tracker}
                  initialSets={pendingData[openExercise] || loggedData[openExercise]}
                  isCompleted={!!loggedData[openExercise]}
                  elapsedSeconds={elapsed}
                  onDone={(sets) => handleExerciseDone(openExercise, sets)}
                  onChange={(sets, dirty) => handleExerciseChange(openExercise, sets, dirty)}
                  onClose={() => setOpenExercise(null)}
                  fullPage={true}
                  isDirty={dirtyMap[openExercise]}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div ref={headerRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, position: 'relative', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 6, height: 32, background: 'var(--accent-color)', borderRadius: 3, boxShadow: '0 0 15px var(--accent-color-alpha)', flexShrink: 0 }} />
          <h1 className="heading-font" style={{ margin: 0, fontSize: 'min(32px, 8vw)', background: 'linear-gradient(to bottom, var(--text-primary) 50%, var(--accent-color) 150%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -1, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1, flex: 1 }}>
            {t(view === 'exercises' ? 'startWorkout' : 'finishSession')}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, background: 'rgba(var(--theme-rgb), 0.05)', border: '1px dashed rgba(var(--theme-rgb), 0.2)', borderRadius: 10, padding: '6px 10px', backdropFilter: 'blur(10px)' }}>
          {view === 'logging' && (
            <div ref={timerBadgeRef} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', minWidth: 75, justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={14} color="var(--accent-color)" strokeWidth={2.5} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</span>
            </div>
          )}
          {view === 'logging' && (
            <button onClick={() => { const e = Math.floor((Date.now() - sessionStartRef.current) / 1000); pausedElapsedRef.current = sessionBaseRef.current + e; setView('exercises'); }} style={{ width: 32, height: 32, borderRadius: '50%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', cursor: 'pointer', flexShrink: 0 }}>
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff0000', cursor: 'pointer', flexShrink: 0 }}>
            <X size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {view === 'exercises' && (
          <>
            <MuscleSelector
              selectedMuscle={muscle}
              onSelect={setMuscle}
              lang={lang}
              musclesWithExercises={musclesWithExercises}
            />
            <ExercisePicker
              search={search}
              onSearchChange={setSearch}
              muscleGroup={muscle}
              activeExercises={activeExercises}
              onToggle={toggleExercise}
              tracker={tracker}
              t={t}
            />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, marginTop: 4 }}>
              <button
                onClick={() => setView('logging')}
                disabled={activeExercises.length === 0}
                style={{ background: hasSession ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '12px 30px', borderRadius: 12, fontSize: 12, fontWeight: 900, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8, opacity: activeExercises.length === 0 ? 0.3 : 1, boxShadow: '0 0 15px var(--accent-color-alpha)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', touchAction: 'manipulation' }}
              >
                <Play size={16} strokeWidth={3} fill="currentColor" />
                {hasSession ? (lang === 'ar' ? 'استكمال التمرين' : 'RESUME SESSION') : Object.keys(loggedData).length > 0 ? (lang === 'ar' ? 'استكمال التمرين' : 'RESUME WORKOUT') : t('startWorkout').toUpperCase()}
              </button>
            </div>
          </>
        )}

        {view === 'logging' && (
          <SessionLogger
            activeExercises={activeExercises}
            loggedData={loggedData}
            weightUnit={tracker.settings.weightUnit}
            onOpenExercise={setOpenExercise}
            onSave={handleSave}
            handleTouchStart={setDraggingIndex}
            handleTouchMove={(e: React.TouchEvent) => {
              if (draggingIndex === null) return;
              const target = (e.target as HTMLElement).closest('[data-index]');
              if (target) {
                const idx = parseInt(target.getAttribute('data-index') || '-1');
                if (idx !== -1 && idx !== draggingIndex) {
                  const arr = [...activeExercises];
                  const [item] = arr.splice(draggingIndex, 1);
                  arr.splice(idx, 0, item);
                  setActiveExercises(arr);
                  setDraggingIndex(idx);
                }
              }
            }}
            handleTouchEnd={() => setDraggingIndex(null)}
            draggingIndex={draggingIndex}
            t={t}
          />
        )}
      </div>
    </div>
  );
};

export default WorkoutSession;
export { WorkoutSession };
