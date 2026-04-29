import { MUSCLE_GROUPS } from '../../../data/exercises';
import type { MuscleGroup } from '../../../types';

interface Props {
  selectedMuscle: MuscleGroup;
  onSelect: (muscle: MuscleGroup) => void;
  lang: 'ar' | 'en';
}

export function MuscleSelector({ selectedMuscle, onSelect, lang }: Props) {
  return (
    <div className="hide-scrollbar" style={{ 
      display: 'flex', 
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: '25px', 
      overflowX: 'scroll', 
      width: '100%',
      padding: '10px 10px 16px', 
      marginBottom: '10px',
      touchAction: 'pan-x',
      WebkitOverflowScrolling: 'touch',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', gap: '25px', minWidth: 'max-content' }}>
        {MUSCLE_GROUPS.map(mg => {
          const isSelected = selectedMuscle === mg.key;
          return (
            <button
              key={mg.key}
              onClick={() => onSelect(mg.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none', padding: '0',
                flexShrink: 0, minWidth: '60px', cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isSelected ? 1 : 0.4
              }}
            >
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isSelected ? 'var(--glass-bg)' : 'transparent',
              border: `1.5px solid ${isSelected ? 'var(--accent-color)' : 'transparent'}`,
              transition: 'all 0.4s ease'
            }}>
              <img
                src={mg.icon}
                alt={mg.en}
                style={{
                  width: '38px', height: '38px', objectFit: 'contain',
                  filter: isSelected ? 'contrast(1.2) brightness(1.1)' : 'grayscale(1) opacity(0.3)',
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
    </div>
  );
}
