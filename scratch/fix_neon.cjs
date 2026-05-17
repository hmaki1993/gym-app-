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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Replace all #ff3d00 with #E67E22
  content = content.replace(/#ff3d00/gi, '#E67E22');
  content = content.replace(/255,\s*61,\s*0/g, '230, 126, 34');

  // 2. Remove boxShadow and filter drop-shadow properties completely to kill neon
  // We match boxShadow: '...' and filter: 'drop-shadow(...)'
  content = content.replace(/boxShadow:\s*'[^']+',?/g, '');
  content = content.replace(/boxShadow:\s*`[^`]+`,?/g, '');
  content = content.replace(/filter:\s*'drop-shadow[^']+',?/g, '');
  content = content.replace(/textShadow:\s*'[^']+',?/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});
console.log('Done!');
