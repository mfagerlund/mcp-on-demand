#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const STATE_DIR = join(process.env.HOME || process.env.USERPROFILE, '.mcp-on-demand');
const SESSION_FILE = join(STATE_DIR, 'session.json');

async function checkStatus() {
  console.log('MCP On-Demand Status');
  console.log('===================\n');

  // Check if session file exists
  if (!existsSync(SESSION_FILE)) {
    console.log('Status: NOT RUNNING');
    console.log('');
    console.log('Start the session manager with:');
    console.log('  mcp-on-demand manager &');
    process.exit(1);
  }

  // Check if daemon is responsive
  try {
    const sessionInfo = JSON.parse(await readFile(SESSION_FILE, 'utf-8'));
    const url = `http://127.0.0.1:${sessionInfo.port}/health`;

    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    const health = await response.json();

    console.log('Status: RUNNING');
    console.log('');
    console.log(`PID: ${health.pid}`);
    console.log(`Port: ${sessionInfo.port}`);
    console.log(`Uptime: ${Math.floor(health.uptime)} seconds`);
    console.log(`Active Sessions: ${health.activeSessions.length}`);

    if (health.activeSessions.length > 0) {
      console.log('');
      health.activeSessions.forEach(session => {
        console.log(`  - ${session}`);
      });
    }
  } catch (err) {
    console.log('Status: UNRESPONSIVE');
    console.log('');
    console.log('Session file exists but daemon is not responding.');
    console.log(`Error: ${err.message}`);
    console.log('');
    console.log('Try restarting:');
    console.log('  rm ~/.mcp-on-demand/session.json');
    console.log('  mcp-on-demand manager &');
    process.exit(1);
  }
}

await checkStatus();
