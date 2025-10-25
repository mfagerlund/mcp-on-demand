#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const STATE_DIR = join(process.env.HOME || process.env.USERPROFILE, '.mcp-on-demand');
const SESSION_FILE = join(STATE_DIR, 'session.json');

async function sendCommand(command) {
  if (!existsSync(SESSION_FILE)) {
    console.error('Session manager not running. Start it with: node src/session-manager.js');
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
    console.error('Is the session manager running?');
    process.exit(1);
  }
}

const [,, action, ...args] = process.argv;

if (!action) {
  console.log(`Usage: session-cli.js <action> [args]

Actions:
  start <mcp-name> [--no-show-tools]  Start an MCP session (shows tools by default)
  call <mcp-name> <tool> <json>       Call a tool in active session
  batch <mcp-name> <json-array>       Call multiple tools in one request
  stop <mcp-name>                     Stop an MCP session
  list                                List active sessions
  shutdown                            Shutdown session manager

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
