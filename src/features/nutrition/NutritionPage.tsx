import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Scan, RefreshCw } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { GeminiService } from '../../services/gemini';
import { Search } from 'lucide-react';
import { FatSecretService } from '../../services/fatsecret';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { translations } from '../../translations';

const CustomPlus = ({ size = 16, color = 'var(--accent-color)' }: { size?: number; color?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <line x1="12" y1="5" x2="12" y2="19" stroke="rgba(61, 61, 61, 0.95)" strokeWidth="7.5" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="rgba(61, 61, 61, 0.95)" strokeWidth="7.5" strokeLinecap="round" />
    <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="4.2" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="4.2" strokeLinecap="round" />
  </svg>
);

function EliteSelect({ id, defaultValue, options }: { id: string, defaultValue: string, options: { value: string, label: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options.find(o => o.value === defaultValue) || options[0]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input type="hidden" id={id} value={selected.value} />
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', background: 'rgba(var(--theme-rgb), 0.1)', border: '1px solid rgba(var(--theme-rgb), 0.1)',
          borderRadius: '16px', padding: '16px', color: 'var(--text-primary)', fontWeight: '800', fontSize: '15px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          transition: 'all 0.3s ease', fontFamily: "var(--heading-font)"
        }}
      >
        {selected.label}
        <img src="/assets/arrow-custom.png" alt="Expand" style={{ width: '22px', height: '22px', objectFit: 'contain', opacity: 0.5, transform: isOpen ? 'rotate(270deg)' : 'rotate(90deg)', transition: 'transform 0.3s ease' }} />
      </div>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 20,
            background: 'var(--primary-bg)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(var(--theme-rgb), 0.12)', borderRadius: '20px',
            padding: '8px', boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            animation: 'slide-up 0.2s ease-out'
          }}>
            {options.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { setSelected(opt); setIsOpen(false); }}
                style={{
                  padding: '12px 16px', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px',
                  fontWeight: selected.value === opt.value ? '900' : '600',
                  background: selected.value === opt.value ? 'rgba(0,255,170,0.1)' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                {opt.label}
                {selected.value === opt.value && <img src="/assets/check-custom.png" style={{ width: 18, height: 18, objectFit: 'contain' }} alt="Check" />}
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
  const [targetCategory, setTargetCategory] = useState<string>('Breakfast');
  const [servingSize, setServingSize] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const justFocused = useRef(false);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<{ title?: string; message: string } | null>(null);

  const searchCache = useRef<Record<string, any[]>>({});
  const nutritionLogs = tracker.nutritionLogs || [];
  const todayDateStr = new Date().toLocaleDateString('en-CA');
  const isLight = tracker.settings.themeMode === 'light';
  const lang = tracker.settings.language || 'en';
  const t = (k: string) => (translations[lang as 'en' | 'ar'] as Record<string, string>)[k] ?? k;

  // Unique recent meals for instant suggestions
  const COMMON_FOODS = [
    { name: 'Boiled Egg', nameAr: 'بيض مسلوق', calories: 78, protein: 6, carbs: 0.6, fats: 5, portion: 50 },
    { name: 'Fried Egg', nameAr: 'بيض مقلي', calories: 90, protein: 6, carbs: 0.6, fats: 7, portion: 46 },
    { name: 'Grilled Chicken Breast', nameAr: 'صدور دجاج مشوية', calories: 165, protein: 31, carbs: 0, fats: 3.6, portion: 100 },
    { name: 'White Rice (Cooked)', nameAr: 'أرز أبيض مطهو', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, portion: 100 },
    { name: 'Banana', nameAr: 'موز', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, portion: 100 },
    { name: 'Apple', nameAr: 'تفاح', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, portion: 100 },
    { name: 'Oats (Cooked)', nameAr: 'شوفان مطهو', calories: 68, protein: 2.4, carbs: 12, fats: 1.4, portion: 100 },
    { name: 'Milk (Full Fat)', nameAr: 'لبن كامل الدسم', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, portion: 100 },
    { name: 'Greek Yogurt', nameAr: 'زبادي يوناني', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, portion: 100 },
    { name: 'Protein Shake (Whey)', nameAr: 'بروتين شيك', calories: 120, protein: 24, carbs: 3, fats: 1.5, portion: 30 },
    { name: 'Tuna (Canned in Water)', nameAr: 'تونا في محلول ملحي', calories: 116, protein: 26, carbs: 0, fats: 0.8, portion: 100 },
    { name: 'Potato (Boiled)', nameAr: 'بطاطس مسلوقة', calories: 87, protein: 1.9, carbs: 20, fats: 0.1, portion: 100 },
    { name: 'Peanut Butter', nameAr: 'زبدة فول سوداني', calories: 588, protein: 25, carbs: 20, fats: 50, portion: 100 },
    { name: 'Dates', nameAr: 'بلح / تمر', calories: 282, protein: 2.5, carbs: 75, fats: 0.4, portion: 100 }
  ];

  const recentMeals = Array.from(new Set(nutritionLogs.map((l: any) => l.name)))
    .map(name => nutritionLogs.find((l: any) => l.name === name));

  const suggestedResults = searchQuery.trim().length > 0
    ? [...recentMeals, ...COMMON_FOODS]
        .filter(Boolean)
        .filter((m: any) => {
          const n = m.name || m.food_name || '';
          const na = m.nameAr || m.name_ar || '';
          return n.toLowerCase().includes(searchQuery.toLowerCase()) || na.includes(searchQuery);
        })
        .map(m => ({
          ...m,
          name: m.name || m.food_name || 'Unknown Food',
          nameAr: m.nameAr || m.name_ar || '',
          calories: Number(m.calories || m.kcal || 0),
          protein: Number(m.protein || 0),
          carbs: Number(m.carbs || 0),
          fats: Number(m.fats || 0),
          portion: Number(m.portion || 100)
        }))
        .slice(0, 5)
    : recentMeals.slice(0, 5).map(m => ({
        ...m,
        name: m.name || 'Recent Meal',
        nameAr: m.nameAr || '',
        calories: Number(m.calories || 0),
        protein: Number(m.protein || 0),
        carbs: Number(m.carbs || 0),
        fats: Number(m.fats || 0),
        portion: Number(m.portion || 300)
      }));

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = searchQuery.trim().toLowerCase();
      if (q.length >= 3) {
        // Check cache and RE-NORMALIZE to be safe
        if (searchCache.current[q]) {
          console.log('Using cached results for:', q);
          const cached = searchCache.current[q];
          const renorm = cached.map((m: any) => ({
            ...m,
            name: m.name || m.food_name || m.title || 'AI Food Result',
            calories: Number(m.calories || m.kcal || 0)
          }));
          setSearchResults(renorm);
          setShowDropdown(true);
          setIsSearching(false);
          return;
        }

        setIsSearching(true);
        setShowDropdown(true);
        try {
          const results = await FatSecretService.searchFood(searchQuery);
          searchCache.current[q] = results;
          setSearchResults(results);
        } catch (error: any) {
          if (error.message?.includes('429')) {
            setCustomAlert({
              title: t('apiLimitError'),
              message: t('apiLimitErrorMessage')
            });
          }
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsSearching(false);
        setSearchResults([]);
        if (suggestedResults.length === 0) setShowDropdown(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const today = todayDateStr;
  const todayMeals = nutritionLogs.filter((m: any) => {
    const logDate = new Date(m.date).toLocaleDateString('en-CA');
    return logDate === today;
  });

  const consumedCal = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.calories) || 0), 0);
  const consumedPro = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.protein) || 0), 0);
  const consumedCarb = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.carbs) || 0), 0);
  const consumedFat = todayMeals.reduce((sum: number, m: any) => sum + (Number(m.fats) || 0), 0);

  const settings = tracker.settings;
  const profile = settings.nutritionProfile;

  const calculateTargets = (p: any) => {
    const w = Number(p.weight) || 80;
    const h = Number(p.height) || 180;
    const a = Number(p.age) || 25;
    const bmr = (10 * w) + (6.25 * h) - (5 * a) + (p.gender === 'male' ? 5 : -161);
    const tdee = bmr * (Number(p.activityLevel) || 1.375);
    let targetCal = tdee;
    if (p.goal === 'lose') targetCal -= ((Number(p.goalRate) || 0.5) * 7700 / 7);
    if (p.goal === 'gain') targetCal += ((Number(p.goalRate) || 0.5) * 7700 / 7);

    return {
      calories: Math.round(targetCal) || 2500,
      protein: Math.round((targetCal * ((Number(p.proteinRatio) || 30) / 100)) / 4) || 180,
      carbs: Math.round((targetCal * ((Number(p.carbsRatio) || 40) / 100)) / 4) || 250,
      fats: Math.round((targetCal * ((Number(p.fatsRatio) || 30) / 100)) / 9) || 80,
    };
  };

  const targets = profile ? calculateTargets(profile) : { 
    calories: settings.dailyCalorieGoal || 2500, 
    protein: Math.round((settings.dailyCalorieGoal || 2500) * 0.25 / 4), 
    carbs: Math.round((settings.dailyCalorieGoal || 2500) * 0.45 / 4), 
    fats: Math.round((settings.dailyCalorieGoal || 2500) * 0.3 / 9) 
  };

  const calorieGoal = Number(targets.calories) || 2500;
  const safeConsumedCal = Number(consumedCal) || 0;
  const remainingCal = isNaN(calorieGoal - safeConsumedCal) ? 0 : Math.max(0, calorieGoal - safeConsumedCal);

  // ── SCAN: Open native camera → analyze → show result card ──
  const handleScan = async (category: string = 'Breakfast') => {
    setTargetCategory(category);
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
        setCustomAlert({ title: t('scanError'), message: t('scanErrorMessage') });
      }
    } finally {
      setScanning(false);
    }
  };

  const handleAddLog = (mealData?: any) => {
    const data = mealData || scanResult;
    if (data) {
      const name = data.name || data.food_name || data.title || data.item_name || 'AI Food Result';
      const nameAr = data.nameAr || data.name_ar || data.arabic_name || '';
      
      // Original values (per 1 unit/serving)
      const unitCal = Number(data.unitCalories || data.calories || data.kcal || 0);
      const unitPro = Number(data.unitProtein || data.protein || 0);
      const unitCarb = Number(data.unitCarbs || data.carbs || 0);
      const unitFat = Number(data.unitFats || data.fats || 0);
      const unitPortion = Number(data.unitPortion || data.portion || 100);
      const mType = targetCategory || 'Breakfast';

      tracker.addMealLog({
        name, nameAr, 
        servingSize: servingSize,
        unitCalories: unitCal,
        unitProtein: unitPro,
        unitCarbs: unitCarb,
        unitFats: unitFat,
        unitPortion: unitPortion,
        // Final calculated values for the log
        calories: Math.round(unitCal * servingSize),
        protein: Number((unitPro * servingSize).toFixed(1)),
        carbs: Number((unitCarb * servingSize).toFixed(1)),
        fats: Number((unitFat * servingSize).toFixed(1)),
        portion: Math.round(unitPortion * servingSize),
        mealType: mType,
        date: new Date().toISOString()
      });

      setScanResult(null);
      setShowResult(false);
      setServingSize(1);
    }
  };

  const updateLogQuantity = (logId: string, delta: number) => {
    const log = nutritionLogs.find((l: any) => l.id === logId);
    if (!log) return;

    const newSize = Math.max(1, (log.servingSize || 1) + delta);
    // CRITICAL: Always calculate from BASE UNIT values
    const unitCal = log.unitCalories || (log.calories / (log.servingSize || 1));
    const unitPro = log.unitProtein || (log.protein / (log.servingSize || 1));
    const unitCarb = log.unitCarbs || (log.carbs / (log.servingSize || 1));
    const unitFat = log.unitFats || (log.fats / (log.servingSize || 1));
    const unitPortion = log.unitPortion || (log.portion / (log.servingSize || 1));

    tracker.updateMealLog(logId, {
      servingSize: newSize,
      calories: Math.round(unitCal * newSize),
      protein: Number((unitPro * newSize).toFixed(1)),
      carbs: Number((unitCarb * newSize).toFixed(1)),
      fats: Number((unitFat * newSize).toFixed(1)),
      portion: Math.round(unitPortion * newSize)
    });
  };


  const handleBarcodeScan = async () => {
    try {
      const isSupported = await BarcodeScanner.isSupported();
      if (!isSupported.supported) {
        setCustomAlert({
          title: t('barcodeScannerInfo'),
          message: t('barcodeScannerInfoMsg')
        });
        return;
      }

      const permission = await BarcodeScanner.requestPermissions();
      if (permission.camera !== 'granted') {
        setCustomAlert({
          title: t('permissionDenied'),
          message: t('permissionDeniedMsg')
        });
        return;
      }
      
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.UpcA, BarcodeFormat.UpcE, BarcodeFormat.Ean8, BarcodeFormat.Ean13]
      });

      if (barcodes.length > 0 && barcodes[0].rawValue) {
        setScanning(true);
        const food = await FatSecretService.findByBarcode(barcodes[0].rawValue);
        if (food) {
          setScanResult(food);
          setShowResult(true);
        } else {
          setCustomAlert({
            title: t('barcodeNotFound'),
            message: t('barcodeNotFoundMsg')
          });
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Module')) {
         setCustomAlert({
           title: t('scannerError'),
           message: t('barcodeScannerInfoMsg')
         });
         await BarcodeScanner.installGoogleBarcodeScannerModule();
      } else {
          setCustomAlert({
            title: t('scannerError'),
            message: t('unknownScanError')
          });
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      {/* ── Result Overlay (only after scan) ── */}
      {showResult && scanResult && createPortal(
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              width: '100%', maxWidth: '340px', background: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(20,20,20,0.95)',
              borderRadius: '32px', border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(var(--theme-rgb), 0.18)',
              boxShadow: isLight ? '0 20px 60px rgba(0,0,0,0.12)' : 'none',
              padding: '32px 24px', textAlign: 'center', animation: 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* Meal Name */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '20px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: "var(--heading-font)" }}>
                  {scanResult.name}
                </div>
                {scanResult.nameAr && (
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(var(--theme-rgb), 0.5)', marginTop: '4px' }}>
                    {scanResult.nameAr}
                  </div>
                )}
              </div>

              {/* Calories */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '42px', fontWeight: '950', color: 'var(--accent-color)', lineHeight: 1, fontFamily: "var(--heading-font)" }}>
                  {scanResult.calories}
                </div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', opacity: 1, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '6px' }}>
                  {t('totalKcal')}
                </div>
              </div>

              {/* Simple Macros Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ffcc00', fontSize: '20px', fontWeight: '950', fontFamily: "var(--heading-font)" }}>{(scanResult.fats * (servingSize || 1)).toFixed(1)}g</div>
                  <div style={{ color: 'rgba(var(--theme-rgb), 0.6)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('fats')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#4da6ff', fontSize: '20px', fontWeight: '950', fontFamily: "var(--heading-font)" }}>{(scanResult.carbs * (servingSize || 1)).toFixed(1)}g</div>
                  <div style={{ color: 'rgba(var(--theme-rgb), 0.6)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('carbs')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff0033', fontSize: '20px', fontWeight: '950', fontFamily: "var(--heading-font)" }}>{(scanResult.protein * (servingSize || 1)).toFixed(1)}g</div>
                  <div style={{ color: 'rgba(var(--theme-rgb), 0.6)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('protein')}</div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', 
                marginBottom: '28px', background: 'rgba(var(--theme-rgb), 0.1)', borderRadius: '16px', padding: '12px'
              }}>
                <button 
                  onClick={() => setServingSize(Math.max(0.5, servingSize - 0.5))}
                  style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(var(--theme-rgb), 0.1)', color: 'var(--text-primary)', fontSize: '20px', fontWeight: '900' }}
                >
                  -
                </button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: "var(--heading-font)" }}>x{servingSize}</div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(var(--theme-rgb), 0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('servings')}</div>
                </div>
                <button 
                  onClick={() => setServingSize(servingSize + 0.5)}
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '12px', 
                    background: 'rgba(var(--theme-rgb), 0.1)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <CustomPlus size={16} color="var(--text-primary)" />
                </button>
              </div>

              {/* Mini Category Selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTargetCategory(cat)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: '10px', fontSize: '10px', fontWeight: '800',
                      background: 'transparent',
                      color: targetCategory === cat ? 'var(--accent-color)' : 'rgba(var(--theme-rgb), 0.4)',
                      border: targetCategory === cat ? '1.5px dashed var(--accent-color)' : '1px dashed rgba(var(--theme-rgb), 0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {t(cat.toLowerCase())}
                  </button>
                ))}
              </div>
              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button
                  onClick={() => { setScanResult(null); setShowResult(false); handleScan(); }}
                  style={{ 
                    flex: 1, height: '52px', borderRadius: '18px', 
                    background: 'transparent', 
                    border: '1.5px solid rgba(var(--theme-rgb), 0.2)', 
                    color: 'var(--text-primary)', fontWeight: '900', fontSize: '14px'
                  }}
                >
                  {t('scanNew')}
                </button>
                <button
                  onClick={() => handleAddLog()}
                  style={{ 
                    flex: 1, height: '52px', borderRadius: '18px', 
                    background: 'transparent', 
                    border: '2px solid var(--accent-color)', 
                    color: 'var(--accent-color)', fontWeight: '950', fontSize: '14px',
                    textTransform: 'uppercase', letterSpacing: '1px'
                  }}
                >
                  {t('logMeal')}
                </button>
              </div>

              {/* Cancel Link */}
              <button
                onClick={() => { setScanResult(null); setShowResult(false); }}
                style={{ 
                  background: 'none', border: 'none', 
                  color: '#ff4d4d', 
                  fontSize: '11px', fontWeight: '800',
                  textTransform: 'uppercase', letterSpacing: '1px'
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>,
        document.getElementById('scanner-root')!
      )}

      {/* ── Custom Premium Alert Modal ── */}
      {customAlert && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '340px', background: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(20,20,20,0.95)',
            borderRadius: '32px', border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(var(--theme-rgb), 0.18)',
            padding: '32px 24px', textAlign: 'center', animation: 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {customAlert.title && (
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '950', 
                color: 'var(--accent-color)', 
                fontFamily: "var(--heading-font)",
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '16px'
              }}>
                {customAlert.title}
              </div>
            )}
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              lineHeight: '1.6',
              marginBottom: '28px',
              whiteSpace: 'pre-line'
            }}>
              {customAlert.message}
            </div>
            <button 
              onClick={() => setCustomAlert(null)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: 'var(--accent-color)',
                color: '#ffffff',
                fontWeight: '950',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "var(--heading-font)",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 8px 24px rgba(0, 255, 170, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {t('ok')}
            </button>
          </div>
        </div>,
        document.getElementById('scanner-root')!
      )}

      {/* ── Loading overlay while scanning ── */}
      {scanning && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px'
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            border: '3px solid rgba(var(--theme-rgb), 0.1)',
            borderTop: '3px solid var(--accent-color)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ color: 'var(--accent-color)', fontWeight: '900', letterSpacing: '3px', fontSize: '12px' }}>{t('analyzing')}</div>
        </div>,
        document.getElementById('scanner-root')!
      )}

      {/* ── Main Page Content ── */}
      <div className="hide-scrollbar" style={{ padding: '0 20px 100px', width: '100%', boxSizing: 'border-box', overflowY: 'auto', height: '100%' }}>
        
        {/* SEARCH BAR */}
        <div ref={searchRef} style={{ marginTop: '20px', display: 'flex', gap: '10px', position: 'relative', zIndex: 1000 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text"
              placeholder={t('searchFood')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setShowDropdown(true);
                justFocused.current = true;
                setTimeout(() => {
                  justFocused.current = false;
                }, 100);
              }}
              onClick={() => {
                if (!justFocused.current) {
                  setShowDropdown(prev => !prev);
                }
              }}
              className={`premium-search-input ${showDropdown && (suggestedResults.length > 0 || isSearching || searchResults.length > 0) ? 'dropdown-open' : ''}`}
            />
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }}>
              <Search size={18} />
            </div>

            {/* LIVE SEARCH DROPDOWN */}
            {showDropdown && (suggestedResults.length > 0 || isSearching || searchResults.length > 0) && (
              <div className="hide-scrollbar" style={{
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0,
                marginTop: '-1.5px',
                background: 'var(--glass-bg)', 
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1.5px solid rgba(var(--theme-rgb), 0.3)', 
                borderTop: 'none',
                borderRadius: '0 0 20px 20px',
                padding: '10px',
                maxHeight: '350px', 
                overflowY: 'auto', 
                transformOrigin: 'top center',
                animation: 'elite-expand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 1000,
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)'
              }}>
                {/* Instant Suggestions from History */}
                {suggestedResults.length > 0 && !isSearching && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ overflow: 'hidden' }}>
                      {suggestedResults.map((item: any, idx: number) => (
                        <div 
                          key={`rec-${idx}`}
                          onClick={() => { 
                            setScanResult(item); 
                            setTargetCategory('Breakfast'); 
                            setShowResult(true); 
                            setShowDropdown(false); 
                            setSearchQuery(''); 
                          }}
                          className="nutrition-dropdown-item"
                        >
                          <div style={{ fontWeight: '900', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px', fontFamily: "var(--heading-font)" }}>{item.name}</div>
                          {item.nameAr && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', opacity: 0.8 }}>{item.nameAr}</div>}
                          <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: '950', marginTop: '4px', letterSpacing: '0.5px' }}>{item.calories} {t('kcal')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isSearching ? (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ width: '22px', height: '22px', border: '2.5px solid rgba(0,255,170,0.1)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-color)', marginTop: '12px', letterSpacing: '2px', opacity: 0.6 }}>{t('searching')}</div>
                  </div>
                ) : (
                  <>
                    {/* AI Results Section with Colored Divider */}
                    {searchResults.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {suggestedResults.length > 0 && (
                          <div style={{ 
                            height: '1.5px', 
                            background: 'linear-gradient(90deg, transparent, var(--glass-border), transparent)', 
                            margin: '12px 12px' 
                          }} />
                        )}
                        
                        <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-color)', letterSpacing: '2px', padding: '8px 12px', textTransform: 'uppercase' }}>{t('searchResults')}</div>
                        <div style={{ overflow: 'hidden' }}>
                          {searchResults.map((item, idx) => {
                            const normalizedItem = {
                              ...item,
                              name: item.name || item.food_name || item.title || 'Unknown Food',
                              calories: Number(item.calories || item.kcal || 0),
                              protein: Number(item.protein || 0),
                              carbs: Number(item.carbs || 0),
                              fats: Number(item.fats || 0)
                            };
                            return (
                              <div 
                                key={`res-${idx}`}
                                onClick={() => { 
                                  console.log('AI Result Selected:', normalizedItem);
                                  setScanResult(normalizedItem); 
                                  setTargetCategory('Breakfast'); 
                                  setShowResult(true); 
                                  setShowDropdown(false); 
                                  setSearchQuery(''); 
                                }}
                                className="nutrition-dropdown-item"
                              >
                                <div style={{ fontWeight: '950', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px', fontFamily: "var(--heading-font)", letterSpacing: '-0.3px' }}>{normalizedItem.name}</div>
                                {normalizedItem.nameAr && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '700', opacity: 0.9 }}>{normalizedItem.nameAr}</div>}
                                <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: '950', letterSpacing: '0.5px' }}>
                                  {normalizedItem.calories} <span style={{opacity: 0.9}}>{t('kcal')}</span> 
                                  <span style={{ opacity: 0.85, margin: '0 8px' }}>•</span> 
                                  {normalizedItem.portion || 100}<span style={{opacity: 0.9}}>G</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={handleBarcodeScan}
            style={{
              width: '50px', height: '50px', borderRadius: '16px',
              background: tracker.settings.themeMode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
              border: tracker.settings.themeMode === 'light' ? '1px solid rgba(0,0,0,0.1)' : 'none',
              boxShadow: tracker.settings.themeMode === 'light' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <img src="/assets/qrcode-custom.png" alt="Scan" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </button>
        </div>

        {/* PREMIUM CIRCULAR CALORIE HEADER - Clean */}
        <div style={{ 
          padding: '24px 0 32px', 
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
             <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '3px', opacity: 1 }}>{t('smartTracker')}</div>
             <button 
              onClick={() => setShowSetup(true)}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '10px', 
                background: 'rgba(0,255,170,0.12)', 
                border: '1.5px solid rgba(0,255,170,0.4)', 
                color: 'var(--accent-color)', 
                fontSize: '10px', 
                fontWeight: '950',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}
             >
               {profile ? t('updateProfile') : t('startSetup')}
             </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px' }}>
            {/* Donut Circle on the Left */}
            <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="140" height="140" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="transparent" stroke="rgba(var(--theme-rgb), 0.2)" strokeWidth="7" />
                {(() => {
                  const circumference = 2 * Math.PI * 44;
                  const pCal = (Number(consumedPro) || 0) * 4;
                  const cCal = (Number(consumedCarb) || 0) * 4;
                  const fCal = (Number(consumedFat) || 0) * 9;
                  const safeGoal = Number(calorieGoal) || 2500;
                  const pLen = isNaN(pCal / safeGoal) ? 0 : (pCal / safeGoal) * circumference;
                  const cLen = isNaN(cCal / safeGoal) ? 0 : (cCal / safeGoal) * circumference;
                  const fLen = isNaN(fCal / safeGoal) ? 0 : (fCal / safeGoal) * circumference;
                  return (
                    <>
                      <circle cx="50" cy="50" r="44" fill="transparent" stroke="#ffcc00" strokeWidth="7" strokeDasharray={`${fLen} ${circumference}`} strokeDashoffset={0} transform="rotate(-90 50 50)" style={{ transition: 'all 1s ease' }} />
                      <circle cx="50" cy="50" r="44" fill="transparent" stroke="#4da6ff" strokeWidth="7" strokeDasharray={`${cLen} ${circumference}`} strokeDashoffset={-fLen || 0} transform="rotate(-90 50 50)" style={{ transition: 'all 1s ease' }} />
                      <circle cx="50" cy="50" r="44" fill="transparent" stroke="#ff4d4d" strokeWidth="7" strokeDasharray={`${pLen} ${circumference}`} strokeDashoffset={-(fLen + cLen) || 0} transform="rotate(-90 50 50)" style={{ transition: 'all 1s ease' }} />
                    </>
                  );
                })()}
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '34px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: "var(--heading-font)", lineHeight: 1, letterSpacing: '-1.5px' }}>{remainingCal}</div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '2px', marginTop: '4px', opacity: 1 }}>{t('left')}</div>
              </div>
            </div>

            {/* Subtle Vertical Divider */}
            {/* Vertical Divider with stronger presence */}
            <div style={{ 
              width: '1px', 
              height: '80px', 
              background: 'linear-gradient(to bottom, transparent, var(--glass-border), transparent)', 
              alignSelf: 'center',
            }} />

            {/* Stats on the Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '15px', textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.8)', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>{t('dailyGoal')}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: "var(--heading-font)" }}>{calorieGoal}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.8)', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>{t('consumed')}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-color)', fontFamily: "var(--heading-font)" }}>{consumedCal}</div>
              </div>
            </div>
          </div>

          {/* Spread Macro Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '28px',
            padding: '0 5px'
          }}>
            {[
              { label: 'protein', val: consumedPro, color: '#ff3300' },
              { label: 'carbs', val: consumedCarb, color: '#4da6ff' },
              { label: 'fats', val: consumedFat, color: '#ffcc00' }
            ].map((m, idx) => (
              <div key={m.label} style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: idx === 0 ? 'flex-start' : (idx === 2 ? 'flex-end' : 'center'),
                position: 'relative'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: m.color, fontFamily: "var(--heading-font)" }}>{m.val.toFixed(1)}<span style={{fontSize: '10px', opacity: 0.75, fontWeight: '700', marginLeft: '2px'}}>g</span></div>
                <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.85)', fontWeight: '900', letterSpacing: '1px' }}>{t(m.label).toUpperCase()}</div>
              </div>
            ))}
          </div>
          {/* Strong Full-Width Neon Horizontal Beam */}
          <div style={{ 
            height: '2px', 
            width: 'calc(100% + 40px)', 
            margin: '32px -20px 0', 
            background: 'linear-gradient(90deg, transparent, var(--glass-border), transparent)', 
          }} />
        </div>

        {/* DIARY SECTIONS */}
        {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((category) => {
          const catMeals = todayMeals.filter((m: any) => {
            if (m.mealType) return m.mealType === category;
            const hour = new Date(m.date).getHours();
            if (category === 'Breakfast') return hour >= 4 && hour < 11;
            if (category === 'Lunch') return hour >= 11 && hour < 16;
            if (category === 'Dinner') return hour >= 16 && hour < 22;
            return hour >= 22 || hour < 4;
          });
          const catCal = catMeals.reduce((s: number, m: any) => s + m.calories, 0);

          return (
            <div key={category} style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', marginTop: '12px' }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: '950', 
                  color: 'var(--accent-color)', 
                  letterSpacing: '3px', 
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}>
                  {t(category.toLowerCase())}
                </div>
                <div style={{ 
                  flex: 1, 
                  height: '1.5px', 
                  background: 'linear-gradient(to right, rgba(var(--theme-rgb), 0.3), transparent)'
                }} />
                {catCal > 0 && (
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: '900', 
                    color: 'rgba(var(--theme-rgb), 0.6)',
                    fontFamily: "var(--heading-font)"
                  }}>
                    {catCal} {t('kcal')}
                  </div>
                )}
              </div>

              <div>
                {catMeals.map((meal: any) => {
                  const isExpanded = expandedMealId === meal.id;
                  return (
                    <div key={meal.id} style={{
                      background: isExpanded ? 'rgba(var(--theme-rgb), 0.14)' : 'rgba(var(--theme-rgb), 0.01)',
                      borderRadius: '18px',
                      margin: '6px 0',
                      border: '1px solid ' + (isExpanded ? 'rgba(var(--theme-rgb), 0.15)' : 'rgba(var(--theme-rgb), 0.18)'),
                      boxShadow: isExpanded ? '0 12px 30px rgba(0, 0, 0, 0.12)' : 'none',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}>
                      <div 
                        onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                        style={{
                          padding: '16px 20px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px', fontFamily: "var(--heading-font)" }}>{meal.name}</div>
                          {meal.nameAr && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', opacity: 1 }}>{meal.nameAr}</div>}
                          
                          {/* Quick Quantity Toggle - Now below name for better width */}
                          <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px',
                            marginTop: meal.nameAr ? '0' : '6px'
                          }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateLogQuantity(meal.id, -1); }}
                              style={{ 
                                background: 'none', border: 'none', color: 'var(--text-primary)', 
                                fontSize: '20px', fontWeight: '900', padding: '0 4px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 1
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: '950', color: 'var(--accent-color)', fontFamily: "var(--heading-font)", minWidth: '24px', textAlign: 'center' }}>x{meal.servingSize || 1}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateLogQuantity(meal.id, 1); }}
                              style={{ 
                                background: 'none', border: 'none', padding: '0 4px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 1
                              }}
                            >
                              <CustomPlus size={14} color="var(--text-primary)" />
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {!isExpanded && (
                            <div style={{ textAlign: 'right', minWidth: '50px' }}>
                              <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--accent-color)', opacity: 0.9 }}>{meal.calories}</div>
                                <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: '900', letterSpacing: '1px' }}>{t('fatLabel')}</div>
                            </div>
                          )}
                          <img src="/assets/arrow-custom.png" alt="Expand" style={{ width: '18px', height: '18px', objectFit: 'contain', opacity: 0.8, transform: isExpanded ? 'rotate(270deg)' : 'rotate(90deg)', transition: 'transform 0.3s ease' }} />
                        </div>
                      </div>

                      {/* Expandable Details Area (The Curtain) */}
                      <div style={{
                        maxHeight: isExpanded ? '120px' : '0',
                        opacity: isExpanded ? 1 : 0,
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: 'rgba(var(--theme-rgb), 0.01)',
                        padding: isExpanded ? '0 20px 24px' : '0 20px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--accent-color)', fontFamily: "var(--heading-font)", lineHeight: 1 }}>{meal.calories}</div>
                              <div style={{ fontSize: '9px', fontWeight: '950', opacity: 1, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>{t('kcal')}</div>
                            </div>
                            
                            <div style={{ width: '2px', background: 'rgba(var(--theme-rgb), 0.15)', height: '24px' }} />
                            
                            <div style={{ display: 'flex', gap: '24px' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ff4d4d', fontSize: '15px', fontWeight: '900', fontFamily: "var(--heading-font)" }}>{meal.protein}g</div>
                                <div style={{ fontSize: '8px', opacity: 1, fontWeight: '950', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>{t('proLabel')}</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#4da6ff', fontSize: '15px', fontWeight: '900', fontFamily: "var(--heading-font)" }}>{meal.carbs}g</div>
                                <div style={{ fontSize: '8px', opacity: 1, fontWeight: '950', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>{t('carbLabel')}</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ffcc00', fontSize: '15px', fontWeight: '900', fontFamily: "var(--heading-font)" }}>{meal.fats}g</div>
                                <div style={{ fontSize: '8px', opacity: 1, fontWeight: '950', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>{t('fatLabel')}</div>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); tracker.deleteMealLog(meal.id); }}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              padding: '8px',
                              color: '#ff4d4d',
                              opacity: 1,
                              marginRight: '-8px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Subtle Divider before Add Button */}
                {catMeals.length > 0 && (
                  <div style={{ 
                    height: '1px', 
                    background: 'linear-gradient(90deg, transparent, rgba(var(--theme-rgb), 0.1), transparent)', 
                    margin: '20px 0 10px' 
                  }} />
                )}

                <button
                  onClick={() => handleScan(category)}
                  disabled={scanning}
                  style={{ 
                    width: '60px', 
                    height: '60px',
                    margin: '25px auto 10px',
                    background: 'transparent', 
                    border: '2px dashed #E67E22', 
                    borderRadius: '50%',
                    color: '#E67E22', 
                    fontSize: '32px', 
                    fontWeight: '200', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: scanning ? 0.3 : 1,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { if(!scanning) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; } }}
                  onMouseLeave={(e) => { if(!scanning) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; } }}
                >
                  {scanning ? (
                    <div style={{ width: '20px', height: '20px', border: '2px solid transparent', borderTopColor: '#E67E22', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  ) : (
                    <CustomPlus size={24} color="#E67E22" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING SCAN BUTTON */}
      <button
        onClick={() => handleScan()}
        disabled={scanning}
        style={{
          position: 'fixed', bottom: '90px', right: '20px',
          width: '60px', height: '60px', borderRadius: '30px',
          background: 'rgba(0, 255, 170, 0.05)', 
          border: '1.5px solid var(--accent-color)', 
          color: 'var(--accent-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          
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
          background: isLight ? 'radial-gradient(circle at top right, rgba(0,200,130,0.08), transparent), radial-gradient(circle at bottom left, rgba(0,163,255,0.06), transparent), rgba(255,255,255,0.96)' : 'radial-gradient(circle at top right, rgba(0,255,170,0.15), transparent), radial-gradient(circle at bottom left, rgba(0,163,255,0.1), transparent), rgba(0,0,0,0.92)',
          backdropFilter: 'blur(25px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            width: '100%', maxWidth: '440px',
            background: 'linear-gradient(145deg, rgba(var(--theme-rgb), 0.14), rgba(var(--theme-rgb), 0.01))',
            borderRadius: '40px',
            border: '1px solid rgba(var(--theme-rgb), 0.12)',
            padding: '40px',
            
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-color)', filter: 'blur(80px)', opacity: 0.15 }} />

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '950', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-1px', fontFamily: "var(--heading-font)" }}>{t('smartSetup')}</h2>
              <div style={{ width: '40px', height: '3px', background: 'var(--accent-color)', margin: '0 auto', borderRadius: '2px', opacity: 0.8 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {[
                { id: 'setup-weight', label: 'bodyWeight', val: profile?.weight || 80, unit: 'kg' },
                { id: 'setup-height', label: 'height', val: profile?.height || 180, unit: 'cm' },
                { id: 'setup-age', label: 'age', val: profile?.age || 25, unit: 'yr' }
              ].map(field => (
                <div key={field.id}>
                  <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '10px', letterSpacing: '1px', opacity: 0.9 }}>{t(field.label).toUpperCase()}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" defaultValue={field.val}
                      id={field.id}
                      style={{ width: '100%', background: 'rgba(var(--theme-rgb), 0.1)', border: '1px solid rgba(var(--theme-rgb), 0.1)', borderRadius: '16px', padding: '16px', color: 'var(--text-primary)', fontWeight: '800', fontSize: '16px', outline: 'none', transition: 'all 0.3s ease', fontFamily: "var(--heading-font)" }}
                      onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--accent-color)'; e.currentTarget.style.background = 'rgba(var(--theme-rgb), 0.07)'; }}
                      onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(var(--theme-rgb), 0.1)'; e.currentTarget.style.background = 'rgba(var(--theme-rgb), 0.1)'; }}
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '900', opacity: 0.7, color: 'var(--text-primary)' }}>{t(field.unit)}</span>
                  </div>
                </div>
              ))}
              <div>
                <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '10px', letterSpacing: '1px', opacity: 0.9 }}>{t('gender')}</label>
                <EliteSelect 
                  id="setup-gender"
                  defaultValue={profile?.gender || 'male'}
                  options={[
                    { value: 'male', label: t('male') },
                    { value: 'female', label: t('female') }
                  ]}
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', display: 'block', marginBottom: '10px', letterSpacing: '1px', opacity: 0.9 }}>{t('fitnessGoal')}</label>
              <EliteSelect 
                id="setup-goal"
                defaultValue={profile?.goal || 'maintain'}
                options={[
                  { value: 'lose', label: t('loseWeight') },
                  { value: 'maintain', label: t('maintainWeight') },
                  { value: 'gain', label: t('gainWeight') }
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
                background: 'var(--accent-color)', border: 'none', color: 'var(--text-primary)', 
                fontWeight: '950', fontSize: '15px', textTransform: 'uppercase', 
                letterSpacing: '1px', marginBottom: '16px', cursor: 'pointer',
                
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {t('saveStartProgress')}
            </button>

            <button
              onClick={() => setShowSetup(false)}
              style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(var(--theme-rgb), 0.4)', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              {t('maybeLater')}
            </button>
          </div>
        </div>,
        document.getElementById('scanner-root')!
      )}


      
      <style>{`
        .premium-search-input {
          width: 100%;
          padding: 14px 20px;
          padding-left: 44px;
          background: rgba(var(--theme-rgb), 0.06);
          border: 1.5px solid rgba(var(--theme-rgb), 0.16);
          border-radius: 20px;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: var(--heading-font);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .premium-search-input:focus {
          background: rgba(var(--theme-rgb), 0.12);
          border-color: var(--accent-color);
          box-shadow: 0 8px 24px rgba(var(--accent-rgb), 0.15);
        }
        .premium-search-input.dropdown-open {
          border-bottom-left-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
          background: var(--glass-bg) !important;
          border-color: rgba(var(--theme-rgb), 0.3) !important;
          box-shadow: none !important;
        }
        .premium-search-input.dropdown-open:focus {
          background: var(--glass-bg) !important;
          border-color: rgba(var(--theme-rgb), 0.3) !important;
          box-shadow: none !important;
        }
        .nutrition-dropdown-item {
          padding: 14px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 1px solid rgba(var(--theme-rgb), 0.08);
          position: relative;
          overflow: hidden;
        }
        .nutrition-dropdown-item:last-child {
          border-bottom: none;
        }
        .nutrition-dropdown-item:hover {
          background: rgba(var(--theme-rgb), 0.08);
          transform: translateX(4px);
        }
        @keyframes elite-expand {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
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
