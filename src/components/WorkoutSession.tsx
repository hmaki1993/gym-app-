import React, { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import type { MuscleGroup, SetLog, ExerciseLog, WorkoutLog } from '../types';
import { MUSCLE_GROUPS, DEFAULT_EXERCISES } from '../data/exercises';
import { translations } from '../translations';
import { ExerciseCard } from './ExerciseCard';
import { 
  X, Search, Plus, CheckCircle, Dumbbell, 
  Activity, Heart, Move, Zap, Waves, User,
  GripVertical, Trophy, LogOut
} from 'lucide-react';
import gsap from 'gsap';

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
  const [showSaved, setShowSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power3.out' }
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

    const log: Omit<WorkoutLog, 'id' | 'durationMinutes'> = {
      date: new Date().toISOString(),
      muscleGroup: selectedMuscle,
      exercises,
    };
    tracker.saveWorkout(log);
    setShowSaved(true);
    setTimeout(() => { setShowSaved(false); onSaved(); }, 1500);
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

  // Aggressively block browser back/forward swipe gestures
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchState.current.startX = e.touches[0].clientX;
      touchState.current.startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!openExercise) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = Math.abs(x - touchState.current.startX);
      const dy = Math.abs(y - touchState.current.startY);

      // Block horizontal swipe immediately to prevent browser back arrow
      if (dx > 2) { 
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
    gsap.set(swipeContainerRef.current, { xPercent, opacity: 1 - Math.abs(xPercent/150) });
  };

  const handleOverlayPointerEnd = (e: React.PointerEvent) => {
    if (touchState.current.isAnimating || !swipeContainerRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const diff = e.clientX - touchState.current.startX;
    const xPercent = (diff / e.currentTarget.clientWidth) * 100;
    const currentIdx = activeExercises.indexOf(openExercise!);
    
    if (Math.abs(xPercent) > 20) {
      touchState.current.isAnimating = true; // Lock
      if (xPercent > 20) {
        if (currentIdx > 0) handleSwipeTransition('right', activeExercises[currentIdx - 1]);
        else {
          gsap.to(swipeContainerRef.current, { xPercent: 0, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)', onComplete: () => { touchState.current.isAnimating = false; } });
        }
      } else {
        if (currentIdx < activeExercises.length - 1) handleSwipeTransition('left', activeExercises[currentIdx + 1]);
        else handleSwipeTransition('left', activeExercises[0]); // Loop back to first
      }
    } else {
      gsap.to(swipeContainerRef.current, { x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
    }
  };

  const handleOverlayPointerCancel = (e: React.PointerEvent) => {
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
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setOpenExercise(nextEx);
        // Animate back in from the opposite side
        gsap.fromTo(swipeContainerRef.current, 
          { xPercent: direction === 'left' ? 100 : -100, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: () => { touchState.current.isAnimating = false; } }
        );
      }
    });
  };

  const loggedCount = Object.keys(loggedData).filter(k => activeExercises.includes(k)).length;
  const totalVolume = Object.values(loggedData).flat().reduce((s, set) => s + set.weight * set.reps, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', overflow: 'hidden' }}>
      {openExercise && (
        <div style={{ 
          position: 'fixed', top: 0, bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 2000, 
          display: 'flex', justifyContent: 'center',
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
            <div style={{ height: '40px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
              {activeExercises.map((name, i) => (
                <div key={i} style={{ 
                  width: name === openExercise ? '20px' : '6px', height: '6px', borderRadius: '3px',
                  background: name === openExercise ? 'var(--accent-color)' : 'rgba(255,255,255,0.2)',
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
                  onDone={(sets) => handleSetsDone(openExercise, sets)}
                  onClose={() => setOpenExercise(null)} fullPage={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-1.2px', lineHeight: '1', marginBottom: '3px' }}>
            {phase === 'exercises' ? t('startWorkout').toUpperCase() : t('finishSession').toUpperCase()}
          </div>
          <div style={{ width: '30px', height: '2.5px', background: 'var(--accent-color)', borderRadius: '2px' }} />
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255, 51, 102, 0.12)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', color: '#cc0033', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogOut size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
        {phase === 'exercises' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 4px 16px', scrollbarWidth: 'none', marginBottom: '10px' }}>
              {MUSCLE_GROUPS.map(mg => {
                const isSelected = selectedMuscle === mg.key;
                return (
                  <button 
                    key={mg.key} 
                    onClick={() => setSelectedMuscle(mg.key)} 
                    style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                      background: 'none', border: 'none', padding: '0', 
                      flexShrink: 0, minWidth: '50px', cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: isSelected ? 1 : 0.4
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: `1.2px solid ${isSelected ? 'var(--accent-color)' : 'transparent'}`,
                      transition: 'all 0.4s ease'
                    }}>
                      <img 
                        src={mg.icon} 
                        alt={mg.en} 
                        style={{ 
                          width: '30px', height: '30px', objectFit: 'contain', 
                          filter: isSelected ? 'contrast(1.2) brightness(1.1)' : 'grayscale(1) opacity(0.5)',
                          transition: 'all 0.4s ease'
                        }} 
                      />
                    </div>
                    <span style={{ 
                      fontSize: '10px', fontWeight: '900', 
                      color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                      textTransform: 'uppercase', letterSpacing: '1px'
                    }}>
                      {mg[lang]}
                    </span>
                    {isSelected && (
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-color)', marginTop: '-2px' }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="glass-input" style={{ paddingLeft: '40px' }} placeholder={t('searchExercise')} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button 
                type="button"
                onClick={() => { 
                  if (search.trim()) { 
                    tracker.addCustomExercise(selectedMuscle, search.trim()); 
                    setSearch(''); 
                  } else {
                    window.alert('Please enter an exercise name first!');
                  }
                }}
                style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1.5px solid var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', cursor: 'pointer' }}
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.length === 0 && search && (
                <button 
                  onClick={() => { tracker.addCustomExercise(selectedMuscle, search); setSearch(''); }}
                  style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--accent-color-alpha)', borderRadius: '16px', color: 'var(--accent-color)', fontWeight: '700', cursor: 'pointer' }}
                >
                  {t('addCustom')}: "{search}"
                </button>
              )}
              {filtered.map(name => {
                const isSelected = activeExercises.includes(name);
                const lastData = tracker.getLastSession(name);
                const isCustom = tracker.customExercises[selectedMuscle]?.includes(name);
                return (
                  <div 
                    key={name} 
                    onClick={() => toggleExercise(name)} 
                    className="exercise-select-btn"
                    style={{ 
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '16px 12px', background: 'transparent',
                      border: 'none',
                      borderBottom: `1.2px solid ${isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)'}`,
                      width: '100%', cursor: 'pointer',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)', transition: 'color 0.3s ease' }}>{name}</div>
                      {lastData && (
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600', opacity: 0.6 }}>
                          {t('lastSession')}: {lastData.sets[0]?.weight}{tracker.settings.weightUnit} × {lastData.sets[0]?.reps}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isSelected && (
                        <div style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
                          <CheckCircle size={18} strokeWidth={3} />
                        </div>
                      )}
                      {isSelected && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (isCustom) {
                              tracker.removeCustomExercise(selectedMuscle, name);
                            } else {
                              tracker.hideDefaultExercise(selectedMuscle, name);
                            }
                            if (isSelected) toggleExercise(name);
                          }}
                          style={{ padding: '6px', background: 'rgba(255,51,102,0.1)', border: 'none', borderRadius: '8px', color: '#ff3366', cursor: 'pointer', display: 'flex', zIndex: 10, opacity: 0.6 }}
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setPhase('logging')} disabled={activeExercises.length === 0} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--accent-color-alpha-heavy)', color: 'var(--accent-color)', fontSize: '12px', fontWeight: '900', padding: '10px 28px', borderRadius: '14px', opacity: activeExercises.length === 0 ? 0.3 : 1 }}>
                <Activity size={16} /> {t('startWorkout')}
              </button>
            </div>
          </div>
        )}

        {phase === 'logging' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><div className="section-label">{t('todaySummary')}</div><div style={{ fontSize: '22px', fontWeight: '900' }}>{loggedCount}/{activeExercises.length}</div></div>
                <div style={{ textAlign: 'right' }}><div className="section-label">{t('totalVolume')}</div><div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-color)' }}>{totalVolume.toFixed(0)}{tracker.settings.weightUnit}</div></div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeExercises.map((name, index) => (
                <div key={name} data-index={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onTouchStart={() => handleTouchStart(index)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ color: 'rgba(255,255,255,0.25)', padding: '10px' }}><GripVertical size={20} /></div>
                  <button onClick={() => setOpenExercise(name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', background: 'none', border: 'none', borderBottom: `1px solid ${loggedData[name] ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)'}`, flex: 1, textAlign: 'left' }}>
                    <div><div style={{ fontSize: '15px', fontWeight: '700', color: loggedData[name] ? 'var(--accent-color)' : 'var(--text-primary)' }}>{loggedData[name] ? '✓ ' : ''}{name}</div></div>
                    <Plus size={16} color="var(--text-secondary)" />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <button onClick={handleSave} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--accent-color-alpha-heavy)', color: 'var(--accent-color)', fontSize: '12px', fontWeight: '900', padding: '10px 28px', borderRadius: '14px' }}>
                <Trophy size={16} /> {t('finishSession')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
