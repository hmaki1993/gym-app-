const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'io=';
let index = content.indexOf(searchStr);
if (index >= 0) {
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\history_real.js', content.substring(index - 100, index + 10000));
    console.log('Saved real History to scratch/history_real.js');
} else {
    console.log('History component io not found');
}
