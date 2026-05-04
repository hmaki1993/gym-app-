import { useState, useRef, useEffect } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { ChevronDown, Check } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
  onComplete: () => void;
}

function EliteSelect({ id, defaultValue, options, onChange }: { id: string, defaultValue: string, options: { value: string, label: string }[], onChange?: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options.find(o => o.value === defaultValue) || options[0]);

  useEffect(() => {
    const found = options.find(o => o.value === defaultValue);
    if (found) setSelected(found);
  }, [defaultValue, options]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input type="hidden" id={id} value={selected.value} />
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', background: 'rgba(var(--theme-rgb), 0.03)', border: '1px solid rgba(var(--theme-rgb), 0.08)',
          borderRadius: '12px', padding: '10px 14px', color: 'var(--text-primary)', fontWeight: '900', fontSize: '13px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          transition: 'all 0.3s ease', fontFamily: 'Outfit'
        }}
      >
        {selected.label}
        <ChevronDown size={14} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
      </div>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 2000,
            background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(var(--theme-rgb), 0.1)', borderRadius: '12px',
            padding: '4px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            animation: 'slide-up 0.2s ease-out'
          }}>
            {options.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { 
                  setSelected(opt); 
                  setIsOpen(false); 
                  if (onChange) onChange(opt.value);
                }}
                style={{
                  padding: '8px 12px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px',
                  fontWeight: selected.value === opt.value ? '900' : '600',
                  background: selected.value === opt.value ? 'rgba(0,255,170,0.1)' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                {opt.label}
                {selected.value === opt.value && <Check size={12} color="var(--accent-color)" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OnboardingModal({ tracker, onComplete }: Props) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [goalRate, setGoalRate] = useState(0.5);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.out' });
    }
  }, []);

  // Live Calculation Logic
  const calculateTargets = () => {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);

    if (!w || !h || !a) return null;

    const bmr = (10 * w) + (6.25 * h) - (5 * a) + (gender === 'male' ? 5 : -161);
    const tdee = bmr * 1.375; // Moderate active default
    let target = tdee;
    
    if (goal !== 'maintain') {
      const dailyOffset = (goalRate * 7700) / 7;
      target = goal === 'lose' ? tdee - dailyOffset : tdee + dailyOffset;
    }
    
    const protein = (target * (goal === 'gain' ? 0.35 : 0.3)) / 4;
    const fats = (target * (goal === 'lose' ? 0.2 : 0.25)) / 9;
    const carbs = (target - (protein * 4) - (fats * 9)) / 4;

    return { 
      calories: Math.round(target),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats)
    };
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
      }
    });
    onComplete();
  };

  return (
    <div className="modal-overlay hide-scrollbar" style={{ 
      alignItems: 'flex-start', 
      background: '#000',
      overflowY: 'auto',
      padding: '30px 25px',
      zIndex: 20000
    }}>
      <div ref={ref} style={{ 
        width: '100%', 
        maxWidth: '400px', 
        margin: '0 auto',
        position: 'relative'
      }}>
        
        {/* Header - Centered & Elite Style */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="heading-font" style={{ 
            margin: 0, 
            fontSize: '42px',
            background: 'linear-gradient(to bottom, var(--text-primary) 50%, var(--accent-color) 150%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2px',
            textTransform: 'uppercase',
            fontWeight: '950',
            lineHeight: 1
          }}>
            GYMLOG
          </h1>
          <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.2)', fontWeight: '900', letterSpacing: '4px', marginTop: '8px', textTransform: 'uppercase' }}>
            {language === 'ar' ? 'الإعداد الذكي' : 'SMART SETUP'}
          </div>
        </div>

        {/* Minimal Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* Language Selector */}
          <div>
            <div style={{ display: 'flex', gap: '20px' }}>
              {(['ar', 'en'] as const).map(lg => (
                <button key={lg} onClick={() => setLanguage(lg)}
                  style={{
                    background: 'none', border: 'none', padding: '0', fontSize: '14px', fontWeight: '950', transition: 'all 0.3s ease',
                    color: language === lg ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.15)',
                    cursor: 'pointer'
                  }}>
                  {lg === 'ar' ? 'عربي' : 'ENGLISH'}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: '950', color: 'rgba(var(--theme-rgb), 0.5)', display: 'block', marginBottom: '14px', letterSpacing: '2px' }}>NAME</label>
            <input
              placeholder="..."
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(var(--theme-rgb), 0.08)', padding: '12px 0', color: 'var(--text-primary)', fontWeight: '800', fontSize: '32px', outline: 'none', fontFamily: 'Outfit' }}
            />
          </div>

          {/* Physical Stats Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '950', color: 'rgba(var(--theme-rgb), 0.5)', display: 'block', marginBottom: '10px', letterSpacing: '2px' }}>WEIGHT</label>
                <div style={{ position: 'relative', borderBottom: '1px solid rgba(var(--theme-rgb), 0.08)' }}>
                  <input type="number" value={weight} placeholder="..." onChange={e => setWeight(e.target.value)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-primary)', fontWeight: '800', fontSize: '24px', outline: 'none', fontFamily: 'Outfit' }}
                  />
                  <span style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '900', opacity: 0.25, color: 'var(--text-primary)' }}>kg</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '950', color: 'rgba(var(--theme-rgb), 0.5)', display: 'block', marginBottom: '10px', letterSpacing: '2px' }}>HEIGHT</label>
                <div style={{ position: 'relative', borderBottom: '1px solid rgba(var(--theme-rgb), 0.08)' }}>
                  <input type="number" value={height} placeholder="..." onChange={e => setHeight(e.target.value)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-primary)', fontWeight: '800', fontSize: '24px', outline: 'none', fontFamily: 'Outfit' }}
                  />
                  <span style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '900', opacity: 0.25, color: 'var(--text-primary)' }}>cm</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '950', color: 'rgba(var(--theme-rgb), 0.5)', display: 'block', marginBottom: '10px', letterSpacing: '2px' }}>AGE</label>
                <div style={{ position: 'relative', borderBottom: '1px solid rgba(var(--theme-rgb), 0.08)' }}>
                  <input type="number" value={age} placeholder="..." onChange={e => setAge(e.target.value)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '12px 0', color: 'var(--text-primary)', fontWeight: '800', fontSize: '24px', outline: 'none', fontFamily: 'Outfit' }}
                  />
                  <span style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '900', opacity: 0.25, color: 'var(--text-primary)' }}>yr</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '950', color: 'rgba(var(--theme-rgb), 0.5)', display: 'block', marginBottom: '10px', letterSpacing: '2px' }}>GENDER</label>
                <div>
                  <EliteSelect 
                    id="setup-gender" 
                    defaultValue={gender} 
                    onChange={(val) => setGender(val as any)}
                    options={[{ value: 'male', label: 'MALE' }, { value: 'female', label: 'FEMALE' }]} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: goal === 'maintain' ? '1fr' : '1.2fr 0.8fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '950', color: 'rgba(var(--theme-rgb), 0.5)', display: 'block', marginBottom: '10px', letterSpacing: '2px' }}>GOAL</label>
                <EliteSelect 
                  id="setup-goal" 
                  defaultValue={goal} 
                  onChange={(val) => setGoal(val as any)}
                  options={[
                    { value: 'lose', label: 'LOSE WEIGHT' },
                    { value: 'maintain', label: 'MAINTAIN' },
                    { value: 'gain', label: 'GAIN WEIGHT' }
                  ]} 
                />
              </div>
              {goal !== 'maintain' && (
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '950', color: 'rgba(var(--theme-rgb), 0.5)', display: 'block', marginBottom: '10px', letterSpacing: '2px' }}>RATE (kg/wk)</label>
                  <EliteSelect 
                    id="setup-rate" 
                    defaultValue={goalRate.toString()} 
                    onChange={(val) => setGoalRate(Number(val))}
                    options={[
                      { value: '0.25', label: '0.25' },
                      { value: '0.5', label: '0.5' },
                      { value: '0.75', label: '0.75' },
                      { value: '1', label: '1.0' }
                    ]} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Result Display */}
          {targets && (
            <div style={{ 
              marginTop: '-20px', 
              padding: '24px 0', 
              borderTop: '1px solid rgba(var(--theme-rgb), 0.03)',
              display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: '950', color: 'var(--accent-color)', lineHeight: 1, fontFamily: 'Outfit' }}>{targets.calories}</div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(var(--theme-rgb), 0.3)', marginBottom: '4px', letterSpacing: '1px' }}>DAILY KCAL TARGET</div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px' }}>
                {[
                  { label: 'PROTEIN', val: targets.protein, unit: 'g' },
                  { label: 'CARBS', val: targets.carbs, unit: 'g' },
                  { label: 'FATS', val: targets.fats, unit: 'g' }
                ].map(macro => (
                  <div key={macro.label}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(var(--theme-rgb), 0.3)', marginBottom: '4px' }}>{macro.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{macro.val}<span style={{ fontSize: '8px', opacity: 0.3, marginLeft: '2px' }}>{macro.unit}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button - Minimal Dash or Subtle Box */}
          <div style={{ marginTop: targets ? '0' : '40px', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={handleFinalSubmit}
              disabled={!name.trim()}
              style={{ 
                width: 'fit-content', padding: '12px 30px', borderRadius: '0', 
                background: 'none', border: '1px dashed var(--accent-color)', color: 'var(--accent-color)', 
                fontWeight: '950', fontSize: '12px', textTransform: 'uppercase', 
                letterSpacing: '3px', opacity: name.trim() ? 1 : 0.2, transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            >
              FINISH SETUP
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
