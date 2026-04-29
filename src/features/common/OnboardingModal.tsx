import { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { Dumbbell } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onComplete: () => void;
}

export function OnboardingModal({ tracker, onComplete }: Props) {



  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
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
    <div className="modal-overlay" style={{ alignItems: 'center', background: 'rgba(0,0,0,0.8)' }}>
      <div ref={ref} style={{ 
        width: '92%', 
        maxWidth: '380px', 
        padding: '36px 28px', 
        textAlign: 'center',
        background: '#111114',
        borderRadius: '28px',
        border: '1.5px solid var(--accent-color)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px var(--accent-color-alpha)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '24px' }}>
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
                  background: language === lg ? 'var(--accent-color-alpha)' : 'var(--glass-bg)',
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
            placeholder={language === 'ar' ? 'اسمك...' : 'Your name...'}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          />
        </div>


        <button 
          onClick={handleSubmit} 
          style={{ 
            width: '100%', 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--accent-color)', 
            fontSize: '18px', 
            fontWeight: '800', 
            fontFamily: 'Syne, sans-serif', 
            textTransform: 'uppercase', 
            letterSpacing: '12px', 
            cursor: 'pointer', 
            marginTop: '40px',
            animation: 'pulse-glow 2.5s ease-in-out infinite',
            outline: 'none'
          }}
          disabled={!name.trim()}
        >
          {t2('letsGo')}
        </button>
      </div>
    </div>
  );
}
