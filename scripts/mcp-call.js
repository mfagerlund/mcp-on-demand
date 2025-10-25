#!/usr/bin/env node
/**
 * MCP Tool Call Helper
 *
 * Simplifies calling MCP tools by handling JSON escaping automatically.
 *
 * Usage:
 *   mcp-call <mcpName> <toolName> [scriptFile]
 *   mcp-call <mcpName> <toolName> < script.js
 *   echo "() => document.title" | mcp-call chrome-devtools-mcp evaluate_script
 *
 * Examples:
 *   node scripts/mcp-call.js chrome-devtools-mcp evaluate_script check-buttons.js
 *   node scripts/mcp-call.js chrome-devtools-mcp navigate_page --url https://example.com
 */

import { request } from 'http';
import { readFile } from 'fs/promises';

const PORT = process.env.MCP_PORT || 9876;
const HOST = process.env.MCP_HOST || '127.0.0.1';

function parseArgs(argv) {
  const mcpName = argv[0];
  const toolName = argv[1];
  const rest = argv.slice(2);

  if (!mcpName || !toolName) {
    console.error('Usage: mcp-call <mcpName> <toolName> [scriptFile | --arg value ...]');
    console.error('\nExamples:');
    console.error('  mcp-call chrome-devtools-mcp evaluate_script script.js');
    console.error('  mcp-call chrome-devtools-mcp navigate_page --url https://example.com');
    console.error('  echo "() => document.title" | mcp-call chrome-devtools-mcp evaluate_script');
    console.error('\nOptions:');
    console.error('  --format=json     Full JSON response (default)');
    console.error('  --format=raw      Extract just the result value');
    console.error('  --format=text     Extract text content only');
    process.exit(1);
  }

  const args = {};
  let scriptFile = null;
  let format = 'json';

  // Check if first arg is a file path (no -- prefix)
  if (rest.length > 0 && !rest[0].startsWith('--')) {
    scriptFile = rest[0];
    // Check remaining args for format flag
    for (let i = 1; i < rest.length; i++) {
      if (rest[i].startsWith('--format=')) {
        format = rest[i].split('=')[1];
      } else if (rest[i].startsWith('--')) {
        const key = rest[i].slice(2);
        const value = rest[i + 1];
        args[key] = value;
        i++; // Skip the value
      }
    }
  } else {
    // Parse --key value pairs
    for (let i = 0; i < rest.length; i++) {
      if (rest[i].startsWith('--format=')) {
        format = rest[i].split('=')[1];
      } else if (rest[i].startsWith('--')) {
        const key = rest[i].slice(2);
        const value = rest[i + 1];
        args[key] = value;
        i++; // Skip the value
      }
    }
  }

  return { mcpName, toolName, args, scriptFile, format };
}

async function readScriptContent(scriptFile) {
  if (scriptFile) {
    return await readFile(scriptFile, 'utf8');
  }

  // Read from stdin
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function callMcp(mcpName, toolName, args) {
  const payload = JSON.stringify({
    action: 'call',
    mcpName,
    toolName,
    args
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function formatOutput(result, format) {
  if (format === 'raw') {
    // Extract just the result value from nested structure
    if (result.result?.content?.[0]?.text) {
      const text = result.result.content[0].text;
      // Try to extract JSON from markdown code blocks
      const match = text.match(/```json\s*\n([\s\S]*?)\n```/);
      if (match) {
        try {
          return JSON.stringify(JSON.parse(match[1]), null, 2);
        } catch {
          return match[1];
        }
      }
      return text;
    }
    return JSON.stringify(result.result, null, 2);
  } else if (format === 'text') {
    // Extract text content only
    if (result.result?.content?.[0]?.text) {
      return result.result.content[0].text;
    }
    return JSON.stringify(result.result, null, 2);
  } else {
    // Full JSON response (default)
    return JSON.stringify(result, null, 2);
  }
}

async function main() {
  const { mcpName, toolName, args, scriptFile, format } = parseArgs(process.argv.slice(2));

  try {
    // If scriptFile is provided or stdin has data, read and add as 'function' arg
    if (scriptFile || !process.stdin.isTTY) {
      const scriptContent = await readScriptContent(scriptFile);
      args.function = scriptContent.trim();
    }

    const result = await callMcp(mcpName, toolName, args);

    if (result.error) {
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log(formatOutput(result, format));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
