#!/usr/bin/env node

/**
 * Catalyst AppSail Server Entry Point
 * 
 * This file starts the Next.js standalone server with proper
 * Catalyst AppSail environment variable support.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Use Catalyst's port environment variable or fallback to 3000
const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';

// Initialize Next.js in production mode
const app = next({
  dev: false,
  hostname,
  port,
  dir: __dirname,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'production'}`);
  });
});
