import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Scan, RefreshCw } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { GeminiService } from '../../services/gemini';
import { ChevronDown, Check } from 'lucide-react';

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
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 20,
            background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(20px)',
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

export function NutritionPage({ tracker }: { tracker: any }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const nutritionLogs = tracker.nutritionLogs || [];
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = nutritionLogs.filter((m: any) => m.date.split('T')[0] === today);

  const consumedCal = todayMeals.reduce((sum: number, m: any) => sum + m.calories, 0);
  const consumedPro = todayMeals.reduce((sum: number, m: any) => sum + m.protein, 0);
  const consumedCarb = todayMeals.reduce((sum: number, m: any) => sum + m.carbs, 0);
  const consumedFat = todayMeals.reduce((sum: number, m: any) => sum + m.fats, 0);

  const settings = tracker.settings;
  const profile = settings.nutritionProfile;

  const calculateTargets = (p: any) => {
    const bmr = (10 * p.weight) + (6.25 * p.height) - (5 * p.age) + (p.gender === 'male' ? 5 : -161);
    const tdee = bmr * p.activityLevel;
    let targetCal = tdee;
    if (p.goal === 'lose') targetCal -= (p.goalRate * 7700 / 7);
    if (p.goal === 'gain') targetCal += (p.goalRate * 7700 / 7);

    return {
      calories: Math.round(targetCal),
      protein: Math.round((targetCal * (p.proteinRatio / 100)) / 4),
      carbs: Math.round((targetCal * (p.carbsRatio / 100)) / 4),
      fats: Math.round((targetCal * (p.fatsRatio / 100)) / 9),
    };
  };

  const targets = profile ? calculateTargets(profile) : { 
    calories: settings.dailyCalorieGoal || 2500, 
    protein: Math.round((settings.dailyCalorieGoal || 2500) * 0.25 / 4), 
    carbs: Math.round((settings.dailyCalorieGoal || 2500) * 0.45 / 4), 
    fats: Math.round((settings.dailyCalorieGoal || 2500) * 0.3 / 9) 
  };

  const calorieGoal = targets.calories;
  const remainingCal = Math.max(0, calorieGoal - consumedCal);

  // ── SCAN: Open native camera → analyze → show result card ──
  const handleScan = async () => {
    try {
      setScanning(true);
      const image = await Camera.getPhoto({
        quality: 75,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true,
        width: 512,
        height: 512,
      });

      if (!image.base64String) return;

      // Detect format and pass to analyzer
      const mimeType = image.format === 'png' ? 'image/png' : 'image/jpeg';
      const result = await GeminiService.analyzeMeal(image.base64String, mimeType);
      setScanResult(result);
      setShowResult(true);
    } catch (err: any) {
      const msg = err?.message || '';
      if (!msg.includes('cancelled') && !msg.includes('User cancelled')) {
        alert('Analysis failed: ' + (err?.message || 'Unknown error'));
      }
    } finally {
      setScanning(false);
    }
  };

  const handleAddLog = () => {
    if (scanResult) {
      tracker.addMealLog({
        name: scanResult.name,
        calories: scanResult.calories,
        protein: scanResult.protein,
        carbs: scanResult.carbs,
        fats: scanResult.fats,
        portion: scanResult.portion ?? 300
      });
      setScanResult(null);
      setShowResult(false);
    }
  };

  return (
    <>
      {/* ── Result Overlay (only after scan) ── */}
      {showResult && scanResult && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            width: '100%', maxWidth: '420px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '32px', padding: '32px',
            textAlign: 'center',
            animation: 'slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Status Label */}
            <div style={{
              color: 'var(--accent-color)',
              fontSize: '11px',
              fontWeight: '900',
              letterSpacing: '3px',
              marginBottom: '20px',
              textTransform: 'uppercase',
              opacity: 0.9
            }}>
              ANALYZED ✓
            </div>

            {/* Meal Name */}
            <div style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '24px',
              width: 'auto'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '950', color: '#fff', lineHeight: 1.2, fontFamily: 'Outfit' }}>
                {scanResult.name}
              </div>
            </div>

            {/* Calories */}
            <div style={{ 
              fontSize: '56px', 
              fontWeight: '950', 
              color: 'var(--accent-color)', 
              lineHeight: 1, 
              fontFamily: 'Outfit',
              letterSpacing: '-2px', 
              marginBottom: '4px' 
            }}>
              {scanResult.calories}
            </div>
            <div style={{ 
              fontSize: '9px', 
              fontWeight: '800', 
              color: 'var(--accent-color)', 
              opacity: 0.5, 
              letterSpacing: '2px', 
              marginBottom: '28px',
              textTransform: 'uppercase'
            }}>
              TOTAL KCAL
            </div>

            {/* Macros Grid */}
            <div style={{ 
              display: 'flex', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '24px', 
              padding: '20px 10px',
              border: '1px solid rgba(255,255,255,0.12)',
              marginBottom: '32px',
              width: '100%',
              justifyContent: 'space-between'
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ color: '#ffcc00', fontSize: '22px', fontWeight: '950', fontFamily: 'Outfit' }}>{scanResult.fats}<span style={{fontSize:'12px'}}>g</span></div>
                <div style={{ color: '#fff', opacity: 0.4, fontSize: '10px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Fats</div>
              </div>
              
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '30px', alignSelf: 'center' }} />

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ color: '#4da6ff', fontSize: '22px', fontWeight: '950', fontFamily: 'Outfit' }}>{scanResult.carbs}<span style={{fontSize:'12px'}}>g</span></div>
                <div style={{ color: '#fff', opacity: 0.4, fontSize: '10px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Carbs</div>
              </div>

              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '30px', alignSelf: 'center' }} />

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ color: '#ff4d4d', fontSize: '22px', fontWeight: '950', fontFamily: 'Outfit' }}>{scanResult.protein}<span style={{fontSize:'12px'}}>g</span></div>
                <div style={{ color: '#fff', opacity: 0.4, fontSize: '10px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Protein</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setScanResult(null); setShowResult(false); handleScan(); }}
                style={{ 
                  flex: 1, padding: '16px', borderRadius: '20px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  color: '#fff', fontWeight: '800', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease'
                }}
              >
                <RefreshCw size={18} /> RETRY
              </button>
              <button
                onClick={handleAddLog}
                style={{ 
                  flex: 1, padding: '16px', borderRadius: '20px', 
                  background: 'rgba(0, 255, 170, 0.05)', 
                  border: '1.5px solid var(--accent-color)', 
                  color: 'var(--accent-color)', fontWeight: '950', 
                  textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease'
                }}
              >
                ADD TO LOG
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={() => { setScanResult(null); setShowResult(false); }}
              style={{ 
                marginTop: '24px', 
                background: 'none', 
                border: 'none', 
                color: '#ff4d4d', 
                opacity: 0.8, 
                fontSize: '13px', 
                fontWeight: '800',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Cancel
            </button>
          </div>
        </div>,
        document.getElementById('scanner-root')!
      )}

      {/* ── Loading overlay while scanning ── */}
      {scanning && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px'
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid var(--accent-color)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ color: 'var(--accent-color)', fontWeight: '900', letterSpacing: '3px', fontSize: '12px' }}>ANALYZING...</div>
        </div>,
        document.getElementById('scanner-root')!
      )}

      {/* ── Main Page Content ── */}
      <div className="hide-scrollbar" style={{ padding: '0 20px 100px', width: '100%', boxSizing: 'border-box', overflowY: 'auto', height: '100%' }}>

        {/* CALORIE HEADER */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
             <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '2px' }}>AI DAILY TARGET</div>
             <button 
              onClick={() => setShowSetup(true)}
              style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(0,255,170,0.1)', border: '1px solid rgba(0,255,170,0.2)', color: 'var(--accent-color)', fontSize: '9px', fontWeight: '800' }}
             >
               {profile ? 'UPDATE PROFILE' : 'START SMART SETUP'}
             </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{calorieGoal}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Base</div>
            </div>
            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.15)', fontWeight: '900' }}>-</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{consumedCal}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Consumed</div>
            </div>
            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.15)', fontWeight: '900' }}>=</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '28px', fontWeight: '950', color: 'var(--accent-color)' }}>{remainingCal}</div>
              <div style={{ fontSize: '8px', color: 'var(--accent-color)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Left</div>
            </div>
          </div>

          {/* Macro Progress */}
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
            <div style={{ width: `${Math.min(100, (consumedPro / targets.protein) * 100)}%`, background: '#ff4d4d', transition: 'width 0.6s ease' }} />
            <div style={{ width: `${Math.min(100, (consumedCarb / targets.carbs) * 100)}%`, background: '#4da6ff', transition: 'width 0.6s ease' }} />
            <div style={{ width: `${Math.min(100, (consumedFat / targets.fats) * 100)}%`, background: '#ffcc00', transition: 'width 0.6s ease' }} />
          </div>

          {/* Macro labels with targets */}
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { label: 'Protein', val: consumedPro, target: targets.protein, color: '#ff4d4d' },
              { label: 'Carbs', val: consumedCarb, target: targets.carbs, color: '#4da6ff' },
              { label: 'Fats', val: consumedFat, target: targets.fats, color: '#ffcc00' }
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: m.color }}>{m.val}<span style={{fontSize:'10px', opacity: 0.5}}>/{m.target}g</span></div>
                <div style={{ fontSize: '8px', opacity: 0.4, letterSpacing: '1px' }}>{m.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DIARY SECTIONS */}
        {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((category) => {
          const catMeals = todayMeals.filter((m: any) => {
            const hour = new Date(m.date).getHours();
            if (category === 'Breakfast') return hour >= 4 && hour < 11;
            if (category === 'Lunch') return hour >= 11 && hour < 16;
            if (category === 'Dinner') return hour >= 16 && hour < 22;
            return hour >= 22 || hour < 4;
          });
          const catCal = catMeals.reduce((s: number, m: any) => s + m.calories, 0);

          return (
            <div key={category} style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '2px' }}>{category}</div>
                {catCal > 0 && <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{catCal} kcal</div>}
              </div>

              <div>
                {catMeals.map((meal: any, i: number) => (
                  <div key={meal.id} style={{
                    padding: '14px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: i < catMeals.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>{meal.name}</div>
                      <div style={{ fontSize: '10px', opacity: 0.4 }}>
                        <span style={{ color: '#ff4d4d' }}>{meal.protein}P</span>
                        {' · '}
                        <span style={{ color: '#4da6ff' }}>{meal.carbs}C</span>
                        {' · '}
                        <span style={{ color: '#ffcc00' }}>{meal.fats}F</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-color)' }}>{meal.calories}</div>
                      <button onClick={() => tracker.deleteMealLog(meal.id)} style={{ background: 'rgba(255,77,77,0.08)', border: 'none', borderRadius: '8px', padding: '6px', color: '#ff4d4d', opacity: 0.5 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleScan}
                  disabled={scanning}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1.5px dashed rgba(0, 255, 170, 0.2)', 
                    borderRadius: '0px',
                    color: 'var(--accent-color)', 
                    fontSize: '11px', 
                    fontWeight: '900', 
                    textTransform: 'uppercase', 
                    letterSpacing: '2px', 
                    opacity: scanning ? 0.4 : 0.8,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}
                >
                  {scanning ? 'ANALYZING...' : (
                    <>
                      <div style={{ fontSize: '20px', fontWeight: '400', marginTop: '-2px' }}>+</div>
                      ADD FOOD
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING SCAN BUTTON */}
      <button
        onClick={handleScan}
        disabled={scanning}
        style={{
          position: 'fixed', bottom: '90px', right: '20px',
          width: '60px', height: '60px', borderRadius: '30px',
          background: 'rgba(0, 255, 170, 0.05)', 
          border: '1.5px solid var(--accent-color)', 
          color: 'var(--accent-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0, 255, 170, 0.1)',
          backdropFilter: 'blur(10px)',
          zIndex: 100, opacity: scanning ? 0.6 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {scanning ? <RefreshCw size={24} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Scan size={24} />}
      </button>

      {/* ── Smart Setup Modal (Elite Edition) ── */}
      {showSetup && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'radial-gradient(circle at top right, rgba(0,255,170,0.15), transparent), radial-gradient(circle at bottom left, rgba(0,163,255,0.1), transparent), rgba(0,0,0,0.92)',
          backdropFilter: 'blur(25px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            width: '100%', maxWidth: '440px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
            borderRadius: '40px',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '40px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-color)', filter: 'blur(80px)', opacity: 0.15 }} />

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '950', color: '#fff', marginBottom: '8px', letterSpacing: '-1px', fontFamily: 'Outfit' }}>Smart Setup</h2>
              <div style={{ width: '40px', height: '3px', background: 'var(--accent-color)', margin: '0 auto', borderRadius: '2px', opacity: 0.8 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {[
                { id: 'setup-weight', label: 'Weight', val: profile?.weight || 80, unit: 'kg' },
                { id: 'setup-height', label: 'Height', val: profile?.height || 180, unit: 'cm' },
                { id: 'setup-age', label: 'Age', val: profile?.age || 25, unit: 'yr' }
              ].map(field => (
                <div key={field.id}>
                  <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '10px', letterSpacing: '1px', opacity: 0.7 }}>{field.label.toUpperCase()}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" defaultValue={field.val}
                      id={field.id}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: '#fff', fontWeight: '800', fontSize: '16px', outline: 'none', transition: 'all 0.3s ease', fontFamily: 'Outfit' }}
                      onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--accent-color)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                      onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '900', opacity: 0.3, color: '#fff' }}>{field.unit}</span>
                  </div>
                </div>
              ))}
              <div>
                <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '10px', letterSpacing: '1px', opacity: 0.7 }}>GENDER</label>
                <EliteSelect 
                  id="setup-gender"
                  defaultValue={profile?.gender || 'male'}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                  ]}
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '10px', letterSpacing: '1px', opacity: 0.7 }}>FITNESS GOAL</label>
              <EliteSelect 
                id="setup-goal"
                defaultValue={profile?.goal || 'maintain'}
                options={[
                  { value: 'lose', label: 'Lose Weight (Cutting)' },
                  { value: 'maintain', label: 'Maintain Weight' },
                  { value: 'gain', label: 'Gain Weight (Bulking)' }
                ]}
              />
            </div>

            <button
              onClick={() => {
                const weight = Number((document.getElementById('setup-weight') as HTMLInputElement).value);
                const height = Number((document.getElementById('setup-height') as HTMLInputElement).value);
                const age = Number((document.getElementById('setup-age') as HTMLInputElement).value);
                const gender = (document.getElementById('setup-gender') as HTMLSelectElement).value as any;
                const goal = (document.getElementById('setup-goal') as HTMLSelectElement).value as any;

                tracker.setSettings({
                  nutritionProfile: {
                    weight, height, age, gender, goal,
                    activityLevel: 1.375,
                    goalRate: goal === 'maintain' ? 0 : 0.5,
                    proteinRatio: goal === 'gain' ? 35 : 30,
                    carbsRatio: 40,
                    fatsRatio: goal === 'lose' ? 20 : 30
                  }
                });
                setShowSetup(false);
              }}
              style={{ 
                width: '100%', padding: '20px', borderRadius: '20px', 
                background: 'var(--accent-color)', border: 'none', color: '#000', 
                fontWeight: '950', fontSize: '15px', textTransform: 'uppercase', 
                letterSpacing: '1px', marginBottom: '16px', cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(0, 255, 170, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Save & Start Progress
            </button>

            <button
              onClick={() => setShowSetup(false)}
              style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Maybe Later
            </button>
          </div>
        </div>,
        document.getElementById('scanner-root')!
      )}
      
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(40px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
