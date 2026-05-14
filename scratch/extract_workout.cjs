const fs = require('fs');

const bundlePath = 'F:\\MyRestoredProjects\\GymLog\\scratch\\apk_extracted\\assets\\public\\assets\\index-DezlWB6i.js';
const content = fs.readFileSync(bundlePath, 'utf8');

// Find all the component functions we need
// From previous analysis: eo = WorkoutSession, We = Dashboard, J = Progress
// We need to find: MuscleSelector, ExerciseCard (qa), the full WorkoutSession

// Search for key workout patterns
const patterns = [
  { name: 'muscleSelector', pattern: 'muscleGroup' },
  { name: 'setWeight', pattern: 'setWeight' },
  { name: 'addSet', pattern: 'addSet' },
  { name: 'restTimer', pattern: 'restTimer' },
  { name: 'restSeconds', pattern: 'restSeconds' },
  { name: 'defaultRest', pattern: 'defaultRest' },
  { name: 'saveWorkout_call', pattern: 'saveWorkout' },
  { name: 'muscleGroups_y', pattern: 'key:`chest`' },
  { name: 'muscleGroups_y2', pattern: 'key:`back`' },
];

for (const { name, pattern } of patterns) {
  const positions = [];
  let idx = 0;
  while ((idx = content.indexOf(pattern, idx)) !== -1) {
    positions.push(idx);
    idx++;
  }
  console.log(`"${pattern}": ${positions.length} times at:`, positions.slice(0, 8));
}

// Extract the muscle groups array (y variable in bundle)
const chestIdx = content.indexOf('key:`chest`');
if (chestIdx !== -1) {
  console.log('\n=== MUSCLE GROUPS ARRAY ===');
  console.log(content.slice(Math.max(0, chestIdx - 100), chestIdx + 3000));
}

// Extract the MuscleSelector component
// It likely renders buttons/divs for each muscle group
const muscleSelectIdx = content.indexOf('pickMuscle');
if (muscleSelectIdx !== -1) {
  console.log('\n=== pickMuscle context ===');
  const chunk = content.slice(Math.max(0, muscleSelectIdx - 2000), muscleSelectIdx + 5000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\muscle_selector.js', chunk);
  console.log('Saved muscle_selector.js');
}

// Extract WorkoutSession - we know it's around position 333958
// Get a bigger chunk
const wsChunk = content.slice(280000, 400000);
fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\workout_session_full.js', wsChunk);
console.log('\nSaved workout_session_full.js (positions 280000-400000)');

// Also look for the ExerciseCard (qa component)
const setRowIdx = content.indexOf('setBest');
console.log('\n"setBest" at:', setRowIdx);

const setRowIdx2 = content.indexOf('restTimer');
console.log('"restTimer" at:', setRowIdx2);
if (setRowIdx2 !== -1) {
  const chunk = content.slice(Math.max(0, setRowIdx2 - 500), setRowIdx2 + 8000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\rest_timer_area.js', chunk);
  console.log('Saved rest_timer_area.js');
}
