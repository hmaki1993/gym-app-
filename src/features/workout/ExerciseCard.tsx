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
  onDone: (sets: SetLog[]) => void;
  onClose: () => void;
  inline?: boolean;
  fullPage?: boolean;
  elapsedSeconds?: number;
}

export function ExerciseCard({ exerciseName, tracker, initialSets, onDone, onClose, inline, fullPage, elapsedSeconds }: Props) {
  const lang = tracker.settings.language;
  const t = (k: string) => (translations[lang] as any)[k] ?? k;
  const unit = tracker.settings.weightUnit;

  const last = tracker.getLastSession(exerciseName);
  const pr = tracker.getExercisePR(exerciseName);

  const [sets, setSets] = useState<{ weight: string | number; reps: string | number; restTime?: number }[]>(() => {
    if (initialSets && initialSets.length > 0) return initialSets.map(s => ({ ...s }));
    return [{ weight: '', reps: '' }];
  });

  const [hasAddedSet, setHasAddedSet] = useState(false);
  const [activeUnit, setActiveUnit] = useState(unit || 'kg');

  const cycleUnit = () => {
    const units = ['kg', 'lbs', 'balata'] as const;
    const currentIndex = units.indexOf(activeUnit as any);
    const nextIndex = (currentIndex + 1) % units.length;
    setActiveUnit(units[nextIndex]);
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
  useEffect(() => {
    if (setsRef.current) {
      gsap.fromTo(setsRef.current.children,
        { opacity: 0, x: -10, translateZ: -20 },
        { opacity: 1, x: 0, translateZ: 0, stagger: 0.05, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

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
    setSets(prev => {
      const newSets = [...prev];
      newSets[index] = { ...newSets[index], [field]: value };
      return newSets;
    });
  };

  const handleDone = () => {
    const validSets = sets.filter(s => Number(s.reps) > 0).map(s => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, restTime: s.restTime }));
    if (validSets.length === 0) { onClose(); return; }
    onDone(validSets);
  };

  const totalVolume = sets.reduce((s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);

  return (
    <div
      ref={cardRef}
      className={(inline || fullPage) ? "antigravity-card" : "glass-card antigravity-card"}
      style={fullPage ? {
        display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%',
        overflow: 'hidden', background: 'var(--primary-bg)', padding: 0, touchAction: 'pan-y', boxSizing: 'border-box', transformStyle: 'preserve-3d'
      } : (inline ? {
        padding: '16px 0', marginBottom: '12px', background: 'transparent',
        borderBottom: '1.5px solid var(--glass-border)', animation: 'slideDown 0.3s ease', transformStyle: 'preserve-3d'
      } : {
        padding: '24px', marginBottom: '20px', background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)', borderRadius: '28px', transformStyle: 'preserve-3d'
      })}>

      <div style={{ flexShrink: 0, transformStyle: 'preserve-3d' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', transform: 'translateZ(20px)' }}>
              <h2 className="heading-font" style={{ 
                margin: 0, 
                fontSize: '22px', 
                fontWeight: '950',
                background: 'linear-gradient(to bottom, var(--text-primary) 30%, var(--accent-color) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px',
                textTransform: 'uppercase',
                lineHeight: '1',
                textShadow: '0 5px 15px rgba(0,0,0,0.3)'
              }}>{exerciseName}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                {pr && <div className="pr-badge" style={{ color: 'var(--accent-color)', fontSize: '12px', fontWeight: '900', fontFamily: 'Syne, sans-serif' }}>🏆 PR: {pr.weight}{t(unit)} × {pr.reps}</div>}
                {elapsedSeconds !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                    <Clock size={12} color="var(--accent-color)" strokeWidth={2.5} />
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{formatElapsed(elapsedSeconds)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            onPointerDown={(e) => e.stopPropagation()} 
            className="close-btn-premium" 
            style={{ 
              background: 'rgba(255, 51, 102, 0.08)', 
              border: '1px solid rgba(255, 51, 102, 0.15)', 
              padding: '0', 
              width: '36px', 
              height: '36px', 
              borderRadius: '12px', 
              color: '#ff3366', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
              flexShrink: 0, 
              zIndex: 100, 
              position: 'relative', 
              pointerEvents: 'auto', 
              transform: 'translateZ(10px)',
              boxShadow: '0 0 15px rgba(255, 51, 102, 0.1)'
            }}
          >
            <X size={22} strokeWidth={3} />
          </button>
        </div>

        {last && (
          <div style={{ margin: '0 20px 12px', padding: '12px 16px', background: 'var(--glass-bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--glass-border)', transform: 'translateZ(10px)' }}>
            <div>
              <div className="section-label" style={{ marginBottom: '4px', color: 'var(--text-secondary)', opacity: 0.4, fontSize: '10px', fontFamily: 'Syne, sans-serif' }}>{t('lastSession').toUpperCase()}</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                {last.sets.map((s, i) => <span key={i}>{i > 0 ? ' · ' : ''}{s.weight}{t(unit)}×{s.reps}</span>)}
              </div>
            </div>
            {Math.max(...sets.map(s => Number(s.weight) || 0)) > Math.max(...last.sets.map(s => s.weight)) && <div style={{ fontSize: '22px' }}>🔥</div>}
          </div>
        )}
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
              onRemove={() => setSets(prev => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>

        <button onClick={() => { setHasAddedSet(true); setSets(prev => [...prev, { weight: '', reps: '' }]); }} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px dashed var(--glass-border)', borderRadius: '16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px', fontFamily: 'Outfit, sans-serif' }}>
          <Plus size={16} color="var(--accent-color)" /> {t('addSet')}
        </button>

        {!hasAddedSet && (
          <div style={{ padding: '20px 0', opacity: 0.15, pointerEvents: 'none', userSelect: 'none', textAlign: 'center', marginTop: '30px' }}>
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

      <div style={{ flexShrink: 0, marginTop: 'auto', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', background: 'var(--primary-bg)', borderTop: '1px solid var(--glass-border)', transformStyle: 'preserve-3d' }}>
        
        {/* Rest Timer Removed */}

        <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', fontFamily: 'Outfit, sans-serif' }}>{t('totalVolume')}</div>
            <div style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>{totalVolume.toFixed(0)}<span style={{ fontSize: '12px', marginLeft: '3px', color: 'var(--accent-color)', opacity: 0.7 }}>{unit}</span></div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', fontFamily: 'Outfit, sans-serif' }}>Max Today</div>
            <div style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>{Math.max(...sets.map(s => Number(s.weight) || 0), 0)}<span style={{ fontSize: '12px', marginLeft: '3px', color: 'var(--accent-color)', opacity: 0.7 }}>{unit}</span></div>
          </div>
        </div>

        <button onClick={handleDone} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', fontSize: '16px', fontWeight: '800', padding: '4px 8px', width: 'fit-content', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '12px', outline: 'none', animation: 'pulse-glow 2.5s ease-in-out infinite', fontFamily: 'Syne, sans-serif', transform: 'translateZ(15px)', touchAction: 'manipulation' }}>
          {t('done')}
        </button>
      </div>
    </div>
  );
}
