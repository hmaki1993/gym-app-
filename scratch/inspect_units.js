// PASTE THIS IN CHROME DEVTOOLS CONSOLE (chrome://inspect)
// It will show you EXACTLY what units are saved in your workout data

const raw = localStorage.getItem('gymlog_state');
if (!raw) { console.log('NO DATA FOUND'); } 
else {
  const data = JSON.parse(raw);
  const logs = data.logs || [];
  console.log(`Total workouts: ${logs.length}`);
  console.log(`Settings weightUnit: ${data.settings?.weightUnit}`);
  console.log('---');
  
  // Show last 10 workouts
  logs.slice(0, 10).forEach((log, i) => {
    console.log(`\n📅 Workout ${i+1}: ${log.date}`);
    log.exercises.forEach(ex => {
      const units = ex.sets.map(s => s.unit || 'MISSING').join(', ');
      const weights = ex.sets.map(s => s.weight).join(', ');
      console.log(`  💪 ${ex.name}`);
      console.log(`     Weights: [${weights}]`);
      console.log(`     Units:   [${units}]`);
    });
  });
}
