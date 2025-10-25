#!/usr/bin/env node
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STATE_DIR = join(process.env.HOME || process.env.USERPROFILE, '.mcp-on-demand');
const INSTALLATION_FILE = join(STATE_DIR, 'installation.json');
const CONFIG_FILE = join(STATE_DIR, 'mcp-configs.json');

// Get the installation path (parent of scripts/)
const INSTALL_PATH = join(__dirname, '..');

console.log('Setting up MCP On-Demand...');
console.log(`Installation path: ${INSTALL_PATH}`);

// Create state directory
await mkdir(STATE_DIR, { recursive: true });
console.log(`✓ Created state directory: ${STATE_DIR}`);

// Write installation.json
const installationInfo = {
  installPath: INSTALL_PATH,
  version: '0.1.0',
  installedAt: new Date().toISOString()
};

await writeFile(INSTALLATION_FILE, JSON.stringify(installationInfo, null, 2));
console.log(`✓ Created installation.json`);

// Create mcp-configs.json if it doesn't exist
if (!existsSync(CONFIG_FILE)) {
  const exampleConfig = {
    "_comment": "Add your MCP server configurations here",
    "_example": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/build/src/index.js"]
    }
  };

  await writeFile(CONFIG_FILE, JSON.stringify(exampleConfig, null, 2));
  console.log(`✓ Created example mcp-configs.json`);
  console.log(`  → Edit ${CONFIG_FILE} to add your MCP servers`);
} else {
  console.log(`✓ Using existing mcp-configs.json`);
}

console.log('\nSetup complete!');
console.log('\nNext steps:');
console.log(`1. Edit ${CONFIG_FILE}`);
console.log('2. Add your MCP server configurations');
console.log('3. Start the session manager: npm start');
