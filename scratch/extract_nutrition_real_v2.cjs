const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'os=({tracker:';
let index = content.indexOf(searchStr);
if (index >= 0) {
    const end = Math.min(content.length, index + 30000);
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\nutrition_real_v2.js', content.substring(index - 100, end));
    console.log('Saved real Nutrition to scratch/nutrition_real_v2.js');
} else {
    // Try search for strings inside nutrition page like "KCAL" or "MACROS"
    const searchStr2 = 'MACROS';
    let index2 = content.indexOf(searchStr2);
    if (index2 >= 0) {
        const start = content.lastIndexOf('function ', index2);
        const end = Math.min(content.length, start + 30000);
        fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\nutrition_real_v2.js', content.substring(start, end));
        console.log('Saved real Nutrition (MACROS) to scratch/nutrition_real_v2.js');
    } else {
        console.log('Nutrition component not found');
    }
}
