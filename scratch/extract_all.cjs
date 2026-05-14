const fs = require('fs');
const path = 'f:/MyRestoredProjects/GymLog/android/app/src/main/assets/public/assets/index-DezlWB6i.js';
const code = fs.readFileSync(path, 'utf8');

const mapping = {
    'Dashboard': 'var We=',
    'Settings': 'function oo(',
    'History': 'function io(',
    'Progress': 'function J(',
    'Session': 'function eo(',
    'ExercisePicker': 'var ExercisePicker=', // Might be different
    'MuscleSelector': 'var MuscleSelector='
};

for (const [name, marker] of Object.entries(mapping)) {
    const start = code.indexOf(marker);
    if (start !== -1) {
        // Take 30KB of context for each, enough to see most logic
        const chunk = code.substring(start, start + 30000);
        fs.writeFileSync(`f:/MyRestoredProjects/GymLog/scratch/raw_${name}.txt`, chunk);
        console.log(`Extracted ${name}`);
    } else {
        console.log(`${name} NOT FOUND with marker ${marker}`);
    }
}
