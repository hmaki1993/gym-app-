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
  { name: 'Emerald',  hex: '#00e5a0', secondary: '#00b37d' },
  { name: 'Purple',   hex: '#a855f7', secondary: '#7c3aed' },
  { name: 'Orange',   hex: '#ff5e00', secondary: '#ff9500' },
  { name: 'Cyan',     hex: '#00f0ff', secondary: '#0099cc' },
  { name: 'Red',      hex: '#ff3366', secondary: '#cc0033' },
  { name: 'Gold',     hex: '#ffcc00', secondary: '#cc9900' },
  { name: 'Fusion',   hex: '#326144', secondary: '#ff5e00' },
];
