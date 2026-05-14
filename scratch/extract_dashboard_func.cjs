const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'welcomeBack';
let index = content.indexOf(searchStr);
while (index >= 0) {
    const start = Math.max(0, index - 2000);
    const end = Math.min(content.length, index + 5000);
    const chunk = content.substring(start, end);
    // Look for the function start before this index
    const funcIndex = content.lastIndexOf('function', index);
    console.log('--- Found at index ' + index + ' ---');
    console.log('Function starts around: ' + funcIndex);
    console.log(content.substring(funcIndex, index + 2000));
    index = content.indexOf(searchStr, index + 1);
    break; // Just get the first one for now
}
