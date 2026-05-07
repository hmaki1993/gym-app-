import { Dumbbell } from 'lucide-react';

interface Props {
  tab: string;
  t: (k: any) => string;
  tracker: any;
}

export function Header({ tab, t, tracker }: Props) {
  return (
    <div style={{ marginBottom: '5px', direction: 'ltr', transformStyle: 'preserve-3d', position: 'relative', padding: '0 16px' }}>
      {tab === 'home' ? (
        <div style={{ transform: 'translateZ(20px)' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: 'var(--logo-font-size)', 
            display: 'inline-flex', 
            alignItems: 'center',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 950,
            letterSpacing: '-1px',
            textTransform: 'uppercase',
            width: 'fit-content'
          }}>
            <span style={{ color: '#a0a0a0' }}>POWER</span>
            <div style={{ 
              margin: '0 6px',
              color: '#ff3d00',
              filter: 'drop-shadow(0 0 8px rgba(255, 61, 0, 0.4))',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Dumbbell size={22} strokeWidth={3} className="pulse-elite" />
            </div>
            <span style={{ color: '#ff3d00' }}>GRID</span>
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
              display: 'inline-block',
              width: 'fit-content',
              backgroundImage: tracker.settings.themeMode === 'light'
                ? 'linear-gradient(135deg, #000 0%, #333 100%)'
                : 'linear-gradient(135deg, #fff 0%, #aaa 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
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
