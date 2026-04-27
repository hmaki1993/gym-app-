import React, { useRef, useEffect } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import { translations } from '../translations';
import { THEME_COLORS } from '../data/exercises';
import { Volume2, VolumeX, Settings } from 'lucide-react';
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
    setLocalName(tracker.settings.userName);
  }, [tracker.settings.userName]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, []);

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
      <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Account Section */}
      <div style={{ padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Settings size={14} color="var(--accent-color)" />
          <span className="section-label">{t('settings')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Row label={t('userName')}>
            <input
              style={{
                background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '4px 0', fontSize: '15px', fontWeight: '800', color: '#fff',
                outline: 'none', width: '160px', textAlign: lang === 'ar' ? 'right' : 'left',
                fontFamily: 'Outfit'
              }}
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              onBlur={() => tracker.setSettings({ userName: localName })}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="..."
            />
          </Row>

          <Row label={t('language')}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {(['ar', 'en'] as const).map((lg, idx) => (
                <React.Fragment key={lg}>
                  {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.05)', margin: '0 12px' }}>|</span>}
                  <button
                    onClick={() => tracker.setSettings({ language: lg })}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '900',
                      color: tracker.settings.language === lg ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.2s ease', padding: '6px'
                    }}
                  >
                    {lg === 'ar' ? 'عربي' : 'ENGLISH'}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </Row>

          <Row label={t('weightUnit')}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {(['kg', 'lbs'] as const).map((u, idx) => (
                <React.Fragment key={u}>
                  {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.05)', margin: '0 12px' }}>|</span>}
                  <button
                    onClick={() => tracker.setSettings({ weightUnit: u })}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '900',
                      color: tracker.settings.weightUnit === u ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.2s ease', padding: '6px'
                    }}
                  >
                    {u.toUpperCase()}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </Row>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />

      {/* Preferences Section */}
      <div style={{ padding: '0 4px' }}>
        <div style={{ marginBottom: '12px' }}>
          <span className="section-label">TRAINING PREFERENCES</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Row label={t('defaultRest')}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[45, 60, 90, 120, 180].map((s, idx) => (
                <React.Fragment key={s}>
                  {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.05)', margin: '0 8px' }}>|</span>}
                  <button
                    onClick={() => tracker.setSettings({ defaultRestSeconds: s })}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: '900',
                      color: tracker.settings.defaultRestSeconds === s ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.2s ease', padding: '4px'
                    }}
                  >
                    {s}s
                  </button>
                </React.Fragment>
              ))}
            </div>
          </Row>

          <Row label={t('sound')}>
            <button
              onClick={() => tracker.setSettings({ soundEnabled: !tracker.settings.soundEnabled })}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: '900',
                color: tracker.settings.soundEnabled ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px'
              }}
            >
              {tracker.settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {tracker.settings.soundEnabled ? t('ON') : t('OFF')}
            </button>
          </Row>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />

      {/* Theme Colors */}
      <div style={{ padding: '0 4px' }}>
        <div className="section-label" style={{ marginBottom: '14px', fontSize: '10px' }}>APPEARANCE</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {THEME_COLORS.map(theme => (
            <button
              key={theme.hex}
              className={`color-dot-btn ${tracker.settings.accentColor === theme.hex ? 'active' : ''}`}
              style={{ 
                width: '28px', height: '28px',
                background: theme.hex, 
                border: tracker.settings.accentColor === theme.hex ? `2px solid #fff` : '2px solid transparent',
                boxShadow: tracker.settings.accentColor === theme.hex ? `0 0 10px ${theme.hex}` : 'none'
              }}
              onClick={() => tracker.setSettings({ accentColor: theme.hex })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
