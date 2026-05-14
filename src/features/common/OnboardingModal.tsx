import React, { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { Dumbbell } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ tracker, onComplete }) => {
  const [name, setName] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 1, ease: 'power2.out' }
      );
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.setProperty('--accent-color', '#ff3d00'); // Default rocket color
    root.style.setProperty('--accent-secondary', '#ff5e00');
    root.style.setProperty('--accent-color-alpha', 'rgba(255, 61, 0, 0.2)');
  }, [theme]);

  const targetMacros = (() => {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    if (!w || !h || !a) return null;

    const bmr = gender === 'male'
      ? (10 * w + 6.25 * h - 5 * a + 5)
      : (10 * w + 6.25 * h - 5 * a - 161);
    
    const tdee = bmr * 1.375;
    let calories = tdee;
    
    if (goal !== 'maintain') {
      const adjustment = 500; // Average adjustment
      calories = goal === 'lose' ? tdee - adjustment : tdee + adjustment;
    }

    return { calories: Math.round(calories) };
  })();

  const handleFinish = () => {
    if (!name.trim()) return;
    
    tracker.setSettings({
      userName: name.trim(),
      language: lang,
      nutritionProfile: {
        weight: Number(weight) || 80,
        height: Number(height) || 180,
        age: Number(age) || 25,
        gender: gender,
        goal: goal,
        activityLevel: 1.375,
        goalRate: goal === 'maintain' ? 0 : 0.5,
        proteinRatio: goal === 'gain' ? 35 : 30,
        carbsRatio: 40,
        fatsRatio: goal === 'lose' ? 20 : 30
      } as any,
      themeMode: theme,
      accentColor: '#ff3d00',
      accentSecondary: '#ff5e00'
    });
    onComplete();
  };

  const sectionStyle: React.CSSProperties = { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '35px' };
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '900', color: '#ff3d00', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' };
  const cardStyle: React.CSSProperties = { 
    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)', 
    borderRadius: '16px', padding: '16px', 
    borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderLeft: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderRight: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderBottom: '3px solid rgba(255, 61, 0, 0.3)',
    transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '6px' 
  };

  return (
    <div className="modal-overlay hide-scrollbar" style={{ alignItems: 'flex-start', background: theme === 'dark' ? '#050505' : '#f8f9fa', overflowY: 'auto', padding: '40px 20px', zIndex: 20000, transition: 'background 0.5s ease' }}>
      <div ref={containerRef} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* LOGO SECTION */}
        <div style={{ textAlign: 'center', marginBottom: '60px', width: '100%' }}>
          <div style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}>
            <h1 className="heading-font" style={{ margin: 0, fontSize: '38px', letterSpacing: '-1px', textTransform: 'uppercase', fontWeight: 950, lineHeight: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#a0a0a0' }}>POWER</span>
              <div style={{ margin: '0 10px', color: '#ff3d00', filter: 'drop-shadow(0 0 12px rgba(255, 61, 0, 0.4))', display: 'flex', alignItems: 'center' }}>
                <Dumbbell size={28} strokeWidth={3} className="pulse-elite" />
              </div>
              <span style={{ color: '#ff3d00' }}>GRID</span>
            </h1>
            <div style={{ fontSize: '13px', color: '#ff3d00', fontWeight: '950', letterSpacing: '8px', marginTop: '16px', textTransform: 'uppercase' }}>
              {lang === 'ar' ? 'الإعداد الذكي' : 'SMART SETUP'}
            </div>
          </div>
        </div>

        {/* LANGUAGE */}
        <div style={sectionStyle}>
          <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
            <span>{lang === 'ar' ? 'اللغة' : 'LANGUAGE'}</span>
          </div>
          <div style={{ display: 'flex', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderRadius: '14px', padding: '5px', border: '1px solid rgba(var(--theme-rgb), 0.05)' }}>
            {(['ar', 'en'] as const).map(l => (
              <button 
                key={l} onClick={() => setLang(l)}
                style={{ 
                  flex: 1, padding: '12px 0', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '950', cursor: 'pointer',
                  background: lang === l ? '#ff3d00' : 'transparent',
                  color: lang === l ? '#fff' : (theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                  transition: 'all 0.3s ease'
                }}
              >
                {l === 'ar' ? 'عربي' : 'ENGLISH'}
              </button>
            ))}
          </div>
        </div>

        {/* NICKNAME */}
        <div style={sectionStyle}>
          <div style={labelStyle}>
             <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
             <span>{lang === 'ar' ? 'الاسم الشخصي' : 'PROFILE IDENTITY'}</span>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '13px', fontWeight: '950', opacity: 0.9, letterSpacing: '1.5px', color: theme === 'dark' ? '#fff' : '#000' }}>NICKNAME</div>
            <input 
              style={{ background: 'none', border: 'none', fontSize: '20px', fontWeight: '950', color: theme === 'dark' ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: 'Outfit' }}
              value={name} onChange={e => setName(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل اسمك...' : 'Enter your name...'}
            />
          </div>
        </div>

        {/* BODY METRICS */}
        <div style={sectionStyle}>
          <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
            <span>BODY METRICS</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Weight', val: weight, set: setWeight, unit: 'kg' },
              { label: 'Height', val: height, set: setHeight, unit: 'cm' },
              { label: 'Age', val: age, set: setAge, unit: 'yr' }
            ].map(item => (
              <div key={item.label} style={{ ...cardStyle, padding: '14px 12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '950', opacity: 0.9, letterSpacing: '1px', color: theme === 'dark' ? '#fff' : '#000' }}>{item.label.toUpperCase()}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <input 
                    type="number" value={item.val} onChange={e => item.set(e.target.value)}
                    style={{ background: 'none', border: 'none', fontSize: '20px', fontWeight: '950', color: theme === 'dark' ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: 'Outfit' }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: '950', opacity: 0.6, color: theme === 'dark' ? '#fff' : '#000' }}>{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '950', opacity: 0.9, letterSpacing: '1.5px', marginBottom: '10px', paddingLeft: '4px', color: theme === 'dark' ? '#fff' : '#000' }}>GENDER</div>
            <div style={{ display: 'flex', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderRadius: '14px', padding: '5px', border: '1px solid rgba(var(--theme-rgb), 0.05)' }}>
              {(['male', 'female'] as const).map(g => (
                <button 
                  key={g} onClick={() => setGender(g)}
                  style={{ 
                    flex: 1, padding: '12px 0', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '950', cursor: 'pointer',
                    background: gender === g ? '#ff3d00' : 'transparent',
                    color: gender === g ? '#fff' : (theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                    transition: 'all 0.3s ease'
                  }}
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FITNESS GOAL */}
        <div style={sectionStyle}>
          <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
            <span>FITNESS GOAL</span>
          </div>
          <div style={{ display: 'flex', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderRadius: '16px', padding: '5px', border: '1px solid rgba(var(--theme-rgb), 0.05)' }}>
            {(['lose', 'maintain', 'gain'] as const).map(g => (
              <button 
                key={g} onClick={() => setGoal(g)}
                style={{ 
                  flex: 1, padding: '14px 0', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: '950', cursor: 'pointer',
                  background: goal === g ? '#ff3d00' : 'transparent',
                  color: goal === g ? '#fff' : (theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                  transition: 'all 0.3s ease'
                }}
              >
                {g.toUpperCase()}
              </button>
            ))}
          </div>
          
          {targetMacros && (
            <div style={{ marginTop: '12px', padding: '30px 20px', background: 'transparent', borderBottom: '4px solid #ff3d00', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 15px 30px -15px rgba(255, 61, 0, 0.3)' }}>
              <div style={{ fontSize: '12px', fontWeight: '950', color: '#ff3d00', letterSpacing: '4px', marginBottom: '4px', opacity: 1 }}>DAILY TARGET</div>
              <div style={{ fontSize: '56px', fontWeight: '950', color: theme === 'dark' ? '#fff' : '#000', fontFamily: 'Outfit', letterSpacing: '-3px' }}>
                {targetMacros.calories}
                <span style={{ fontSize: '16px', fontWeight: '900', opacity: 0.3, marginLeft: '8px', letterSpacing: '1px' }}>KCAL</span>
              </div>
            </div>
          )}
        </div>

        {/* VISUAL THEME */}
        <div style={sectionStyle}>
           <div style={labelStyle}>
             <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ff3d00', boxShadow: '0 0 8px #ff3d00' }} />
             <span>VISUAL THEME</span>
           </div>
           <div style={{ display: 'flex', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderRadius: '18px', padding: '5px', width: '100%', border: '1px solid rgba(var(--theme-rgb), 0.05)' }}>
             {(['dark', 'light'] as const).map(m => (
               <button 
                 key={m} onClick={() => setTheme(m)}
                 style={{ 
                   flex: 1, padding: '12px 0', border: 'none', borderRadius: '14px', fontSize: '11px', fontWeight: '900', cursor: 'pointer',
                   background: theme === m ? '#ff3d00' : 'transparent',
                   color: theme === m ? '#fff' : (theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
                   transition: 'all 0.3s ease'
                 }}
               >
                 {m.toUpperCase()}
               </button>
             ))}
           </div>
        </div>

        {/* START BUTTON */}
        <div style={{ marginTop: '80px', paddingBottom: '80px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div 
            onClick={handleFinish}
            style={{ 
              cursor: name.trim() ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px', width: '100%', maxWidth: '300px', opacity: name.trim() ? 1 : 0.3, transition: 'opacity 0.4s ease' 
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <div className="premium-title" style={{ fontSize: '24px', lineHeight: '1', color: theme === 'dark' ? '#fff' : '#000', fontWeight: '950', letterSpacing: '-1px' }}>START</div>
              <div className="premium-title" style={{ fontSize: '24px', lineHeight: '1', color: '#ff3d00', fontWeight: '950', letterSpacing: '-1px' }}>JOURNEY</div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '10px', fontWeight: '950', color: '#ff3d00', letterSpacing: '5px', textTransform: 'uppercase', opacity: 0.8 }}>
              {lang === 'ar' ? 'اضغط للبدء' : 'TAP TO BEGIN'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
