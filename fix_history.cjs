const fs = require('fs');
let file = 'src/features/history/HistoryPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix isLight missing in HistoryPage
content = content.replace(
  /const t = \(k: keyof typeof translations.en\) =>/,
  "const isLight = tracker.settings.themeMode === 'light';\n  const t = (k: keyof typeof translations.en) =>"
);

// Fix TS7006 implicit any types in WorkoutSessionCard
content = content.replace(/log\.exercises\.forEach\(ex =>/g, "log.exercises.forEach((ex: any) =>");
content = content.replace(/log\.exercises\.reduce\(\(acc, ex\)/g, "log.exercises.reduce((acc: any, ex: any)");
content = content.replace(/log\.exercises\.map\(\(ex, idx\)/g, "log.exercises.map((ex: any, idx: any)");
content = content.replace(/ex\.sets\.reduce\(\(best, s\)/g, "ex.sets.reduce((best: any, s: any)");
content = content.replace(/ex\.sets\.map\(\(set, setIdx\)/g, "ex.sets.map((set: any, setIdx: any)");
content = content.replace(/log\.exercises\.map\(ex =>/g, "log.exercises.map((ex: any) =>");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HistoryPage.tsx');
