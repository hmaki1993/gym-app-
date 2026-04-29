import { Dumbbell } from 'lucide-react';

interface Props {
  tab: string;
  t: (k: any) => string;
}

export function Header({ tab, t }: Props) {
  return (
    <div style={{ marginBottom: '5px', direction: 'ltr', transformStyle: 'preserve-3d' }}>
      {tab === 'home' ? (
        <div style={{ transform: 'translateZ(20px)' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: 'var(--logo-font-size)', 
            display: 'flex', 
            alignItems: 'center',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 950,
            letterSpacing: '-1px',
            textTransform: 'uppercase'
          }}>
            <span style={{ color: 'var(--text-primary)' }}>GYM</span>
            <div style={{ 
              margin: '0 6px',
              color: 'var(--accent-color)',
              filter: 'drop-shadow(0 0 8px var(--accent-color-alpha))',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Dumbbell size={22} strokeWidth={3} className="pulse-elite" />
            </div>
            <span style={{ color: 'var(--accent-color)' }}>LOG</span>
          </h1>
          <div className="subtitle-text" style={{ letterSpacing: '4px', opacity: 0.5 }}>{t('premiumSystem')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px', transform: 'translateZ(30px)' }}>
          <div style={{ 
            width: '4px', 
            height: '24px', 
            background: 'var(--accent-color)', 
            borderRadius: '2px',
            boxShadow: '0 0 15px var(--accent-color-alpha)'
          }} />
          <h1 className="heading-font" style={{ 
            margin: 0, 
            fontSize: '32px',
            background: 'linear-gradient(to bottom, var(--text-primary) 50%, var(--accent-color) 150%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1.5px',
            textTransform: 'uppercase'
          }}>
            {t(tab)}
          </h1>
        </div>
      )}
    </div>
  );
}
