import React, { useState, useEffect, useRef, memo } from 'react';
import { X, Clock, Plus, Trash2 } from 'lucide-react';
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

// SetRow component (Ka from bundle)
const SetRow = ({ index, weight, reps, activeUnit, canRemove, t, onUpdate, onCycleUnit, onRemove, isCardio, lang }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1.5px solid rgba(var(--theme-rgb), 0.1)', gap: 8, transformStyle: 'preserve-3d' }}>
    <div style={{ width: 24, fontSize: 14, fontWeight: 900, color: 'var(--accent-color)', opacity: 0.8, fontFamily: 'Outfit, sans-serif' }}>{index + 1}</div>
    <div style={{ width: '1.5px', height: 20, background: 'rgba(var(--theme-rgb), 0.15)', marginRight: 12 }} />
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <input type="number" inputMode="decimal" value={weight} onChange={e => onUpdate('weight', e.target.value)} style={{ background: 'rgba(var(--theme-rgb), 0.05)', border: '1.5px solid rgba(var(--theme-rgb), 0.2)', outline: 'none', color: 'var(--text-primary)', fontSize: 24, fontWeight: 900, textAlign: 'center', width: 65, padding: '8px 0', borderRadius: 12, fontFamily: 'Outfit, sans-serif', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)' }} />
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
          fontFamily: 'Outfit, sans-serif', 
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
        <span style={{
          background: 'linear-gradient(90deg, var(--accent-color) 0%, #fff 50%, var(--accent-color) 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'text-shimmer 3s linear infinite'
        }}>
          {isCardio ? (lang === 'ar' ? 'مستوى' : 'LEVEL') : t(activeUnit)}
        </span>
      </div>
    </div>
    <div style={{ width: '1.5px', height: 24, background: 'rgba(var(--theme-rgb), 0.15)' }} />
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <input type="number" inputMode="numeric" value={reps} onChange={e => onUpdate('reps', e.target.value)} style={{ background: 'rgba(var(--theme-rgb), 0.05)', border: '1.5px solid rgba(var(--theme-rgb), 0.2)', outline: 'none', color: 'var(--text-primary)', fontSize: 24, fontWeight: 900, textAlign: 'center', width: 65, padding: '8px 0', borderRadius: 12, fontFamily: 'Outfit, sans-serif', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)' }} />
      <div style={{ 
        fontSize: 10, 
        fontWeight: 950, 
        color: 'var(--text-secondary)', 
        textTransform: 'uppercase', 
        opacity: 0.9, 
        letterSpacing: '1px', 
        fontFamily: 'Outfit, sans-serif',
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

  const totalVolume = sets.reduce((sum, s) => {
    const convertedWeight = tracker.convertWeight(Number(s.weight) || 0, s.unit || activeUnit, activeUnit);
    return sum + convertedWeight * (Number(s.reps) || 0);
  }, 0);
  const maxWeight = Math.max(...sets.map(s => tracker.convertWeight(Number(s.weight) || 0, s.unit || activeUnit, activeUnit)), 0);

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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px 4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingLeft: 4 }}>
            <h2 ref={titleRef} className="heading-font" style={{ margin: 0, fontSize: 'clamp(18px, 5.5vw, 28px)', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1.1, paddingRight: 10 }}>
              {exerciseName.split(' ').map((word, i) => (
                <span key={i} className="title-word" style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.3em' }}>{word}</span>
              ))}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, background: 'rgba(var(--theme-rgb), 0.05)', border: '1px dashed rgba(var(--theme-rgb), 0.2)', borderRadius: 10, padding: '6px 10px', backdropFilter: 'blur(10px)', marginTop: -4 }}>
            {elapsedSeconds !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', minWidth: 75, justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={14} color="var(--accent-color)" strokeWidth={2.5} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsedSeconds)}</span>
              </div>
            )}
            <button onClick={onClose} onPointerDown={e => e.stopPropagation()} style={{ background: 'none', border: 'none', padding: 0, width: 32, height: 32, borderRadius: '50%', color: '#ff3366', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* PR bar */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 20px 12px' }}>
          {(() => {
            const lastSession = tracker.getLastSession(exerciseName);
            if (!lastSession) return null;
            const bestSet = lastSession.bestSet;
            return (
              <div style={{ 
                background: 'transparent', 
                borderRadius: 12, 
                padding: '8px 16px', 
                color: 'var(--text-primary)', 
                fontSize: 13, 
                fontWeight: 800, 
                fontFamily: 'Outfit, sans-serif', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                whiteSpace: 'nowrap',
                border: '1.5px dashed rgba(255, 255, 255, 0.35)',
              }}>
                <span style={{ color: 'var(--accent-color)', fontSize: 10, fontWeight: 900, letterSpacing: 1.5, opacity: 0.9 }}>LAST:</span>
                <span style={{ fontWeight: 900, fontSize: 15 }}>{lastSession.sets.length} <span style={{ fontSize: 10, opacity: 0.8 }}>SETS</span></span>
                <span style={{ opacity: 0.4, fontSize: 10 }}>×</span>
                <span style={{ fontWeight: 900, fontSize: 15 }}>{bestSet.reps} <span style={{ fontSize: 10, opacity: 0.8 }}>REPS</span></span>
                <div style={{ width: '1px', height: 12, background: 'rgba(255, 255, 255, 0.15)', margin: '0 6px' }} />
                <span style={{ fontWeight: 950, fontSize: 17, color: 'var(--accent-color)' }}>{bestSet.weight}</span>
                <span style={{ fontSize: 11, opacity: 0.7, color: 'var(--accent-color)', fontWeight: 900 }}>{t(bestSet.unit || weightUnit)}</span>
                <span style={{ fontSize: 16, marginLeft: 6, filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.3))' }}>🏆</span>
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
        <button onClick={() => { const updated = [...sets, { weight: '', reps: '', unit: activeUnit }]; setSets(updated); onChange && onChange(updated, true); }} style={{ width: '100%', padding: 14, background: 'transparent', border: '2px dashed rgba(var(--theme-rgb), 0.45)', borderRadius: 16, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginTop: 12, fontFamily: 'Outfit, sans-serif' }}>
          <Plus size={16} color="var(--accent-color)" /> {t('addSet')}
        </button>
        {sets.length <= 1 && (
          <div style={{ padding: '20px 0', opacity: 0.65, pointerEvents: 'none', userSelect: 'none', textAlign: 'center', marginTop: 30 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1.4, fontFamily: 'Outfit, sans-serif' }}>
              STAY FOCUSED<br />{tracker.settings.userName.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, marginTop: 'auto', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%', background: 'var(--primary-bg)', borderTop: '2px solid rgba(var(--theme-rgb), 0.25)', transformStyle: 'preserve-3d' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: 40, padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.85, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2, fontFamily: 'Outfit, sans-serif' }}>{t('totalVolume')}</div>
            <div style={{ fontSize: 22, color: 'var(--text-primary)', fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>{totalVolume.toFixed(0)} <span style={{ fontSize: 12, marginLeft: 3, color: 'var(--accent-color)', opacity: 0.7 }}>{t(weightUnit)}</span></div>
          </div>
          <div style={{ width: '1.5px', height: 24, background: 'rgba(var(--theme-rgb), 0.15)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.85, fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2, fontFamily: 'Outfit, sans-serif' }}>Max Today</div>
            <div style={{ fontSize: 22, color: 'var(--text-primary)', fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>{maxWeight} <span style={{ fontSize: 12, marginLeft: 3, color: 'var(--accent-color)', opacity: 0.7 }}>{t(weightUnit)}</span></div>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px 0' }}>
          <button 
            onClick={handleDone} 
            disabled={saving || !isDirtyRef || sets.every(s => !Number(s.reps))} 
            style={{ 
              background: 'none', 
              border: '2px solid var(--accent-color)', 
              color: 'var(--accent-color)', 
              fontSize: 14, 
              fontWeight: 950, 
              padding: '16px 50px', 
              width: 'fit-content', 
              cursor: saving || !isDirtyRef || sets.every(s => !Number(s.reps)) ? 'default' : 'pointer', 
              pointerEvents: saving || !isDirtyRef || sets.every(s => !Number(s.reps)) ? 'none' : 'auto', 
              textTransform: 'uppercase', 
              letterSpacing: '4px', 
              outline: 'none', 
              opacity: saving || !isDirtyRef || sets.every(s => !Number(s.reps)) ? 0.3 : 1, 
              fontFamily: 'Syne, sans-serif', 
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              clipPath: 'polygon(0% 15%, 5% 0%, 95% 0%, 100% 15%, 100% 85%, 95% 100%, 5% 100%, 0% 85%, 0% 50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 25px var(--accent-color-alpha), inset 0 0 10px var(--accent-color-alpha)',
              textShadow: '0 0 10px var(--accent-color)'
            }}
            onMouseDown={e => {
              e.currentTarget.style.transform = 'scale(0.94)';
              e.currentTarget.style.background = 'var(--accent-color)';
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.boxShadow = '0 0 50px var(--accent-color)';
            }}
            onMouseUp={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--accent-color)';
              e.currentTarget.style.boxShadow = '0 0 25px var(--accent-color-alpha), inset 0 0 10px var(--accent-color-alpha)';
            }}
          >
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              position: 'relative'
            }}>
              {saving ? (lang === 'ar' ? 'جاري...' : 'SAVING...') : (
                <>
                  <span style={{ 
                    letterSpacing: '3px',
                    background: 'linear-gradient(90deg, var(--accent-color) 20%, #fff 50%, var(--accent-color) 80%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'text-shimmer 2s linear infinite',
                    fontWeight: 900,
                    fontSize: 16
                  }}>S E T   S A</span>
                  
                  <div style={{ display: 'inline-flex', transform: 'translateY(-1px)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--accent-color)" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px var(--accent-color))' }}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                  
                  <span style={{ 
                    letterSpacing: '3px',
                    background: 'linear-gradient(90deg, var(--accent-color) 20%, #fff 50%, var(--accent-color) 80%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'text-shimmer 2s linear infinite',
                    fontWeight: 900,
                    fontSize: 16
                  }}>E D</span>
                </>
              )}
            </span>
          </button>
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
