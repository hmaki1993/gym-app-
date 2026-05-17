import type { MuscleGroup } from '../types';

export const MUSCLE_GROUPS: { key: MuscleGroup; ar: string; en: string; icon: string }[] = [
  { key: 'chest',     ar: 'صدر',       en: 'Chest',     icon: '/assets/muscles/chest.png' },
  { key: 'back',      ar: 'ظهر',       en: 'Back',      icon: '/assets/muscles/back.png' },
  { key: 'legs',      ar: 'رجلين',     en: 'Legs',      icon: '/assets/muscles/legs.png' },
  { key: 'shoulders', ar: 'أكتاف',     en: 'Shoulders', icon: '/assets/muscles/shoulders.png' },
  { key: 'arms',      ar: 'دراعات',     en: 'Arms',      icon: '/assets/muscles/biceps.png' },
  { key: 'abs',       ar: 'بطن',       en: 'Abs',       icon: '/assets/muscles/abs.png' },
  { key: 'cardio',    ar: 'كارديو',    en: 'Cardio',    icon: '/assets/muscles/cardio.png' },
];

export const DEFAULT_EXERCISES: Record<MuscleGroup, string[]> = {
  chest: [
    'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
    'Dumbbell Fly', 'Cable Crossover', 'Push Up', 'Chest Dip',
    'Butterfly Machine', 'Pec Deck', 'butter flay machine',
  ],
  back: [
    'Deadlift', 'Pull Up', 'Lat Pulldown', 'Seated Row',
    'Barbell Row', 'Dumbbell Row', 'Face Pull', 'Shrug',
  ],
  legs: [
    'Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl',
    'Leg Extension', 'Calf Raise', 'Hack Squat', 'Lunges',
  ],
  shoulders: [
    'Overhead Press', 'Dumbbell Press', 'Lateral Raise',
    'Front Raise', 'Rear Delt Fly', 'Arnold Press', 'Upright Row',
  ],
  arms: [
    'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
    'Tricep Pushdown', 'Skull Crusher', 'Overhead Extension', 'Tricep Dip',
  ],
  abs: [
    'Crunch', 'Plank', 'Leg Raise', 'Russian Twist',
    'Cable Crunch', 'Ab Wheel', 'Mountain Climber',
  ],
  cardio: [
    'Treadmill', 'Bike', 'Rowing', 'Jump Rope',
    'Stair Climber', 'Elliptical',
  ],
};

export const EXERCISE_TRANSLATIONS: Record<string, string> = {
  // Chest
  'Bench Press': 'بنش برس - دفع بالبار',
  'Incline Bench Press': 'بنش عالي - دفع بالبار مائل',
  'Decline Bench Press': 'بنش مقلوب - دفع بالبار مائل لأسفل',
  'Dumbbell Fly': 'تفتيح بالدمبل',
  'Cable Crossover': 'تجميع كابل',
  'Push Up': 'تمرين الضغط',
  'Chest Dip': 'متوازي صدر',
  'Butterfly Machine': 'جهاز الفراشة - تجميع صدر',
  'Pec Deck': 'بك دك - تجميع صدر جهاز',
  'butter flay machine': 'جهاز الفراشة',
  // Back
  'Deadlift': 'ديدليفت - الرفعة الميتة',
  'Pull Up': 'عقلة',
  'Lat Pulldown': 'سحب عالي للظهر',
  'Seated Row': 'سحب أرضي',
  'Barbell Row': 'تجديف بالبار',
  'Dumbbell Row': 'تجديف بالدمبل',
  'Face Pull': 'سحب للوجه',
  'Shrug': 'ترابيس',
  // Legs
  'Squat': 'سكوات - قرفصاء',
  'Leg Press': 'رجل لج برس',
  'Romanian Deadlift': 'ديدليفت روماني',
  'Leg Curl': 'مرجحة رجل خلفي',
  'Leg Extension': 'رفرفة رجل أمامي',
  'Calf Raise': 'سمانة',
  'Hack Squat': 'هاك سكوات',
  'Lunges': 'طعن',
  // Shoulders
  'Overhead Press': 'دفع فوق الرأس بالبار',
  'Dumbbell Press': 'دفع بالأكتاف دمبل',
  'Lateral Raise': 'رفرفة جانبي',
  'Front Raise': 'رفرفة أمامي',
  'Rear Delt Fly': 'رفرفة خلفي',
  'Arnold Press': 'أرنولد برس',
  'Upright Row': 'تجديف للأعلى',
  // Arms
  'Barbell Curl': 'بايسبس بالبار',
  'Dumbbell Curl': 'بايسبس بالدمبل',
  'Hammer Curl': 'بايسبس شاكوش',
  'Preacher Curl': 'بايسبس ارتكاز',
  'Tricep Pushdown': 'ترايسبس كابل',
  'Skull Crusher': 'ترايسبس بار فرنسي',
  'Overhead Extension': 'ترايسبس خلف الرأس',
  'Tricep Dip': 'متوازي تراي',
  // Abs
  'Crunch': 'طحن بطن',
  'Plank': 'بلانك',
  'Leg Raise': 'رفع أرجل',
  'Russian Twist': 'لف روسي',
  'Cable Crunch': 'طحن كابل',
  'Ab Wheel': 'عجلة بطن',
  'Mountain Climber': 'متسلق الجبال',
  // Cardio
  'Treadmill': 'مشاية',
  'Bike': 'عجلة',
  'Rowing': 'تجديف كاردو',
  'Jump Rope': 'نط الحبل',
  'Stair Climber': 'سلم',
  'Elliptical': 'أوربتراك',
};

export const EXERCISE_DETAILS: Record<string, { en: string; ar: string }> = {
  'Bench Press': {
    en: 'Lower the bar to mid-chest with controlled motion, then drive it up locking your elbows.',
    ar: 'انزل بالبار لمنتصف الصدر ببطء، ثم ادفعه للأعلى بقوة حتى استقامة الذراعين.'
  },
  'Incline Bench Press': {
    en: 'Targeting the upper chest. Maintain a 45-degree angle on the bench.',
    ar: 'يستهدف عضلات الصدر العلوية. حافظ على زاوية 45 درجة للدكة.'
  },
  'Dumbbell Fly': {
    en: 'Keep a slight bend in your elbows. Feel the stretch in your chest at the bottom.',
    ar: 'حافظ على ثنية بسيطة في الكوع. اشعر بتمدد عضلات الصدر في الأسفل.'
  },
  'Squat': {
    en: 'Keep your back straight and lower your hips until thighs are parallel to the floor.',
    ar: 'حافظ على استقامة ظهرك وانزل بوسطك حتى تصبح الأفخاذ موازية للأرض.'
  },
  'Deadlift': {
    en: 'Lift the bar from the ground to hip height while keeping your back flat.',
    ar: 'ارفع البار من الأرض حتى مستوى الحوض مع الحفاظ على استقامة الظهر تماماً.'
  },
  'Pull Up': {
    en: 'Pull yourself up until your chin is over the bar. Control the descent.',
    ar: 'اسحب جسمك للأعلى حتى يتجاوز ذقنك البار، وانزل ببطء وتحكم.'
  },
  'Lat Pulldown': {
    en: 'Pull the bar down to your upper chest while leaning back slightly.',
    ar: 'اسحب البار لأسفل باتجاه أعلى الصدر مع ميل بسيط للخلف.'
  },
  'Overhead Press': {
    en: 'Press the bar from shoulder height to full extension above your head.',
    ar: 'ادفع البار من مستوى الكتف حتى استقامة الذراعين فوق الرأس.'
  },
  'Barbell Curl': {
    en: 'Curl the bar toward your shoulders while keeping your elbows tucked.',
    ar: 'ارفع البار باتجاه كتفك مع الحفاظ على ثبات الكوع بجانب الجسم.'
  },
  'Tricep Pushdown': {
    en: 'Push the bar down until arms are straight. Squeeze the triceps.',
    ar: 'ادفع البار لأسفل حتى استقامة الذراعين، وركز على قبض عضلة التراي.'
  }
};

export const THEME_COLORS = [
  { name: 'Fusion',   hex: '#00E676', secondary: '#E67E22' },
];
