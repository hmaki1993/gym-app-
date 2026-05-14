const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const index = content.indexOf('welcomeBack');
if (index >= 0) {
    const start = Math.max(0, index - 5000);
    const end = Math.min(content.length, index + 5000);
    console.log(content.substring(start, end));
} else {
    console.log('Not found');
}
