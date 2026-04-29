import { MUSCLE_GROUPS } from '../../../data/exercises';
import type { MuscleGroup } from '../../../types';

interface Props {
  selectedMuscle: MuscleGroup;
  onSelect: (muscle: MuscleGroup) => void;
  lang: 'ar' | 'en';
}

export function MuscleSelector({ selectedMuscle, onSelect, lang }: Props) {
  return (
    <div className="hide-scrollbar allow-swipe" style={{ 
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
              width: '60px', height: '60px', borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)'}`,
              boxShadow: isSelected ? '0 10px 25px -5px var(--accent-color-alpha)' : 'none',
              transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
              transform: isSelected ? 'translateY(-2px)' : 'none'
            }}>
              <img
                src={mg.icon}
                alt={mg.en}
                style={{
                  width: '40px', height: '40px', objectFit: 'contain',
                  filter: isSelected ? 'contrast(1.2) brightness(1.2) drop-shadow(0 0 5px var(--accent-color-alpha))' : 'grayscale(1) opacity(0.3)',
                  transition: 'all 0.4s ease'
                }}
              />
            </div>
            <span style={{
              fontSize: '10px', fontWeight: '950',
              color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '1px',
              marginTop: '4px'
            }}>
              {mg[lang]}
            </span>
            {isSelected && (
              <div style={{ 
                width: '16px', 
                height: '2px', 
                borderRadius: '1px', 
                background: 'var(--accent-color)', 
                marginTop: '4px',
                boxShadow: '0 0 10px var(--accent-color)'
              }} />
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}
