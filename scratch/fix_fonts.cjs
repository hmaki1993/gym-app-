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

  // Fix inline fonts that were missed because they were like: fontFamily: 'Outfit, sans-serif'
  content = content.replace(/['"]?Outfit,\s*sans-serif['"]?/gi, "'Montserrat', sans-serif");
  content = content.replace(/['"]?Space Grotesk,\s*sans-serif['"]?/gi, "'Montserrat', sans-serif");
  content = content.replace(/['"]?Kanit,\s*sans-serif['"]?/gi, "'Montserrat', sans-serif");
  content = content.replace(/['"]?Syne,\s*sans-serif['"]?/gi, "'Montserrat', sans-serif");
  
  // also match just 'Outfit' or "Outfit"
  content = content.replace(/['"]Outfit['"]/gi, "'Montserrat'");
  content = content.replace(/['"]Space Grotesk['"]/gi, "'Montserrat'");
  content = content.replace(/['"]Kanit['"]/gi, "'Montserrat'");
  content = content.replace(/['"]Syne['"]/gi, "'Montserrat'");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated inline fonts in: ${file}`);
  }
});
console.log('Fonts updated successfully!');
