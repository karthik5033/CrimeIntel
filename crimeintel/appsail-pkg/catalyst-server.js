#!/usr/bin/env node

/**
 * Catalyst AppSail Server Entry Point
 * 
 * This file starts the Next.js standalone server with proper
 * Catalyst AppSail environment variable support.
 */

const path = require('path');

// Use Catalyst's port environment variable or fallback to 3000
const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';

// Set port for Next.js standalone server
process.env.PORT = port;
process.env.HOSTNAME = hostname;

console.log(`Starting server on ${hostname}:${port}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'production'}`);

// Start the Next.js standalone server
// When this file is copied into .next/standalone, it should require the original server.js
require('./server.js');
