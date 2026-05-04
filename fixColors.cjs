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
  
  // Replace rgba(255, 255, 255, X) with rgba(var(--theme-rgb), X)
  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)/g, 'rgba(var(--theme-rgb), $1)');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nSuccessfully updated colors in ${changedFiles} files!`);
