const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'SMART SETUP';
let index = content.indexOf(searchStr);
if (index >= 0) {
    const start = content.lastIndexOf('function ', index);
    const end = Math.min(content.length, start + 25000);
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\nutrition_real.js', content.substring(start, end));
    console.log('Saved real Nutrition (SMART) to scratch/nutrition_real.js');
} else {
    const searchStr2 = 'TRACK CALORIES';
    let index2 = content.indexOf(searchStr2);
    if (index2 >= 0) {
        const start = content.lastIndexOf('function ', index2);
        const end = Math.min(content.length, start + 25000);
        fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\nutrition_real.js', content.substring(start, end));
        console.log('Saved real Nutrition (TRACK) to scratch/nutrition_real.js');
    } else {
        console.log('Nutrition component not found by strings');
    }
}
