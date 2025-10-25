#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// MCP server configurations
const MCP_CONFIGS = {
  'chrome-devtools-mcp': {
    command: process.execPath,
    args: ['C:/Dev/MCPs/chrome-devtools-mcp/build/src/index.js']
  }
};

async function startMcp(mcpName) {
  const config = MCP_CONFIGS[mcpName];
  if (!config) {
    console.error(`Unknown MCP: ${mcpName}`);
    console.error(`Available: ${Object.keys(MCP_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  console.log(`Starting ${mcpName}...`);

  // Create transport and client
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

  try {
    await client.connect(transport);

    // List available tools
    const tools = await client.listTools();
    console.log(`\nConnected to ${mcpName}`);
    console.log(`Available tools: ${tools.tools.length}\n`);
    
    // Output tool definitions
    console.log('=== TOOL DEFINITIONS ===');
    for (const tool of tools.tools) {
      console.log(`\nTool: ${tool.name}`);
      console.log(`Description: ${tool.description || 'N/A'}`);
      if (tool.inputSchema) {
        console.log(`Input schema: ${JSON.stringify(tool.inputSchema, null, 2)}`);
      }
    }

    await client.close();
  } catch (err) {
    console.error('Error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

async function callTool(mcpName, toolName, argsJson) {
  const config = MCP_CONFIGS[mcpName];
  if (!config) {
    console.error(`Unknown MCP: ${mcpName}`);
    process.exit(1);
  }

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

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: toolName,
      arguments: JSON.parse(argsJson)
    });

    console.log(JSON.stringify(result, null, 2));

    await client.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// CLI
const [,, command, ...args] = process.argv;

switch (command) {
  case 'start':
    await startMcp(args[0]);
    break;
  case 'call':
    await callTool(args[0], args[1], args[2]);
    break;
  default:
    console.log(`Usage: wrapper.js <command> [args]
    
Commands:
  start <mcp-name>              Start MCP and show its tools
  call <mcp-name> <tool> <json> Call a tool
  
Examples:
  node src/wrapper.js start chrome-devtools-mcp
  node src/wrapper.js call chrome-devtools-mcp navigate '{"url":"https://example.com"}'
`);
    process.exit(1);
}
