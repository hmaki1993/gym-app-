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

  const getLabelStyle = (color: string): React.CSSProperties => ({
    fontSize: '11px',
    fontWeight: '900',
    color: color,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 8px'
  });

  const inputRowStyle: React.CSSProperties = {
    background: 'rgba(var(--theme-rgb), 0.16)',
    borderRadius: '14px',
    padding: '16px',
    border: 'none',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  };

  return (
    <>
      {showResetConfirm && (
        <div 
          onClick={() => setShowResetConfirm(false)}
          style={{
            position: 'fixed', inset: 0,
            zIndex: 999999, background: tracker.settings.themeMode === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(15px)',
            display: 'grid',
            placeItems: 'center', padding: '20px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="antigravity-card" 
            style={{
              maxWidth: '320px', width: '100%', padding: '40px 24px',
              textAlign: 'center', border: '1px solid var(--glass-border)',
              background: 'var(--modal-bg)', position: 'relative',
              animation: 'elite-expand 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
              borderRadius: '28px',
              margin: '0',
              boxShadow: 'var(--elite-shadow)'
            }}
          >
            <div style={{ color: '#ff0000', marginBottom: '20px' }}>
              <Target size={52} />
            </div>
            <h2 className="heading-font logo-underline" style={{ color: 'var(--text-primary)', fontSize: '26px', marginBottom: '16px' }}>
              {t('factoryReset')}
            </h2>
            <p style={{ color: 'rgba(var(--theme-rgb), 0.7)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
              {t('resetWarning')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button onClick={() => tracker.resetAllData()} style={{ background: '#FF3B30', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '18px', fontWeight: '950', fontSize: '13px', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                {t('confirmReset')}
              </button>
              <button onClick={() => setShowResetConfirm(false)} style={{ background: 'rgba(var(--theme-rgb), 0.18)', color: 'var(--text-primary)', border: 'none', padding: '14px', borderRadius: '18px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', padding: '20px 20px 0', gap: '20px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
        <div style={cardStyle}>
          <div style={getLabelStyle('var(--accent-color)')}>
            <img src="/assets/settings-profile.png" alt="Profile" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <img src={tracker.settings.themeMode === 'light' ? "/assets/arrow-orange.png" : "/assets/arrow-green.png"} alt="Arrow" style={{ height: '14px', width: 'auto', objectFit: 'contain', marginRight: '8px' }} />
            <span>{t('accountProfile')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ ...inputRowStyle }} className="elite-input-wrapper">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#E67E22',
                  opacity: 0.65,
                  WebkitMask: 'url(/assets/settings-avatar.png) no-repeat center / contain',
                  mask: 'url(/assets/settings-avatar.png) no-repeat center / contain',
                  display: 'inline-block',
                  flexShrink: 0
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', opacity: 0.9, letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                    <span>{t('userName').toUpperCase()}</span>
                  </div>
                  <input style={{ background: 'none', border: 'none', fontSize: '17px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : 'var(--text-primary)', outline: 'none', width: '100%', fontFamily: "var(--heading-font)" }} value={localName} onChange={e => setLocalName(e.target.value)} onBlur={() => tracker.setSettings({ userName: localName })} />
                </div>
                {(localName.trim() && localName === (tracker.settings.userName || '')) ? (
                  <div style={{ width: '20px', height: '20px', backgroundColor: '#E67E22', opacity: 0.9, WebkitMask: 'url(/assets/check-custom.png) center / contain no-repeat', mask: 'url(/assets/check-custom.png) center / contain no-repeat', flexShrink: 0 }} />
                ) : null}
              </div>
            </div>
            <div style={{ ...inputRowStyle }} className="elite-input-wrapper">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#E67E22',
                  opacity: 0.65,
                  WebkitMask: 'url(/assets/settings-email.png) no-repeat center / contain',
                  mask: 'url(/assets/settings-email.png) no-repeat center / contain',
                  display: 'inline-block',
                  flexShrink: 0
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', opacity: 0.9, letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                    <span>{t('email' as any).toUpperCase()}</span>
                  </div>
                  <input type="email" style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : 'var(--text-primary)', outline: 'none', width: '100%', fontFamily: "var(--heading-font)" }} value={localEmail} onChange={e => setLocalEmail(e.target.value)} onBlur={() => tracker.setSettings({ userEmail: localEmail })} />
                </div>
                {(localEmail.trim() && localEmail === (tracker.settings.userEmail || '')) ? (
                  <div style={{ width: '20px', height: '20px', backgroundColor: '#E67E22', opacity: 0.9, WebkitMask: 'url(/assets/check-custom.png) center / contain no-repeat', mask: 'url(/assets/check-custom.png) center / contain no-repeat', flexShrink: 0 }} />
                ) : null}
              </div>
            </div>
            <div style={{ ...inputRowStyle }} className="elite-input-wrapper">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#E67E22',
                  opacity: 0.65,
                  WebkitMask: 'url(/assets/settings-lock.png) no-repeat center / contain',
                  mask: 'url(/assets/settings-lock.png) no-repeat center / contain',
                  display: 'inline-block',
                  flexShrink: 0
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', opacity: 0.9, letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                    <span>{t('password').toUpperCase()}</span>
                  </div>
                  <input type="password" style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : 'var(--text-primary)', outline: 'none', width: '100%', fontFamily: "var(--heading-font)" }} value={localPassword} onChange={e => setLocalPassword(e.target.value)} onBlur={() => tracker.setSettings({ userPassword: localPassword })} />
                </div>
                {(localPassword.trim() && localPassword === (tracker.settings.userPassword || '')) ? (
                  <div style={{ width: '20px', height: '20px', backgroundColor: '#E67E22', opacity: 0.9, WebkitMask: 'url(/assets/check-custom.png) center / contain no-repeat', mask: 'url(/assets/check-custom.png) center / contain no-repeat', flexShrink: 0 }} />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={getLabelStyle('var(--accent-color)')}>
            <img src="/assets/settings-body.png" alt="Body Composition" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <img src={tracker.settings.themeMode === 'light' ? "/assets/arrow-orange.png" : "/assets/arrow-green.png"} alt="Arrow" style={{ height: '14px', width: 'auto', objectFit: 'contain', marginRight: '8px' }} />
            <span>{t('bodyComposition' as any)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { labelKey: 'bodyWeight', key: 'weight', unit: 'kg', icon: '/assets/settings-weight.png' },
              { labelKey: 'height', key: 'height', unit: 'cm', icon: '/assets/settings-height.png' },
              { labelKey: 'age', key: 'age', unit: '', icon: '/assets/settings-age.png' }
            ].map(f => (
              <div key={f.key} style={{ ...inputRowStyle, padding: '12px' }} className="elite-input-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: '#E67E22',
                    WebkitMask: `url(${f.icon}) no-repeat center / contain`,
                    mask: `url(${f.icon}) no-repeat center / contain`,
                    display: 'inline-block',
                    flexShrink: 0
                  }} />
                  <div style={{ fontSize: '11px', fontWeight: '900', opacity: 1, color: 'var(--text-secondary)' }}>{t(f.labelKey as any).toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <input type="number" defaultValue={(tracker.settings.nutritionProfile as any)?.[f.key] || 0} onBlur={(e) => tracker.setSettings({ nutritionProfile: { ...tracker.settings.nutritionProfile, [f.key]: Number(e.target.value) } as any })} style={{ background: 'none', border: 'none', fontSize: '20px', fontWeight: '800', color: tracker.settings.themeMode === 'dark' ? '#fff' : 'var(--text-primary)', outline: 'none', width: '100%', fontFamily: "var(--heading-font)" }} />
                  {f.unit && <span style={{ fontSize: '10px', fontWeight: '900', opacity: 0.8 }}>{t(f.unit as any)}</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: '950', opacity: 0.8, letterSpacing: '2px', marginBottom: '16px' }}>{t('gender').toUpperCase()}</div>
            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center' }}>
              {(['male', 'female'] as const).map(g => (
                <button key={g} onClick={() => tracker.setSettings({ nutritionProfile: { ...tracker.settings.nutritionProfile, gender: g } as any })} style={{ padding: '0', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: tracker.settings.nutritionProfile?.gender === g ? 1 : 0.3, transform: tracker.settings.nutritionProfile?.gender === g ? 'scale(1.15)' : 'scale(0.9)' }}>
                  <img src={`/assets/settings-${g}.png`} alt={g} style={{ width: '64px', height: '64px', objectFit: 'contain', filter: tracker.settings.nutritionProfile?.gender === g ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' : 'none' }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={getLabelStyle('var(--accent-color)')}>
            <img src="/assets/settings-strategy.png" alt="Strategy" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <img src={tracker.settings.themeMode === 'light' ? "/assets/arrow-orange.png" : "/assets/arrow-green.png"} alt="Arrow" style={{ height: '14px', width: 'auto', objectFit: 'contain', marginRight: '8px' }} />
            <span>{t('fitnessStrategy' as any)}</span>
          </div>
          <div style={{ display: 'flex', background: 'rgba(var(--theme-rgb), 0.16)', borderRadius: '14px', padding: '4px' }}>
            {(['lose', 'maintain', 'gain'] as const).map(g => (
              <button key={g} onClick={() => tracker.setSettings({ nutritionProfile: { ...tracker.settings.nutritionProfile, goal: g, goalRate: g === 'maintain' ? 0 : (tracker.settings.nutritionProfile?.goalRate || 0.5) } as any })} style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: '10px', fontSize: '9px', fontWeight: '950', cursor: 'pointer', background: tracker.settings.nutritionProfile?.goal === g ? 'rgba(230, 126, 34, 0.18)' : 'transparent', color: tracker.settings.nutritionProfile?.goal === g ? '#E67E22' : ('rgba(var(--theme-rgb), 0.4)'), transition: 'all 0.3s ease' }}>{t(g as any).toUpperCase()}</button>
            ))}
          </div>
          <div style={{ marginTop: '8px', padding: '16px 24px 12px', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--accent-secondary)', letterSpacing: '3px', marginBottom: '4px', opacity: 0.85, textAlign: 'center', width: '100%' }}>{t('dailyTarget').toUpperCase()}</div>
            <div style={{ fontSize: '48px', fontWeight: '950', color: tracker.settings.themeMode === 'dark' ? '#fff' : 'var(--text-primary)', fontFamily: "var(--heading-font)", letterSpacing: '-2px', textAlign: 'center', width: '100%' }}>
              {(() => {
                const p = tracker.settings.nutritionProfile;
                if (!p?.weight || !p?.height || !p?.age) return '0';
                const bmr = p.gender === 'male' ? (10 * p.weight) + (6.25 * p.height) - (5 * p.age) + 5 : (10 * p.weight) + (6.25 * p.height) - (5 * p.age) - 161;
                const tdee = Math.round(bmr * 1.375);
                const deficit = (p.goalRate || 0.5) * 1100;
                const target = p.goal === 'lose' ? tdee - deficit : p.goal === 'gain' ? tdee + deficit : tdee;
                return Math.round(target);
              })()}
              <span style={{ fontSize: '14px', fontWeight: '800', opacity: 0.7, marginLeft: '6px', letterSpacing: '1px' }}>{t('kcal')}</span>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, gap: '15px', marginBottom: '8px' }}>
          <div style={getLabelStyle('var(--accent-color)')}>
            <img src="/assets/settings-appearance.png" alt="Appearance" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <img src={tracker.settings.themeMode === 'light' ? "/assets/arrow-orange.png" : "/assets/arrow-green.png"} alt="Arrow" style={{ height: '14px', width: 'auto', objectFit: 'contain', marginRight: '8px' }} />
            <span>{t('themeMode')}</span>
          </div>
          <div style={{ display: 'flex', background: 'rgba(var(--theme-rgb), 0.16)', borderRadius: '16px', padding: '4px', width: '100%' }}>
            {(['dark', 'light', 'system'] as const).map(mode => (
              <button key={mode} onClick={() => tracker.setSettings({ themeMode: mode })} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '950', cursor: 'pointer', background: tracker.settings.themeMode === mode ? 'rgba(230, 126, 34, 0.18)' : 'transparent', color: tracker.settings.themeMode === mode ? '#E67E22' : ('rgba(var(--theme-rgb), 0.4)'), transition: 'all 0.3s ease' }}>{t(mode as any).toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={{ paddingBottom: '30px', paddingTop: '0px', display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
          <img
            src="/assets/button-reset.png"
            alt="Factory Reset"
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              opacity: 0.85
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        </div>
      </div>
      <style>{`.elite-input-wrapper:focus-within { background: rgba(var(--theme-rgb), 0.1) !important; }`}</style>
    </>
  );
}
