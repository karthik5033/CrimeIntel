const { spawn } = require('child_process');

const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000;
console.log(`Starting Next.js native server on port ${port}...`);

const nextProcess = spawn('npx', ['next', 'start', '-p', port, '-H', '0.0.0.0'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: port, HOSTNAME: '0.0.0.0' }
});

nextProcess.on('exit', (code) => {
    console.log(`Next.js native server exited with code ${code}`);
    process.exit(code);
});
