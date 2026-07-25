const fs = require('fs');
const path = require('path');

const files = [
  'app/api/graph/route.ts',
  'app/api/chat/route.ts',
  'app/(auth)/profiles/page.tsx',
  'app/(auth)/profiles/[id]/page.tsx',
  'app/(auth)/financial/page.tsx',
  'app/(auth)/firs/[id]/page.tsx',
  'app/(auth)/cases/page.tsx',
  'app/(auth)/cases/[id]/page.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/import \{ DataClient \} from ("|')@\/lib\/api\/dataClient("|');?/g, 'import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
