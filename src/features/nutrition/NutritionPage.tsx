import { useState } from 'react';
import { useGymTracker } from '../../hooks/useGymTracker';
import { translations } from '../../translations';
import { Scan, Zap, Plus, X } from 'lucide-react';

interface Props {
  tracker: ReturnType<typeof useGymTracker>;
}

export function NutritionPage({ tracker }: Props) {
  const lang = tracker.settings.language;
  const t = (k: keyof typeof translations.en) => (translations[lang] as any)[k] ?? k;
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanResult({
        name: lang === 'ar' ? 'صدور دجاج مشوية' : 'Grilled Chicken Breast',
        calories: 350,
        protein: 45,
        carbs: 5,
        fats: 12
      });
    }, 2500);
  };

  const closeScanner = () => {
    setShowScanner(false);
    setScanResult(null);
    setScanning(false);
  };

  return (
    <>
      <div style={{ padding: '0 20px 20px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* 1. Daily Summary */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.6 }}>{t('dailyTarget')}</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', lineHeight: '1' }}>2,400 <span style={{ fontSize: '14px', opacity: 0.4, fontWeight: '400' }}>KCAL</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-color)', lineHeight: '1' }}>0%</div>
              <div style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: '4px' }}>{t('done')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            {[
              { label: t('protein'), val: '0g', color: '#00e5a0' },
              { label: t('carbs'), val: '0g', color: '#00d1ff' },
              { label: t('fats'), val: '0g', color: '#ff9d00' }
            ].map((m, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ fontSize: '9px', fontWeight: '800', color: m.color, opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. SCAN CTA */}
        <button 
          onClick={() => setShowScanner(true)}
          style={{
            width: '100%',
            padding: '25px 0',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            cursor: 'pointer',
            marginBottom: '20px',
            textAlign: 'left'
          }}
        >
          <div style={{ 
            width: '50px', height: '50px', 
            background: 'rgba(255,255,255,0.03)', 
            borderRadius: '16px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <Scan size={24} color="var(--accent-color)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{t('scanMeal')}</div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-color)', opacity: 0.5, letterSpacing: '1px', marginTop: '2px' }}>AI VISION SCANNER</div>
          </div>
          <Plus size={20} color="rgba(255,255,255,0.2)" />
        </button>

        {/* 3. Recent Logs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', opacity: 0.4 }}>
             <Zap size={12} color="var(--accent-color)" />
             <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '2px' }}>RECENT LOGS</span>
          </div>
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.2 }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>NO LOGS RECORDED</div>
          </div>
        </div>
      </div>

      {/* FULL SCREEN SCANNER - Positioned Absolute to avoid parent padding interference */}
      {showScanner && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100vw', height: '100vh',
          background: '#000', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Main Scanner Body */}
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Background Camera Mockup */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, #000 0%, #080808 100%)' }} />

            {/* Framing Guide - More compact */}
            {!scanResult && (
              <div style={{ 
                width: '240px', height: '240px', 
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', 
                position: 'relative',
                display: 'grid', placeItems: 'center',
                marginBottom: '100px' // Space for the button below
              }}>
                <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '3px solid var(--accent-color)', borderLeft: '3px solid var(--accent-color)', borderTopLeftRadius: '12px' }} />
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '3px solid var(--accent-color)', borderRight: '3px solid var(--accent-color)', borderTopRightRadius: '12px' }} />
                <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '3px solid var(--accent-color)', borderLeft: '3px solid var(--accent-color)', borderBottomLeftRadius: '12px' }} />
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '3px solid var(--accent-color)', borderRight: '3px solid var(--accent-color)', borderBottomRightRadius: '12px' }} />
                {scanning && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                    background: 'var(--accent-color)', boxShadow: '0 0 20px var(--accent-color)',
                    animation: 'scan-move 2s infinite linear'
                  }} />
                )}
              </div>
            )}

            {/* Result Display - Compact Overlay */}
            {scanResult && (
              <div style={{ 
                width: '90%', padding: '20px',
                background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(30px)', borderRadius: '32px',
                border: '1px solid rgba(255,255,255,0.1)', animation: 'slide-up 0.4s ease',
                zIndex: 10,
                marginBottom: '40px'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '15px', textAlign: 'center' }}>{scanResult.name}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { l: t('calories'), v: scanResult.calories, c: 'var(--accent-color)' },
                    { l: t('protein'), v: scanResult.protein + 'g', c: '#00d1ff' },
                    { l: t('carbs'), v: scanResult.carbs + 'g', c: '#ff9d00' }
                  ].map((x, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 5px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                      <div style={{ fontSize: '8px', color: x.c, fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>{x.l}</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button - Moved further in for perfect visibility */}
            <button onClick={closeScanner} style={{ 
              position: 'absolute', top: '25px', right: '40px', // Moved from 25px to 40px
              width: '36px', height: '36px', 
              background: 'rgba(255, 59, 48, 0.45)', 
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%', 
              color: '#fff', zIndex: 100,
              backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
            }}>
              <X size={18} />
            </button>

            {/* Centered Capture Button - Fixed centering */}
            <div style={{ 
              position: 'absolute', bottom: '120px',
              left: 0, right: 0, // Force full width for perfect centering
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ pointerEvents: 'auto' }}>
                {scanResult ? (
                  <button className="accent-button" style={{ width: '180px', padding: '16px' }} onClick={closeScanner}>{t('done')}</button>
                ) : (
                  <button 
                    disabled={scanning}
                    onClick={handleScan}
                    style={{
                      width: '65px', height: '65px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)', border: '5px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', outline: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                     <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 25px rgba(255,255,255,0.6)' }} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes scan-move {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
