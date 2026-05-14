const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = 'var io=({tracker:';
let index = content.indexOf(searchStr);
if (index >= 0) {
    const end = Math.min(content.length, index + 20000);
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\history_real_v2.js', content.substring(index, end));
    console.log('Saved real History to scratch/history_real_v2.js');
} else {
    // Try function pattern
    const searchStrFunc = 'function io({tracker:';
    let indexFunc = content.indexOf(searchStrFunc);
    if (indexFunc >= 0) {
        const end = Math.min(content.length, indexFunc + 20000);
        fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\history_real_v2.js', content.substring(indexFunc, end));
        console.log('Saved real History (func) to scratch/history_real_v2.js');
    } else {
        // Try another search for common component pattern
        const searchStr3 = '({tracker:e,onDeleteWorkout:t})=>';
        let index3 = content.indexOf(searchStr3);
        if (index3 >= 0) {
            const start = content.lastIndexOf('var ', index3);
            fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\history_real_v2.js', content.substring(start, index3 + 20000));
            console.log('Saved real History (var pattern) to scratch/history_real_v2.js');
        } else {
            console.log('History component io/pattern not found');
        }
    }
}
