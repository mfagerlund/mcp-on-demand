#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createServer } from 'http';
import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const STATE_DIR = join(process.env.HOME || process.env.USERPROFILE, '.mcp-on-demand');
const SESSION_FILE = join(STATE_DIR, 'session.json');
const PORT = 9876;

await mkdir(STATE_DIR, { recursive: true });

const activeSessions = new Map();

const MCP_CONFIGS = {
  'chrome-devtools-mcp': {
    command: process.execPath,
    args: ['C:/Dev/MCPs/chrome-devtools-mcp/build/src/index.js']
  }
};

async function startSession(mcpName, showTools = true) {
  if (activeSessions.has(mcpName)) {
    return { error: `Session ${mcpName} already running` };
  }

  const config = MCP_CONFIGS[mcpName];
  if (!config) {
    return { error: `Unknown MCP: ${mcpName}` };
  }

  try {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args
    });

    const client = new Client({
      name: 'mcp-on-demand',
      version: '0.1.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);

    const tools = await client.listTools();

    activeSessions.set(mcpName, { client, transport });

    const result = {
      success: true,
      mcpName,
      toolCount: tools.tools.length,
      message: `Session started with ${tools.tools.length} tools`
    };

    if (showTools) {
      result.tools = tools.tools;
    }

    return result;
  } catch (err) {
    return { error: err.message };
  }
}

async function callTool(mcpName, toolName, args) {
  const session = activeSessions.get(mcpName);
  if (!session) {
    return { error: `No active session for ${mcpName}. Start session first.` };
  }

  try {
    const result = await session.client.callTool({
      name: toolName,
      arguments: args
    });

    return { success: true, result };
  } catch (err) {
    return { error: err.message };
  }
}

async function batchCallTools(mcpName, toolCalls) {
  const session = activeSessions.get(mcpName);
  if (!session) {
    return { error: `No active session for ${mcpName}. Start session first.` };
  }

  try {
    const results = [];
    for (const call of toolCalls) {
      const result = await session.client.callTool({
        name: call.tool,
        arguments: call.args
      });
      results.push({ tool: call.tool, result });
    }

    return { success: true, results };
  } catch (err) {
    return { error: err.message };
  }
}

async function stopSession(mcpName) {
  const session = activeSessions.get(mcpName);
  if (!session) {
    return { error: `No active session for ${mcpName}` };
  }

  try {
    await session.client.close();
    activeSessions.delete(mcpName);
    return { success: true, message: `Session ${mcpName} stopped` };
  } catch (err) {
    return { error: err.message };
  }
}

async function listSessions() {
  const sessions = Array.from(activeSessions.keys());
  return { success: true, sessions };
}

const server = createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Only POST allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const cmd = JSON.parse(body);
      let result;

      switch (cmd.action) {
        case 'start':
          result = await startSession(cmd.mcpName, cmd.showTools);
          break;
        case 'call':
          result = await callTool(cmd.mcpName, cmd.toolName, cmd.args);
          break;
        case 'batch':
          result = await batchCallTools(cmd.mcpName, cmd.toolCalls);
          break;
        case 'stop':
          result = await stopSession(cmd.mcpName);
          break;
        case 'list':
          result = await listSessions();
          break;
        case 'shutdown':
          result = { success: true, message: 'Shutting down' };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));

          for (const [name, session] of activeSessions) {
            await session.client.close();
          }
          process.exit(0);
          return;
        default:
          result = { error: `Unknown action: ${cmd.action}` };
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, '127.0.0.1', async () => {
  console.log(`Session manager running on http://127.0.0.1:${PORT}`);

  await writeFile(SESSION_FILE, JSON.stringify({
    port: PORT,
    pid: process.pid,
    started: new Date().toISOString()
  }));

  console.log(`PID: ${process.pid}`);
  console.log(`Session info: ${SESSION_FILE}`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  for (const [name, session] of activeSessions) {
    await session.client.close();
  }
  if (existsSync(SESSION_FILE)) {
    await unlink(SESSION_FILE);
  }
  process.exit(0);
});
