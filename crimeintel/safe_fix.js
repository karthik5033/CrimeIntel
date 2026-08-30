const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (fullPath.replace(/\\/g, '/').endsWith('lib/catalyst/index.ts')) {
        continue; 
      }
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (!content.includes('getCatalystApp()')) {
        continue;
      }
      
      // Safely update imports
      if (content.includes('import { getCatalystApp } from')) {
        content = content.replace(/import\s*\{\s*getCatalystApp\s*\}\s*from/g, 'import { getCatalystAppAsync } from');
      } else if (content.match(/import\s*\{[^}]*\bgetCatalystApp\b[^}]*\}\s*from/)) {
        // e.g. import { otherThing, getCatalystApp } from ...
        content = content.replace(/\bgetCatalystApp\b/g, 'getCatalystAppAsync');
      }

      // 1. If it's already `await getCatalystApp()`, just change to `await getCatalystAppAsync()`
      content = content.replace(/await\s+getCatalystApp\(\)/g, 'await getCatalystAppAsync()');
      
      // 2. Change remaining `getCatalystApp()` to `await getCatalystAppAsync()`
      content = content.replace(/\bgetCatalystApp\(\)/g, 'await getCatalystAppAsync()');
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated: ${fullPath}`);
    }
  }
}

const targetDirs = [
  path.join(__dirname, 'lib', 'catalyst'),
  path.join(__dirname, 'lib', 'ai'),
  path.join(__dirname, 'app', 'api')
];

for (const dir of targetDirs) {
  if (fs.existsSync(dir)) {
    processDir(dir);
  }
}
console.log('Done!');
