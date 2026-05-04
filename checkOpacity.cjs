const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // We want to remove inline opacities from elements that already use --text-secondary
  // or at least increase the minimum opacity across the app for text elements.
  // A safer approach: replace `opacity: 0.2`, `0.3`, `0.4`, `0.5`, `0.6` inline with `opacity: 0.8`
  // only if they are text opacities. But replacing all low opacities with higher ones might break some glowing effects.
  // Let's specifically target the ones we know cause text readability issues:
  
  // Replace `opacity: 0.5` near `subtitle-text` or similar.
  // Actually, let's just replace all `opacity: 0.4`, `0.5`, `0.6` inside inline styles with `opacity: 0.8`
  // But wait, that might affect layouts.
  // Let's just fix the variables in index.css and remove the inline opacity in Header.tsx and SettingsPage.tsx
  
});
