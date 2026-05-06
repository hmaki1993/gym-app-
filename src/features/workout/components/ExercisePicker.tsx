import { useState, useRef } from 'react';
import { Plus, CheckCircle, X, ChevronRight, Info, GripVertical } from 'lucide-react';
import { EXERCISE_DETAILS } from '../../../data/exercises';
import gsap from 'gsap';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  filteredExercises: string[];
  activeExercises: string[];
  onToggle: (name: string) => void;
  onAddCustom: (name: string) => void;
  onRemove: (name: string, isCustom: boolean) => void;
  onReorder: (newOrder: string[]) => void;
  isRtl: boolean;
  t: (k: any) => string;
  weightUnit: string;
  getLastSession: (name: string) => any;
  customExercises: string[];
}

export function ExercisePicker({
  search, onSearchChange, filteredExercises, activeExercises, onToggle,
  onAddCustom, onRemove, onReorder, isRtl, t, weightUnit,
  getLastSession, customExercises
}: Props) {
  const [showInput, setShowInput] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleToggleWithAnimation = (name: string, el: HTMLDivElement | null) => {
    if (el) {
      const isCurrentlySelected = activeExercises.includes(name);
      if (!isCurrentlySelected) {
        // SELECT: explosive snap-in
        gsap.timeline()
          .to(el, { scale: 0.94, duration: 0.06, ease: 'power2.in' })
          .to(el, { scale: 1.04, duration: 0.12, ease: 'power3.out' })
          .to(el, { scale: 1.0, duration: 0.2, ease: 'elastic.out(1.2, 0.5)' });
      } else {
        // DESELECT: quick shrink
        gsap.timeline()
          .to(el, { scale: 0.96, duration: 0.08, ease: 'power2.in' })
          .to(el, { scale: 1.0, duration: 0.15, ease: 'power2.out' });
      }
    }
    onToggle(name);
  };

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
        const newOrder = [...filteredExercises];
        const item = newOrder[draggingIndex];
        newOrder.splice(draggingIndex, 1);
        newOrder.splice(targetIndex, 0, item);
        onReorder(newOrder);
        setDraggingIndex(targetIndex);
      }
    }
  };

  const handleTouchEnd = () => setDraggingIndex(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, userSelect: draggingIndex !== null ? 'none' : 'auto' }}>
      {/* Header with Minimal Plus Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-color)' }} />
          <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.6 }}>
            {t('exercises') || 'Exercises'}
          </div>
        </div>
        {!showInput && (
          <button 
            onClick={() => setShowInput(true)}
            style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--accent-color)' }}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        )}
      </div>

      {showInput && (
        <div style={{ 
          background: 'var(--glass-bg)', 
          padding: '8px', 
          borderRadius: '20px', 
          border: '1px solid var(--accent-color-alpha)',
          display: 'flex',
          gap: '8px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <input 
            className="glass-input" 
            autoFocus
            style={{ 
              paddingLeft: '16px', 
              height: '44px',
              fontSize: '14px',
              borderRadius: '14px',
              flex: 1
            }} 
            placeholder={t('customExercise') || 'Exercise Name...'} 
            value={search} 
            onChange={e => onSearchChange(e.target.value)} 
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => {
                if (search.trim()) {
                  onAddCustom(search.trim());
                  onSearchChange('');
                  setShowInput(false);
                }
              }}
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'var(--accent-color)', border: 'none', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <ChevronRight size={20} strokeWidth={3} />
            </button>
            <button
              onClick={() => {
                onSearchChange('');
                setShowInput(false);
              }}
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(var(--theme-rgb), 0.05)', border: 'none', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div 
        className="hide-scroll" 
        style={{ flex: 1, overflowY: draggingIndex !== null ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {filteredExercises.map((name, index) => {
          const isSelected = activeExercises.includes(name);
          const lastData = getLastSession(name);
          const isCustom = customExercises?.includes(name);
          const detail = EXERCISE_DETAILS[name];
          const isDragging = draggingIndex === index;

          return (
            <div 
              key={name} 
              data-index={index}
              ref={(el) => { if (el) itemRefs.current.set(name, el); else itemRefs.current.delete(name); }}
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                zIndex: isDragging ? 100 : 1,
                opacity: isDragging ? 0.7 : 1,
                transition: isDragging ? 'none' : 'opacity 0.2s ease',
                boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.4)' : 'none'
              }}
            >
              <div
                onClick={() => handleToggleWithAnimation(name, itemRefs.current.get(name) ?? null)}
                className="exercise-select-btn"
                role="button"
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 12px 12px 20px', 
                  background: isSelected ? 'rgba(255, 61, 0, 0.06)' : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${isSelected ? 'rgba(255, 61, 0, 0.2)' : 'rgba(var(--theme-rgb), 0.06)'}`,
                  borderLeft: isSelected ? '3px solid #ff3d00' : '3px solid transparent',
                  width: '100%', cursor: 'pointer',
                  borderRadius: '0px',
                  transition: 'all 0.2s ease',
                  marginBottom: '0',
                  touchAction: 'manipulation'
                }}
              >
                <div 
                  onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(index); }}
                  style={{ 
                    touchAction: 'none', 
                    padding: '8px', 
                    marginRight: isRtl ? '0' : '4px', 
                    marginLeft: isRtl ? '4px' : '0', 
                    color: isDragging ? 'var(--accent-color)' : 'var(--text-secondary)', 
                    opacity: isDragging ? 1 : 0.3,
                    transition: 'color 0.2s ease'
                  }}
                >
                  <GripVertical size={20} />
                </div>

                <div style={{ textAlign: isRtl ? 'right' : 'left', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '800', 
                      color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)', 
                      transition: 'color 0.3s ease',
                      fontFamily: 'Outfit, sans-serif'
                    }}>{name}</div>
                    {detail && <Info size={13} style={{ opacity: isSelected ? 0.8 : 0.2, color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)' }} />}
                  </div>
                  {lastData && (
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '800', opacity: 0.5, letterSpacing: '0.5px' }}>
                      {t('lastSession').toUpperCase()}: {lastData.sets[0]?.weight} {t(weightUnit as any)} × {lastData.sets[0]?.reps}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSelected && (
                    <div style={{ 
                      width: '6px', height: '6px', borderRadius: '50%', 
                      background: '#ff3d00', 
                      boxShadow: '0 0 6px #ff3d00',
                      flexShrink: 0
                    }} />
                  )}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(name, isCustom);
                      }}
                      style={{ padding: '4px 8px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '6px', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: '900', opacity: 0.7 }}
                    >
                      <X size={11} strokeWidth={3} /> Remove
                    </button>
                  )}
                  {!isSelected && <ChevronRight size={16} style={{ opacity: 0.15 }} />}
                </div>
              </div>
              

            </div>
          );
        })}
      </div>
    </div>
  );
}
