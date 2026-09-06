const http = require('http');
const port = parseInt(process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000, 10);
const server = http.createServer((req, res) => {
    const info = {
        status: 'alive',
        port: port,
        env: {
            X_ZOHO_CATALYST_LISTEN_PORT: process.env.X_ZOHO_CATALYST_LISTEN_PORT,
            PORT: process.env.PORT,
            NODE_ENV: process.env.NODE_ENV,
            HOSTNAME: process.env.HOSTNAME,
        },
        nodeVersion: process.version,
        cwd: process.cwd(),
        time: new Date().toISOString()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info, null, 2));
});
server.listen(port, '0.0.0.0', () => {
    console.log('Probe server listening on', port);
});
