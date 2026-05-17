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
      
      let newContent = content.replace(/fontFamily:\s*["']'Montserrat',\s*sans-serif["']/g, `fontFamily: "'Bebas Neue', sans-serif"`);
      
      newContent = newContent.replace(/font-family:\s*'Montserrat',\s*sans-serif;/g, `font-family: 'Bebas Neue', sans-serif;`);

      if (fullPath.endsWith('index.css') && !newContent.includes('Bebas+Neue')) {
        newContent = newContent.replace('family=Oswald:wght@500;600;700&display=swap', 'family=Oswald:wght@500;600;700&family=Bebas+Neue&display=swap');
      }

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
