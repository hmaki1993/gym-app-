const fs = require('fs');
const bundle = fs.readFileSync('F:/MyRestoredProjects/GymLog/scratch/apk_extracted/assets/public/assets/index-DezlWB6i.js', 'utf8');

// Search for actual workout UI patterns
const patterns = [
  'muscleGroup',
  'startWorkout',
  'addSet',
  'MUSCLE_SELECTOR',
  'setRow',
  'restTimer',
  'exercisePicker',
  'sessionLogger',
  'weightUnit',
  'durationSeconds',
  'defaultRestSeconds',
  'POWER GRID',
  'TODAY\'S SUMMARY',
  'Finish Session',
  'Start Workout',
  'Add Set',
  'Rest Timer',
];

for (const p of patterns) {
  const idx = bundle.indexOf(p);
  console.log(`"${p}": ${idx === -1 ? 'NOT FOUND' : 'pos=' + idx}`);
}
