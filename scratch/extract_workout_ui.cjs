const fs = require('fs');
const bundle = fs.readFileSync('F:/MyRestoredProjects/GymLog/scratch/apk_extracted/assets/public/assets/index-DezlWB6i.js', 'utf8');

// Extract the full workout section - from ~196000 to ~220000
// This covers muscleGroup (198125) through Finish Session (204414)
const start = 195000;
const end = 230000;
const chunk = bundle.slice(start, end);
fs.writeFileSync('F:/MyRestoredProjects/GymLog/scratch/workout_ui_full.js', chunk);
console.log('Saved workout_ui_full.js (' + chunk.length + ' chars)');

// Also save a smaller section around the translations/strings for reference
const translStart = bundle.lastIndexOf('{', 202835); 
console.log('Translation block starts around:', translStart);
const transChunk = bundle.slice(202500, 210000);
fs.writeFileSync('F:/MyRestoredProjects/GymLog/scratch/workout_translations.js', transChunk);
console.log('Saved workout_translations.js');
