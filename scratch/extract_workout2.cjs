const fs = require('fs');

const bundlePath = 'F:\\MyRestoredProjects\\GymLog\\scratch\\apk_extracted\\assets\\public\\assets\\index-DezlWB6i.js';
const content = fs.readFileSync(bundlePath, 'utf8');

// The WorkoutSession (eo function) starts around position 305000+ based on our analysis
// The ExerciseCard (qa function) is somewhere around 250000-330000
// Let's extract chunks methodically

// From ui_chunk_333958 we know eo starts around 333700 area (it references 'resumeSession' etc)
// Let's look for the muscle picker UI which is in the 'exercises' tab
const pickMusclePos = [];
let idx = 0;
while ((idx = content.indexOf('pickMuscle', idx)) !== -1) {
  pickMusclePos.push(idx);
  idx++;
}
console.log('pickMuscle positions:', pickMusclePos);

// Extract around each pickMuscle position to find the UI rendering
for (const pos of pickMusclePos) {
  const chunk = content.slice(Math.max(0, pos - 3000), pos + 10000);
  const filename = `F:\\MyRestoredProjects\\GymLog\\scratch\\pickup_${pos}.js`;
  fs.writeFileSync(filename, chunk);
  console.log(`Saved pickup_${pos}.js`);
}

// Also look for the MuscleSelector render - it will have the muscle images grid
// Search for the characteristic pattern of the muscle grid (shows all 7 muscle groups)
const muscleGridPatterns = [
  'muscleGroup:`chest`',
  'muscleGroup:`back`', 
  'assets/muscles',
  'pickMuscle',
  'grid.*muscle',
  'Chest.*Back.*Legs',
];

// Find the rest timer component
const restTimerPositions = [];
idx = 0;
while ((idx = content.indexOf('restTimer', idx)) !== -1) {
  restTimerPositions.push(idx);
  idx++;
}
console.log('\nrestTimer positions:', restTimerPositions);

for (const pos of restTimerPositions) {
  const chunk = content.slice(Math.max(0, pos - 500), pos + 5000);
  fs.writeFileSync(`F:\\MyRestoredProjects\\GymLog\\scratch\\rest_${pos}.js`, chunk);
  console.log(`Saved rest_${pos}.js`);
}

// Find the ExerciseCard (qa) - look for 'bestSet' or 'reps' input
const repsInputIdx = content.indexOf('placeholder:`0`,type:`number`');
console.log('\nreps input at:', repsInputIdx);
if (repsInputIdx !== -1) {
  const chunk = content.slice(Math.max(0, repsInputIdx - 5000), repsInputIdx + 10000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\exercise_card.js', chunk);
  console.log('Saved exercise_card.js');
}

// Try another pattern
const weightInputIdx = content.indexOf('type:`number`,value:e.weight');
console.log('weight input at:', weightInputIdx);
if (weightInputIdx !== -1) {
  const chunk = content.slice(Math.max(0, weightInputIdx - 5000), weightInputIdx + 10000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\weight_input.js', chunk);
}
