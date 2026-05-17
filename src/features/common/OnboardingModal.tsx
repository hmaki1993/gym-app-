import { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { THEME_COLORS } from '../../data/exercises';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onComplete: () => void;
}

export function OnboardingModal({ tracker, onComplete }: Props) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [goalRate] = useState(0.5);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [accentColor, _setAccentColor] = useState(THEME_COLORS[0].hex);
  const [accentSecondary, _setAccentSecondary] = useState(THEME_COLORS[0].secondary);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.out' });
    }
  }, []);

  // Live Theme Preview
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeMode);
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--accent-secondary', accentSecondary);
    
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    root.style.setProperty('--accent-color-alpha', `rgba(${r}, ${g}, ${b}, 0.2)`);
  }, [themeMode, accentColor, accentSecondary]);

  const calculateTargets = () => {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    if (!w || !h || !a) return null;
    const bmr = (10 * w) + (6.25 * h) - (5 * a) + (gender === 'male' ? 5 : -161);
    const tdee = bmr * 1.375;
    let target = tdee;
    if (goal !== 'maintain') {
      const dailyOffset = (goalRate * 7700) / 7;
      target = goal === 'lose' ? tdee - dailyOffset : tdee + dailyOffset;
    }
    const protein = (target * (goal === 'gain' ? 0.35 : 0.3)) / 4;
    const fats = (target * (goal === 'lose' ? 0.2 : 0.25)) / 9;
    const carbs = (target - (protein * 4) - (fats * 9)) / 4;
    return { calories: Math.round(target), protein: Math.round(protein), carbs: Math.round(carbs), fats: Math.round(fats) };
  };

  const targets = calculateTargets();

  const handleFinalSubmit = () => {
    if (!name.trim()) return;
    tracker.setSettings({ 
      userName: name.trim(), 
      language,
      nutritionProfile: {
        weight: Number(weight) || 80, 
        height: Number(height) || 180, 
        age: Number(age) || 25, 
        gender, goal,
        activityLevel: 1.375,
        goalRate: goal === 'maintain' ? 0 : goalRate,
        proteinRatio: goal === 'gain' ? 35 : 30,
        carbsRatio: 40,
        fatsRatio: goal === 'lose' ? 20 : 30
      },
      themeMode,
      accentColor,
      accentSecondary
    });
    onComplete();
  };

  const cardStyle: React.CSSProperties = { width: '100%', maxWidth: '400px', background: 'transparent', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '35px' };
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '900', color: '#E67E22', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' };
  const inputRowStyle: React.CSSProperties = { background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)', borderRadius: '16px', padding: '16px', borderTop: themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)', borderLeft: themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)', borderRight: themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.1)', borderBottom: '3px solid rgba(230, 126, 34, 0.3)', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '6px' };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!name.trim()) return;
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(btn, { rotateY: x * 15, rotateX: -y * 15, translateZ: 40, duration: 0.5, ease: 'power2.out' });
  };

  const handleHeaderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(btn, { rotateY: x * 20, rotateX: -y * 20, duration: 0.5, ease: 'power2.out' });
  };

  const handleHeaderMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => { gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' }); };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => { gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, translateZ: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' }); };

  return (
    <div className="modal-overlay hide-scrollbar" style={{ alignItems: 'flex-start', background: themeMode === 'dark' ? '#050505' : '#f8f9fa', overflowY: 'auto', padding: '40px 20px', zIndex: 20000, transition: 'background 0.5s ease' }}>
      <div ref={ref} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div onMouseMove={handleHeaderMouseMove} onMouseLeave={handleHeaderMouseLeave} style={{ textAlign: 'center', marginBottom: '60px', width: '100%', perspective: '1200px', cursor: 'default' }}>
          <div style={{ display: 'inline-block', transformStyle: 'preserve-3d', transition: 'transform 0.1s ease-out' }}>
            <h1 className="heading-font" style={{ margin: 0, fontSize: '38px', letterSpacing: '-1px', textTransform: 'uppercase', fontWeight: 950, lineHeight: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', transform: 'translateZ(30px)' }}>
              <span style={{ color: '#a0a0a0' }}>POWER</span>
              <div style={{ margin: '0 10px', color: '#E67E22',  display: 'flex', alignItems: 'center', transform: 'translateZ(20px)' }}>
                <div 
                  className="pulse-elite"
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'currentColor',
                    WebkitMask: 'url(/assets/dumbbell-custom.png) no-repeat center / contain',
                    mask: 'url(/assets/dumbbell-custom.png) no-repeat center / contain',
                    display: 'inline-block'
                  }} 
                />
              </div>
              <span style={{ color: '#E67E22' }}>GRID</span>
            </h1>
            <div style={{ fontSize: '13px', color: '#E67E22', fontWeight: '950', letterSpacing: '8px', marginTop: '16px', textTransform: 'uppercase', opacity: 1 }}>{language === 'ar' ? 'الإعداد الذكي' : 'SMART SETUP'}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E67E22',  }} />
            <span style={{ fontSize: '14px', fontWeight: '950' }}>{language === 'ar' ? 'اللغة' : 'LANGUAGE'}</span>
          </div>
          <div style={{ display: 'flex', background: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderRadius: '14px', padding: '5px', border: '1px solid rgba(var(--theme-rgb), 0.05)' }}>
            {(['ar', 'en'] as const).map(lg => (
              <button key={lg} onClick={() => setLanguage(lg)} style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '950', cursor: 'pointer', background: language === lg ? '#E67E22' : 'transparent', color: language === lg ? '#fff' : (themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'), transition: 'all 0.3s ease' }}>{lg === 'ar' ? 'عربي' : 'ENGLISH'}</button>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E67E22',  }} />
            <span style={{ fontSize: '13px', fontWeight: '950' }}>{language === 'ar' ? 'الاسم الشخصي' : 'PROFILE IDENTITY'}</span>
          </div>
          <div style={inputRowStyle}>
            <div style={{ fontSize: '13px', fontWeight: '950', opacity: 0.9, letterSpacing: '1.5px', color: themeMode === 'dark' ? '#fff' : '#000' }}>NICKNAME</div>
            <input style={{ background: 'none', border: 'none', fontSize: '20px', fontWeight: '950', color: themeMode === 'dark' ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: "'Montserrat', sans-serif" }} value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E67E22',  }} />
            <span>Body Metrics</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Weight', val: weight, set: setWeight, unit: 'kg' },
              { label: 'Height', val: height, set: setHeight, unit: 'cm' },
              { label: 'Age', val: age, set: setAge, unit: 'yr' }
            ].map(f => (
              <div key={f.label} style={{ ...inputRowStyle, padding: '14px 12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '950', opacity: 0.9, letterSpacing: '1px', color: themeMode === 'dark' ? '#fff' : '#000' }}>{f.label.toUpperCase()}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <input type="number" value={f.val} onChange={e => f.set(e.target.value)} style={{ background: 'none', border: 'none', fontSize: '20px', fontWeight: '950', color: themeMode === 'dark' ? '#fff' : '#000', outline: 'none', width: '100%', fontFamily: "'Montserrat', sans-serif" }} />
                  <span style={{ fontSize: '11px', fontWeight: '950', opacity: 0.6, color: themeMode === 'dark' ? '#fff' : '#000' }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '950', opacity: 0.9, letterSpacing: '1.5px', marginBottom: '10px', paddingLeft: '4px', color: themeMode === 'dark' ? '#fff' : '#000' }}>GENDER</div>
            <div style={{ display: 'flex', background: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderRadius: '14px', padding: '5px', border: '1px solid rgba(var(--theme-rgb), 0.05)' }}>
              {(['male', 'female'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)} style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '950', cursor: 'pointer', background: gender === g ? '#E67E22' : 'transparent', color: gender === g ? '#fff' : (themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'), transition: 'all 0.3s ease' }}>{g.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E67E22',  }} />
            <span style={{ fontSize: '14px', fontWeight: '950' }}>Fitness Goal</span>
          </div>
          <div style={{ display: 'flex', background: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderRadius: '16px', padding: '5px', border: '1px solid rgba(var(--theme-rgb), 0.05)' }}>
            {(['lose', 'maintain', 'gain'] as const).map(g => (
              <button key={g} onClick={() => setGoal(g)} style={{ flex: 1, padding: '14px 0', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: '950', cursor: 'pointer', background: goal === g ? '#E67E22' : 'transparent', color: goal === g ? '#fff' : (themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'), transition: 'all 0.3s ease' }}>{g.toUpperCase()}</button>
            ))}
          </div>
          {targets && (
            <div style={{ marginTop: '12px', padding: '30px 20px', background: 'transparent', borderBottom: '4px solid #E67E22', display: 'flex', flexDirection: 'column', alignItems: 'center',  }}>
              <div style={{ fontSize: '12px', fontWeight: '950', color: '#E67E22', letterSpacing: '4px', marginBottom: '4px', opacity: 1 }}>DAILY TARGET</div>
              <div style={{ fontSize: '56px', fontWeight: '950', color: themeMode === 'dark' ? '#fff' : '#000', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-3px' }}>{targets.calories}<span style={{ fontSize: '16px', fontWeight: '900', opacity: 0.3, marginLeft: '8px', letterSpacing: '1px' }}>KCAL</span></div>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E67E22',  }} />
            <span style={{ fontSize: '14px', fontWeight: '950' }}>Visual Theme</span>
          </div>
          <div style={{ display: 'flex', background: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)', borderRadius: '18px', padding: '5px', width: '100%', border: '1px solid rgba(var(--theme-rgb), 0.05)' }}>
            {(['dark', 'light'] as const).map(mode => (
              <button key={mode} onClick={() => setThemeMode(mode)} style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: '14px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', background: themeMode === mode ? '#E67E22' : 'transparent', color: themeMode === mode ? '#fff' : (themeMode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), transition: 'all 0.3s ease' }}>{mode.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '160px', paddingBottom: '100px', width: '100%', display: 'flex', justifyContent: 'center', perspective: '1200px' }}>
          <div onClick={handleFinalSubmit} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ cursor: name.trim() ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d', textAlign: 'center', padding: '30px', width: '100%', maxWidth: '300px', opacity: name.trim() ? 1 : 0.3, transition: 'opacity 0.4s ease' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', transform: 'translateZ(50px)' }}>
              <div className="premium-title" style={{ fontSize: '24px', lineHeight: '1', color: themeMode === 'dark' ? '#fff' : '#000', fontWeight: '950', letterSpacing: '-1px' }}>START</div>
              <div className="premium-title" style={{ fontSize: '24px', lineHeight: '1', color: '#E67E22', fontWeight: '950', letterSpacing: '-1px' }}>JOURNEY</div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '10px', fontWeight: '950', color: '#E67E22', letterSpacing: '5px', textTransform: 'uppercase', opacity: 0.8, transform: 'translateZ(25px)' }}>{language === 'ar' ? 'اضغط للبدء' : 'TAP TO BEGIN'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
