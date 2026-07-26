#!/usr/bin/env node

/**
 * Catalyst AppSail Server Entry Point
 * Starts the Next.js standalone server with Catalyst environment support
 */

// Set port from Catalyst environment or use default
const catalystPort = process.env.X_ZOHO_CATALYST_LISTEN_PORT;
if (catalystPort) {
  process.env.PORT = catalystPort;
  console.log(`✅ Using Catalyst port: ${catalystPort}`);
} else {
  process.env.PORT = process.env.PORT || '3000';
  console.log(`ℹ️  Using default port: ${process.env.PORT}`);
}

process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`🚀 Starting Next.js standalone server...`);

// Check if standalone server exists
const fs = require('fs');
const path = require('path');

// In AppSail, the standalone build is extracted directly
const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');
const rootServerPath = path.join(__dirname, 'server.js');

if (fs.existsSync(standalonePath)) {
  console.log(`✅ Found standalone server at: ${standalonePath}`);
  require(standalonePath);
} else if (fs.existsSync(path.join(__dirname, '.next', 'server.js'))) {
  console.log(`✅ Found server in .next directory`);
  require(path.join(__dirname, '.next', 'server.js'));
} else {
  console.error(`❌ ERROR: Could not find Next.js server`);
  console.error(`   Searched paths:`);
  console.error(`   - ${standalonePath}`);
  console.error(`   - ${path.join(__dirname, '.next', 'server.js')}`);
  console.error(`   Current directory: ${__dirname}`);
  console.error(`   Directory contents:`);
  try {
    const files = fs.readdirSync(__dirname);
    files.forEach(file => {
      const stats = fs.statSync(path.join(__dirname, file));
      console.error(`   ${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${file}`);
    });
  } catch (e) {
    console.error(`   Could not list directory: ${e.message}`);
  }
  process.exit(1);
}
