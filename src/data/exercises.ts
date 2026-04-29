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

export const THEME_COLORS = [
  { name: 'Emerald',  hex: '#00e5a0', secondary: '#00b37d' },
  { name: 'Purple',   hex: '#a855f7', secondary: '#7c3aed' },
  { name: 'Orange',   hex: '#ff5e00', secondary: '#ff9500' },
  { name: 'Cyan',     hex: '#00f0ff', secondary: '#0099cc' },
  { name: 'Red',      hex: '#ff3366', secondary: '#cc0033' },
  { name: 'Gold',     hex: '#ffcc00', secondary: '#cc9900' },
  { name: 'Fusion',   hex: '#326144', secondary: '#ff5e00' },
];
