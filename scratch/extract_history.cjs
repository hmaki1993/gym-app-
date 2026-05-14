const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = "TODAY'S ACHIEVEMENTS";
let index = content.indexOf(searchStr);
if (index >= 0) {
    const funcStart = content.lastIndexOf('function ', index);
    const end = Math.min(content.length, funcStart + 20000);
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\history_full.js', content.substring(funcStart, end));
    console.log('Saved to scratch/history_full.js');
} else {
    // Try Arabic version
    const searchStrAr = "إنجازات اليوم";
    let indexAr = content.indexOf(searchStrAr);
    if (indexAr >= 0) {
        const funcStart = content.lastIndexOf('function ', indexAr);
        const end = Math.min(content.length, funcStart + 20000);
        fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\history_full.js', content.substring(funcStart, end));
        console.log('Saved to scratch/history_full.js (AR)');
    } else {
        console.log('History achievements not found');
    }
}
