import React, { useState, useEffect, useRef } from 'react';
import { useGymTracker, playSetDoneSound, playRestDoneSound } from '../hooks/useGymTracker';
import type { SetLog } from '../types';
import { translations } from '../translations';
import { X, Minus, Plus, ChevronDown, Clock, Trash2 } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  exerciseName: string;
  muscleGroup: string;
  tracker: ReturnType<typeof useGymTracker>;
  initialSets?: SetLog[];
  onDone: (sets: SetLog[]) => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  inline?: boolean;
  fullPage?: boolean;
  elapsedSeconds?: number;
}

export function ExerciseCard({ exerciseName, tracker, initialSets, onDone, onClose, onNext, onPrev, inline, fullPage, elapsedSeconds }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
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
    const units = ['kg', 'lbs', 'balata'];
    const currentIndex = units.indexOf(activeUnit.toLowerCase());
    const nextIndex = (currentIndex + 1) % units.length;
    setActiveUnit(units[nextIndex]);
  };
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [restActive, setRestActive] = useState(false);
  const [restDuration, setRestDuration] = useState(tracker.settings.defaultRestSeconds);
  const [restRemaining, setRestRemaining] = useState(tracker.settings.defaultRestSeconds);
  const [restingSetIndex, setRestingSetIndex] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (cardRef.current && !fullPage) {
      gsap.fromTo(cardRef.current, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
    }
  }, [fullPage]);

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
      // Record actual time spent before stopping
      const timeSpent = restDuration - restRemaining;
      if (timeSpent > 0) {
        updateSet(restingSetIndex, 'restTime', timeSpent);
      }
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

  const addSet = () => {
    setHasAddedSet(true);
    setSets(prev => [...prev, { weight: '', reps: '' }]);
  };

  const updateSet = (index: number, field: 'weight' | 'reps' | 'restTime', value: string | number) => {
    setSets(prev => {
      const newSets = [...prev];
      newSets[index] = { ...newSets[index], [field]: value };
      return newSets;
    });
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDone = () => {
    const validSets = sets.filter(s => s.reps > 0).map(s => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, restTime: s.restTime }));
    if (validSets.length === 0) { onClose(); return; }
    onDone(validSets);
  };

  const getComparison = () => {
    if (!last || last.sets.length === 0) return null;
    const lastMax = Math.max(...last.sets.map(s => s.weight));
    const currMax = Math.max(...sets.map(s => Number(s.weight) || 0));
    if (currMax > lastMax) return 'improved';
    if (currMax === lastMax) return 'same';
    return 'decreased';
  };

  const comparison = getComparison();
  const totalVolume = sets.reduce((s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);

  return (
    <div
      ref={cardRef}
      className={(inline || fullPage) ? "" : "glass-card"}
      style={fullPage ? {
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100%',
        overflow: 'hidden',
        background: '#000',
        padding: 0,
        touchAction: 'pan-y',
        boxSizing: 'border-box'
      } : (inline ? {
        padding: '16px 0',
        marginBottom: '12px',
        background: 'transparent',
        borderBottom: '1.5px solid var(--accent-color-alpha-heavy)',
        animation: 'slideDown 0.3s ease'
      } : {
        padding: '24px',
        marginBottom: '20px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '28px'
      })}>

      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className="premium-title" style={{ margin: 0, fontSize: '28px' }}>
                {exerciseName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                {pr && (
                  <div className="pr-badge" style={{ color: 'var(--accent-color)', fontSize: '12px', fontWeight: '700', fontFamily: 'Kanit, sans-serif' }}>
                    🏆 PR: {pr.weight}{unit} × {pr.reps}
                  </div>
                )}
                
                {/* Live Session Timer inside Exercise Card */}
                {elapsedSeconds !== undefined && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    opacity: 0.8,
                    animation: 'pulse-glow 2s infinite ease-in-out'
                  }}>
                    <Clock size={12} color="var(--accent-color)" strokeWidth={2.5} />
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', fontFamily: 'Kanit, sans-serif' }}>
                      {formatElapsed(elapsedSeconds)}
                    </span>
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
              background: 'rgba(255, 51, 102, 0.15)', 
              border: 'none', 
              padding: '0',
              width: '32px', 
              height: '32px', 
              borderRadius: '10px', 
              color: '#ff3366',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
              flexShrink: 0,
              zIndex: 100,
              position: 'relative',
              pointerEvents: 'auto'
            }}
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <style>{`
          .close-btn-premium:active {
            transform: scale(0.9);
            background: rgba(255, 51, 102, 0.25) !important;
          }
        `}</style>

        {last && (
          <div style={{
            margin: '0 20px 12px',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div>
              <div className="section-label" style={{ marginBottom: '4px', color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{t('lastSession').toUpperCase()}</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {last.sets.map((s, i) => <span key={i}>{i > 0 ? ' · ' : ''}{s.weight}{unit}×{s.reps}</span>)}
              </div>
            </div>
            {comparison && (
              <div style={{ fontSize: '22px', filter: comparison === 'improved' ? 'drop-shadow(0 0 8px var(--accent-color))' : 'none' }}>
                {comparison === 'improved' ? '🔥' : comparison === 'same' ? '↔️' : '📉'}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0 20px 16px',
        WebkitOverflowScrolling: 'touch',
        minHeight: 0,
        maxHeight: 'calc(100dvh - 240px)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {sets.map((set, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              gap: '8px'
            }}>
              <div style={{ width: '24px', fontSize: '14px', fontWeight: '900', color: 'var(--accent-color)', opacity: 0.8 }}>
                {i + 1}
              </div>
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', marginRight: '12px' }} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <input
                  type="number"
                  inputMode="decimal"
                  value={set.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '24px',
                    fontWeight: '900',
                    textAlign: 'center',
                    width: '65px',
                    padding: '4px 0',
                    borderRadius: '4px'
                  }}
                />
                <div
                  onClick={cycleUnit}
                  style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    opacity: 0.9,
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}
                >
                  {activeUnit}
                </div>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '24px',
                    fontWeight: '900',
                    textAlign: 'center',
                    width: '65px',
                    padding: '4px 0',
                    borderRadius: '4px'
                  }}
                />
                <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.5px' }}>{t('reps')}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {set.restTime ? (
                  <div style={{ fontSize: '10px', color: 'var(--accent-color)', fontWeight: '900', background: 'rgba(0,229,160,0.1)', padding: '2px 4px', borderRadius: '4px' }}>
                    {set.restTime}s
                  </div>
                ) : (
                  <button
                    onClick={() => startRest(i)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: restingSetIndex === i ? 'var(--accent-color)' : 'rgba(255,255,255,0.2)', padding: '4px' }}
                  >
                    <Clock size={16} />
                  </button>
                )}

                {sets.length > 1 && (
                  <button onClick={() => removeSet(i)} style={{ background: 'transparent', border: 'none', width: '28px', height: '28px', cursor: 'pointer', color: 'rgba(255,51,102,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 0 }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addSet} style={{
          width: '100%', padding: '14px', background: 'transparent',
          border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px',
          color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          cursor: 'pointer', marginTop: '12px'
        }}>
          <Plus size={16} color="var(--accent-color)" /> {t('addSet')}
        </button>

        {!hasAddedSet && (
          <div style={{ padding: '20px 0', opacity: 0.12, pointerEvents: 'none', userSelect: 'none', textAlign: 'center', marginTop: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '6px', textTransform: 'uppercase', lineHeight: '1.2' }}>
              STAY FOCUSED{'\n'}{tracker.settings.userName.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* ── ZONE 3: FIXED FOOTER ── */}
      <div style={{
        flexShrink: 0,
        marginTop: 'auto',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingTop: '12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        width: '100%',
        background: '#000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              const newDur = Math.max(5, restDuration - 5);
              setRestDuration(newDur);
              if (!restActive) setRestRemaining(newDur);
            }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: '800' }}
          >
            -
          </button>

          <button onClick={() => startRest()} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '800',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            cursor: 'pointer', padding: '6px 16px', borderRadius: '100px',
            letterSpacing: '0.3px', transition: 'all 0.2s', minWidth: '80px'
          }}>
            <Clock size={14} color="var(--accent-color)" /> {restDuration}s
          </button>

          <button
            onClick={() => {
              const newDur = restDuration + 5;
              setRestDuration(newDur);
              if (!restActive) setRestRemaining(newDur);
            }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: '800' }}
          >
            +
          </button>
        </div>

        {restActive && (
          <div style={{ width: '100%', background: 'rgba(0,229,160,0.04)', padding: '10px 12px', borderRadius: '14px', border: '1px solid rgba(0,229,160,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)' }}>
                <Clock size={15} strokeWidth={2.5} />
                <span style={{ fontSize: '14px', fontWeight: '900' }}>{restRemaining}s</span>
              </div>
              <button onClick={() => { setRestActive(false); if (intervalRef.current) clearInterval(intervalRef.current); }}
                style={{ background: 'none', border: 'none', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase' }}>
                {t('skip')}
              </button>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(restRemaining / restDuration) * 100}%`, background: 'var(--accent-color)', transition: 'width 1s linear' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '4px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>{t('totalVolume')}</div>
            <div style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '900' }}>
              {totalVolume.toFixed(0)}<span style={{ fontSize: '11px', marginLeft: '3px', color: 'var(--accent-color)', opacity: 0.7 }}>{unit}</span>
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Max Today</div>
            <div style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '900' }}>
              {Math.max(...sets.map(s => Number(s.weight) || 0), 0)}<span style={{ fontSize: '11px', marginLeft: '3px', color: 'var(--accent-color)', opacity: 0.7 }}>{unit}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDone}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--accent-color)', fontSize: '16px', fontWeight: '900',
            padding: '4px 8px', width: 'fit-content', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '12px', outline: 'none',
            animation: 'pulse-glow 2.5s ease-in-out infinite'
          }}
        >
          {t('done')}
        </button>
      </div>


    </div>
  );
}
