
interface Props {
  tab: string;
  t: (k: any) => string;
  tracker: any;
}

export function Header({ tab, t, tracker }: Props) {
  const toggleTheme = () => {
    // Determine the currently active theme (might be derived from system)
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (activeTheme === 'light') {
      tracker.setSettings({ themeMode: 'dark' });
    } else {
      tracker.setSettings({ themeMode: 'light' });
    }
  };

  const getThemeIcon = () => {
    const activeTheme = tracker.settings.themeMode === 'system' 
      ? (document.documentElement.getAttribute('data-theme') || 'dark')
      : tracker.settings.themeMode;

    const diskColor = activeTheme === 'dark' ? '#ffffff' : '#6B7DB3';
    const rayColor = activeTheme === 'dark' ? '#FFD700' : '#6B7DB3';
    const outlineColor = activeTheme === 'dark' ? '#ffffff' : 'rgba(0,0,0,0.75)';

    return (
      <svg width="42" height="42" viewBox="0 0 64 72" fill="none" style={{ transition: 'all 0.3s ease' }}>
        <defs>
          <filter id="white-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComponentTransfer in="blur" result="boost">
              <feFuncA type="linear" slope="1.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="boost" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform="translate(0, -5)">
          {/* Sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 32 + Math.cos(rad) * 18;
            const y1 = 32 + Math.sin(rad) * 18;
            const x2 = 32 + Math.cos(rad) * 24;
            const y2 = 32 + Math.sin(rad) * 24;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={rayColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{ transition: 'stroke 0.3s ease' }}
              />
            );
          })}
          {/* Main circle - sun disk */}
          <circle 
            cx="32" 
            cy="32" 
            r="13.5" 
            fill={diskColor} 
            stroke={outlineColor} 
            strokeWidth="2.5" 
            filter={activeTheme === 'dark' ? 'url(#white-glow)' : undefined}
            style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }} 
          />
          {/* Moon half overlay */}
          <path 
            d={activeTheme === 'dark' ? '' : 'M32 18.5 A13.5 13.5 0 0 1 32 45.5 A8.3 13.5 0 0 0 32 18.5Z'}
            fill={activeTheme === 'dark' ? 'transparent' : 'rgba(255,255,255,0.3)'}
            style={{ transition: 'all 0.3s ease' }}
          />
        </g>
        <g transform="translate(0, 10)">
          {/* Toggle bar */}
          <rect x="14" y="54" width="36" height="5" rx="2.5" fill={outlineColor} opacity="0.5" style={{ transition: 'fill 0.3s ease' }} />
          {/* Toggle knob */}
          <rect 
            x={activeTheme === 'dark' ? '36' : '16'} 
            y="52.5" width="10" height="8" rx="2" 
            fill={rayColor} 
            stroke={outlineColor} 
            strokeWidth="1.5"
            style={{ transition: 'all 0.3s ease' }}
          />
        </g>
      </svg>
    );
  };

  return (
    <div style={{ marginBottom: '5px', direction: 'ltr', transformStyle: 'preserve-3d', position: 'relative', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: 'translateZ(30px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px' }}>
          <div style={{ 
            width: '44px', 
            height: '28px', 
            backgroundColor: 'var(--accent-color)', 
            maskImage: "url('/assets/label-custom.png')", 
            WebkitMaskImage: "url('/assets/label-custom.png')", 
            maskSize: 'contain', 
            WebkitMaskSize: 'contain', 
            maskRepeat: 'no-repeat', 
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            flexShrink: 0
          }} />
          <h1 className="heading-font logo-underline" style={{ 
            margin: 0, 
            fontSize: '32px',
            display: 'inline-block',
            width: 'fit-content',
            color: 'var(--text-primary)',
            letterSpacing: '-1.5px',
            textTransform: 'uppercase'
          }}>
            {t(tab)}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tab === 'home' && (
            <button 
              onClick={toggleTheme} 
              style={{
                background: 'transparent',
                border: 'none',
                width: '46px',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {getThemeIcon()}
            </button>
          )}
          {tab === 'settings' && (
            <div style={{ display: 'flex', background: 'rgba(var(--theme-rgb), 0.16)', borderRadius: '12px', padding: '4px', marginRight: '4px' }}>
              {(['ar', 'en'] as const).map(lg => (
                <button key={lg} onClick={() => tracker.setSettings({ language: lg })} style={{
                  padding: '6px 14px', border: 'none', borderRadius: '9px', fontSize: '10px', fontWeight: '950', cursor: 'pointer',
                  background: tracker.settings.language === lg ? 'rgba(var(--accent-rgb), 0.18)' : 'transparent',
                  color: tracker.settings.language === lg ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>{lg.toUpperCase()}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
