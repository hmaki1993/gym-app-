import { MUSCLE_GROUPS } from '../../../data/exercises';
import type { MuscleGroup } from '../../../types';
import { TransparentImage } from './TransparentImage';

interface Props {
  selectedMuscle: MuscleGroup;
  onSelect: (muscle: MuscleGroup) => void;
  lang: 'ar' | 'en';
  themeMode?: 'dark' | 'light';
  accentColor?: string;
}

export function MuscleSelector({ selectedMuscle, onSelect, lang }: Props) {
  return (
    <div className="hide-scrollbar allow-swipe" style={{ 
      display: 'flex', flexDirection: 'row', flexWrap: 'nowrap',
      gap: '25px', overflowX: 'scroll', width: '100%',
      padding: '10px 10px 16px', marginBottom: '10px',
      touchAction: 'pan-x', WebkitOverflowScrolling: 'touch',
      position: 'relative', zIndex: 10
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
                opacity: isSelected ? 1 : 0.5
              }}
            >
              <div style={{
                width: '60px', height: '60px', borderRadius: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected ? 'rgba(var(--theme-rgb), 0.08)' : 'rgba(var(--theme-rgb), 0.04)',
                border: `1.5px solid ${isSelected ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.08)'}`,
                boxShadow: isSelected ? '0 0 20px -4px var(--accent-color-alpha)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                overflow: 'hidden'
              }}>
                <TransparentImage
                  src={mg.icon}
                  alt={mg.en}
                  width={44}
                  height={44}
                  threshold={45}
                  style={{
                    filter: 'grayscale(1) brightness(1.1)',
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
                  width: '16px', height: '2px', borderRadius: '1px', 
                  background: 'var(--accent-color)', marginTop: '4px',
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
