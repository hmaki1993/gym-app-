const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'var We=';
let index = content.indexOf(searchStr);
if (index >= 0) {
    const end = Math.min(content.length, index + 20000);
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\dashboard_complete.js', content.substring(index, end));
    console.log('Saved to scratch/dashboard_complete.js');
} else {
    console.log('Dashboard component not found');
}
