const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting CLI Automated Build & AppSail Deployment...');

// 1. Build Next.js app
console.log('🔨 Running Next.js Production Build...');
execSync('npm run build', { stdio: 'inherit' });

const targetDir = path.join(__dirname, 'appsail-build');

// Clean target directory
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

// 2. Copy standalone files
console.log('📦 Copying Next.js standalone output...');
const standaloneDir = path.join(__dirname, '.next', 'standalone');
fs.cpSync(standaloneDir, targetDir, { recursive: true });

// 3. Copy static assets to .next/static and public
console.log('📁 Copying static assets...');
const targetNextStatic = path.join(targetDir, '.next', 'static');
fs.mkdirSync(targetNextStatic, { recursive: true });

const srcNextStatic = path.join(__dirname, '.next', 'static');
if (fs.existsSync(srcNextStatic)) {
  fs.cpSync(srcNextStatic, targetNextStatic, { recursive: true });
}

const srcPublic = path.join(__dirname, 'public');
if (fs.existsSync(srcPublic)) {
  fs.cpSync(srcPublic, path.join(targetDir, 'public'), { recursive: true });
  fs.cpSync(srcPublic, targetNextStatic, { recursive: true });
}

// 4. Copy essential node_modules (next, react, react-dom, @google/genai)
console.log('📦 Copying core framework node_modules...');
const targetModules = path.join(targetDir, 'node_modules');
fs.mkdirSync(targetModules, { recursive: true });

const corePackages = ['next', 'react', 'react-dom', 'zcatalyst-sdk-node', '@google'];
for (const pkg of corePackages) {
  const srcPkg = path.join(__dirname, 'node_modules', pkg);
  const destPkg = path.join(targetModules, pkg);
  if (fs.existsSync(srcPkg)) {
    fs.cpSync(srcPkg, destPkg, { recursive: true });
  }
}

// 5. Create production server.js at appsail-build root
console.log('⚡ Creating AppSail server entry point...');
const serverJsContent = `#!/usr/env node
const path = require('path');
const fs = require('fs');

// Bind dynamic AppSail listen port
const port = parseInt(process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || '3000', 10);
process.env.PORT = String(port);
process.env.HOSTNAME = '0.0.0.0';
process.env.NODE_ENV = 'production';

console.log('🌍 AppSail Environment: ' + process.env.NODE_ENV);
console.log('🔌 Listening on Port: ' + process.env.PORT);

// Clean Windows paths if present in config
const configFile = path.join(__dirname, 'server.js');
try {
  let content = fs.readFileSync(__filename, 'utf8');
} catch (e) {}

// Start Next.js standalone server
const { startServer } = require('next/dist/server/lib/start-server');

// Read Next.js standalone config if present
let nextConfig = {};
try {
  if (process.env.__NEXT_PRIVATE_STANDALONE_CONFIG) {
    nextConfig = JSON.parse(process.env.__NEXT_PRIVATE_STANDALONE_CONFIG);
  }
} catch (e) {}

startServer({
  dir: __dirname,
  isDev: false,
  config: nextConfig,
  hostname: '0.0.0.0',
  port: port,
  allowRetry: false,
}).then(() => {
  console.log('✅ Next.js production server running on port ' + port);
}).catch((err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});
`;

fs.writeFileSync(path.join(targetDir, 'server.js'), serverJsContent, 'utf8');

// 6. Copy app-config.json and .env.local
console.log('⚙️ Copying configuration files...');
fs.writeFileSync(path.join(targetDir, 'app-config.json'), JSON.stringify({
  command: "node server.js",
  build_path: "./",
  stack: "node20",
  memory: 2048,
  env_variables: {
    NODE_ENV: "production",
    HOSTNAME: "0.0.0.0"
  }
}, null, 2), 'utf8');

if (fs.existsSync(path.join(__dirname, '.env.local'))) {
  fs.copyFileSync(path.join(__dirname, '.env.local'), path.join(targetDir, '.env.local'));
}

// 7. Update catalyst.json source
console.log('📝 Updating catalyst.json source to appsail-build...');
const catPath = path.join(__dirname, 'catalyst.json');
const catData = JSON.parse(fs.readFileSync(catPath, 'utf8'));
catData.appsail = [{ source: "appsail-build", name: "crimeintel" }];
fs.writeFileSync(catPath, JSON.stringify(catData, null, 2), 'utf8');

// 8. Execute Catalyst Deploy CLI
console.log('🚀 Executing CLI Deployment: catalyst deploy --only appsail:crimeintel...');
execSync('catalyst deploy --only appsail:crimeintel --non-interactive', { stdio: 'inherit' });

console.log('🎉 Catalyst CLI Deployment Completed Successfully!');
