const fs = require('fs');
const bundle = fs.readFileSync('F:/MyRestoredProjects/GymLog/scratch/apk_extracted/assets/public/assets/index-DezlWB6i.js', 'utf8');

function extractFunction(startPattern, chunkSize) {
  const idx = bundle.indexOf(startPattern);
  if (idx === -1) return null;
  return { pos: idx, code: bundle.slice(idx, idx + chunkSize) };
}

const components = [
  { name: 'eo_WorkoutSession',    pattern: 'function eo(',   size: 30000 },
  { name: 'qa_ExerciseCard',      pattern: 'function qa(',   size: 20000 },
  { name: 'sa_SessionLogger',     pattern: 'function $a(',   size: 15000 },
  { name: 'Ja_MuscleSelector',    pattern: 'function Ja(',   size: 8000  },
  { name: 'Qa_ExercisePicker',    pattern: 'function Qa(',   size: 15000 },
  { name: 'Ka_SetRow',            pattern: 'function Ka(',   size: 5000  },
];

for (const c of components) {
  const result = extractFunction(c.pattern, c.size);
  if (result) {
    console.log(`✅ ${c.name}: found at pos ${result.pos}`);
    fs.writeFileSync(`F:/MyRestoredProjects/GymLog/scratch/${c.name}.js`, result.code);
  } else {
    console.log(`❌ ${c.name}: NOT FOUND`);
  }
}
