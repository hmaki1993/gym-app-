const fs = require('fs');
const content = fs.readFileSync('F:\\MyRestoredProjects\\GymLog\\android\\app\\build\\outputs\\apk\\debug\\assets\\public\\assets\\index-DezlWB6i.js', 'utf8');
const searchStr = '(0,R.jsx)(We,';
let index = content.indexOf(searchStr);
if (index >= 0) {
    fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\app_jsx_props.js', content.substring(index, index + 1000));
    console.log('Saved props to scratch/app_jsx_props.js');
} else {
    console.log('Dashboard usage not found');
}
