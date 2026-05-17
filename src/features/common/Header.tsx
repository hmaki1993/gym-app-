// No imports needed for current Header implementation

interface Props {
  tab: string;
  t: (k: any) => string;
  tracker: any;
}

export function Header({ tab, t, tracker }: Props) {
  return (
    <div style={{ marginBottom: '5px', direction: 'ltr', transformStyle: 'preserve-3d', position: 'relative', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: 'translateZ(30px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px' }}>
          <div style={{ 
            width: '4px', 
            height: '24px', 
            background: 'var(--accent-color)', 
            borderRadius: '2px',
            
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
                background: tracker.settings.language === lg ? 'var(--accent-color)' : 'transparent',
                color: tracker.settings.language === lg ? '#000' : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>{lg.toUpperCase()}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
