const { spawn } = require('child_process');

const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000;
console.log(`🚀 Starting Next.js production server on port ${port}...`);

const nextProc = spawn('npx', ['next', 'start', '-p', String(port)], {
  stdio: 'inherit',
  shell: true
});

nextProc.on('exit', (code) => {
  process.exit(code || 0);
});
