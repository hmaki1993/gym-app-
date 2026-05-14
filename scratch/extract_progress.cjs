const fs = require('fs');

const bundlePath = 'F:\\MyRestoredProjects\\GymLog\\scratch\\apk_extracted\\assets\\public\\assets\\index-DezlWB6i.js';
const content = fs.readFileSync(bundlePath, 'utf8');

// The ProgressPage (J function) - from ui_chunk_366545.js analysis
// Let's find its exact position
const progressStart = content.indexOf('function J({tracker:');
console.log('ProgressPage (J) starts at:', progressStart);

// If not found with that name, search for key progress patterns
const patterns = [
  'exerciseFreq',
  'topExercises',
  'chartData',
  'Volume Over Time',
  'Muscle Group Distribution',
];

for (const p of patterns) {
  const pos = content.indexOf(p);
  if (pos !== -1) console.log(`"${p}" at:`, pos);
}

// Extract ProgressPage logic area
if (progressStart !== -1) {
  const chunk = content.slice(progressStart, progressStart + 25000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\progress_page_full.js', chunk);
  console.log('\nSaved progress_page_full.js');
}

// Also find the LineChart (ao) and other charts
const lineChartStart = content.indexOf('function ao({data:e,color:t,title:n');
console.log('LineChart (ao) starts at:', lineChartStart);
if (lineChartStart !== -1) {
  const chunk = content.slice(lineChartStart, lineChartStart + 5000);
  fs.writeFileSync('F:\\MyRestoredProjects\\GymLog\\scratch\\line_chart.js', chunk);
}
