import { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { ChevronDown, Check, ChevronRight } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onComplete: () => void;
}

function EliteSelect({ id, defaultValue, options }: { id: string, defaultValue: string, options: { value: string, label: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options.find(o => o.value === defaultValue) || options[0]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input type="hidden" id={id} value={selected.value} />
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '16px', color: '#fff', fontWeight: '800', fontSize: '15px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          transition: 'all 0.3s ease', fontFamily: 'Outfit'
        }}
      >
        {selected.label}
        <ChevronDown size={18} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
      </div>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 2000,
            background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            animation: 'slide-up 0.2s ease-out'
          }}>
            {options.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { setSelected(opt); setIsOpen(false); }}
                style={{
                  padding: '12px 16px', borderRadius: '12px', color: '#fff', fontSize: '14px',
                  fontWeight: selected.value === opt.value ? '900' : '600',
                  background: selected.value === opt.value ? 'rgba(0,255,170,0.1)' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                {opt.label}
                {selected.value === opt.value && <Check size={14} color="var(--accent-color)" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OnboardingModal({ tracker, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { y: 60, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
    }
  }, [step]);

  const handleFinalSubmit = () => {
    const weight = Number((document.getElementById('setup-weight') as HTMLInputElement).value);
    const height = Number((document.getElementById('setup-height') as HTMLInputElement).value);
    const age = Number((document.getElementById('setup-age') as HTMLInputElement).value);
    const gender = (document.getElementById('setup-gender') as HTMLInputElement).value as any;
    const goal = (document.getElementById('setup-goal') as HTMLInputElement).value as any;

    tracker.setSettings({ 
      userName: name.trim(), 
      language,
      nutritionProfile: {
        weight, height, age, gender, goal,
        activityLevel: 1.375,
        goalRate: goal === 'maintain' ? 0 : 0.5,
        proteinRatio: goal === 'gain' ? 35 : 30,
        carbsRatio: 40,
        fatsRatio: goal === 'lose' ? 20 : 30
      }
    });
    onComplete();
  };

  const t2 = (k: keyof typeof translations.en) => (translations[language] as any)[k] ?? k;

  return (
    <div className="modal-overlay" style={{ alignItems: 'center', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}>
      <div ref={ref} style={{ 
        width: '94%', 
        maxWidth: '440px', 
        padding: '40px 32px', 
        background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
        borderRadius: '40px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        overflow: 'visible'
      }}>
        
        {step === 1 && (
          <div style={{ animation: 'slide-up 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div className="logo-text" style={{ fontSize: '32px', marginBottom: '8px' }}>GYMLOG</div>
              <div style={{ width: '40px', height: '3px', background: 'var(--accent-color)', margin: '0 auto', borderRadius: '2px' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '12px', letterSpacing: '2px' }}>{t2('language').toUpperCase()}</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['ar', 'en'] as const).map(lg => (
                  <button key={lg} onClick={() => setLanguage(lg)}
                    style={{
                      flex: 1, padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: '900', transition: 'all 0.3s ease',
                      border: `1px solid ${language === lg ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}`,
                      background: language === lg ? 'rgba(0,255,170,0.1)' : 'rgba(255,255,255,0.03)',
                      color: language === lg ? 'var(--accent-color)' : '#fff'
                    }}>
                    {lg === 'ar' ? 'عربي' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '12px', letterSpacing: '2px' }}>{t2('onboarding_name').toUpperCase()}</label>
              <input
                placeholder="..."
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: '#fff', fontWeight: '800', fontSize: '18px', outline: 'none', textAlign: 'center' }}
              />
            </div>

            <button 
              onClick={() => name.trim() && setStep(2)}
              style={{ width: '100%', padding: '20px', borderRadius: '20px', background: 'var(--accent-color)', border: 'none', color: '#000', fontWeight: '950', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '2px', opacity: name.trim() ? 1 : 0.3, transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'slide-up 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '950', color: '#fff', marginBottom: '8px', fontFamily: 'Outfit' }}>Smart Setup</h2>
              <div style={{ width: '40px', height: '3px', background: 'var(--accent-color)', margin: '0 auto', borderRadius: '2px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { id: 'setup-weight', label: 'Weight', val: 80, unit: 'kg' },
                { id: 'setup-height', label: 'Height', val: 180, unit: 'cm' },
                { id: 'setup-age', label: 'Age', val: 25, unit: 'yr' }
              ].map(field => (
                <div key={field.id}>
                  <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '8px', letterSpacing: '1px', opacity: 0.7 }}>{field.label.toUpperCase()}</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" defaultValue={field.val} id={field.id}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px', color: '#fff', fontWeight: '800', fontSize: '15px', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '9px', fontWeight: '900', opacity: 0.3 }}>{field.unit}</span>
                  </div>
                </div>
              ))}
              <div>
                <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '8px', letterSpacing: '1px', opacity: 0.7 }}>GENDER</label>
                <EliteSelect id="setup-gender" defaultValue="male" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '8px', letterSpacing: '1px', opacity: 0.7 }}>FITNESS GOAL</label>
              <EliteSelect id="setup-goal" defaultValue="maintain" options={[
                { value: 'lose', label: 'Lose Weight (Cutting)' },
                { value: 'maintain', label: 'Maintain Weight' },
                { value: 'gain', label: 'Gain Weight (Bulking)' }
              ]} />
            </div>

            <button 
              onClick={handleFinalSubmit}
              style={{ width: '100%', padding: '20px', borderRadius: '20px', background: 'var(--accent-color)', border: 'none', color: '#000', fontWeight: '950', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 10px 20px rgba(0, 255, 170, 0.2)' }}
            >
              Finish Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
