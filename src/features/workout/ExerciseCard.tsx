import { useState, useEffect, useRef } from 'react';
import { useGymTracker, playSetDoneSound, playRestDoneSound } from '../../hooks/useGymTracker';
import type { SetLog } from '../../types';
import { translations } from '../../translations';
import { X, Plus, Clock } from 'lucide-react';
import gsap from 'gsap';
import { SetRow } from './components/SetRow';

interface Props {
  exerciseName: string;
  muscleGroup: string;
  tracker: ReturnType<typeof useGymTracker>;
  initialSets?: SetLog[];
  isCompleted?: boolean;
  onDone: (sets: SetLog[]) => void;
  onChange?: (sets: any[], isDirty: boolean) => void;
  onClose: () => void;
  inline?: boolean;
  fullPage?: boolean;
  elapsedSeconds?: number;
  isDirty?: boolean;
}

export function ExerciseCard({ exerciseName, tracker, initialSets, onDone, onChange, onClose, inline, fullPage, elapsedSeconds, isDirty: isDirtyProp }: Props) {
  const lang = tracker.settings.language;
  const t = (k: string) => (translations[lang] as any)[k] ?? k;
  const unit = tracker.settings.weightUnit;

  const pr = tracker.getExercisePR(exerciseName);

  const [sets, setSets] = useState<{ weight: string | number; reps: string | number; restTime?: number }[]>(() => {
    if (initialSets && initialSets.length > 0) return initialSets.map(s => ({ ...s }));
    return [{ weight: '', reps: '' }];
  });

  const isDirty = !!isDirtyProp;

  const handleManualChange = (newSets: typeof sets) => {
    setSets(newSets);
    if (onChange) onChange(newSets, true);
  };

  useEffect(() => {
    // Initial sync without marking as dirty
    if (onChange) onChange(sets, false);
  }, []); // Run only ONCE on mount

  const [, setHasAddedSet] = useState(false);
  const [activeUnit, setActiveUnit] = useState(unit || 'kg');

  const cycleUnit = () => {
    const units = ['kg', 'lbs', 'balata'] as const;
    const currentIndex = units.indexOf(activeUnit as any);
    const nextIndex = (currentIndex + 1) % units.length;
    const newUnit = units[nextIndex];
    setActiveUnit(newUnit);
    tracker.setSettings({ weightUnit: newUnit });
  };
  const [restActive, setRestActive] = useState(false);
  const [restDuration] = useState(tracker.settings.defaultRestSeconds);
  const [restRemaining, setRestRemaining] = useState(tracker.settings.defaultRestSeconds);
  const [restingSetIndex, setRestingSetIndex] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (cardRef.current && !fullPage) {
      gsap.fromTo(cardRef.current, 
        { y: 30, opacity: 0, rotateX: 15, translateZ: -100 }, 
        { y: 0, opacity: 1, rotateX: 0, translateZ: 0, duration: 0.6, ease: 'power4.out' }
      );
    }
  }, [fullPage]);

  // Stagger sets on mount
  const setsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (setsRef.current && !fullPage) {
      gsap.fromTo(setsRef.current.children,
        { opacity: 0, x: -10, translateZ: -20 },
        { opacity: 1, x: 0, translateZ: 0, stagger: 0.05, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [fullPage]);

  useEffect(() => {
    if (titleRef.current && !fullPage) {
      const words = titleRef.current.querySelectorAll('.title-word');
      gsap.fromTo(words,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [exerciseName, fullPage]);

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
    if (restActive && restRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setRestRemaining(prev => {
          if (prev <= 1) {
            setRestActive(false);
            if (restingSetIndex !== null) {
              updateSet(restingSetIndex, 'restTime', restDuration);
              setRestingSetIndex(null);
            }
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (tracker.settings.soundEnabled) playRestDoneSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [restActive, restingSetIndex, restDuration]);

  const startRest = (index?: number) => {
    if (restActive && restingSetIndex === index) {
      const timeSpent = restDuration - restRemaining;
      if (timeSpent > 0) updateSet(restingSetIndex, 'restTime', timeSpent);
      setRestActive(false);
      setRestingSetIndex(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (tracker.settings.soundEnabled) playSetDoneSound();
    setRestRemaining(restDuration);
    setRestActive(true);
    if (index !== undefined) setRestingSetIndex(index);
  };

  const updateSet = (index: number, field: 'weight' | 'reps' | 'restTime', value: string | number) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    handleManualChange(newSets);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleDone = () => {
    if (isSubmitting) return;
    const validSets = sets.filter(s => Number(s.reps) > 0).map(s => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, restTime: s.restTime }));
    if (validSets.length === 0) { onClose(); return; }
    setIsSubmitting(true);
    onDone(validSets);
  };

  const totalVolume = sets.reduce((s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);

  return (
    <div
      ref={cardRef}
      className={fullPage ? "" : (inline ? "antigravity-card" : "glass-card antigravity-card")}
      style={fullPage ? {
        display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%',
        overflow: 'hidden', background: 'var(--primary-bg)', padding: 0, touchAction: 'pan-y', boxSizing: 'border-box'
      } : (inline ? {
        padding: '16px 0', marginBottom: '12px', background: 'transparent',
        border: 'none', animation: 'slideDown 0.3s ease'
      } : {
        padding: '24px', marginBottom: '20px', background: 'var(--glass-bg)',
        border: 'none', borderRadius: '28px'
      })}
    >

      <div style={{ flexShrink: 0, transformStyle: 'preserve-3d' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '14px', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <h2 ref={titleRef} className="heading-font" style={{ 
                margin: 0, 
                marginBottom: '10px',
                fontSize: 'clamp(18px, 5.5vw, 28px)', 
                fontWeight: '950',
                color: 'var(--text-primary)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                lineHeight: '1.15',
                paddingRight: '8px',
                position: 'relative'
              }}>
                {exerciseName.split(' ').map((word, wi) => (
                  <span key={wi} className="title-word" style={{ 
                    display: 'inline-block', 
                    whiteSpace: 'nowrap', 
                    marginRight: '0.3em',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    willChange: 'transform, opacity'
                  }}>
                    {word}
                  </span>
                ))}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                {pr && <div className="pr-badge" style={{ color: '#ff5e00', fontSize: '13px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.5px' }}>🏆 PR: {pr.weight} {t(unit as any)} × {pr.reps}</div>}
              </div>
            </div>
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
            WebkitBackdropFilter: 'blur(10px)',
            transform: 'translateZ(10px)',
            marginTop: '-4px'
          }}>
            {elapsedSeconds !== undefined && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', // Matched outer
                padding: '0 8px',
                minWidth: '75px', // Matched outer
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={14} color="var(--accent-color)" strokeWidth={2.5} /> {/* Matched outer */}
                <span style={{ 
                  fontFamily: 'Outfit, sans-serif', 
                  fontSize: '17px', // Matched outer
                  fontWeight: '900', 
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {formatElapsed(elapsedSeconds)}
                </span>
              </div>
            )}
            
            <button 
              onClick={onClose} 
              onPointerDown={(e) => e.stopPropagation()} 
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: '0', 
                width: '32px', // Matched outer
                height: '32px', // Matched outer
                borderRadius: '50%', 
                color: '#ff3366', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                flexShrink: 0, 
                zIndex: 100, 
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 51, 102, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <X size={20} strokeWidth={3} /> {/* Matched outer */}
            </button>
          </div>
        </div>

      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 16px', WebkitOverflowScrolling: 'touch', minHeight: 0, maxHeight: 'calc(100dvh - 240px)', transformStyle: 'preserve-3d' }}>
        <div ref={setsRef} style={{ display: 'flex', flexDirection: 'column', gap: '0', transformStyle: 'preserve-3d' }}>
          {sets.map((set, i) => (
            <SetRow
              key={i}
              index={i}
              weight={set.weight}
              reps={set.reps}
              restTime={set.restTime}
              activeUnit={activeUnit}
              isResting={restingSetIndex === i}
              canRemove={sets.length > 1}
              t={t}
              onUpdate={(field, val) => updateSet(i, field, val)}
              onCycleUnit={cycleUnit}
              onStartRest={() => startRest(i)}
              onRemove={() => { handleManualChange(sets.filter((_, idx) => idx !== i)); }}
            />
          ))}
        </div>

        <button onClick={() => { setHasAddedSet(true); handleManualChange([...sets, { weight: '', reps: '' }]); }} style={{ width: '100%', padding: '14px', background: 'transparent', border: '2px dashed rgba(var(--theme-rgb), 0.45)', borderRadius: '16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px', fontFamily: 'Outfit, sans-serif' }}>
          <Plus size={16} color="var(--accent-color)" /> {t('addSet')}
        </button>

        {sets.length <= 1 && (
          <div style={{ padding: '20px 0', opacity: 0.65, pointerEvents: 'none', userSelect: 'none', textAlign: 'center', marginTop: '30px' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '900', 
              color: 'var(--text-primary)', 
              letterSpacing: '2px', 
              textTransform: 'uppercase', 
              lineHeight: '1.4', 
              fontFamily: 'Outfit, sans-serif' 
            }}>
              STAY FOCUSED<br/>{tracker.settings.userName.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: 'auto', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', background: 'var(--primary-bg)', borderTop: '2px solid rgba(var(--theme-rgb), 0.25)', transformStyle: 'preserve-3d' }}>
        
        {/* Rest Timer Removed */}

        <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.85, fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', fontFamily: 'Outfit, sans-serif' }}>{t('totalVolume')}</div>
            <div style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>{totalVolume.toFixed(0)} <span style={{ fontSize: '12px', marginLeft: '3px', color: 'var(--accent-color)', opacity: 0.7 }}> {t(unit as any)}</span></div>
          </div>
          <div style={{ width: '1.5px', height: '24px', background: 'rgba(var(--theme-rgb), 0.15)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.85, fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', fontFamily: 'Outfit, sans-serif' }}>Max Today</div>
            <div style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>{Math.max(...sets.map(s => Number(s.weight) || 0), 0)} <span style={{ fontSize: '12px', marginLeft: '3px', color: 'var(--accent-color)', opacity: 0.7 }}> {t(unit as any)}</span></div>
          </div>
        </div>

        <button 
          onClick={handleDone} 
          disabled={isSubmitting || !isDirty || sets.every(s => !Number(s.reps))}
          style={{ 
            background: 'transparent', border: 'none', 
            color: 'var(--accent-color)', fontSize: '16px', fontWeight: '800', 
            padding: '4px 8px', width: 'fit-content', 
            cursor: (isSubmitting || !isDirty || sets.every(s => !Number(s.reps))) ? 'default' : 'pointer', 
            pointerEvents: (isSubmitting || !isDirty || sets.every(s => !Number(s.reps))) ? 'none' : 'auto',
            textTransform: 'uppercase', letterSpacing: isSubmitting ? '4px' : '12px', outline: 'none', 
            animation: (isSubmitting || !isDirty || sets.every(s => !Number(s.reps))) ? 'none' : 'pulse-glow 2.5s ease-in-out infinite', 
            opacity: (isSubmitting || !isDirty || sets.every(s => !Number(s.reps))) ? 0.6 : 1,
            fontFamily: 'Syne, sans-serif', transform: 'translateZ(15px)', touchAction: 'manipulation',
            transition: 'all 0.2s ease'
          }}
        >
          {isSubmitting ? (lang === 'ar' ? 'جاري الحفظ...' : 'SAVING...') : t('done')}
        </button>
      </div>
    </div>
  );
}
