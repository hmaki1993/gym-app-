const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'startWorkout';
let index = content.indexOf(searchStr);
if (index >= 0) {
    // Find where the key is used: maybe .startWorkout or ['startWorkout']
    const usage1 = '.' + searchStr;
    const usage2 = "['" + searchStr + "']";
    const usage3 = '("' + searchStr + '")';
    
    let usageIndex = content.indexOf(usage1);
    if (usageIndex === -1) usageIndex = content.indexOf(usage2);
    if (usageIndex === -1) usageIndex = content.indexOf(usage3);
    
    if (usageIndex >= 0) {
        const funcStart = content.lastIndexOf('function ', usageIndex);
        const end = Math.min(content.length, funcStart + 20000);
        fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\dashboard_full_jsx.js', content.substring(funcStart, end));
        console.log('Saved to scratch/dashboard_full_jsx.js');
    } else {
        console.log('Specific usage not found, saving generic chunk around index');
        const start = Math.max(0, index - 5000);
        const end = Math.min(content.length, index + 15000);
        fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\dashboard_full_jsx.js', content.substring(start, end));
    }
} else {
    console.log('startWorkout not found');
}
