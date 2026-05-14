const fs = require('fs');

const bundlePath = 'F:\\MyRestoredProjects\\GymLog\\scratch\\apk_extracted\\assets\\public\\assets\\index-DezlWB6i.js';
const content = fs.readFileSync(bundlePath, 'utf8');

// Find the translations object end (this is after index 202702)
// Now search for component patterns AFTER the translations
const translationsEnd = content.indexOf('scanMeal');
console.log('Translations end approx at:', translationsEnd);

// Extract a chunk AFTER translations to find the page components
const afterTranslations = content.slice(translationsEnd, translationsEnd + 50000);

// Save it so we can read it
fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\after_translations.js', afterTranslations);
console.log('Saved after_translations.js, length:', afterTranslations.length);

// Also look for JSX patterns in that area that correspond to History/Progress pages
// These will have patterns like: t("history") or p("history")
const historyIdx = afterTranslations.indexOf('history');
const progressIdx = afterTranslations.indexOf('progress');
const calendarIdx = afterTranslations.indexOf('calendar');
const getMonthIdx = afterTranslations.indexOf('getMonth');
const getDateIdx = afterTranslations.indexOf('getDate');
const mapIdx = afterTranslations.indexOf('.logs.map');

console.log('In afterTranslations:');
console.log('  "history" at:', historyIdx);
console.log('  "progress" at:', progressIdx);
console.log('  "calendar" at:', calendarIdx);
console.log('  "getMonth" at:', getMonthIdx);
console.log('  "getDate" at:', getDateIdx);
console.log('  ".logs.map" at:', mapIdx);

// Print context around .logs.map
if (mapIdx !== -1) {
  console.log('\n=== .logs.map context ===');
  console.log(afterTranslations.slice(Math.max(0, mapIdx - 200), mapIdx + 5000));
}

// Also search entire bundle for .logs.
const logsPatterns = ['.logs.filter', '.logs.map', '.logs.reduce', 'e.logs', 't.logs'];
for (const p of logsPatterns) {
  let idx = 0;
  let count = 0;
  const positions = [];
  while ((idx = content.indexOf(p, idx)) !== -1) {
    positions.push(idx);
    idx++;
    count++;
  }
  console.log(`\n"${p}" found ${count} times at positions:`, positions.slice(0, 10));
}
