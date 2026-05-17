const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let lines = content.split('\n');
      let modified = false;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // If it uses Montserrat
        if (line.includes(`fontFamily: "'Montserrat', sans-serif"`)) {
          // Conditions where we KNOW it represents a number:
          // 1. input type="number" or inputMode="numeric" or inputMode="decimal"
          // 2. Contains variables known to be numbers: index, weight, reps, volume, formatTime, elapsed, kcal, bmr, tdee, remaining, consumed
          // 3. Simple numeric formats like {value} where value is mostly numeric.
          
          if (
            line.includes('type="number"') || 
            line.includes('inputMode="numeric"') ||
            line.includes('inputMode="decimal"') ||
            line.includes('{index') ||
            line.includes('{weight') ||
            line.includes('{reps') ||
            line.includes('{maxWeight') ||
            line.includes('formatTime(') ||
            line.includes('totalVolume') ||
            line.includes('elapsed') ||
            line.includes('calories') ||
            line.includes('remainingCal') ||
            line.includes('consumedCal') ||
            line.includes('consumedPro') ||
            line.includes('consumedCarb') ||
            line.includes('consumedFat') ||
            line.includes('bmr') ||
            line.includes('tdee') ||
            line.includes('target') ||
            line.includes('{m.val') ||
            line.includes('{meal.calories}') ||
            line.includes('{meal.protein}') ||
            line.includes('{meal.carbs}') ||
            line.includes('{meal.fats}') ||
            line.includes('streakDays') ||
            line.includes('todayCalories') ||
            line.includes('totalLifted')
          ) {
            // ONLY if it does NOT contain obvious text labels that are primary
            if (!line.includes('label:') && !line.includes('>{name}<') && !line.includes('{t(')) {
              lines[i] = line.replace(`fontFamily: "'Montserrat', sans-serif"`, `fontFamily: "'Bebas Neue', sans-serif"`);
              modified = true;
            }
          }
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, lines.join('\n'));
        console.log(`Updated numbers to Bebas Neue in ${fullPath}`);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
