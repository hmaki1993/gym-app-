import { MUSCLE_GROUPS } from '../../../data/exercises';
import type { MuscleGroup } from '../../../types';

interface Props {
  selectedMuscle: MuscleGroup;
  onSelect: (muscle: MuscleGroup) => void;
  lang: 'ar' | 'en';
}

export function MuscleSelector({ selectedMuscle, onSelect, lang }: Props) {
  return (
    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 4px 16px', scrollbarWidth: 'none', marginBottom: '10px' }}>
      {MUSCLE_GROUPS.map(mg => {
        const isSelected = selectedMuscle === mg.key;
        return (
          <button
            key={mg.key}
            onClick={() => onSelect(mg.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', padding: '0',
              flexShrink: 0, minWidth: '50px', cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isSelected ? 1 : 0.4
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isSelected ? 'var(--glass-bg)' : 'transparent',
              border: `1.2px solid ${isSelected ? 'var(--accent-color)' : 'transparent'}`,
              transition: 'all 0.4s ease'
            }}>
              <img
                src={mg.icon}
                alt={mg.en}
                style={{
                  width: '30px', height: '30px', objectFit: 'contain',
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
  );
}
