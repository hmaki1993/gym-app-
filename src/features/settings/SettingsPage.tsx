import React, { useRef, useState } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { Target } from 'lucide-react';


interface Props {
  tracker: ReturnType<typeof useGymTracker>;
}




export function SettingsPage({ tracker }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const containerRef = useRef<HTMLDivElement>(null);
  const [localName, setLocalName] = useState(tracker.settings.userName);
  const [localEmail, setLocalEmail] = useState(tracker.settings.userEmail || '');
  const [localPassword, setLocalPassword] = useState(tracker.settings.userPassword || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Lock scroll and fix positioning when modal is open
  React.useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (showResetConfirm) {
      document.body.style.overflow = 'hidden';
      if (parent) {
        parent.style.transform = 'none';
        parent.style.perspective = 'none';
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { 
      document.body.style.overflow = 'unset';
    };
  }, [showResetConfirm]);

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '900',
    color: '#ff3d00',
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 8px'
  };

  const inputRowStyle: React.CSSProperties = {
    background: tracker.settings.themeMode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
    borderRadius: '16px',
    padding: '16px',
    borderTop: tracker.settings.themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderLeft: tracker.settings.themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderRight: tracker.settings.themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderBottom: '3px solid rgba(255, 61, 0, 0.3)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  };

  return (
    <>
      {/* Premium Reset Confirmation Overlay */}
      {showResetConfirm && (
        <div 
          onClick={() => setShowResetConfirm(false)}
          style={{
            position: 'fixed', inset: 0,
            zIndex: 999999, background: 'transparent',
            backdropFilter: 'blur(16px)', display: 'grid',
            placeItems: 'center', padding: '20px',
            WebkitBackdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="antigravity-card" 
            style={{
              maxWidth: '320px', width: '100%', padding: '40px 24px',
              textAlign: 'center', border: 'none',
              boxShadow: '0 0 80px rgba(255,0,0,0.3)',
              background: 'rgba(10, 0, 0, 0.98)', position: 'relative',
              animation: 'elite-expand 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
              borderRadius: '28px',
              margin: '0'
            }}
          >
            <div style={{ color: '#ff0000', marginBottom: '20px' }}>
              <Target size={52} style={{ filter: 'drop-shadow(0 0 15px #ff0000)' }} />
            </div>
            
            <h2 className="heading-font logo-underline" style={{ color: '#fff', fontSize: '26px', marginBottom: '16px' }}>
              {lang === 'ar' ? 'تصفير المصنع؟' : 'FACTORY RESET?'}
            </h2>
            
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
              {lang === 'ar' ? '⚠️ سيتم مسح كل بياناتك نهائياً!' : '⚠️ This will permanently delete all your data!'}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => tracker.resetAllData()}
                style={{
                  background: '#ff0000', color: '#fff', border: 'none',
                  padding: '16px', borderRadius: '18px', fontWeight: '950',
                  fontSize: '13px', letterSpacing: '2px', cursor: 'pointer',
                  boxShadow: '0 15px 30px rgba(255,0,0,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {lang === 'ar' ? 'تأكيد المسح' : 'CONFIRM RESET'}
              </button>
              
              <button 
                onClick={() => setShowResetConfirm(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: 'none',
                  padding: '14px', borderRadius: '18px', fontWeight: '800',
                  fontSize: '12px', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                {lang === 'ar' ? 'إلغاء' : 'CANCEL'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ 
        display: 'flex', flexDirection: 'column', 
        padding: '20px 20px 100px', gap: '20px',
        alignItems: 'center', width: '100%', boxSizing: 'border-box'
      }}>

      {/* SECTION 1: ACCOUNT PROFILE */}
      <div style={cardStyle}>
        <div style={labelStyle}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
          <span>{t('accountProfile')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={inputRowStyle} className="elite-input-wrapper">
            <div style={{ fontSize: '11px', fontWeight: '900', opacity: 0.6, letterSpacing: '1px', color: 'var(--text-primary)' }}>NICKNAME</div>
              <input
                style={{ background: 'none', border: 'none', fontSize: '17px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: 'Outfit' }}
                value={localName} onChange={e => setLocalName(e.target.value)} onBlur={() => tracker.setSettings({ userName: localName })}
              />
          </div>
          <div style={inputRowStyle} className="elite-input-wrapper">
            <div style={{ fontSize: '11px', fontWeight: '900', opacity: 0.6, letterSpacing: '1px', color: 'var(--text-primary)' }}>EMAIL</div>
              <input
                type="email" style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: 'Outfit' }}
                value={localEmail} onChange={e => setLocalEmail(e.target.value)} onBlur={() => tracker.setSettings({ userEmail: localEmail })}
              />
          </div>
          <div style={inputRowStyle} className="elite-input-wrapper">
            <div style={{ fontSize: '11px', fontWeight: '900', opacity: 0.6, letterSpacing: '1px', color: 'var(--text-primary)' }}>{t('password').toUpperCase()}</div>
              <input
                type="password" style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: 'Outfit' }}
                value={localPassword} onChange={e => setLocalPassword(e.target.value)} onBlur={() => tracker.setSettings({ userPassword: localPassword })}
              />
          </div>
        </div>
      </div>

      {/* SECTION 2: BODY METRICS */}
      <div style={cardStyle}>
        <div style={labelStyle}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
          <span>Body Composition</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Weight', key: 'weight', unit: 'kg' },
            { label: 'Height', key: 'height', unit: 'cm' },
            { label: 'Age', key: 'age', unit: '' }
          ].map(f => (
            <div key={f.key} style={{ ...inputRowStyle, padding: '10px 12px' }} className="elite-input-wrapper">
              <div style={{ fontSize: '10px', fontWeight: '900', opacity: 0.6, color: 'var(--text-primary)' }}>{f.label.toUpperCase()}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <input 
                  type="number" defaultValue={(tracker.settings.nutritionProfile as any)?.[f.key] || 0}
                  onBlur={(e) => tracker.setSettings({ nutritionProfile: { ...tracker.settings.nutritionProfile, [f.key]: Number(e.target.value) } as any })}
                  style={{ background: 'none', border: 'none', fontSize: '16px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: 'Outfit' }}
                />
                <span style={{ fontSize: '8px', fontWeight: '900', opacity: 0.3 }}>{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '9px', fontWeight: '900', opacity: 0.4, letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>BIOLOGICAL GENDER</div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {(['male', 'female'] as const).map(g => (
              <button key={g} onClick={() => tracker.setSettings({ nutritionProfile: { ...tracker.settings.nutritionProfile, gender: g } as any })} style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer',
                background: tracker.settings.nutritionProfile?.gender === g ? '#ff3d00' : 'transparent',
                color: tracker.settings.nutritionProfile?.gender === g ? '#000' : (tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.75)'),
                transition: 'all 0.3s ease'
              }}>{g.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: FITNESS GOAL */}
      <div style={cardStyle}>
        <div style={labelStyle}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
          <span>Fitness Strategy</span>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {(['lose', 'maintain', 'gain'] as const).map(g => (
            <button key={g} onClick={() => tracker.setSettings({ 
              nutritionProfile: { ...tracker.settings.nutritionProfile, goal: g, goalRate: g === 'maintain' ? 0 : (tracker.settings.nutritionProfile?.goalRate || 0.5) } as any 
            })} style={{
              flex: 1, padding: '12px 0', border: 'none', borderRadius: '10px', fontSize: '9px', fontWeight: '900', cursor: 'pointer',
              background: tracker.settings.nutritionProfile?.goal === g ? '#ff3d00' : 'transparent',
              color: tracker.settings.nutritionProfile?.goal === g ? '#000' : (tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.75)'),
              transition: 'all 0.3s ease'
            }}>{g.toUpperCase()}</button>
          ))}
        </div>

        {/* CALORIE TARGET DISPLAY */}
        <div style={{ 
          marginTop: '8px', padding: '24px', background: 'transparent', 
          borderBottom: '2px solid #ff3d00',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: '0 10px 20px -10px rgba(255, 61, 0, 0.2)'
        }}>
          <div style={{ fontSize: '9px', fontWeight: '900', color: '#ff3d00', letterSpacing: '3px', marginBottom: '4px', opacity: 0.6 }}>DAILY TARGET</div>
          <div style={{ fontSize: '48px', fontWeight: '900', color: tracker.settings.themeMode === 'dark' ? '#fff' : '#000', fontFamily: 'Outfit', letterSpacing: '-2px' }}>
            {(() => {
              const p = tracker.settings.nutritionProfile;
              if (!p?.weight || !p?.height || !p?.age) return '0';
              const bmr = p.gender === 'male' ? (10 * p.weight) + (6.25 * p.height) - (5 * p.age) + 5 : (10 * p.weight) + (6.25 * p.height) - (5 * p.age) - 161;
              const tdee = Math.round(bmr * 1.375);
              const deficit = (p.goalRate || 0.5) * 1100;
              const target = p.goal === 'lose' ? tdee - deficit : p.goal === 'gain' ? tdee + deficit : tdee;
              return Math.round(target);
            })()}
            <span style={{ fontSize: '14px', fontWeight: '800', opacity: 0.3, marginLeft: '6px', letterSpacing: '1px' }}>KCAL</span>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, gap: '15px' }}>
         <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
            <span>Appearance</span>
          </div>
         <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '4px', width: '100%', border: '1px solid rgba(255,255,255,0.05)' }}>
            {(['dark', 'light'] as const).map(mode => (
              <button key={mode} onClick={() => tracker.setSettings({ themeMode: mode })} style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '900', cursor: 'pointer',
                background: tracker.settings.themeMode === mode ? '#ff3d00' : 'transparent', 
                color: tracker.settings.themeMode === mode ? '#000' : (tracker.settings.themeMode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.75)'),
                transition: 'all 0.3s ease'
              }}>{mode.toUpperCase()}</button>
            ))}
         </div>


         <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                console.log('Reset Clicked');
                setShowResetConfirm(true);
              }}
              style={{
                background: 'rgba(255, 0, 0, 0.05)', border: '1.5px solid #ff0000', color: '#ff0000',
                padding: '8px 20px', borderRadius: '12px', fontSize: '10px', fontWeight: '950',
                textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
                boxShadow: '0 0 15px rgba(255, 0, 0, 0.1)', transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ff0000'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 0, 0, 0.05)'; e.currentTarget.style.color = '#ff0000'; }}
            >
              {lang === 'ar' ? 'تصفير المصنع' : 'FACTORY RESET'}
            </button>
         </div>
      </div>

      <style>{`
        .elite-input-wrapper:focus-within {
          border-color: var(--accent-color) !important;
          background: rgba(var(--theme-rgb), 0.06) !important;
        }
      `}</style>
      </div>
    </>
  );
}
