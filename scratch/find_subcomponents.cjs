const fs = require('fs');

const bundlePath = 'F:\\MyRestoredProjects\\GymLog\\scratch\\apk_extracted\\assets\\public\\assets\\index-DezlWB6i.js';
const content = fs.readFileSync(bundlePath, 'utf8');

// Extract Ja (MuscleSelector), Qa (ExercisePicker), $a (SessionLogger)
// These are at positions around 67000-68500 in application code (not React internals)
// From earlier: Wa at 67954, Ja at 68203, Qa at 68306, $a at 68438

// Actually those were React internals - need to find the APP-level ones
// The eo function at 333257 references Ja, Qa, $a, qa
// They must be defined BEFORE 333257 in the app code

// Search for Ja function definition that takes selectedMuscle prop
const searchStr1 = 'function Ja({selectedMuscle:';
const searchStr2 = 'selectedMuscle:e,';
const searchStr3 = 'onSelect:t,lang:n';
const searchStr4 = 'selectedMuscle';

const positions = {};
for (const [name, str] of Object.entries({searchStr1, searchStr2, searchStr3, searchStr4})) {
  let idx = 0;
  const found = [];
  while ((idx = content.indexOf(str.replace('searchStr', '').replace(/^\d+,/, ''), idx)) !== -1) {
    found.push(idx);
    idx++;
  }
}

// Actually search with correct strings
for (const str of [
  'selectedMuscle:e,onSelect:t',
  'selectedMuscle:',
  'onSelect:t,lang',
  'musclesWithExercises',
  'archivedExercises',
  'draggingIndex',
  'onOpenExercise',
  'handleTouchStart',
  'loggedData',
]) {
  let idx = 0;
  const found = [];
  while ((idx = content.indexOf(str, idx)) !== -1) {
    found.push(idx);
    idx++;
  }
  console.log(`"${str}": at positions:`, found.slice(0, 5));
}

// Extract the region containing Ja, Qa, $a, qa (the app-level components)
// We know eo is at 333257. These components must be between ~210000 and 333257
const appChunk1 = content.slice(210000, 280000);
fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\app_chunk_210_280.js', appChunk1);

const appChunk2 = content.slice(280000, 333257);
fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\app_chunk_280_333.js', appChunk2);

console.log('\nSaved app chunks 210-280 and 280-333');

// Find qa (ExerciseCard) in app code - it takes exerciseName, muscleGroup, tracker
const qaApp = content.indexOf('exerciseName:e,muscleGroup:t,tracker:n');
console.log('\nqa app (ExerciseCard) at:', qaApp);
if (qaApp !== -1) {
  const chunk = content.slice(Math.max(0, qaApp - 500), qaApp + 20000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\exercise_card_app.js', chunk);
  console.log('Saved exercise_card_app.js');
}
