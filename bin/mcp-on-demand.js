#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

const STATE_DIR = join(process.env.HOME || process.env.USERPROFILE, '.mcp-on-demand');
const INSTALLATION_FILE = join(STATE_DIR, 'installation.json');

// Get installation path
let installPath;
try {
  if (!existsSync(INSTALLATION_FILE)) {
    console.error('MCP On-Demand not set up. Run: npm run setup');
    process.exit(1);
  }

  const installationInfo = JSON.parse(await readFile(INSTALLATION_FILE, 'utf-8'));
  installPath = installationInfo.installPath;

  if (!installPath) {
    console.error('Invalid installation.json: missing installPath');
    process.exit(1);
  }
} catch (err) {
  console.error('Failed to read installation info:', err.message);
  console.error('Run: npm run setup');
  process.exit(1);
}

// Parse command
const [,, command, ...args] = process.argv;

if (!command) {
  console.log(`MCP On-Demand v0.1.0

Usage: mcp-on-demand <command> [args]

Commands:
  start <mcp-name>              Start an MCP session
  call <mcp-name> <tool> <json> Call a tool in active session
  batch <mcp-name> <json>       Call multiple tools
  stop <mcp-name>               Stop an MCP session
  list                          List active sessions
  shutdown                      Shutdown session manager

  manager                       Start the session manager (background)
  setup                         Run setup/configuration

Examples:
  mcp-on-demand start chrome-devtools-mcp
  mcp-on-demand call chrome-devtools-mcp navigate_page '{"url":"https://example.com"}'
  mcp-on-demand stop chrome-devtools-mcp

Installation: ${installPath}
Configuration: ${STATE_DIR}/mcp-configs.json
`);
  process.exit(0);
}

// Route to appropriate script
let scriptPath;
let scriptArgs = [];

switch (command) {
  case 'setup':
    scriptPath = join(installPath, 'scripts', 'setup.js');
    break;

  case 'manager':
    scriptPath = join(installPath, 'src', 'session-manager.js');
    break;

  case 'start':
  case 'call':
  case 'batch':
  case 'stop':
  case 'list':
  case 'shutdown':
    scriptPath = join(installPath, 'src', 'session-cli.js');
    scriptArgs = [command, ...args];
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Run "mcp-on-demand" for usage');
    process.exit(1);
}

// Execute the script
const child = spawn('node', [scriptPath, ...scriptArgs], {
  stdio: 'inherit',
  shell: false
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
