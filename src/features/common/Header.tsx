import { Dumbbell } from 'lucide-react';

interface Props {
  tab: string;
  t: (k: any) => string;
  tracker: any;
}

export function Header({ tab, t, tracker }: Props) {
  return (
    <div style={{ marginBottom: '5px', direction: 'ltr', transformStyle: 'preserve-3d', position: 'relative' }}>
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
            textTransform: 'uppercase',
            background: tracker.settings.themeMode === 'light'
              ? 'linear-gradient(135deg, #111 0%, #444 50%, var(--accent-secondary) 100%)'
              : 'linear-gradient(135deg, #fff 0%, #fff 50%, var(--accent-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            <span>POWER</span>
            <div style={{ 
              margin: '0 6px',
              color: 'var(--accent-secondary)',
              filter: 'drop-shadow(0 0 8px var(--accent-color-alpha))',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Dumbbell size={22} strokeWidth={3} className="pulse-elite" />
            </div>
            <span>GRID</span>
          </h1>
          <div className="subtitle-text logo-underline" style={{ width: 'fit-content', letterSpacing: '4px', opacity: 1, color: 'var(--text-secondary)', fontWeight: '900', fontSize: '10px' }}>{t('premiumSystem')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: 'translateZ(30px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px' }}>
            <div style={{ 
              width: '4px', 
              height: '24px', 
              background: 'var(--accent-color)', 
              borderRadius: '2px',
              boxShadow: '0 0 15px var(--accent-color-alpha)'
            }} />
            <h1 className="heading-font logo-underline" style={{ 
              margin: 0, 
              fontSize: '32px',
              background: tracker.settings.themeMode === 'light'
                ? 'linear-gradient(135deg, #111 0%, #444 50%, var(--accent-secondary) 100%)'
                : 'linear-gradient(135deg, #fff 0%, #fff 50%, var(--accent-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1.5px',
              textTransform: 'uppercase'
            }}>
              {t(tab)}
            </h1>
          </div>

          {tab === 'settings' && (
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '4px', marginRight: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {(['ar', 'en'] as const).map(lg => (
                <button key={lg} onClick={() => tracker.setSettings({ language: lg })} style={{
                  padding: '6px 14px', border: 'none', borderRadius: '9px', fontSize: '10px', fontWeight: '950', cursor: 'pointer',
                  background: tracker.settings.language === lg ? '#ff3d00' : 'transparent',
                  color: tracker.settings.language === lg ? '#000' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: tracker.settings.language === lg ? '0 0 15px rgba(255, 61, 0, 0.3)' : 'none'
                }}>{lg.toUpperCase()}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
