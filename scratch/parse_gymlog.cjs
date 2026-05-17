const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'gymlog_raw.bin');
const buffer = fs.readFileSync(filePath);

// LevelDB logs often have null bytes between characters or special encoding
// Let's filter to get only printable ASCII
let clean = '';
for (let i = 0; i < buffer.length; i++) {
  const byte = buffer[i];
  if (byte >= 32 && byte <= 126) {
    clean += String.fromCharCode(byte);
  }
}

const startMarker = '"logs"';
const idx = clean.indexOf(startMarker);

if (idx === -1) {
  console.log('Could not find logs in clean data. Sample:');
  console.log(clean.substring(0, 500));
  process.exit(1);
}

// Extract state
const stateMarker = '{"logs"';
const stateIdx = clean.lastIndexOf(stateMarker, idx); // Look backwards from "logs"
if (stateIdx === -1) {
    console.log('State marker not found');
    process.exit(1);
}

// Find balanced braces
let depth = 0;
let end = -1;
for (let i = stateIdx; i < clean.length; i++) {
  if (clean[i] === '{') depth++;
  else if (clean[i] === '}') {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}

if (end !== -1) {
  const jsonStr = clean.substring(stateIdx, end + 1);
  try {
    const state = JSON.parse(jsonStr);
    console.log(`\n=== TOTAL LOGS: ${state.logs.length} ===\n`);
    
    // Sort logs by date descending
    const sortedLogs = state.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedLogs.slice(0, 10).forEach((log, i) => {
      console.log(`📅 LOG ${i}: date="${log.date}" muscleGroup="${log.muscleGroup}" id="${log.id}"`);
      log.exercises.forEach(ex => {
        console.log(`   💪 ${ex.name} (${ex.sets.length} sets) unit=${ex.sets[0]?.unit}`);
      });
      console.log('');
    });
  } catch (e) {
    console.log('JSON parse error:', e.message);
    console.log('Snippet:', clean.substring(stateIdx, stateIdx + 200));
  }
} else {
  console.log('Could not find end of JSON');
}
