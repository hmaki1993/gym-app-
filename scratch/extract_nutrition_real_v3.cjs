const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'nutritionLogs';
let index = content.indexOf(searchStr);
if (index >= 0) {
    const start = content.lastIndexOf('function ', index);
    const end = Math.min(content.length, start + 30000);
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\nutrition_real_v3.js', content.substring(start, end));
    console.log('Saved real Nutrition (nutritionLogs) to scratch/nutrition_real_v3.js');
} else {
    console.log('nutritionLogs not found');
}
