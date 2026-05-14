const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'startWorkout';
let index = content.indexOf(searchStr);
while (index >= 0) {
    const start = Math.max(0, index - 5000);
    const end = Math.min(content.length, index + 10000);
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\dashboard_jsx.js', content.substring(start, end));
    console.log('Saved to scratch/dashboard_jsx.js');
    index = content.indexOf(searchStr, index + 1);
    break; 
}
