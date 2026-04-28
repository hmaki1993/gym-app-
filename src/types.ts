export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'cardio';

export interface SetLog {
  weight: number;
  reps: number;
}

export interface ExerciseLog {
  name: string;
  sets: SetLog[];
  restSeconds: number;
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO
  startTime: string; // ISO
  endTime: string; // ISO
  muscleGroup: MuscleGroup;
  exercises: ExerciseLog[];
  durationMinutes: number;
  notes?: string;
}

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export type WeightUnit = 'kg' | 'lbs';
export type Language = 'ar' | 'en';

export interface ThemeColor {
  name: string;
  hex: string;
  secondary: string;
}

export interface GymSettings {
  userName: string;
  weightUnit: WeightUnit;
  language: Language;
  accentColor: string;
  defaultRestSeconds: number;
  soundEnabled: boolean;
}

export interface GymState {
  logs: WorkoutLog[];
  prs: PersonalRecord[];
  settings: GymSettings;
  customExercises: Record<MuscleGroup, string[]>;
  hiddenExercises: Record<MuscleGroup, string[]>;
}
