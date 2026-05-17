import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Scan, RefreshCw } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { GeminiService } from '../../services/gemini';
import { ChevronDown, Check, Search } from 'lucide-react';
import { FatSecretService } from '../../services/fatsecret';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';

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
          width: '100%', background: 'rgba(var(--theme-rgb), 0.03)', border: '1px solid rgba(var(--theme-rgb), 0.1)',
          borderRadius: '16px', padding: '16px', color: 'var(--text-primary)', fontWeight: '800', fontSize: '15px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          transition: 'all 0.3s ease', fontFamily: "'Montserrat', sans-serif"
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
            background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(var(--theme-rgb), 0.1)', borderRadius: '20px',
            padding: '8px', 
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
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  const searchCache = useRef<Record<string, any[]>>({});
  const nutritionLogs = tracker.nutritionLogs || [];
  const todayDateStr = new Date().toLocaleDateString('en-CA');

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
          console.error('AI Search Error:', error);
          if (error.message?.includes('429')) {
            alert('Google API Limit Reached. Please wait 60 seconds.');
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
        console.error('Analysis failed:', err);
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
        alert('Scanner requires a mobile device. This feature uses native ML Kit which only works on Android/iOS app builds. Once you build the APK, you can scan any food barcode! 📱');
        return;
      }

      const permission = await BarcodeScanner.requestPermissions();
      if (permission.camera !== 'granted') {
        alert('Camera permission is required to scan barcodes');
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
          alert('AI couldn\'t identify this barcode yet. Try searching for it by name!');
        }
      }
    } catch (err: any) {
      console.error('Barcode Scan Error:', err);
      // If it still fails with module error, it might need one last sync
      if (err.message?.includes('Module')) {
         alert('جاري تهيئة السكنر لأول مرة، جرب كمان ثانية');
         await BarcodeScanner.installGoogleBarcodeScannerModule();
      } else {
         alert('Scanner Error: ' + (err.message || 'Unknown error'));
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
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              width: '100%', maxWidth: '340px', background: 'rgba(20,20,20,0.95)',
              borderRadius: '32px', border: '1px solid rgba(var(--theme-rgb), 0.08)',
              padding: '32px 24px', textAlign: 'center', animation: 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* Meal Name */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '20px', fontWeight: '950', color: '#ffffff', fontFamily: "'Montserrat', sans-serif" }}>
                  {scanResult.name}
                </div>
                {scanResult.nameAr && (
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    {scanResult.nameAr}
                  </div>
                )}
              </div>

              {/* Calories */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '42px', fontWeight: '950', color: 'var(--accent-color)', lineHeight: 1, fontFamily: "'Montserrat', sans-serif" }}>
                  {scanResult.calories}
                </div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', opacity: 1, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '6px' }}>
                  Total KCAL
                </div>
              </div>

              {/* Simple Macros Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ffcc00', fontSize: '20px', fontWeight: '950', fontFamily: "'Montserrat', sans-serif" }}>{(scanResult.fats * (servingSize || 1)).toFixed(1)}g</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Fats</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#4da6ff', fontSize: '20px', fontWeight: '950', fontFamily: "'Montserrat', sans-serif" }}>{(scanResult.carbs * (servingSize || 1)).toFixed(1)}g</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Carbs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff0033', fontSize: '20px', fontWeight: '950', fontFamily: "'Montserrat', sans-serif" }}>{(scanResult.protein * (servingSize || 1)).toFixed(1)}g</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Protein</div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', 
                marginBottom: '28px', background: 'rgba(var(--theme-rgb), 0.03)', borderRadius: '16px', padding: '12px'
              }}>
                <button 
                  onClick={() => setServingSize(Math.max(0.5, servingSize - 0.5))}
                  style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '20px', fontWeight: '900' }}
                >
                  -
                </button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '950', color: '#ffffff', fontFamily: "'Montserrat', sans-serif" }}>x{servingSize}</div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Servings</div>
                </div>
                <button 
                  onClick={() => setServingSize(servingSize + 0.5)}
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '12px', 
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <CustomPlus size={16} color="#ffffff" />
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
                      color: targetCategory === cat ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)',
                      border: targetCategory === cat ? '1.5px dashed var(--accent-color)' : '1px dashed rgba(255,255,255,0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {cat.substring(0, 3)}
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
                    border: '1.5px solid rgba(255,255,255,0.2)', 
                    color: '#ffffff', fontWeight: '900', fontSize: '14px'
                  }}
                >
                  Scan New
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
                  Log Meal
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
            border: '3px solid rgba(var(--theme-rgb), 0.1)',
            borderTop: '3px solid var(--accent-color)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ color: 'var(--accent-color)', fontWeight: '900', letterSpacing: '3px', fontSize: '12px' }}>ANALYZING...</div>
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
              placeholder="Search food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestedResults.length > 0) setShowDropdown(true);
              }}
              onClick={() => {
                if (suggestedResults.length > 0) setShowDropdown(!showDropdown);
              }}
              style={{
                width: '100%', padding: '14px 20px', paddingLeft: '44px',
                background: showDropdown ? 'rgba(var(--theme-rgb), 0.05)' : 'rgba(var(--theme-rgb), 0.03)', 
                backdropFilter: showDropdown ? 'blur(30px)' : 'none',
                WebkitBackdropFilter: showDropdown ? 'blur(30px)' : 'none',
                border: '1.5px solid rgba(var(--theme-rgb), 0.3)',
                borderBottom: showDropdown ? 'none' : '1.5px solid rgba(var(--theme-rgb), 0.3)',
                borderRadius: showDropdown ? '20px 20px 0 0' : '20px', 
                color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600',
                outline: 'none', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: "'Montserrat', sans-serif",
                boxShadow: showDropdown ? 'none' : '0 4px 12px rgba(0,0,0,0.02)'
              }}
            />
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }}>
              <Search size={18} />
            </div>

            {/* LIVE SEARCH DROPDOWN */}
            {showDropdown && (
              <div className="hide-scrollbar" style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                marginTop: '-1.5px', 
                background: 'rgba(var(--theme-rgb), 0.05)', backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1.5px solid rgba(var(--theme-rgb), 0.3)', 
                borderTop: 'none',
                borderRadius: '0 0 24px 24px',
                 padding: '10px',
                maxHeight: '350px', overflowY: 'auto', 
                transformOrigin: 'top',
                animation: 'elite-expand 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 1000
              }}>
                {/* Instant Suggestions from History */}
                {suggestedResults.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-color)', letterSpacing: '2px', padding: '8px 12px', textTransform: 'uppercase' }}>AI Suggestions</div>
                    <div style={{ 
                      overflow: 'hidden'
                    }}>
                      {suggestedResults.map((item: any, idx: number) => (
                        <div 
                          key={`rec-${idx}`}
                          onClick={() => { setScanResult(item); setTargetCategory('Breakfast'); setShowResult(true); setShowDropdown(false); setSearchQuery(''); }}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            borderBottom: idx === suggestedResults.length - 1 ? 'none' : '1px solid rgba(var(--theme-rgb), 0.04)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(var(--theme-rgb), 0.03)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: '900', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px', fontFamily: "'Montserrat', sans-serif" }}>{item.name}</div>
                          {item.nameAr && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', opacity: 0.8 }}>{item.nameAr}</div>}
                          <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: '950', marginTop: '4px', letterSpacing: '0.5px' }}>{item.calories} KCAL</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isSearching ? (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ width: '22px', height: '22px', border: '2.5px solid rgba(0,255,170,0.1)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-color)', marginTop: '12px', letterSpacing: '2px', opacity: 0.6 }}>SEARCHING...</div>
                  </div>
                ) : (
                  <>
                    {/* AI Results Section with Colored Divider */}
                    {searchResults.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ 
                          height: '2px', 
                          background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)', 
                          opacity: 0.3,
                          margin: '20px 12px' 
                        }} />
                        
                        <div style={{ fontSize: '10px', fontWeight: '950', color: 'var(--accent-color)', letterSpacing: '2px', padding: '8px 12px', textTransform: 'uppercase' }}>Search Results</div>
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
                                style={{
                                  padding: '16px 16px', borderRadius: '16px',
                                  cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid rgba(var(--theme-rgb), 0.05)',
                                  position: 'relative', overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(var(--theme-rgb), 0.04)';
                                  e.currentTarget.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.transform = 'translateX(0)';
                                }}
                              >
                                <div style={{ fontWeight: '950', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.3px' }}>{normalizedItem.name}</div>
                                {normalizedItem.nameAr && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '700', opacity: 0.9 }}>{normalizedItem.nameAr}</div>}
                                <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: '950', letterSpacing: '0.5px' }}>
                                  {normalizedItem.calories} <span style={{opacity: 0.7}}>KCAL</span> 
                                  <span style={{ opacity: 0.4, margin: '0 8px' }}>•</span> 
                                  {normalizedItem.portion || 100}<span style={{opacity: 0.7}}>G</span>
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
              background: 'rgba(255, 255, 255, 0.85)', border: 'none',
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
             <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '3px', opacity: 1 }}>SMART TRACKER</div>
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
               {profile ? 'UPDATE PROFILE' : 'START SETUP'}
             </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px' }}>
            {/* Donut Circle on the Left */}
            <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="140" height="140" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="transparent" stroke="rgba(var(--theme-rgb), 0.2)" strokeWidth="7" />
                {(() => {
                  const circumference = 2 * Math.PI * 44;
                  const pCal = consumedPro * 4;
                  const cCal = consumedCarb * 4;
                  const fCal = consumedFat * 9;
                  const pLen = (pCal / calorieGoal) * circumference;
                  const cLen = (cCal / calorieGoal) * circumference;
                  const fLen = (fCal / calorieGoal) * circumference;
                  return (
                    <>
                      <circle cx="50" cy="50" r="44" fill="transparent" stroke="#ffcc00" strokeWidth="7" strokeDasharray={`${fLen} ${circumference}`} strokeDashoffset={0} transform="rotate(-90 50 50)" style={{ transition: 'all 1s ease' }} />
                      <circle cx="50" cy="50" r="44" fill="transparent" stroke="#4da6ff" strokeWidth="7" strokeDasharray={`${cLen} ${circumference}`} strokeDashoffset={-fLen} transform="rotate(-90 50 50)" style={{ transition: 'all 1s ease' }} />
                      <circle cx="50" cy="50" r="44" fill="transparent" stroke="#ff4d4d" strokeWidth="7" strokeDasharray={`${pLen} ${circumference}`} strokeDashoffset={-(fLen + cLen)} transform="rotate(-90 50 50)" style={{ transition: 'all 1s ease' }} />
                    </>
                  );
                })()}
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '34px', fontWeight: '950', color: 'var(--text-primary)', fontFamily: "'Montserrat', sans-serif", lineHeight: 1, letterSpacing: '-1.5px' }}>{remainingCal}</div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '2px', marginTop: '4px', opacity: 1 }}>LEFT</div>
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
                <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.8)', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>DAILY GOAL</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: "'Montserrat', sans-serif" }}>{calorieGoal}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.8)', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>CONSUMED</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-color)', fontFamily: "'Montserrat', sans-serif" }}>{consumedCal}</div>
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
              { label: 'PROTEIN', val: consumedPro, color: '#ff3300' },
              { label: 'CARBS', val: consumedCarb, color: '#4da6ff' },
              { label: 'FATS', val: consumedFat, color: '#ffcc00' }
            ].map((m, idx) => (
              <div key={m.label} style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: idx === 0 ? 'flex-start' : (idx === 2 ? 'flex-end' : 'center'),
                position: 'relative'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: m.color, fontFamily: "'Montserrat', sans-serif" }}>{m.val.toFixed(1)}<span style={{fontSize: '10px', opacity: 0.3, fontWeight: '700', marginLeft: '2px'}}>g</span></div>
                <div style={{ fontSize: '10px', color: 'rgba(var(--theme-rgb), 0.85)', fontWeight: '900', letterSpacing: '1px' }}>{m.label}</div>
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
                  {category}
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
                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                    {catCal} KCAL
                  </div>
                )}
              </div>

              <div>
                {catMeals.map((meal: any) => {
                  const isExpanded = expandedMealId === meal.id;
                  return (
                    <div key={meal.id} style={{
                      background: isExpanded ? 'rgba(var(--theme-rgb), 0.05)' : 'rgba(var(--theme-rgb), 0.01)',
                      borderRadius: '18px',
                      margin: '6px 0',
                      border: '1px solid ' + (isExpanded ? 'rgba(var(--theme-rgb), 0.15)' : 'rgba(var(--theme-rgb), 0.08)'),
                      boxShadow: isExpanded ? '0 12px 30px rgba(0,0,0,0.04)' : 'none',
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
                          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px', fontFamily: "'Montserrat', sans-serif" }}>{meal.name}</div>
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
                            <span style={{ fontSize: '12px', fontWeight: '950', color: 'var(--accent-color)', fontFamily: "'Montserrat', sans-serif", minWidth: '24px', textAlign: 'center' }}>x{meal.servingSize || 1}</span>
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
                                <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: '900', letterSpacing: '1px' }}>FAT</div>
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
                              <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--accent-color)', fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{meal.calories}</div>
                              <div style={{ fontSize: '9px', fontWeight: '950', opacity: 1, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>Kcal</div>
                            </div>
                            
                            <div style={{ width: '2px', background: 'rgba(var(--theme-rgb), 0.15)', height: '24px' }} />
                            
                            <div style={{ display: 'flex', gap: '24px' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ff4d4d', fontSize: '15px', fontWeight: '900', fontFamily: "'Montserrat', sans-serif" }}>{meal.protein}g</div>
                                <div style={{ fontSize: '8px', opacity: 1, fontWeight: '950', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>PRO</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#4da6ff', fontSize: '15px', fontWeight: '900', fontFamily: "'Montserrat', sans-serif" }}>{meal.carbs}g</div>
                                <div style={{ fontSize: '8px', opacity: 1, fontWeight: '950', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>CARB</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ffcc00', fontSize: '15px', fontWeight: '900', fontFamily: "'Montserrat', sans-serif" }}>{meal.fats}g</div>
                                <div style={{ fontSize: '8px', opacity: 1, fontWeight: '950', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>FAT</div>
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
                    background: 'linear-gradient(90deg, transparent, rgba(var(--theme-rgb), 0.03), transparent)', 
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
          background: 'radial-gradient(circle at top right, rgba(0,255,170,0.15), transparent), radial-gradient(circle at bottom left, rgba(0,163,255,0.1), transparent), rgba(0,0,0,0.92)',
          backdropFilter: 'blur(25px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            width: '100%', maxWidth: '440px',
            background: 'linear-gradient(145deg, rgba(var(--theme-rgb), 0.05), rgba(var(--theme-rgb), 0.01))',
            borderRadius: '40px',
            border: '1px solid rgba(var(--theme-rgb), 0.12)',
            padding: '40px',
            
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-color)', filter: 'blur(80px)', opacity: 0.15 }} />

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '950', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-1px', fontFamily: "'Montserrat', sans-serif" }}>Smart Setup</h2>
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
                      style={{ width: '100%', background: 'rgba(var(--theme-rgb), 0.03)', border: '1px solid rgba(var(--theme-rgb), 0.1)', borderRadius: '16px', padding: '16px', color: 'var(--text-primary)', fontWeight: '800', fontSize: '16px', outline: 'none', transition: 'all 0.3s ease', fontFamily: "'Montserrat', sans-serif" }}
                      onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--accent-color)'; e.currentTarget.style.background = 'rgba(var(--theme-rgb), 0.07)'; }}
                      onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(var(--theme-rgb), 0.1)'; e.currentTarget.style.background = 'rgba(var(--theme-rgb), 0.03)'; }}
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '900', opacity: 0.3, color: 'var(--text-primary)' }}>{field.unit}</span>
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
                
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Save & Start Progress
            </button>

            <button
              onClick={() => setShowSetup(false)}
              style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(var(--theme-rgb), 0.4)', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
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
