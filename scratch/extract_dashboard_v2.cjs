const fs = require('fs');
const path = 'f:/MyRestoredProjects/GymLog/android/app/src/main/assets/public/assets/index-DezlWB6i.js';
const code = fs.readFileSync(path, 'utf8');

const start = code.indexOf('var We=');
const end = code.indexOf('He(y.map(e=>e.icon),45);');

fs.writeFileSync('f:/MyRestoredProjects/GymLog/scratch/dashboard_actual.txt', code.substring(start, end));
console.log('Actual Dashboard extracted.');
