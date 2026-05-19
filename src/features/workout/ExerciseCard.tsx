import React, { useState, useEffect, useRef, memo } from 'react';
import { Trash2 } from 'lucide-react';
import gsap from 'gsap';
import { useGymTracker } from '../../hooks/useGymTracker';

const translations: any = {
  en: { totalVolume: 'Total Volume', addSet: 'Add Set', reps: 'Reps', done: 'Done', kg: 'kg', lbs: 'lbs', balata: 'plate', lastSession: 'Last Session' },
  ar: { totalVolume: 'الحجم الكلي', addSet: 'أضف سيت', reps: 'عدات', done: 'تمام', kg: 'كج', lbs: 'رطل', balata: 'بلاطة', lastSession: 'آخر جلسة' },
};

// Rest timer sounds
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime); g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {}
}
function playStart() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(440, ctx.currentTime); g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.start(); o.stop(ctx.currentTime + 0.15);
  } catch {}
}

const CustomPlus = ({ size = 16, color = 'var(--accent-color)' }: { size?: number; color?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <line x1="12" y1="5" x2="12" y2="19" stroke="rgba(61, 61, 61, 0.95)" strokeWidth="7.5" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="rgba(61, 61, 61, 0.95)" strokeWidth="7.5" strokeLinecap="round" />
    <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="4.2" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="4.2" strokeLinecap="round" />
  </svg>
);

// SetRow component (Ka from bundle)
const SetRow = ({ index, weight, reps, activeUnit, canRemove, t, onUpdate, onCycleUnit, onRemove, isCardio, lang }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1.5px solid rgba(var(--theme-rgb), 0.1)', gap: 8, transformStyle: 'preserve-3d' }}>
    <div style={{ width: 24, fontSize: 14, fontWeight: 900, color: 'var(--accent-color)', opacity: 0.8, fontFamily: "'Montserrat', sans-serif" }}>{index + 1}</div>
    <div style={{ width: '1.5px', height: 20, background: 'rgba(var(--theme-rgb), 0.15)', marginRight: 12 }} />
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <input type="number" inputMode="decimal" value={weight} onChange={e => onUpdate('weight', e.target.value)} style={{ background: 'rgba(var(--theme-rgb), 0.14)', border: '1.5px solid rgba(var(--theme-rgb), 0.2)', outline: 'none', color: 'var(--text-primary)', fontSize: 24, fontWeight: 900, textAlign: 'center', width: 65, padding: '8px 0', borderRadius: 12, fontFamily: "'Montserrat', sans-serif",  }} />
      <div 
        onClick={onCycleUnit} 
        style={{ 
          fontSize: 10, 
          fontWeight: 950, 
          color: 'var(--accent-color)', 
          textTransform: 'uppercase', 
          letterSpacing: 1, 
          cursor: 'pointer', 
          width: 48, 
          height: 48,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontFamily: "'Montserrat', sans-serif", 
          lineHeight: 1, 
          transition: 'all 0.2s ease',
          background: 'transparent',
          border: '1.5px dashed rgba(var(--theme-rgb), 0.3)',
          borderRadius: '50%',
          padding: '0 4px',
          boxSizing: 'border-box'
        }} 
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')} 
        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')} 
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <span style={{ color: 'var(--text-primary)' }}>
          {isCardio ? (lang === 'ar' ? 'مستوى' : 'LEVEL') : t(activeUnit)}
        </span>
      </div>
    </div>
    <div style={{ width: '1.5px', height: 24, background: 'rgba(var(--theme-rgb), 0.15)' }} />
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <input type="number" inputMode="numeric" value={reps} onChange={e => onUpdate('reps', e.target.value)} style={{ background: 'rgba(var(--theme-rgb), 0.14)', border: '1.5px solid rgba(var(--theme-rgb), 0.2)', outline: 'none', color: 'var(--text-primary)', fontSize: 24, fontWeight: 900, textAlign: 'center', width: 65, padding: '8px 0', borderRadius: 12, fontFamily: "'Montserrat', sans-serif",  }} />
      <div style={{ 
        fontSize: 10, 
        fontWeight: 950, 
        color: 'var(--text-secondary)', 
        textTransform: 'uppercase', 
        opacity: 0.9, 
        letterSpacing: '1px', 
        fontFamily: "'Montserrat', sans-serif",
        width: 48,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: '1.5px dashed rgba(var(--theme-rgb), 0.3)',
        borderRadius: '50%',
        padding: '0 4px',
        boxSizing: 'border-box'
      }}>
        {isCardio ? (lang === 'ar' ? 'دقيقة' : 'MINS') : t('reps')}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {canRemove && (
        <button onClick={onRemove} style={{ background: 'transparent', border: 'none', width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,51,102,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 0 }}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  </div>
);

interface Props {
  exerciseName: string;
  muscleGroup: string;
  tracker: ReturnType<typeof useGymTracker>;
  initialSets?: any[];
  isCompleted?: boolean;
  elapsedSeconds?: number;
  onDone: (sets: any[]) => void;
  onChange?: (sets: any[], dirty: boolean) => void;
  onClose: () => void;
  fullPage?: boolean;
  inline?: boolean;
  isDirty?: boolean;
}

const ExerciseCard: React.FC<Props> = memo(({ exerciseName, muscleGroup, tracker, initialSets, onDone, onChange, onClose, fullPage, inline, elapsedSeconds, isDirty }) => {
  const lang = tracker.settings.language;
  const t = (k: string) => (translations[lang] as any)[k] ?? k;
  const weightUnit = tracker.settings.weightUnit;

  const initSets = () => {
    const lastUnit = tracker.getLastUsedUnit(exerciseName);
    return initialSets && initialSets.length > 0
      ? initialSets.map(s => ({ ...s, unit: (s.unit || lastUnit || weightUnit || 'kg') as any }))
      : [{ weight: '', reps: '', unit: (lastUnit || weightUnit || 'kg') as any }];
  };

  const [sets, setSets] = useState(initSets);
  const [activeUnit, setActiveUnit] = useState(initialSets?.[0]?.unit || tracker.getLastUsedUnit(exerciseName) || weightUnit || 'kg');
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(tracker.settings.defaultRestSeconds);
  const [restingSetIndex, setRestingSetIndex] = useState<number | null>(null);
  const restTimerRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const setsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [saving, setSaving] = useState(false);
  const isDirtyRef = !!isDirty;

  // Re-init when exercise changes
  useEffect(() => {
    const lastUnit = tracker.getLastUsedUnit(exerciseName);
    const s = initSets();
    setSets(s);
    setActiveUnit(initialSets?.[0]?.unit || lastUnit || weightUnit || 'kg');
    onChange && onChange(s, false);
  }, [exerciseName]);

  useEffect(() => { onChange && onChange(sets, false); }, []);

  // GSAP animations
  useEffect(() => {
    if (cardRef.current && !fullPage) {
      gsap.fromTo(cardRef.current, { y: 30, opacity: 0, rotateX: 15, translateZ: -100 }, { y: 0, opacity: 1, rotateX: 0, translateZ: 0, duration: 0.6, ease: 'power4.out' });
    }
  }, [fullPage]);

  useEffect(() => {
    if (setsRef.current && !fullPage) {
      gsap.fromTo(setsRef.current.children, { opacity: 0, x: -10, translateZ: -20 }, { opacity: 1, x: 0, translateZ: 0, stagger: 0.05, duration: 0.5, ease: 'power2.out' });
    }
  }, [fullPage]);

  useEffect(() => {
    if (titleRef.current && !fullPage) {
      const words = titleRef.current.querySelectorAll('.title-word');
      if (words.length > 0) {
        gsap.fromTo(words, { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.35, ease: 'power2.out' });
      }
    }
  }, [exerciseName, fullPage]);

  // Rest timer
  useEffect(() => {
    if (isResting && restSeconds > 0) {
      restTimerRef.current = window.setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) {
            setIsResting(false);
            if (restingSetIndex !== null) {
              updateSet(restingSetIndex, 'restTime', tracker.settings.defaultRestSeconds);
              setRestingSetIndex(null);
            }
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            if (tracker.settings.soundEnabled) playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [isResting, restingSetIndex]);

  const cycleUnit = () => {
    const units = ['kg', 'lbs', 'balata'];
    const next = units[(units.indexOf(activeUnit) + 1) % units.length];
    setActiveUnit(next);
    const updated = sets.map(s => ({ ...s, unit: next }));
    setSets(updated);
    onChange && onChange(updated, true);
    // Removed global setting update to allow per-exercise persistence
  };

  const updateSet = (idx: number, field: string, val: any) => {
    const updated = [...sets];
    updated[idx] = { ...updated[idx], [field]: val };
    setSets(updated);
    onChange && onChange(updated, true);
  };

  const startRest = (idx?: number) => {
    if (isResting && restingSetIndex === idx) {
      const elapsed2 = tracker.settings.defaultRestSeconds - restSeconds;
      if (elapsed2 > 0 && idx !== undefined) updateSet(idx, 'restTime', elapsed2);
      setIsResting(false); setRestingSetIndex(null);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      return;
    }
    if (tracker.settings.soundEnabled) playStart();
    setRestSeconds(tracker.settings.defaultRestSeconds);
    setIsResting(true);
    if (idx !== undefined) setRestingSetIndex(idx);
  };


  const handleDone = () => {
    if (saving) return;
    const valid = sets.filter(s => Number(s.reps) > 0).map(s => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, unit: s.unit || activeUnit, restTime: s.restTime }));
    if (valid.length === 0) { onClose(); return; }
    setSaving(true);
    onDone(valid);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return [h > 0 ? h.toString().padStart(2, '0') : null, m.toString().padStart(2, '0'), s.toString().padStart(2, '0')].filter(Boolean).join(':');
  };

  const wrapStyle: React.CSSProperties = fullPage
    ? { display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden', background: 'var(--primary-bg)', padding: 0, touchAction: 'none', boxSizing: 'border-box' }
    : inline
      ? { padding: '16px 0', marginBottom: 12, background: 'transparent', border: 'none', animation: 'slideDown 0.3s ease' }
      : { padding: 24, marginBottom: 20, background: 'var(--glass-bg)', border: 'none', borderRadius: 28 };

  return (
    <div ref={cardRef} className={fullPage ? '' : inline ? 'antigravity-card' : 'glass-card antigravity-card'} style={wrapStyle}>
      {/* Header */}
      <div style={{ flexShrink: 0, transformStyle: 'preserve-3d' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          padding: '16px 20px 4px' 
        }}>
          {/* Row 1: Full-Width Left-Aligned Exercise Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: 4, width: '100%' }}>
            <div style={{ 
              width: '28px', height: '28px', 
              backgroundColor: 'var(--accent-color)', 
              maskImage: "url('/assets/exercise-title-arrow.png')", 
              WebkitMaskImage: "url('/assets/exercise-title-arrow.png')", 
              maskSize: 'contain', WebkitMaskSize: 'contain', 
              maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', 
              maskPosition: 'center', WebkitMaskPosition: 'center',
              flexShrink: 0
            }} />
            <h2 ref={titleRef} className="heading-font" style={{ margin: 0, fontSize: 'clamp(20px, 6vw, 30px)', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
              {exerciseName}
            </h2>
          </div>

          {/* Row 2: Centered Controls Container */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, background: 'transparent', border: '1.5px dashed rgba(var(--theme-rgb), 0.2)', borderRadius: 10, padding: '6px 10px', backdropFilter: 'blur(10px)' }}>
              {elapsedSeconds !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', minWidth: 75, justifyContent: 'center', flexShrink: 0 }}>
                  <img src="/assets/clock-custom.png" alt="timer" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsedSeconds)}</span>
                </div>
              )}
              <button onClick={onClose} onPointerDown={e => e.stopPropagation()} style={{ background: 'none', border: 'none', padding: 0, width: 40, height: 40, borderRadius: '50%', color: '#ff3366', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/assets/close-custom.png" alt="Close" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
              </button>
            </div>
          </div>
        </div>

        {/* PR bar */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 20px 12px' }}>
          {(() => {
            const lastSession = tracker.getLastSession(exerciseName);
            if (!lastSession || !lastSession.sets || lastSession.sets.length === 0) return null;
            
            const sets = lastSession.sets;
            const maxWeight = Math.max(...sets.map(s => Number(s.weight) || 0));
            const maxWeightSets = sets.filter(s => (Number(s.weight) || 0) === maxWeight);
            const setsAtMaxWeight = maxWeightSets.length;
            const maxRepsAtMaxWeight = Math.max(...maxWeightSets.map(s => Number(s.reps) || 0));
            const bestSet = maxWeightSets[0];
            const displayUnit = bestSet.unit || weightUnit;

            return (
              <div style={{ 
                background: 'transparent', 
                borderRadius: 12, 
                padding: '4px 0', 
                color: 'var(--text-primary)', 
                fontSize: 13, 
                fontWeight: 800, 
                fontFamily: "'Montserrat', sans-serif", 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                whiteSpace: 'nowrap',
                border: 'none',
              }}>
                <span style={{ color: 'var(--accent-color)', fontSize: 10, fontWeight: 900, letterSpacing: 1.5, opacity: 0.9 }}>LAST:</span>
                <span style={{ fontWeight: 900, fontSize: 15 }}>{setsAtMaxWeight} <span style={{ fontSize: 10, opacity: 0.8 }}>SETS</span></span>
                <span style={{ opacity: 0.4, fontSize: 10 }}>×</span>
                <span style={{ fontWeight: 900, fontSize: 15 }}>{maxRepsAtMaxWeight} <span style={{ fontSize: 10, opacity: 0.8 }}>REPS</span></span>
                <div style={{ width: '1px', height: 12, background: 'rgba(var(--theme-rgb), 0.15)', margin: '0 6px' }} />
                <span style={{ fontWeight: 950, fontSize: 17, color: 'var(--accent-color)' }}>{maxWeight}</span>
                <span style={{ fontSize: 11, opacity: 0.7, color: 'var(--accent-color)', fontWeight: 900 }}>{t(displayUnit)}</span>
                <img src="/assets/trophy-custom.png" style={{ width: 18, height: 18, marginLeft: 6, objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }} alt="Trophy" />
              </div>
            );
          })()}
        </div>
      </div>

      {/* Sets list */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 16px', WebkitOverflowScrolling: 'touch', minHeight: 0, maxHeight: 'calc(100dvh - 240px)', transformStyle: 'preserve-3d', touchAction: 'pan-y' }}>
        <div ref={setsRef} style={{ display: 'flex', flexDirection: 'column', gap: 0, transformStyle: 'preserve-3d' }}>
          {sets.map((s, i) => (
            <SetRow key={i} index={i} weight={s.weight} reps={s.reps} restTime={s.restTime} activeUnit={activeUnit} isResting={restingSetIndex === i} canRemove={sets.length > 1} t={t} onUpdate={(field: string, val: any) => updateSet(i, field, val)} onCycleUnit={cycleUnit} onStartRest={() => startRest(i)} onRemove={() => { const updated = sets.filter((_, j) => j !== i); setSets(updated); onChange && onChange(updated, true); }} isCardio={muscleGroup === 'cardio'} lang={lang} />
          ))}
        </div>
        <button onClick={() => { const updated = [...sets, { weight: '', reps: '', unit: activeUnit }]; setSets(updated); onChange && onChange(updated, true); }} style={{ width: '100%', padding: 14, background: 'transparent', border: '2px dashed rgba(var(--theme-rgb), 0.45)', borderRadius: 16, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginTop: 12, fontFamily: "'Montserrat', sans-serif" }}>
          <CustomPlus size={16} color="var(--accent-color)" /> {t('addSet')}
        </button>
        {sets.length <= 1 && (
          <div style={{ padding: '20px 0', opacity: 0.65, pointerEvents: 'none', userSelect: 'none', textAlign: 'center', marginTop: 30 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1.4, fontFamily: "'Montserrat', sans-serif" }}>
              STAY FOCUSED<br />{tracker.settings.userName.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, marginTop: 'auto', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%', background: 'var(--primary-bg)', borderTop: 'none', transformStyle: 'preserve-3d' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 0 0 0' }}>
          <img
            src="/assets/button-done-rect.png"
            alt="Save Sets"
            onClick={() => !saving && isDirtyRef && !sets.every(s => !Number(s.reps)) && handleDone()}
            style={{
              height: '55px',
              width: 'auto',
              objectFit: 'contain',
              cursor: saving || !isDirtyRef || sets.every(s => !Number(s.reps)) ? 'default' : 'pointer',
              opacity: saving || !isDirtyRef || sets.every(s => !Number(s.reps)) ? 0.35 : 1,
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: saving || !isDirtyRef || sets.every(s => !Number(s.reps)) ? 'none' : 'auto',
            }}
            onMouseDown={e => { if (!saving && isDirtyRef) e.currentTarget.style.transform = 'scale(0.94)'; }}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => { if (!saving && isDirtyRef) e.currentTarget.style.transform = 'scale(0.94)'; }}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        </div>
        
        <style>{`
          @keyframes text-shimmer {
            to { background-position: 200% center; }
          }
        `}</style>
      </div>
    </div>
  );
});

export default ExerciseCard;
export { ExerciseCard };
