import { useState } from 'react';
import { Plus, CheckCircle, X, ChevronRight } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  filteredExercises: string[];
  activeExercises: string[];
  onToggle: (name: string) => void;
  onAddCustom: (name: string) => void;
  onRemove: (name: string, isCustom: boolean) => void;
  isRtl: boolean;
  t: (k: any) => string;
  weightUnit: string;
  getLastSession: (name: string) => any;
  customExercises: string[];
}

export function ExercisePicker({
  search, onSearchChange, filteredExercises, activeExercises, onToggle,
  onAddCustom, onRemove, isRtl, t, weightUnit,
  getLastSession, customExercises
}: Props) {
  const [showInput, setShowInput] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
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

      <div className="hide-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredExercises.map(name => {
          const isSelected = activeExercises.includes(name);
          const lastData = getLastSession(name);
          const isCustom = customExercises?.includes(name);
          return (
            <div
              key={name}
              onClick={() => onToggle(name)}
              className="exercise-select-btn"
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 12px', 
                background: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${isSelected ? 'var(--accent-color-alpha)' : 'rgba(255,255,255,0.03)'}`,
                width: '100%', cursor: 'pointer',
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '2px'
              }}
            >
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <div style={{ 
                  fontSize: '15px', 
                  fontWeight: '800', 
                  color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)', 
                  transition: 'color 0.3s ease',
                  fontFamily: 'Outfit, sans-serif'
                }}>{name}</div>
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
          );
        })}
      </div>
    </div>
  );
}
