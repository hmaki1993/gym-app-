const fs = require('fs');

const bundlePath = 'F:\\MyRestoredProjects\\GymLog\\scratch\\apk_extracted\\assets\\public\\assets\\index-DezlWB6i.js';
const content = fs.readFileSync(bundlePath, 'utf8');

// The WorkoutSession (eo function) - from ui_chunk_333958 we know it starts around pos 305000
// Let's find the exact start by looking for the function signature pattern
// From previous read: "function eo({tracker:e,onClose:t,onSaved:n})"
const eoStart = content.indexOf('function eo({tracker:e,onClose:t,onSaved:n}');
console.log('eo (WorkoutSession) starts at:', eoStart);

// Find the ExerciseCard (qa) component
const qaStart = content.indexOf('function qa(');
console.log('qa (ExerciseCard) starts at:', qaStart);

// Find the session logger / exercise logger ($a component)
const sessionLogStart = content.indexOf('function $a(');
console.log('$a (SessionLogger) starts at:', sessionLogStart);

// Find all other component functions
const patterns = [
  'function Za(',
  'function Qa(',
  'function Ja(',
  'function Ka(', 
  'function Wa(',
];
for (const p of patterns) {
  const pos = content.indexOf(p);
  if (pos !== -1) console.log(`${p} at:`, pos);
}

// Save eo function (WorkoutSession) - 30000 chars
if (eoStart !== -1) {
  const chunk = content.slice(eoStart, eoStart + 30000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\workout_eo_full.js', chunk);
  console.log('\nSaved workout_eo_full.js');
}

// Save qa function (ExerciseCard) - 20000 chars
if (qaStart !== -1) {
  const chunk = content.slice(qaStart, qaStart + 20000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\exercise_card_qa.js', chunk);
  console.log('Saved exercise_card_qa.js');
}

// Find the MuscleSelector component - it renders a grid of muscle groups
// It should be called from within eo when tab === 'exercises'
// Look for pattern that maps over y (muscle groups array)
const muscleMapIdx = content.indexOf('y.map(e=>{let');
const muscleMapIdx2 = content.indexOf('y.map((e,t)=>');
console.log('\ny.map patterns:', muscleMapIdx, muscleMapIdx2);

// Find muscle picker grid  
const gridMuscle = content.indexOf('gridTemplateColumns:`repeat(2');
console.log('"repeat(2" grid at positions:');
let idx = 0;
while ((idx = content.indexOf('gridTemplateColumns:`repeat(2', idx)) !== -1) {
  console.log('  pos:', idx);
  const chunk = content.slice(Math.max(0, idx - 200), idx + 3000);
  fs.writeFileSync(`F:\\MyRestoredProjects\\GymLog\\scratch\\grid2col_${idx}.js`, chunk);
  idx++;
}
