import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, Plus, X, GripVertical, RotateCcw, Trash2, Pen } from 'lucide-react';
import gsap from 'gsap';
import { useGymTracker } from '../../../hooks/useGymTracker';
import { DEFAULT_EXERCISES } from '../../../data/exercises';
import type { MuscleGroup } from '../../../types';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  muscleGroup: string;
  activeExercises: string[];
  onToggle: (name: string) => void;
  tracker: ReturnType<typeof useGymTracker>;
  t: (key: string) => string;
}

const ExercisePicker: React.FC<Props> = ({ search, onSearchChange, muscleGroup, activeExercises, onToggle, tracker, t }) => {
  const lang = tracker.settings.language;
  const isRtl = lang === 'ar';
  const weightUnit = tracker.settings.weightUnit;
  const customTranslations = (tracker.state as any).customTranslations || {};

  const [showSearch, setShowSearch] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [renamingExercise, setRenamingExercise] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const deletedExercises = (tracker.state as any).deletedExercises?.[muscleGroup as MuscleGroup] || [];
  const hiddenExercises = tracker.hiddenExercises?.[muscleGroup as MuscleGroup] || [];
  const customExercises = tracker.customExercises[muscleGroup as MuscleGroup] || [];

  const b = DEFAULT_EXERCISES;
  const baseList = (b[muscleGroup as MuscleGroup] || []).filter((e: string) => !hiddenExercises.includes(e) && !deletedExercises.includes(e));
  const fullList = Array.from(new Set([...baseList, ...customExercises.filter((e: string) => !hiddenExercises.includes(e))]));
  
  // Search logic: should also find hidden default exercises
  const searchFullList = Array.from(new Set([...(b[muscleGroup as MuscleGroup] || []), ...customExercises]));
  
  const exerciseOrder = tracker.exerciseOrder?.[muscleGroup as MuscleGroup];
  const filteredExercises = [...fullList]
    .sort((a, z) => {
      const ai = exerciseOrder?.indexOf(a) ?? -1, bi = exerciseOrder?.indexOf(z) ?? -1;
      if (ai === -1 && bi === -1) return 0; if (ai === -1) return 1; if (bi === -1) return -1;
      return ai - bi;
    })
    .filter(e => e.toLowerCase().includes(search.toLowerCase()));

  // Search results in the overlay should show EVERYTHING matching
  const searchFiltered = searchFullList
    .filter(e => e.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.length - b.length);

  // Archived exercises
  const archivedExercises = (() => {
    const exerciseMap: Record<string, string> = {};
    Object.entries(b).forEach(([mg, exs]) => (exs as string[]).forEach(ex => { exerciseMap[ex] = mg; }));
    Object.entries(tracker.customExercises).forEach(([mg, exs]) => exs.forEach(ex => { exerciseMap[ex] = mg; }));
    const archived = new Set<string>([...hiddenExercises]);
    tracker.logs.forEach(log => {
      log.exercises.forEach((ex: any) => {
        const mg = ex.muscleGroup || exerciseMap[ex.name] || log.muscleGroup;
        if (mg === muscleGroup) archived.add(ex.name);
      });
    });
    const visible = new Set([...baseList, ...customExercises.filter((e: string) => !hiddenExercises.includes(e))]);
    deletedExercises.forEach((e: string) => archived.delete(e));
    visible.forEach((e: string) => archived.delete(e));
    return Array.from(archived).sort();
  })();

  useEffect(() => {
    if (showSearch && overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power2.out' });
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [showSearch]);

  useEffect(() => {
    if (showSearch && searchResultsRef.current) {
      const items = searchResultsRef.current.querySelectorAll('.search-result-item');
      if (items.length > 0) gsap.fromTo(items, { y: 8, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.02, duration: 0.15, ease: 'power2.out' });
    }
  }, [search, showSearch]);

  const closeSearch = () => {
    if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in', onComplete: () => { setShowSearch(false); onSearchChange(''); } });
    else { setShowSearch(false); onSearchChange(''); }
  };

  const toggleWithAnim = (name: string, el: HTMLElement | null) => {
    if (el) {
      if (activeExercises.includes(name)) {
        gsap.timeline().to(el, { scale: 0.96, duration: 0.08 }).to(el, { scale: 1, duration: 0.15 });
      } else {
        gsap.timeline().to(el, { scale: 0.94, duration: 0.06 }).to(el, { scale: 1.04, duration: 0.12 }).to(el, { scale: 1, duration: 0.2, ease: 'elastic.out(1.2, 0.5)' });
      }
    }
    onToggle(name);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingIndex === null) return;
    const t2 = e.touches[0];
    const el = document.elementFromPoint(t2.clientX, t2.clientY)?.closest('[data-index]');
    if (el) {
      const idx = parseInt(el.getAttribute('data-index') || '-1');
      if (idx !== -1 && idx !== draggingIndex) {
        const arr = [...filteredExercises];
        const [item] = arr.splice(draggingIndex, 1);
        arr.splice(idx, 0, item);
        tracker.reorderExercises(muscleGroup as MuscleGroup, arr);
        setDraggingIndex(idx);
      }
    }
  };

  const renderExerciseItem = (name: string, idx: number, isRecent: boolean) => {
    const isActive = activeExercises.includes(name);
    const lastSession = tracker.getLastSession(name);
    const isDragging = draggingIndex === idx;

    return (
      <div key={name} data-index={idx} ref={el => { if (el) itemRefs.current.set(name, el); else itemRefs.current.delete(name); }} style={{ display: 'flex', flexDirection: 'column', zIndex: isDragging ? 100 : 1, opacity: isDragging ? 0.7 : 1, transition: isDragging ? 'none' : 'opacity 0.2s ease', boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.4)' : 'none' }}>
        <div onClick={() => toggleWithAnim(name, itemRefs.current.get(name) ?? null)} className="exercise-select-btn" role="button" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 12px 20px', background: isActive ? 'rgba(255, 61, 0, 0.06)' : 'transparent', border: 'none', borderBottom: `1px solid ${isActive ? 'rgba(255, 61, 0, 0.1)' : 'transparent'}`, borderLeft: isActive ? '3px solid #ff3d00' : '3px solid transparent', width: '100%', cursor: 'pointer', borderRadius: 0, transition: 'all 0.2s ease', touchAction: 'manipulation', outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
          <div onTouchStart={e => { e.stopPropagation(); setDraggingIndex(idx); }} style={{ touchAction: 'none', padding: 8, marginRight: isRtl ? 0 : 4, color: isDragging ? 'var(--accent-color)' : 'var(--text-secondary)', opacity: isDragging ? 1 : 0.3 }}>
            <GripVertical size={20} />
          </div>
          <div style={{ textAlign: isRtl ? 'right' : 'left', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {renamingExercise === name ? (
                <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} onBlur={() => { if (renameValue.trim() && renameValue !== name) tracker.renameExercise(muscleGroup as MuscleGroup, name, renameValue.trim()); setRenamingExercise(null); }} onKeyDown={e => { if (e.key === 'Enter') { if (renameValue.trim() && renameValue !== name) tracker.renameExercise(muscleGroup as MuscleGroup, name, renameValue.trim()); setRenamingExercise(null); } if (e.key === 'Escape') setRenamingExercise(null); }} onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--accent-color)', borderRadius: 4, color: '#fff', fontSize: 16, fontWeight: 800, padding: '2px 6px', width: '100%', outline: 'none', fontFamily: 'Outfit, sans-serif' }} />
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isActive ? 'var(--accent-color)' : 'var(--text-primary)', transition: 'color 0.3s ease', fontFamily: 'Outfit, sans-serif' }}>
                    {isRecent && <RotateCcw size={14} style={{ marginRight: 6, opacity: 0.5, verticalAlign: 'middle' }} />}{name}
                  </div>
                  {!customTranslations[name] && (
                    <button onClick={e => { e.stopPropagation(); setRenamingExercise(name); setRenameValue(name); }} style={{ background: 'transparent', border: 'none', padding: 4, color: 'var(--text-secondary)', opacity: 0.3, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Pen size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
            {(customTranslations[name]) && <div style={{ fontSize: 14, color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: 700, marginTop: 1, opacity: 0.6, fontFamily: 'Outfit, sans-serif' }}>{customTranslations[name]}</div>}
            {lastSession && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 800, opacity: 0.5, letterSpacing: '0.5px' }}>{t('lastSession').toUpperCase()}: {lastSession.bestSet?.weight} {t(lastSession.bestSet?.unit || weightUnit)} × {lastSession.bestSet?.reps}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 6px #ff3d00', flexShrink: 0 }} />}
            {isActive && (
              <button onClick={e => { e.stopPropagation(); tracker.hideDefaultExercise(muscleGroup as MuscleGroup, name); if (activeExercises.includes(name)) onToggle(name); }} style={{ padding: '4px 8px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 6, color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 900, opacity: 0.7 }}>
                <X size={11} strokeWidth={3} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Split into recent (logged) and others
  const exerciseMap: Record<string, string> = {};
  Object.entries(DEFAULT_EXERCISES).forEach(([mg, exs]) => (exs as string[]).forEach(ex => { exerciseMap[ex] = mg; }));
  Object.entries(tracker.customExercises).forEach(([mg, exs]) => exs.forEach(ex => { exerciseMap[ex] = mg; }));
  const recentNames: string[] = [], otherNames: string[] = [];
  filteredExercises.forEach(name => { tracker.getLastSession(name) ? recentNames.push(name) : otherNames.push(name); });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, userSelect: draggingIndex === null ? 'auto' : 'none' }}>
      {/* Search overlay portal */}
      {showSearch && ReactDOM.createPortal(
        <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
          <button onClick={closeSearch} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 20px)', right: 20, background: 'rgba(255,0,0,0.15)', border: '1.5px solid rgba(255,0,0,0.35)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ff4444', zIndex: 1 }}>
            <X size={18} strokeWidth={3} />
          </button>
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', color: '#ff5e00', marginBottom: 6 }}>POWER GRID</div>
              <div style={{ fontSize: 28, fontWeight: 950, color: '#fff', fontFamily: 'Outfit, sans-serif', letterSpacing: -1, lineHeight: 1 }}>Find Exercise</div>
              <div style={{ width: 40, height: 2, background: 'linear-gradient(to right, transparent, var(--accent-color), transparent)', margin: '10px auto 0', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderBottom: '2px solid var(--accent-color)', borderRadius: 20, padding: '16px 20px' }}>
              <Search size={22} color="var(--accent-color)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <input ref={searchInputRef} value={search} onChange={e => onSearchChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && search.trim() && filteredExercises.length === 0) { tracker.addCustomExercise(muscleGroup as MuscleGroup, search.trim()); closeSearch(); } if (e.key === 'Escape') closeSearch(); }} placeholder="" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Outfit, sans-serif' }} />
            </div>
            {search.trim() && filteredExercises.length === 0 && (
              <div onClick={() => { tracker.addCustomExercise(muscleGroup as MuscleGroup, search.trim()); closeSearch(); }} style={{ marginTop: 12, padding: '14px 18px', background: 'rgba(var(--accent-rgb, 50, 97, 68), 0.15)', border: '1px dashed var(--accent-color)', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Plus size={18} color="var(--accent-color)" strokeWidth={3} />
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-color)', fontFamily: 'Outfit, sans-serif' }}>Add "{search.trim()}" as custom exercise</span>
              </div>
            )}
          </div>
          <div ref={searchResultsRef} className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {searchFiltered.map(name => {
              const isActive = activeExercises.includes(name);
              const lastSession = tracker.getLastSession(name);
              return (
                <div key={name} className="search-result-item" onClick={() => { toggleWithAnim(name, null); if (!isActive) closeSearch(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: isActive ? 'rgba(255,61,0,0.1)' : 'rgba(255,255,255,0.04)', border: isActive ? '1px solid rgba(255,61,0,0.3)' : '1px solid rgba(255,255,255,0.06)', borderLeft: isActive ? '3px solid #ff3d00' : '3px solid transparent', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none', WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: isActive ? '#ff3d00' : '#fff', fontFamily: 'Outfit, sans-serif' }}>{name}</div>
                    {lastSession && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontWeight: 800, letterSpacing: '0.5px' }}>{t('lastSession').toUpperCase()}: {lastSession.bestSet?.weight} {t(lastSession.bestSet?.unit || weightUnit)} × {lastSession.bestSet?.reps}</div>}
                  </div>
                  {isActive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
                      <button onClick={e => { e.stopPropagation(); onToggle(name); }} style={{ padding: '4px 8px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.25)', borderRadius: 6, color: '#ff4444', cursor: 'pointer', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <X size={10} strokeWidth={3} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-color)' }} />
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.6 }}>{t('exercises') || 'Exercises'}</div>
        </div>
        <button onClick={() => setShowSearch(true)} style={{ background: 'rgba(255,61,0,0.08)', border: '1.5px solid rgba(255,61,0,0.3)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ff3d00', boxShadow: '0 0 12px rgba(255,61,0,0.2)', transition: 'all 0.2s ease' }}>
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      {/* Exercise list */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: draggingIndex === null ? 'auto' : 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }} onTouchMove={handleTouchMove} onTouchEnd={() => setDraggingIndex(null)}>
        {recentNames.length > 0 && (
          <>
            <div style={{ padding: '16px 12px 8px', display: 'flex', alignItems: 'center', gap: 8, background: 'transparent' }}>
              <RotateCcw size={14} color="#ff3d00" strokeWidth={3} />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#ff3d00', letterSpacing: 1, textTransform: 'uppercase' }}>{isRtl ? 'تمارينك السابقة' : 'My Recent Exercises'}</span>
            </div>
            {recentNames.map((name, i) => renderExerciseItem(name, i, true))}
          </>
        )}
        {otherNames.length > 0 && recentNames.length > 0 && (
          <div style={{ padding: '24px 12px 8px', display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>{isRtl ? 'بقية التمارين' : 'All Other Exercises'}</span>
          </div>
        )}
        {otherNames.map((name, i) => renderExerciseItem(name, i + recentNames.length, false))}

        {/* Archive */}
        {archivedExercises.length > 0 && (
          <div style={{ marginTop: 24, paddingBottom: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)' }} />
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: 2, textTransform: 'uppercase' }}>{isRtl ? 'الأرشيف' : 'ARCHIVE'}</div>
              </div>
            </div>
            {archivedExercises.map(name => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 16px', background: 'rgba(var(--theme-rgb), 0.02)', borderBottom: '1px solid rgba(var(--theme-rgb), 0.04)', borderRadius: 12, transition: 'all 0.2s ease', cursor: 'pointer' }}>
                <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', opacity: 0.8 }}>{name}</div>
                <button onClick={() => tracker.restoreExercise(muscleGroup as MuscleGroup, name)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(var(--accent-rgb), 0.1)', border: 'none', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <RotateCcw size={18} strokeWidth={2.5} />
                </button>
                <button onClick={() => setDeleteConfirm([name])} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,0,0,0.05)', border: 'none', color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 340, background: 'rgba(20,20,20,0.95)', borderRadius: 32, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }}>DELETE FOREVER</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>Are you sure you want to permanently delete "{deleteConfirm[0]}"?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { deleteConfirm.forEach(n => tracker.permanentlyDeleteExercise(muscleGroup as MuscleGroup, n)); setDeleteConfirm(null); }} style={{ flex: 1, height: 48, borderRadius: 12, background: 'rgba(255,50,50,0.2)', border: '1px solid rgba(255,50,50,0.5)', color: '#ff4444', fontWeight: 900, cursor: 'pointer' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisePicker;
export { ExercisePicker };
