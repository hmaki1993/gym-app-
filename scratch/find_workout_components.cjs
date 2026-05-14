const fs = require('fs');
const bundle = fs.readFileSync('F:/MyRestoredProjects/GymLog/scratch/apk_extracted/assets/public/assets/index-DezlWB6i.js', 'utf8');

// Extract main workout area (around the UI strings we found)
// muscleGroup: 198125, POWER GRID: 202835, Finish Session: 204414
// Let's get a big chunk around this area
const chunk = bundle.slice(196000, 380000);
fs.writeFileSync('F:/MyRestoredProjects/GymLog/scratch/workout_main_chunk.js', chunk);
console.log('Saved workout_main_chunk.js (' + chunk.length + ' chars)');

// Find specific function boundaries by looking for component patterns
// The workout session component uses useState, useEffect, etc.
// Let's find the component that uses 'startWorkout' string
const pos = bundle.indexOf('startWorkout');
console.log('startWorkout pos:', pos);

// Look back to find the nearest function definition
const before = bundle.slice(pos - 3000, pos);
const funcMatch = before.match(/function\s+\w+\s*\([^)]*\)\s*\{/g);
if (funcMatch) {
  console.log('Recent function defs before startWorkout:', funcMatch.slice(-3));
}

// Also look for the workout component using arrow function pattern
const arrowMatch = before.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g);
if (arrowMatch) {
  console.log('Recent arrow functions:', arrowMatch.slice(-3));
}

// Look for the MuscleSelector specifically  
const muscleSel = bundle.indexOf('pickMuscle');
console.log('pickMuscle pos:', muscleSel);
const muscleBefore = bundle.slice(muscleSel - 5000, muscleSel + 500);
fs.writeFileSync('F:/MyRestoredProjects/GymLog/scratch/muscle_selector_area.js', muscleBefore);
