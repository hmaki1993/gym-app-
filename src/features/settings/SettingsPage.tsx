import React, { useRef } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { THEME_COLORS } from '../../data/exercises';


interface Props {
  tracker: ReturnType<typeof useGymTracker>;
}




export function SettingsPage({ tracker }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const containerRef = useRef<HTMLDivElement>(null);
  const [localName, setLocalName] = React.useState(tracker.settings.userName);

  // Entrance animation removed to ensure instant feel
  /*
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);
  */

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


        {/* Personal Metrics Frame - Minimalist Rewrite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', width: '100%', maxWidth: '340px', marginTop: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '950', color: 'var(--accent-color)', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>Personal Metrics</span>
            <div style={{ width: '30px', height: '2px', background: 'var(--accent-color)', margin: '8px auto', opacity: 0.3 }} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>
            {[
              { label: 'Weight', unit: 'KG', key: 'weight', def: 80 },
              { label: 'Height', unit: 'CM', key: 'height', def: 180 },
              { label: 'Age', unit: '', key: 'age', def: 25 }
            ].map(field => (
              <div key={field.key}>
                 <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.4, display: 'block', marginBottom: '8px', letterSpacing: '1px', color: 'var(--text-secondary)' }}>{field.label.toUpperCase()} {field.unit && `(${field.unit})`}</label>
                 <input 
                   type="number" defaultValue={(tracker.settings.nutritionProfile as any)?.[field.key] || field.def}
                   onBlur={(e) => tracker.setSettings({ nutritionProfile: { ...tracker.settings.nutritionProfile, [field.key]: Number(e.target.value) } as any })}
                   style={{ 
                     width: '100%', background: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', 
                     borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                     borderRadius: '0', padding: '12px 0', color: '#fff', fontSize: '18px', fontWeight: '950', outline: 'none', fontFamily: 'Outfit' 
                   }}
                 />
              </div>
            ))}
            <div>
               <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.4, display: 'block', marginBottom: '8px', letterSpacing: '1px', color: 'var(--text-secondary)' }}>GENDER</label>
               <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                 {(['male', 'female'] as const).map(g => (
                    <button 
                      key={g}
                      onClick={() => tracker.setSettings({ nutritionProfile: { ...tracker.settings.nutritionProfile, gender: g } as any })}
                      style={{
                        padding: '8px 14px', borderRadius: '12px', fontSize: '10px', fontWeight: '950', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                        background: tracker.settings.nutritionProfile?.gender === g ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                        color: tracker.settings.nutritionProfile?.gender === g ? '#000' : 'rgba(255,255,255,0.3)',
                        boxShadow: tracker.settings.nutritionProfile?.gender === g ? '0 5px 15px rgba(0,255,170,0.2)' : 'none'
                      }}
                    >
                      {g.toUpperCase()}
                    </button>
                 ))}
               </div>
            </div>
          </div>

          <div style={{ width: '100%', padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.4, display: 'block', marginBottom: '16px', letterSpacing: '1px', textAlign: 'center' }}>FITNESS GOAL</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {(['lose', 'maintain', 'gain'] as const).map(g => (
                <button 
                  key={g}
                  onClick={() => tracker.setSettings({ 
                    nutritionProfile: { 
                      ...tracker.settings.nutritionProfile, 
                      goal: g,
                      goalRate: g === 'maintain' ? 0 : (tracker.settings.nutritionProfile?.goalRate || 0.5)
                    } as any 
                  })}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: '14px', fontSize: '11px', fontWeight: '950', cursor: 'pointer', transition: 'all 0.3s ease',
                    background: tracker.settings.nutritionProfile?.goal === g ? 'rgba(0, 255, 170, 0.1)' : 'transparent',
                    border: tracker.settings.nutritionProfile?.goal === g ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.05)',
                    color: tracker.settings.nutritionProfile?.goal === g ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {tracker.settings.nutritionProfile?.goal !== 'maintain' && (
            <div style={{ width: '100%', animation: 'slide-up 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <label style={{ fontSize: '10px', fontWeight: '900', opacity: 0.4, display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>
                  {tracker.settings.nutritionProfile?.goal === 'lose' ? 'WEIGHT LOSS RATE' : 'WEIGHT GAIN RATE'}
                </label>
                <div style={{ fontSize: '12px', fontWeight: '950', color: 'var(--accent-color)' }}>
                  {tracker.settings.nutritionProfile?.goalRate || 0.5} KG / WEEK
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {([0.25, 0.5, 0.75, 1.0] as const).map(r => (
                  <button 
                    key={r}
                    onClick={() => tracker.setSettings({ nutritionProfile: { ...tracker.settings.nutritionProfile, goalRate: r } as any })}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: '12px', fontSize: '10px', fontWeight: '950', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                      background: tracker.settings.nutritionProfile?.goalRate === r ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                      color: tracker.settings.nutritionProfile?.goalRate === r ? '#000' : 'rgba(255,255,255,0.3)',
                      transform: tracker.settings.nutritionProfile?.goalRate === r ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Calories Display - Ultra Minimal */}
          <div style={{ 
            width: '100%', padding: '32px 0', textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '950', color: 'var(--accent-color)', opacity: 0.5, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Daily Target</div>
            <div style={{ fontSize: '48px', fontWeight: '950', color: '#fff', fontFamily: 'Outfit', letterSpacing: '-1px' }}>
              {(() => {
                const p = tracker.settings.nutritionProfile;
                if (!p?.weight || !p?.height || !p?.age) return '0';
                const bmr = p.gender === 'male' 
                  ? (10 * p.weight) + (6.25 * p.height) - (5 * p.age) + 5
                  : (10 * p.weight) + (6.25 * p.height) - (5 * p.age) - 161;
                const tdee = Math.round(bmr * 1.375);
                const rate = p.goalRate || 0.5;
                const deficit = rate * 1100; // ~7700 kcal per kg / 7 days
                const target = p.goal === 'lose' ? tdee - deficit : p.goal === 'gain' ? tdee + deficit : tdee;
                return Math.round(target);
              })()}
              <span style={{ fontSize: '14px', opacity: 0.3, marginLeft: '8px', fontWeight: '800' }}>KCAL</span>
            </div>
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
