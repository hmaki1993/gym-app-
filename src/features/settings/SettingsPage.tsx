import React, { useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { THEME_COLORS } from '../../data/exercises';
import { Volume2, VolumeX } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
}




export function SettingsPage({ tracker }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const containerRef = useRef<HTMLDivElement>(null);
  const [localName, setLocalName] = React.useState(tracker.settings.userName);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div ref={containerRef} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '40px 16px',
      minHeight: '80vh',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>

      {/* Group 1: Identity & Language */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
        
        {/* Name Frame */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', opacity: 0.4, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{t('userName')}</span>
          <div style={{ 
            background: 'none', 
            padding: '14px 20px', 
            borderRadius: '8px', 
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            width: '240px',
            transition: 'all 0.3s ease'
          }} className="name-box-elite">
            <input
              style={{
                background: 'none', 
                border: 'none', 
                fontSize: '18px', 
                fontWeight: '950', 
                color: 'var(--text-primary)',
                outline: 'none', 
                width: '100%', 
                textAlign: 'center',
                fontFamily: 'Outfit, sans-serif'
              }}
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              onBlur={() => tracker.setSettings({ userName: localName })}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="..."
            />
          </div>
        </div>

        {/* Language Frame */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', opacity: 0.4, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{t('language')}</span>
          <div style={{ 
            display: 'flex', 
            gap: '1px', 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)', 
            padding: '4px', 
            borderRadius: '8px',
            width: '240px',
            justifyContent: 'space-between'
          }}>
            {(['ar', 'en'] as const).map((lg) => (
              <button
                key={lg}
                onClick={() => tracker.setSettings({ language: lg })}
                style={{
                  background: tracker.settings.language === lg ? 'var(--accent-color)' : 'none',
                  border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '950',
                  color: tracker.settings.language === lg ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.3s ease', 
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '6px',
                  letterSpacing: '1px',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                {lg === 'ar' ? 'عربي' : 'ENGLISH'}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Frame */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', opacity: 0.4, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{t('themeMode')}</span>
          <div style={{ 
            display: 'flex', 
            gap: '1px', 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)', 
            padding: '4px', 
            borderRadius: '8px',
            width: '240px',
            justifyContent: 'space-between'
          }}>
            {(['dark', 'light'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => tracker.setSettings({ themeMode: mode })}
                style={{
                  background: tracker.settings.themeMode === mode ? 'var(--accent-color)' : 'none',
                  border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '950',
                  color: tracker.settings.themeMode === mode ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.3s ease', 
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '6px',
                  letterSpacing: '1px',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                {t(mode as any)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Group 2: Preferences (Centered Frame) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', opacity: 0.4, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>{t('sound')}</span>
        <button
          onClick={() => tracker.setSettings({ soundEnabled: !tracker.settings.soundEnabled })}
          style={{
            background: 'none', 
            border: tracker.settings.soundEnabled ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)', 
            cursor: 'pointer',
            fontSize: '14px', fontWeight: '950',
            color: tracker.settings.soundEnabled ? 'var(--accent-color)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
            padding: '14px',
            width: '240px',
            borderRadius: '8px',
            fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.3s ease'
          }}
        >
          {tracker.settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          {tracker.settings.soundEnabled ? t('on') : t('off')}
        </button>
      </div>

      {/* Group 3: Visuals (Bottom) */}
      <div style={{ marginTop: '20px', padding: '24px 0', width: '100%' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: '900', 
          color: 'var(--text-secondary)', 
          opacity: 0.4,
          marginBottom: '24px', 
          letterSpacing: '3px', 
          fontFamily: 'Outfit, sans-serif',
          textTransform: 'uppercase',
          textAlign: 'center'
        }}>Appearance</div>
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {THEME_COLORS.map(theme => (
            <button
              key={theme.name}
              onClick={() => tracker.setSettings({ accentColor: theme.hex })}
              style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                background: theme.hex,
                border: tracker.settings.accentColor === theme.hex ? '3px solid var(--text-primary)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: tracker.settings.accentColor === theme.hex ? `0 0 20px ${theme.hex}` : 'none',
                transform: tracker.settings.accentColor === theme.hex ? 'scale(1.2)' : 'scale(1)'
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .name-box-elite:focus-within {
          border-color: var(--accent-color) !important;
          box-shadow: 0 0 15px rgba(0,229,160,0.1), inset 0 0 10px rgba(0,0,0,0.2) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
