const fs = require('fs');

const bundlePath = 'F:\\MyRestoredProjects\\GymLog\\scratch\\apk_extracted\\assets\\public\\assets\\index-DezlWB6i.js';
const content = fs.readFileSync(bundlePath, 'utf8');

// Extract large chunks around key positions to find History and Progress pages
const positions = {
  'logs_filter_1': 195498,
  'logs_filter_4': 333958,
  'logs_filter_5': 347166,
  'logs_filter_6': 366545,
  'e_logs_9': 215641,
  'e_logs_10': 218676,
};

for (const [name, pos] of Object.entries(positions)) {
  const chunk = content.slice(Math.max(0, pos - 500), pos + 8000);
  fs.writeFileSync(`F:\\MyRestoredProjects\\GymLog\\scratch\\chunk_${name}.js`, chunk);
  console.log(`Saved chunk_${name}.js`);
}

// Also extract the calendar section
const translationsEnd = content.indexOf('scanMeal');
const afterTrans = content.slice(translationsEnd, translationsEnd + 50000);
const calPos = afterTrans.indexOf('calendar');
const calChunk = afterTrans.slice(Math.max(0, calPos - 500), calPos + 10000);
fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\chunk_calendar.js', calChunk);
console.log('Saved chunk_calendar.js at pos:', calPos);

// Extract around e.logs positions that are in the UI area (after 300000)
const uiLogsPos = [333958, 347166, 366545, 366611];
for (const pos of uiLogsPos) {
  const chunk = content.slice(Math.max(0, pos - 2000), pos + 10000);
  fs.writeFileSync(`F:\\MyRestoredProjects\\GymLog\\scratch\\ui_chunk_${pos}.js`, chunk);
  console.log(`Saved ui_chunk_${pos}.js`);
}
