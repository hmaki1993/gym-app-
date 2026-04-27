import React, { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../hooks/useGymTracker';
import { translations } from '../translations';
import { THEME_COLORS } from '../data/exercises';
import { Dumbbell } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onComplete: () => void;
}

export function OnboardingModal({ tracker, onComplete }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { y: 60, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
    }
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    tracker.setSettings({ userName: trimmed, weightUnit: unit, language });
    onComplete();
  };

  const t2 = (k: keyof typeof translations.en) => (translations[language] as any)[k] ?? k;

  return (
    <div className="modal-overlay" style={{ alignItems: 'center' }}>
      <div ref={ref} className="glass-panel" style={{ width: '90%', maxWidth: '380px', padding: '32px 28px', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(0,229,160,0.15), rgba(0,229,160,0.05))',
            border: '1.5px solid rgba(0,229,160,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(0,229,160,0.15)'
          }}>
            <Dumbbell size={36} color="var(--accent-color)" strokeWidth={1.5} />
          </div>
          <div className="logo-text" style={{ fontSize: '28px', display: 'block', textAlign: 'center' }}>GYMLOG</div>
          <div className="subtitle-text" style={{ textAlign: 'center' }}>{t2('premiumSystem')}</div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {t2('onboarding_sub')}
        </div>

        {/* Language first */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <div className="section-label" style={{ marginBottom: '8px' }}>{t2('language')}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ar', 'en'] as const).map(lg => (
              <button key={lg} onClick={() => setLanguage(lg)} className="glass-button"
                style={{
                  flex: 1, fontSize: '13px', fontWeight: '900',
                  border: `1.5px solid ${language === lg ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                  background: language === lg ? 'rgba(0,229,160,0.08)' : 'var(--glass-bg)',
                  color: language === lg ? 'var(--accent-color)' : 'var(--text-secondary)'
                }}>
                {lg === 'ar' ? 'عربي 🇪🇬' : 'English 🇬🇧'}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <div className="section-label" style={{ marginBottom: '8px' }}>{t2('onboarding_name')}</div>
          <input
            className="glass-input"
            placeholder={language === 'ar' ? 'اسمك هنا...' : 'Your name here...'}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          />
        </div>

        {/* Weight Unit */}
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <div className="section-label" style={{ marginBottom: '8px' }}>{t2('onboarding_unit')}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['kg', 'lbs'] as const).map(u => (
              <button key={u} onClick={() => setUnit(u)} className="glass-button"
                style={{
                  flex: 1, fontSize: '14px', fontWeight: '900',
                  border: `1.5px solid ${unit === u ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                  background: unit === u ? 'rgba(0,229,160,0.08)' : 'var(--glass-bg)',
                  color: unit === u ? 'var(--accent-color)' : 'var(--text-secondary)'
                }}>
                {u === 'kg' ? '⚖️ KG' : '🏋️ LBS'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} className="accent-button" style={{ width: '100%', fontSize: '16px' }}
          disabled={!name.trim()}>
          <Dumbbell size={16} /> {t2('letsGo')}
        </button>
      </div>
    </div>
  );
}
