#!/usr/bin/env node
import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const STATE_DIR = join(process.env.HOME || process.env.USERPROFILE, '.mcp-on-demand');
const SESSION_FILE = join(STATE_DIR, 'session.json');
const LOCK_FILE = join(STATE_DIR, 'daemon.lock');
const PORT = 9876;

async function startDaemon() {
  const sessionManagerPath = join(__dirname, 'session-manager.js');
  const isWindows = process.platform === 'win32';

  const spawnOptions = {
    detached: true,
    stdio: 'ignore',
    ...(isWindows && { shell: true })
  };

  const daemon = spawn('node', [sessionManagerPath], spawnOptions);
  daemon.unref();

  console.log(`Session manager starting (PID ${daemon.pid})...`);

  // Wait for daemon to be ready (up to 10 seconds)
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (existsSync(SESSION_FILE)) {
      // Verify it's actually responsive
      try {
        const sessionInfo = JSON.parse(await readFile(SESSION_FILE, 'utf-8'));
        const url = `http://127.0.0.1:${sessionInfo.port}/health`;
        const response = await fetch(url, { signal: AbortSignal.timeout(2000) });

        if (response.ok) {
          console.log('Session manager ready');
          return true;
        }
      } catch (err) {
        // Not ready yet, keep waiting
      }
    }
  }

  throw new Error('Session manager failed to start within 10 seconds');
}

async function ensureDaemonRunning() {
  // Check if session manager is running
  if (!existsSync(SESSION_FILE)) {
    console.log('Session manager not running, starting it...');

    // Check for lock file to prevent race condition
    if (existsSync(LOCK_FILE)) {
      console.log('Another process is starting the daemon, waiting...');
      // Wait for the other process to finish (up to 15 seconds)
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (existsSync(SESSION_FILE)) {
          console.log('Session manager is now ready');
          return true;
        }
      }
      throw new Error('Timed out waiting for daemon to start');
    }

    // Create lock file
    try {
      await writeFile(LOCK_FILE, process.pid.toString());
    } catch (err) {
      // Another process might have created it first
      if (existsSync(LOCK_FILE)) {
        console.log('Another process is starting the daemon, waiting...');
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (existsSync(SESSION_FILE)) {
            console.log('Session manager is now ready');
            return true;
          }
        }
        throw new Error('Timed out waiting for daemon to start');
      }
      throw err;
    }

    try {
      await startDaemon();
    } finally {
      // Clean up lock file
      try {
        if (existsSync(LOCK_FILE)) {
          await unlink(LOCK_FILE);
        }
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    return true;
  }

  // Verify it's actually responsive
  try {
    const sessionInfo = JSON.parse(await readFile(SESSION_FILE, 'utf-8'));
    const url = `http://127.0.0.1:${sessionInfo.port}/health`;
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });

    if (response.ok) {
      return true; // Daemon is running and responsive
    }
  } catch (err) {
    console.log('Session manager not responsive, restarting...');

    // Clean up stale session file
    try {
      if (existsSync(SESSION_FILE)) {
        await unlink(SESSION_FILE);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  return await ensureDaemonRunning(); // Retry
}

async function sendCommand(command) {
  // Ensure daemon is running before sending command
  try {
    await ensureDaemonRunning();
  } catch (err) {
    console.error('Failed to start session manager:', err.message);
    console.error('');
    console.error('You can try starting it manually with:');
    console.error('  mcp-on-demand manager &');
    process.exit(1);
  }

  const sessionInfo = JSON.parse(await readFile(SESSION_FILE, 'utf-8'));
  const url = `http://127.0.0.1:${sessionInfo.port}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });

    const result = await response.json();

    if (result.error) {
      console.error('Error:', result.error);
      process.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed to connect to session manager:', err.message);
    console.error('');
    console.error('The session manager may have crashed or stopped.');
    console.error('Restart it with: mcp-on-demand manager');
    console.error('');
    console.error('Check status: curl http://127.0.0.1:9876/health');
    process.exit(1);
  }
}

const [,, action, ...args] = process.argv;

if (!action) {
  console.log(`Usage: session-cli.js <action> [args]

Actions:
  start <mcp-name> [--no-show-tools]  Start an MCP session and discover available tools
  call <mcp-name> <tool> <json>       Call a tool in active session
  batch <mcp-name> <json-array>       Call multiple tools in one request
  stop <mcp-name>                     Stop an MCP session
  list                                List active sessions
  shutdown                            Shutdown session manager

Tool Discovery:
  When you start a session, it automatically queries the MCP server and displays
  all available tools with their schemas. Use this to discover what the MCP can do.

Examples:
  node src/session-cli.js start chrome-devtools-mcp
  node src/session-cli.js start chrome-devtools-mcp --no-show-tools
  node src/session-cli.js call chrome-devtools-mcp new_page '{"url":"http://localhost:5173"}'
  node src/session-cli.js batch chrome-devtools-mcp '[{"tool":"new_page","args":{"url":"http://localhost:5173"}},{"tool":"take_screenshot","args":{"filePath":"test.png"}}]'
  node src/session-cli.js stop chrome-devtools-mcp
  node src/session-cli.js list
  node src/session-cli.js shutdown
`);
  process.exit(1);
}

let command;

switch (action) {
  case 'start':
    command = {
      action: 'start',
      mcpName: args[0],
      showTools: args[1] !== '--no-show-tools'
    };
    break;
  case 'call':
    command = {
      action: 'call',
      mcpName: args[0],
      toolName: args[1],
      args: JSON.parse(args[2] || '{}')
    };
    break;
  case 'batch':
    command = {
      action: 'batch',
      mcpName: args[0],
      toolCalls: JSON.parse(args[1])
    };
    break;
  case 'stop':
    command = { action: 'stop', mcpName: args[0] };
    break;
  case 'list':
    command = { action: 'list' };
    break;
  case 'shutdown':
    command = { action: 'shutdown' };
    break;
  default:
    console.error(`Unknown action: ${action}`);
    process.exit(1);
}

await sendCommand(command);
