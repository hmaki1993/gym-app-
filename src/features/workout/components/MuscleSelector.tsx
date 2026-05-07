import { MUSCLE_GROUPS } from '../../../data/exercises';
import type { MuscleGroup } from '../../../types';
import { TransparentImage } from './TransparentImage';

interface Props {
  selectedMuscle: MuscleGroup;
  onSelect: (muscle: MuscleGroup) => void;
  lang: 'ar' | 'en';
  themeMode?: 'dark' | 'light';
  accentColor?: string;
  musclesWithExercises?: Set<MuscleGroup>;
}

export function MuscleSelector({ selectedMuscle, onSelect, lang, musclesWithExercises }: Props) {
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
          const hasExercises = musclesWithExercises?.has(mg.key as MuscleGroup);
          return (
            <button
              key={mg.key}
              onClick={() => onSelect(mg.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none', padding: '0',
                flexShrink: 0, minWidth: '60px', cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isSelected ? 1 : (hasExercises ? 0.9 : 0.5),
                position: 'relative'
              }}
            >
              <div style={{
                width: '75px', height: '75px', borderRadius: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected ? 'rgba(var(--theme-rgb), 0.08)' : 'rgba(var(--theme-rgb), 0.04)',
                border: `2px solid ${isSelected ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.08)'}`,
                boxShadow: isSelected ? '0 0 25px -4px var(--accent-color-alpha)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <TransparentImage
                  src={mg.icon}
                  alt={mg.en}
                  width={55}
                  height={55}
                  threshold={45}
                  style={{
                    filter: isSelected ? 'grayscale(0) brightness(1.1)' : 'grayscale(1) brightness(1.1)',
                    transition: 'all 0.4s ease'
                  }}
                />
              </div>
              <span style={{
                fontSize: '12px', fontWeight: '950',
                color: isSelected ? 'var(--accent-color)' : (hasExercises ? 'var(--accent-secondary)' : 'var(--text-secondary)'),
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
