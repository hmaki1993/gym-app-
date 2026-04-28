import React from 'react';
import { Clock } from 'lucide-react';

interface Props {
  restActive: boolean;
  restRemaining: number;
  restDuration: number;
  t: (key: string) => string;
  onAdjustDuration: (amount: number) => void;
  onToggleRest: () => void;
  onSkip: () => void;
}

export const RestTimer: React.FC<Props> = ({
  restActive,
  restRemaining,
  restDuration,
  t,
  onAdjustDuration,
  onToggleRest,
  onSkip
}) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      width: '100%',
      transformStyle: 'preserve-3d'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => onAdjustDuration(-5)}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: '800' }}
        >
          -
        </button>

        <button onClick={onToggleRest} style={{
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '800',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          cursor: 'pointer', padding: '6px 16px', borderRadius: '100px',
          letterSpacing: '0.3px', transition: 'all 0.2s', minWidth: '80px',
          fontFamily: 'Outfit, sans-serif'
        }}>
          <Clock size={14} color="var(--accent-color)" /> {restDuration}s
        </button>

        <button
          onClick={() => onAdjustDuration(5)}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: '800' }}
        >
          +
        </button>
      </div>

      {restActive && (
        <div style={{ width: '100%', background: 'var(--accent-color-alpha)', padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--accent-color-alpha-heavy)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)' }}>
              <Clock size={15} strokeWidth={2.5} />
              <span style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>{restRemaining}s</span>
            </div>
            <button onClick={onSkip}
              style={{ background: 'none', border: 'none', fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.4, fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>
              {t('skip')}
            </button>
          </div>
          <div style={{ height: '3px', background: 'var(--glass-border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(restRemaining / restDuration) * 100}%`, background: 'var(--accent-color)', transition: 'width 1s linear' }} />
          </div>
        </div>
      )}
    </div>
  );
};
