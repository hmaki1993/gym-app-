const fs = require('fs');
const path = 'f:/MyRestoredProjects/GymLog/android/app/src/main/assets/public/assets/index-DezlWB6i.js';
const code = fs.readFileSync(path, 'utf8');

// Try to find interesting blocks
const components = code.split('function ').filter(s => s.includes('tracker'));

console.log('Found ' + components.length + ' components with tracker prop.');

// Print first 5 components found
components.slice(0, 5).forEach((c, i) => {
    console.log('--- Component ' + i + ' ---');
    console.log(c.substring(0, 1000) + '...');
});
