import { useState } from 'react';
import { Plus, CheckCircle, X, ChevronRight, Info, GripVertical } from 'lucide-react';
import { EXERCISE_DETAILS } from '../../../data/exercises';

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
                background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)',
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
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                zIndex: isDragging ? 100 : 1,
                opacity: isDragging ? 0.7 : 1,
                transform: isDragging ? 'scale(1.02)' : 'none',
                transition: isDragging ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
                boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.4)' : 'none'
              }}
            >
              <div
                onClick={() => onToggle(name)}
                className="exercise-select-btn glass-card"
                role="button"
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 12px', 
                  background: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${isSelected ? 'var(--accent-color-alpha)' : 'rgba(255,255,255,0.03)'}`,
                  width: '100%', cursor: 'pointer',
                  borderRadius: isSelected && detail ? '16px 16px 0 0' : '16px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: isSelected && detail ? '0' : '2px',
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
                    {detail && <Info size={13} style={{ opacity: isSelected ? 0.8 : 0.2, color: isSelected ? 'var(--accent-color)' : '#fff' }} />}
                  </div>
                  {lastData && (
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '800', opacity: 0.5, letterSpacing: '0.5px' }}>
                      {t('lastSession').toUpperCase()}: {lastData.sets[0]?.weight}{weightUnit} × {lastData.sets[0]?.reps}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isSelected && (
                    <div style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', filter: 'drop-shadow(0 0 5px var(--accent-color-alpha))' }}>
                      <CheckCircle size={18} strokeWidth={3} />
                    </div>
                  )}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(name, isCustom);
                      }}
                      style={{ padding: '6px', background: 'rgba(255,51,102,0.1)', border: 'none', borderRadius: '8px', color: '#ff3366', cursor: 'pointer', display: 'flex', zIndex: 10, opacity: 0.6 }}
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
              
              {isSelected && detail && (
                <div style={{
                  padding: '12px 16px 20px',
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--accent-color-alpha)',
                  borderRadius: '0 0 16px 16px',
                  animation: 'slideDown 0.3s ease-out',
                  marginBottom: '8px'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    lineHeight: '1.6', 
                    color: 'rgba(255,255,255,0.6)', 
                    fontFamily: 'Outfit, sans-serif',
                    textAlign: isRtl ? 'right' : 'left'
                  }}>
                    {isRtl ? detail.ar : detail.en}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
