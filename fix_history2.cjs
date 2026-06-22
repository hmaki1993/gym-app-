const fs = require('fs');
let file = 'src/features/history/HistoryPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix isLight prop in WorkoutSessionCard
content = content.replace(
  "log, tracker, lang, isLight, t, isOpen, onToggle, onDeleteWorkout, exerciseToMuscle",
  "log, tracker, lang, t, isOpen, onToggle, onDeleteWorkout, exerciseToMuscle"
);
content = content.replace(
  "log: WorkoutLog, tracker: any, lang: 'ar' | 'en', isLight: boolean, t: any, isOpen: boolean, onToggle: (id: string) => void, onDeleteWorkout: (id: string) => void, exerciseToMuscle: Record<string, string>",
  "log: WorkoutLog, tracker: any, lang: 'ar' | 'en', t: any, isOpen: boolean, onToggle: (id: string) => void, onDeleteWorkout: (id: string) => void, exerciseToMuscle: Record<string, string>"
);

// Fix remaining TS7006 implicit any types
content = content.replace(/\(ex, idx\) =>/g, "(ex: any, idx: any) =>");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HistoryPage.tsx again');
