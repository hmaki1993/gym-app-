import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Scan, RefreshCw } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { GeminiService } from '../../services/gemini';

export function NutritionPage({ tracker }: { tracker: any }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const nutritionLogs = tracker.nutritionLogs || [];
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = nutritionLogs.filter((m: any) => m.date.split('T')[0] === today);

  const consumedCal = todayMeals.reduce((sum: number, m: any) => sum + m.calories, 0);
  const consumedPro = todayMeals.reduce((sum: number, m: any) => sum + m.protein, 0);
  const consumedCarb = todayMeals.reduce((sum: number, m: any) => sum + m.carbs, 0);
  const consumedFat = todayMeals.reduce((sum: number, m: any) => sum + m.fats, 0);

  const calorieGoal = tracker.settings.dailyCalorieGoal || 2500;
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
            {/* Badge */}
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: '20px',
              background: 'var(--accent-color)', color: '#000',
              fontSize: '10px', fontWeight: '900', letterSpacing: '2px',
              marginBottom: '20px', textTransform: 'uppercase'
            }}>
              AI ANALYZED ✓
            </div>

            {/* Meal Name */}
            <div style={{ fontSize: '24px', fontWeight: '950', color: '#fff', marginBottom: '8px', lineHeight: 1.2 }}>
              {scanResult.name}
            </div>

            {/* Calories */}
            <div style={{ fontSize: '64px', fontWeight: '950', color: 'var(--accent-color)', lineHeight: 1, letterSpacing: '-3px', marginBottom: '8px' }}>
              {scanResult.calories}
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-color)', opacity: 0.6, letterSpacing: '3px', marginBottom: '32px' }}>
              KCAL
            </div>

            {/* Macros */}
            <div style={{
              display: 'flex', justifyContent: 'space-around',
              background: 'rgba(255,255,255,0.04)', borderRadius: '20px',
              padding: '18px', marginBottom: '32px'
            }}>
              {[
                { label: 'PROTEIN', val: scanResult.protein, color: '#ff4d4d' },
                { label: 'CARBS', val: scanResult.carbs, color: '#4da6ff' },
                { label: 'FATS', val: scanResult.fats, color: '#ffcc00' }
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: m.color }}>{m.val}<span style={{ fontSize: '11px' }}>g</span></div>
                  <div style={{ fontSize: '8px', opacity: 0.4, fontWeight: '800', letterSpacing: '1px' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setScanResult(null); setShowResult(false); handleScan(); }}
                style={{ flex: 1, padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <RefreshCw size={16} /> Retry
              </button>
              <button
                onClick={handleAddLog}
                style={{ flex: 2, padding: '16px', borderRadius: '18px', background: 'var(--accent-color)', border: 'none', color: '#000', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '14px' }}
              >
                ADD TO DIARY
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={() => { setScanResult(null); setShowResult(false); }}
              style={{ marginTop: '16px', background: 'none', border: 'none', color: '#fff', opacity: 0.3, fontSize: '12px', fontWeight: '700' }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{calorieGoal}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Goal</div>
            </div>
            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.15)', fontWeight: '900' }}>-</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{consumedCal}</div>
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Food</div>
            </div>
            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.15)', fontWeight: '900' }}>=</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '28px', fontWeight: '950', color: 'var(--accent-color)' }}>{remainingCal}</div>
              <div style={{ fontSize: '8px', color: 'var(--accent-color)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Remaining</div>
            </div>
          </div>

          {/* Macro bar */}
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
            {(() => {
              const total = consumedPro + consumedCarb + consumedFat || 1;
              return (
                <>
                  <div style={{ width: `${(consumedPro / total) * 100}%`, background: '#ff4d4d', transition: 'width 0.6s ease' }} />
                  <div style={{ width: `${(consumedCarb / total) * 100}%`, background: '#4da6ff', transition: 'width 0.6s ease' }} />
                  <div style={{ width: `${(consumedFat / total) * 100}%`, background: '#ffcc00', transition: 'width 0.6s ease' }} />
                </>
              );
            })()}
          </div>

          {/* Macro labels */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '12px' }}>
            {[
              { label: 'Protein', val: consumedPro, color: '#ff4d4d' },
              { label: 'Carbs', val: consumedCarb, color: '#4da6ff' },
              { label: 'Fats', val: consumedFat, color: '#ffcc00' }
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: m.color }}>{m.val}g</div>
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

              <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
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
                  style={{ width: '100%', padding: '14px', background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', opacity: scanning ? 0.4 : 0.7 }}
                >
                  {scanning ? 'ANALYZING...' : '+ ADD FOOD'}
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
          background: 'var(--accent-color)', border: 'none', color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px var(--accent-color-alpha)',
          zIndex: 100, opacity: scanning ? 0.6 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        {scanning ? <RefreshCw size={24} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Scan size={24} />}
      </button>

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
