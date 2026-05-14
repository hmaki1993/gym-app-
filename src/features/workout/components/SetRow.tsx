import React from 'react';
import { Trash2, Clock } from 'lucide-react';

interface Props {
  index: number;
  weight: string | number;
  reps: string | number;
  restTime?: number;
  activeUnit: string;
  isResting: boolean;
  canRemove: boolean;
  t: (key: string) => string;
  onUpdate: (field: 'weight' | 'reps' | 'restTime', value: string | number) => void;
  onCycleUnit: () => void;
  onStartRest: () => void;
  onRemove: () => void;
}

export const SetRow: React.FC<Props> = ({
  index,
  weight,
  reps,
  restTime,
  activeUnit,
  isResting,
  canRemove,
  t,
  onUpdate,
  onCycleUnit,
  onStartRest,
  onRemove
}) => {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 0',
      borderBottom: '1.5px solid rgba(var(--theme-rgb), 0.1)',
      gap: '8px',
      transformStyle: 'preserve-3d'
    }}>
      <div style={{ width: '24px', fontSize: '14px', fontWeight: '900', color: 'var(--accent-color)', opacity: 0.8, fontFamily: 'Outfit, sans-serif' }}>
        {index + 1}
      </div>
      <div style={{ width: '1.5px', height: '20px', background: 'rgba(var(--theme-rgb), 0.15)', marginRight: '12px' }} />
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => onUpdate('weight', e.target.value)}
          style={{
            background: 'var(--glass-bg)',
            border: '1.5px solid rgba(var(--theme-rgb), 0.3)',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '24px',
            fontWeight: '900',
            textAlign: 'center',
            width: '65px',
            padding: '4px 0',
            borderRadius: '8px',
            fontFamily: 'Outfit, sans-serif',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}
        />
        <div
          onClick={onCycleUnit}
          style={{
            fontSize: '11px',
            fontWeight: '950',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            minWidth: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif',
            filter: 'none',
            lineHeight: '1',
            transition: 'transform 0.2s ease'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {t(activeUnit)}
          <div style={{ width: '12px', height: '2px', background: '#666', marginTop: '3px', borderRadius: '1px' }} />
        </div>
      </div>

      <div style={{ width: '1.5px', height: '24px', background: 'rgba(var(--theme-rgb), 0.15)' }} />
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => onUpdate('reps', e.target.value)}
          style={{
            background: 'var(--glass-bg)',
            border: '1.5px solid rgba(var(--theme-rgb), 0.3)',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '24px',
            fontWeight: '900',
            textAlign: 'center',
            width: '65px',
            padding: '4px 0',
            borderRadius: '8px',
            fontFamily: 'Outfit, sans-serif',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}
        />
        <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>
          {t('reps')}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {restTime ? (
          <div style={{ fontSize: '10px', color: 'var(--accent-color)', fontWeight: '900', background: 'rgba(0,229,160,0.1)', padding: '2px 4px', borderRadius: '4px', fontFamily: 'Outfit, sans-serif' }}>
            {restTime}s
          </div>
        ) : (
          <button
            onClick={onStartRest}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isResting ? 'var(--accent-color)' : '#555', opacity: isResting ? 1 : 0.5, padding: '4px' }}
          >
            <Clock size={16} />
          </button>
        )}

        {canRemove && (
          <button onClick={onRemove} style={{ background: 'transparent', border: 'none', width: '28px', height: '28px', cursor: 'pointer', color: 'rgba(255,51,102,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 0 }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
