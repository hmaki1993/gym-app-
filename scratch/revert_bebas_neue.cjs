const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let newContent = content.replace(/fontFamily:\s*["']'Bebas Neue',\s*sans-serif["']/g, `fontFamily: "'Montserrat', sans-serif"`);
      
      newContent = newContent.replace(/font-family:\s*'Bebas Neue',\s*sans-serif;/g, `font-family: 'Montserrat', sans-serif;`);

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Reverted ${fullPath}`);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
